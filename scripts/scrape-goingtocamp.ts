#!/usr/bin/env npx tsx
/**
 * Scrape GoingToCamp availability via camply (BC Parks, Parks Canada, Washington).
 * Requires: pip install camply (or pip install -r requirements.txt)
 *
 * Matches camply facility names to DB locations by normalized name overlap.
 * Outputs to Supabase availability table.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import { addDays, format } from 'date-fns';

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract core park name by stripping common suffixes (BC Parks: "X Provincial Park", DB: "X PARK") */
function toCore(s: string): string {
  const n = normalizeName(s);
  return n
    .replace(/\s*(provincial\s*)?park\s*$/i, '')
    .replace(/\s*marine\s+park\s*$/i, '')
    .replace(/\s+trail\s*$/i, '')
    .replace(/\s*day\s+use\s*$/i, '')
    .trim();
}

/** True if our DB name likely matches camply facility name */
function namesMatch(dbName: string, facilityName: string): boolean {
  const a = toCore(dbName);
  const b = toCore(facilityName);
  if (!a || !b) return false;
  if (a === b) return true;
  // One core must contain the other (e.g. "alice lake" vs "alice lake provincial park" → both "alice lake")
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;
  if (shorter.length < 4) return false;
  // Single-word shorter (e.g. "beatton") must match exactly - avoids "Beatton Park" matching "Beatton River Park"
  const shortWords = shorter.split(/\s+/).filter((w) => w.length > 1);
  if (shortWords.length === 1) return a === b;
  return longer.includes(shorter);
}

interface CamplyResult {
  rec_area_id: number;
  provider: string;
  facility_id: number;
  facility_name: string;
  map_id: number;
  availability: Record<string, number>;
}

async function runCamply(recArea?: number, limit?: number): Promise<CamplyResult[]> {
  return new Promise((resolve, reject) => {
    const args = ['scripts/camply_availability.py'];
    if (recArea) args.push('--rec-area', String(recArea));
    if (limit) args.push('--limit', String(limit));
    const proc = spawn('python3', args, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (d) => (stdout += d.toString()));
    proc.stderr?.on('data', (d) => (stderr += d.toString()));
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`camply script exited ${code}: ${stderr || stdout}`));
        return;
      }
      try {
        const data = JSON.parse(stdout);
        resolve(Array.isArray(data) ? data : []);
      } catch (e) {
        reject(new Error(`camply output not JSON: ${stdout.slice(0, 200)}`));
      }
    });
    proc.on('error', reject);
  });
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  const args = process.argv.slice(2);
  const recArea = args.includes('--rec-area')
    ? parseInt(args[args.indexOf('--rec-area') + 1] ?? '0', 10)
    : undefined;
  const limit = args.includes('--limit')
    ? parseInt(args[args.indexOf('--limit') + 1] ?? '0', 10)
    : undefined;

  // Load DB locations for GoingToCamp providers
  const { data: locations, error: locErr } = await supabase
    .from('locations_with_coords')
    .select('id, name, provider')
    .in('provider', ['bcparks', 'parks_canada', 'wa_state_parks']);

  if (locErr || !locations?.length) {
    console.error('Failed to load locations:', locErr);
    process.exit(1);
  }

  console.log(`Running camply (rec_area=${recArea ?? 'all'}, limit=${limit ?? 'none'})...`);
  let camplyResults: CamplyResult[];
  try {
    camplyResults = await runCamply(recArea, limit);
  } catch (e) {
    console.error('Camply failed:', e);
    console.error('Install with: pip install camply');
    process.exit(1);
  }

  if (camplyResults.length === 0) {
    console.log('No campgrounds returned from camply.');
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const providerMap: Record<string, string> = {
    '12': 'bcparks',
    '14': 'parks_canada',
    '3': 'wa_state_parks',
  };

  let ok = 0;
  let skip = 0;

  for (const camp of camplyResults) {
    const provider = providerMap[String(camp.rec_area_id)] ?? camp.provider;
    const dbLocs = locations.filter(
      (l) => l.provider === provider && namesMatch(l.name, camp.facility_name)
    );

    if (dbLocs.length === 0) {
      skip++;
      continue;
    }

      for (const loc of dbLocs) {
      const avail = camp.availability;
      const rows = [];
      for (let i = 0; i < 90; i++) {
        const d = addDays(new Date(), i);
        const dateStr = format(d, 'yyyy-MM-dd');
        if (dateStr < today) continue;
        const spots = avail[dateStr];
        const status =
          spots === undefined ? 'unknown'
          : spots > 0 ? 'available'
          : spots === -1 ? 'closed'
          : 'booked';
        rows.push({
          location_id: loc.id,
          date: dateStr,
          status,
          spots_remaining: spots > 0 ? spots : null,
          last_updated: new Date().toISOString(),
        });
      }

      if (rows.length === 0) continue;

      const { error: upsertErr } = await supabase
        .from('availability')
        .upsert(rows, { onConflict: 'location_id,date', ignoreDuplicates: false });

      if (upsertErr) {
        console.error(`  Error ${loc.name}:`, upsertErr.message);
        continue;
      }
      const availCount = rows.filter((r) => r.status === 'available').length;
      console.log(`  OK ${loc.name} (${camp.facility_name}): ${availCount}/90 days available`);
      ok++;
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone: ${ok} locations updated, ${skip} camply facilities unmatched`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
