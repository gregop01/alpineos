#!/usr/bin/env node
/**
 * Export all locations to JSON for Gemini review (lat/lon corrections).
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Usage: node scripts/export-locations-for-gemini.mjs
 * Output: scripts/exports/locations-export.json
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPORTS_DIR = join(__dirname, 'exports');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase
    .from('locations_with_coords')
    .select('id, name, provider, type, capacity_total, booking_url, metadata, lon, lat')
    .order('provider')
    .order('name');

  if (error) {
    console.error('Supabase error:', error);
    process.exit(1);
  }

  mkdirSync(EXPORTS_DIR, { recursive: true });
  const outPath = join(EXPORTS_DIR, 'locations-export.json');
  const prevPath = join(EXPORTS_DIR, 'locations-export-previous.json');

  if (existsSync(outPath)) {
    copyFileSync(outPath, prevPath);
    console.error(`Backed up previous export to locations-export-previous.json`);
  }
  writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
  console.error(`Exported ${data.length} locations to locations-export.json`);
}

main();
