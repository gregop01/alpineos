/**
 * Run availability scrape. Used by CLI script and /api/scrape.
 */

import { createClient } from '@supabase/supabase-js';
import {
  recreationGovScraper,
  goingToCampScraper,
  type LocationForScrape,
} from '@/lib/scrapers';

const SCRAPERS = [recreationGovScraper, goingToCampScraper];

function getScraperForProvider(provider: string) {
  return SCRAPERS.find((s) => s.providers.includes(provider));
}

export interface RunScrapeOptions {
  limit?: number;
  provider?: string;
}

export interface RunScrapeResult {
  ok: number;
  fail: number;
  total: number;
}

export async function runScrape(options: RunScrapeOptions = {}): Promise<RunScrapeResult> {
  const { limit = 0, provider: providerFilter = null } = options;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(url, serviceKey);

  const bookableProviders = ['ridb', 'bcparks', 'parks_canada', 'wa_state_parks'];
  let query = supabase
    .from('locations_with_coords')
    .select('id, name, provider, type, capacity_total, booking_url, metadata')
    .in('provider', bookableProviders);

  if (providerFilter) {
    query = query.eq('provider', providerFilter);
  }
  if (limit > 0) {
    query = query.limit(limit);
  }

  const { data: locations, error } = await query;

  if (error) throw new Error(`Failed to load locations: ${error.message}`);
  if (!locations?.length) return { ok: 0, fail: 0, total: 0 };

  const today = new Date().toISOString().slice(0, 10);
  let ok = 0;
  let fail = 0;

  for (const loc of locations) {
    const scraper = getScraperForProvider(loc.provider);
    if (!scraper) {
      fail++;
      continue;
    }

    const locationForScrape: LocationForScrape = {
      id: loc.id,
      name: loc.name,
      provider: loc.provider,
      booking_url: loc.booking_url,
      metadata: (loc.metadata ?? {}) as Record<string, unknown>,
    };

    try {
      const result = await scraper.run(locationForScrape);
      if (!result) {
        fail++;
        continue;
      }

      const rows = result.availability
        .filter((a) => a.date >= today)
        .map((a) => ({
          location_id: loc.id,
          date: a.date,
          status: a.status,
          spots_remaining: a.spotsRemaining ?? null,
          last_updated: result.lastUpdated,
        }));

      if (rows.length === 0) {
        fail++;
        continue;
      }

      const { error: upsertErr } = await supabase.from('availability').upsert(rows, {
        onConflict: 'location_id,date',
        ignoreDuplicates: false,
      });

      if (upsertErr) {
        fail++;
        continue;
      }
      ok++;
    } catch {
      fail++;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return { ok, fail, total: locations.length };
}
