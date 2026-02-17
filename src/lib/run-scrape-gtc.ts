/**
 * Run GoingToCamp availability scrape via camply (BC Parks, Parks Canada, Washington).
 * Requires Python + camply: pip install camply
 *
 * Used by scripts/scrape-goingtocamp.ts and /api/scrape-gtc.
 */

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import { addDays, format } from 'date-fns';
import path from 'path';

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toCore(s: string): string {
  const n = normalizeName(s);
  return n
    .replace(/\s*(provincial\s*)?park\s*$/i, '')
    .replace(/\s*marine\s+park\s*$/i, '')
    .replace(/\s+trail\s*$/i, '')
    .replace(/\s*day\s+use\s*$/i, '')
    .trim();
}

function namesMatch(dbName: string, facilityName: string): boolean {
  const a = toCore(dbName);
  const b = toCore(facilityName);
  if (!a || !b) return false;
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;
  if (shorter.length < 4) return false;
  const shortWords = shorter.split(/\s+/).filter((w) => w.length > 1);
  if (shortWords.length === 1) return a === b;
  return longer.includes(shorter);
}

export interface CamplyResult {
  rec_area_id: number;
  provider: string;
  facility_id: number;
  facility_name: string;
  map_id: number;
  availability: Record<string, number>;
}

export interface RunScrapeGtcOptions {
  /** rec_area_id: 12=BC Parks, 14=Parks Canada, 3=Washington */
  recArea?: number;
  /** Max facilities per rec area (0 = no limit) */
  limit?: number;
}

export interface RunScrapeGtcResult {
  ok: number;
  skip: number;
  total: number;
  error?: string;
}

export async function runCamply(recArea?: number, limit?: number): Promise<CamplyResult[]> {
  const scriptPath = path.join(process.cwd(), 'scripts', 'camply_availability.py');
  return new Promise((resolve, reject) => {
    const args = [scriptPath];
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
        reject(new Error(`Camply exited ${code}: ${stderr || stdout}`));
        return;
      }
      try {
        const data = JSON.parse(stdout);
        resolve(Array.isArray(data) ? data : []);
      } catch {
        reject(new Error(`Camply output not JSON: ${stdout.slice(0, 200)}`));
      }
    });
    proc.on('error', (err) => {
      reject(new Error(`Camply not found (pip install camply): ${err.message}`));
    });
  });
}

export async function runScrapeGtc(options: RunScrapeGtcOptions = {}): Promise<RunScrapeGtcResult> {
  const { recArea = 12, limit = 30 } = options;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(url, serviceKey);

  const { data: locations, error: locErr } = await supabase
    .from('locations_with_coords')
    .select('id, name, provider')
    .in('provider', ['bcparks', 'parks_canada', 'wa_state_parks']);

  if (locErr || !locations?.length) {
    return { ok: 0, skip: 0, total: 0, error: locErr?.message ?? 'No locations' };
  }

  let camplyResults: CamplyResult[];
  try {
    camplyResults = await runCamply(recArea, limit);
  } catch (err) {
    return {
      ok: 0,
      skip: 0,
      total: 0,
      error: err instanceof Error ? err.message : 'Camply failed',
    };
  }

  if (camplyResults.length === 0) {
    return { ok: 0, skip: 0, total: camplyResults.length };
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
          spots === undefined ? (Object.keys(avail).length > 0 ? 'unknown' : 'unknown')
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

      if (!upsertErr) {
        ok++;
        // Mark as bookable so the calendar shows (BC Parks default to FCFS otherwise)
        if (provider === 'bcparks') {
          const { data: cur } = await supabase.from('locations').select('metadata').eq('id', loc.id).single();
          const meta = (cur?.metadata as Record<string, unknown>) ?? {};
          await supabase
            .from('locations')
            .update({ metadata: { ...meta, requires_booking: true, camping_type: 'reservation' } })
            .eq('id', loc.id);
        }
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  return { ok, skip, total: camplyResults.length };
}
