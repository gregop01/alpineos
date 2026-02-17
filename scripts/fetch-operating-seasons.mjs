#!/usr/bin/env node
/**
 * Infer operating season from camply availability for BC Parks.
 * Runs camply_availability.py, finds first/last non-closed dates, outputs SQL to add metadata.season.
 *
 * Usage:
 *   python3 scripts/camply_availability.py --rec-area 12 --limit 150 | node scripts/fetch-operating-seasons.mjs
 *   # Or with sql output:
 *   python3 scripts/camply_availability.py --rec-area 12 --limit 150 | node scripts/fetch-operating-seasons.mjs --sql
 *
 * Season inference (running in Feb, 90-day window = Feb–May):
 * - Closed at start, then open → seasonal, e.g. "May 15 - Sep 30" (open from first open date)
 * - No closed days → "Year-round"
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';

const wantSql = process.argv.includes('--sql');
const runCamply = !process.stdin.isTTY;

function normalizeName(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toCore(s) {
  const n = normalizeName(s);
  return n
    .replace(/\s*(provincial\s*)?park\s*$/i, '')
    .replace(/\s*marine\s+park\s*$/i, '')
    .replace(/\s+trail\s*$/i, '')
    .replace(/\s*day\s+use\s*$/i, '')
    .replace(/\s*-\s*backcountry\s*camping\s*$/i, '')
    .trim();
}

function formatMonthDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m - 1]} ${d}`;
}

/** Infer season string from availability map. date -> -1 (closed), 0 (booked), >0 (available) */
function inferSeason(availability, todayStr) {
  if (!availability || typeof availability !== 'object') return null;
  const dates = Object.keys(availability).sort();
  if (dates.length === 0) return null;

  const openDates = dates.filter((d) => availability[d] !== -1);
  const closedDates = dates.filter((d) => availability[d] === -1);

  if (openDates.length === 0) return null;
  if (closedDates.length === 0) return 'Year-round';

  const firstOpen = openDates[0];
  const lastOpen = openDates[openDates.length - 1];

  // If we see closed at start then open, it's seasonal. Use first/last open in our window.
  // Typical BC Parks: May 15 - Sep 30. We might only see May-Jun in a Feb run.
  const openFormatted = formatMonthDay(firstOpen);
  const lastFormatted = formatMonthDay(lastOpen);

  // Heuristic: if last open is near end of our 90-day window, assume season continues to ~Sep 30
  const lastDate = new Date(lastOpen);
  const windowEnd = new Date(todayStr);
  windowEnd.setDate(windowEnd.getDate() + 89);
  const daysFromEnd = Math.round((windowEnd - lastDate) / (24 * 60 * 60 * 1000));
  // If still open near window end, we don't see close date - use Sep 30 for typical BC Parks
  const endStr = daysFromEnd < 14 ? 'Sep 30' : lastFormatted;

  return `${openFormatted} - ${endStr}`;
}

async function runCamplyScript() {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', ['scripts/camply_availability.py', '--rec-area', '12', '--limit', '150'], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (d) => (stdout += d.toString()));
    proc.stderr?.on('data', (d) => (stderr += d.toString()));
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`camply exited ${code}: ${stderr || stdout}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error('camply output not JSON'));
      }
    });
  });
}

async function loadDbLocations() {
  try {
    const content = readFileSync('scripts/exports/locations-export.json', 'utf8');
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function namesMatch(dbName, facilityName) {
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

async function main() {
  let camplyResults;
  if (runCamply) {
    const rl = createInterface({ input: process.stdin });
    let input = '';
    for await (const line of rl) input += line + '\n';
    try {
      camplyResults = JSON.parse(input);
    } catch {
      console.error('Expected JSON from camply on stdin. Run: python3 scripts/camply_availability.py --rec-area 12 | node scripts/fetch-operating-seasons.mjs');
      process.exit(1);
    }
  } else {
    camplyResults = await runCamplyScript();
  }

  const dbLocs = await loadDbLocations();
  const todayStr = new Date().toISOString().slice(0, 10);

  const updates = [];
  for (const camp of camplyResults) {
    if (camp.provider !== 'bcparks') continue;
    const season = inferSeason(camp.availability, todayStr);
    if (!season) continue;

    const dbLoc = dbLocs.find((l) => l.provider === 'bcparks' && namesMatch(l.name, camp.facility_name));
    if (!dbLoc) continue;

    const escaped = JSON.stringify({ season }).replace(/'/g, "''");
    updates.push({ name: dbLoc.name, season, escaped });
  }

  if (wantSql && updates.length > 0) {
    console.log('-- Add operating season from camply availability inference');
    console.log('-- Run: python3 scripts/camply_availability.py --rec-area 12 --limit 150 | node scripts/fetch-operating-seasons.mjs --sql');
    console.log('');
    for (const u of updates) {
      console.log(`UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '${u.escaped}'::jsonb`);
      console.log(`WHERE provider = 'bcparks' AND name ILIKE ${"'" + u.name.replace(/'/g, "''") + "'"};`);
      console.log('');
    }
  } else {
    console.log(JSON.stringify(updates.map((u) => ({ name: u.name, season: u.season })), null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
