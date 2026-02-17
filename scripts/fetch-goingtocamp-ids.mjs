#!/usr/bin/env node
/**
 * Fetch GoingToCamp facility IDs (rec_area_id, resource_location_id, map_id)
 * for BC Parks, Parks Canada, and Washington.
 *
 * Outputs JSON mapping and sample SQL. Use to populate locations.metadata.goingtocamp
 * so scrape-availability.ts can fetch real availability.
 *
 * Usage: node scripts/fetch-goingtocamp-ids.mjs
 *        node scripts/fetch-goingtocamp-ids.mjs --sql   # also output SQL
 *
 * GoingToCamp rec_area_id: 3=Washington, 12=BC Parks, 14=Parks Canada
 */

const REC_AREAS = [
  { id: 3, host: 'washington.goingtocamp.com', provider: 'wa_state_parks' },
  { id: 12, host: 'camping.bcparks.ca', provider: 'bcparks' },
  { id: 14, host: 'reservation.pc.gc.ca', provider: 'parks_canada' },
];

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

function escapeSql(str) {
  if (str == null) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

async function main() {
  const wantSql = process.argv.includes('--sql');
  const allMappings = [];

  for (const ra of REC_AREAS) {
    try {
      const facilities = await fetchJson(
        `https://${ra.host}/api/resourceLocation`
      );
      const details = await fetchJson(`https://${ra.host}/api/maps`);

      const detailsByLocationId = {};
      for (const d of Array.isArray(details) ? details : []) {
        if (d?.resourceLocationId) {
          detailsByLocationId[d.resourceLocationId] = d;
        }
      }

      for (const f of Array.isArray(facilities) ? facilities : []) {
        const locName =
          f.localizedValues?.[0]?.fullName || f.resourceLocationName || 'Unknown';
        const resourceLocationId = f.resourceLocationId;
        const d = detailsByLocationId[resourceLocationId];
        const mapId = d?.mapId;

        if (!mapId) continue;

        const gtc = {
          rec_area_id: ra.id,
          resource_location_id: resourceLocationId,
          map_id: mapId,
        };
        allMappings.push({
          provider: ra.provider,
          name: locName,
          goingtocamp: gtc,
        });
      }
    } catch (err) {
      console.error(`Failed for ${ra.provider}:`, err.message);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(JSON.stringify(allMappings, null, 2));

  if (wantSql && allMappings.length > 0) {
    console.error('\n-- Sample SQL (match by name; adjust as needed):');
    const updates = allMappings
      .slice(0, 5)
      .map(
        (m) =>
          `UPDATE locations SET metadata = COALESCE(metadata,'{}'::jsonb) || '${JSON.stringify({
            goingtocamp: m.goingtocamp,
          }).replace(/'/g, "''")}'::jsonb WHERE provider = ${escapeSql(m.provider)} AND name ILIKE ${escapeSql('%' + m.name.split(' ')[0] + '%')};`
      );
    updates.forEach((u) => console.error(u));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
