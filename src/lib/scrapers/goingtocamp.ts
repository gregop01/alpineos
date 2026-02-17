/**
 * GoingToCamp availability scraper
 * Serves: BC Parks (camping.bcparks.ca), Parks Canada (reservation.pc.gc.ca), Washington (washington.goingtocamp.com)
 *
 * Requires metadata.goingtocamp with { rec_area_id, resource_location_id, map_id }
 * Run scripts/fetch-goingtocamp-ids.mjs to populate these IDs.
 */

import type { Scraper, ScraperResult } from './base';
import { addDays, format } from 'date-fns';
import type { LocationForScrape } from './base';

const HOSTNAMES: Record<number, string> = {
  3: 'washington.goingtocamp.com',
  12: 'camping.bcparks.ca',
  14: 'reservation.pc.gc.ca',
};

/** Map resourceAvailabilities format to per-date status */
function parseMapData(
  resourceAvailabilities: Record<string, Array<{ availability?: number; [k: string]: unknown }>>
): Map<string, { status: string; spotsRemaining: number }> {
  const byDate = new Map<string, { available: number }>();
  for (const siteData of Object.values(resourceAvailabilities ?? {})) {
    const first = Array.isArray(siteData) ? siteData[0] : siteData;
    if (!first || typeof first !== 'object') continue;
    const availMap = (first as { availabilities?: Record<string, number> }).availabilities;
    if (!availMap || typeof availMap !== 'object') continue;
    for (const [dateStr, avail] of Object.entries(availMap)) {
      const cur = byDate.get(dateStr) ?? { available: 0 };
      if (avail === 0) cur.available += 1; // 0 = available in GoingToCamp
      byDate.set(dateStr, cur);
    }
  }
  const result = new Map<string, { status: string; spotsRemaining: number }>();
  for (const [dateStr, { available }] of byDate) {
    result.set(dateStr, {
      status: available > 0 ? 'available' : 'booked',
      spotsRemaining: available,
    });
  }
  return result;
}

export const goingToCampScraper: Scraper = {
  name: 'goingtocamp',
  providers: ['bcparks', 'parks_canada', 'wa_state_parks'],
  async run(location: LocationForScrape): Promise<ScraperResult | null> {
    const gtc = location.metadata?.goingtocamp as
      | { rec_area_id?: number; resource_location_id?: number; map_id?: number }
      | undefined;
    if (!gtc?.rec_area_id || !gtc?.resource_location_id || !gtc?.map_id) return null;

    const hostname = HOSTNAMES[gtc.rec_area_id];
    if (!hostname) return null;

    const today = new Date();
    const startDate = format(today, 'yyyy-MM-dd');
    const endDate = format(addDays(today, 90), 'yyyy-MM-dd');
    const url = `https://${hostname}/api/availability/map`;
    const params = new URLSearchParams({
      mapId: String(gtc.map_id),
      resourceLocationId: String(gtc.resource_location_id),
      bookingCategoryId: '0',
      startDate,
      endDate,
      isReserving: 'true',
      getDailyAvailability: 'true',
      partySize: '1',
      numEquipment: '1',
      equipmentCategoryId: '-32768', // NON_GROUP_EQUIPMENT
      filterData: '[]',
    });

    try {
      const res = await fetch(`${url}?${params}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error(`GoingToCamp API ${res.status}: ${res.statusText}`);
      }
      const data = (await res.json()) as {
        resourceAvailabilities?: Record<string, Array<{ availabilities?: Record<string, number> }>>;
        mapLinkAvailabilities?: Record<string, unknown>;
      };

      const byDate = parseMapData(data.resourceAvailabilities ?? {});

      // If there are linked maps, merge their availability (e.g. overflow areas)
      const linked = data.mapLinkAvailabilities
        ? Object.keys(data.mapLinkAvailabilities)
        : [];
      for (const mapId of linked) {
        const linkParams = new URLSearchParams(params);
        linkParams.set('mapId', mapId);
        const linkRes = await fetch(`${url}?${linkParams}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            Accept: 'application/json',
          },
        });
        if (linkRes.ok) {
          const linkData = (await linkRes.json()) as {
            resourceAvailabilities?: Record<string, Array<{ availabilities?: Record<string, number> }>>;
          };
          const linkByDate = parseMapData(linkData.resourceAvailabilities ?? {});
          for (const [dateStr, info] of linkByDate) {
            const cur = byDate.get(dateStr);
            if (!cur) byDate.set(dateStr, info);
            else
              byDate.set(dateStr, {
                status: cur.status === 'available' || info.status === 'available' ? 'available' : 'booked',
                spotsRemaining: (cur.spotsRemaining ?? 0) + (info.spotsRemaining ?? 0),
              });
          }
        }
      }

      const availability: ScraperResult['availability'] = [];
      for (let i = 0; i < 90; i++) {
        const date = addDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const info = byDate.get(dateStr);
        availability.push({
          date: dateStr,
          status: info?.status ?? 'unknown',
          spotsRemaining: info?.spotsRemaining,
        });
      }

      return {
        locationId: location.id,
        availability,
        lastUpdated: new Date().toISOString(),
      };
    } catch (err) {
      console.error(`GoingToCamp scrape failed for ${location.name}:`, err);
      return null;
    }
  },
};
