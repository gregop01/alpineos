#!/usr/bin/env npx tsx
/**
 * Scrape availability for bookable campsites and upsert to Supabase.
 *
 * Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npx tsx scripts/scrape-availability.ts
 *   npx tsx scripts/scrape-availability.ts --provider ridb --limit 5
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { runScrape } from '../src/lib/run-scrape';

async function main() {
  const args = process.argv.slice(2);
  const providerFilter = args.includes('--provider')
    ? args[args.indexOf('--provider') + 1]
    : undefined;
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1] ?? '0', 10) : 0;

  const result = await runScrape({ limit: limit || undefined, provider: providerFilter ?? undefined });
  console.log(`Done: ${result.ok} success, ${result.fail} failed/skipped`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
