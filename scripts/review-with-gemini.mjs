#!/usr/bin/env node
/**
 * Send location data to Gemini for lat/lon correction review.
 * Requires: GEMINI_API_KEY, and run export-locations-for-gemini.mjs first.
 *
 * Usage: node scripts/review-with-gemini.mjs
 * Output: scripts/exports/gemini-corrections.json
 *
 * Sends in batches of 150 locations to stay within token limits.
 * Focus: bcparks, rstbc, parks_canada (providers most likely to have wrong centroids).
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BATCH_SIZE = 75;
const PROVIDERS_TO_REVIEW = new Set(['bcparks', 'rstbc', 'parks_canada']);

const PROMPT = `YOUR TASK: DATA QUALITY REVIEW — (1) CORRECT COORDINATES, (2) IDENTIFY MISSING CAMPSITES.

You are auditing campground and recreation site data for BC and Washington. Two goals:

PART 1 — FIX WRONG COORDINATES
- BC Parks & RSTBC: Many points are polygon centroids (center of park boundary), NOT the actual campground.
- If coordinates are wrong (ocean, wrong region, centroid far from campsite): provide corrected lat, lon.
- Only correct when confident. When unsure, omit.

PART 2 — IDENTIFY MISSING SITES (any overnight accommodation)
- Compare the input against ALL known places to camp or stay overnight in BC and Washington.
- Include:
  * Campgrounds: BC Parks, Parks Canada, RSTBC (Helm Creek, Russet Lake, Singing Pass, etc.)
  * Marine campsites: water-access only, kayak/canoe sites, Sea to Sky Marine Trail, bc_coastal
  * Huts: LOADS of backcountry huts are typically missing — Cayoosh Hut, Beekers Hut, Wendy Thompson, Sphinx, Burton Hut, Saddle Mountain, Harrison Hut, Elfin Lakes, Sproatt, Himmelsbach, many VOC/BCMC/ACC/PWA huts
  * Commercial: lodges, guided huts
- Provider: "bcparks" | "parks_canada" | "rstbc" | "bc_coastal" | "acc" | "bcmc" | "voc" | "spearhead_huts" | "cvhs" | "pwa" | "tetrahedron" | "sct" | "commercial" | "other"
- type: "campsite" | "hut" | "lodge" — use "hut" for backcountry huts, "lodge" for commercial lodges
- Aim for comprehensive coverage: every bookable, FCFS, or walk-in overnight site.

OUTPUT FORMAT — JSON only (no markdown, no code blocks):
{
  "corrections": [
    {
      "id": "exact-uuid-from-input",
      "original_lat": 49.5,
      "original_lon": -123.2,
      "lat": 49.1234,
      "lon": -123.5678,
      "reason": "Centroid of park; actual campground at trailhead per bcparks.ca"
    }
  ],
  "additions": [
    { "name": "Russet Lake", "provider": "bcparks", "lat": 50.05, "lon": -122.85, "type": "campsite", "reason": "Backcountry campground Garibaldi, Singing Pass trail" },
    { "name": "Cayoosh Hut", "provider": "bcmc", "lat": 50.42, "lon": -122.5, "type": "hut", "reason": "Backcountry ski hut, Cayoosh Range near Pemberton, Duffey Lake Rd" },
    { "name": "Beekers Hut", "provider": "voc", "lat": 50.15, "lon": -122.6, "type": "hut", "reason": "User-maintained memorial hut near Steep Creek, Lillooet Range" },
    { "name": "Wendy Thompson Hut", "provider": "acc", "lat": 50.35, "lon": -122.55, "type": "hut", "reason": "ACC hut in Marriott Basin near Duffey Lake" },
    { "name": "Plumper Cove Marine", "provider": "bc_coastal", "lat": 49.4, "lon": -123.5, "type": "campsite", "reason": "Water-access marine campground in Gulf Islands" }
  ]
}

REQUIREMENTS:
- Use exact "id" from input for corrections. Include original_lat, original_lon for audit.
- Additions: name, provider, lat, lon required. type defaults to "campsite". Include brief reason.
- Valid: BC lat 48–60, lon -139 to -114; WA lat 45–49, lon -125 to -117.
- If none in a batch: {"corrections":[],"additions":[]}.`;

function repairTruncatedJson(str) {
  let s = str.trim();
  if (!s.startsWith('{')) return s;
  let depth = 0;
  let inString = false;
  let escape = false;
  let quote = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escape) { escape = false; continue; }
    if (c === '\\' && inString) { escape = true; continue; }
    if ((c === '"' || c === "'") && !inString) { inString = true; quote = c; continue; }
    if (c === quote && inString) { inString = false; quote = null; continue; }
    if (!inString && (c === '{' || c === '[')) depth++;
    else if (!inString && (c === '}' || c === ']')) depth--;
  }
  if (inString) s += quote ?? '"';
  while (depth > 0) {
    if (/[,\s]$/.test(s)) s = s.replace(/[,\s]+$/, '');
    if (depth === 1 && !s.includes('"additions"')) {
      s += ',"additions":[]}';
    } else {
      s += depth === 1 ? '}' : ']';
    }
    depth--;
  }
  return s;
}

async function callGemini(locations, batchIndex) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY required');

  const input = locations.map((l) => ({
    id: l.id,
    name: l.name,
    provider: l.provider,
    lat: l.lat,
    lon: l.lon,
    type: l.type,
    metadata: l.metadata,
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${PROMPT}\n\n---\nLocations (batch ${batchIndex + 1}):\n${JSON.stringify(input)}\n---\nRespond with JSON only.`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 16384,
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || res.statusText);
  }

  const data = await res.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const repaired = repairTruncatedJson(text);
    try {
      parsed = JSON.parse(repaired);
    } catch {
      throw new Error('Gemini returned invalid JSON: ' + text.slice(0, 300));
    }
  }
  return {
    corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
    additions: Array.isArray(parsed.additions) ? parsed.additions : [],
  };
}

const MISSING_PASS_PROMPT = `Given this list of campground/hut/lodge names we already have, identify ALL overnight accommodation in British Columbia and Washington that we are MISSING.

LOADS of backcountry huts are typically missing. Include:
- Campgrounds: Helm Creek, Russet Lake, Singing Pass, etc.
- Marine campsites: water-access, kayak sites, Sea to Sky Marine Trail (provider: bc_coastal)
- Huts: Cayoosh Hut, Beekers Hut, Wendy Thompson Hut, Burton Hut, Sphinx Hut, Harrison Hut, Saddle Mountain, Sproatt, Himmelsbach, Elfin Lakes shelter, plus VOC/BCMC/ACC/PWA/Spearhead/CVHS/Tetrahedron/SCT huts — many are obscure but well-known to backcountry users
- Commercial: lodges, guided huts (provider: commercial)
- Other: anything else (provider: other)

Output JSON only:
{
  "additions": [
    { "name": "Cayoosh Hut", "provider": "bcmc", "lat": 50.42, "lon": -122.5, "type": "hut", "reason": "Backcountry ski hut, Cayoosh Range, Duffey Lake Rd" },
    { "name": "Russet Lake", "provider": "bcparks", "lat": 50.05, "lon": -122.85, "type": "campsite", "reason": "Backcountry campground Garibaldi, Singing Pass" },
    { "name": "Beekers Hut", "provider": "voc", "lat": 50.15, "lon": -122.6, "type": "hut", "reason": "User-maintained hut near Steep Creek" },
    { "name": "Wendy Thompson Hut", "provider": "acc", "lat": 50.35, "lon": -122.55, "type": "hut", "reason": "ACC hut Marriott Basin, Duffey Lake" }
  ]
}

Include EVERY overnight site — campgrounds, marine sites, hidden/obscure huts, lodges. Provider: bcparks | parks_canada | rstbc | bc_coastal | acc | bcmc | voc | spearhead_huts | cvhs | pwa | tetrahedron | sct | commercial | other. type: campsite | hut | lodge. Valid: BC lat 48-60, lon -139 to -114; WA lat 45-49, lon -125 to -117.`;

async function callMissingPass(existingNames) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  const uniqueNames = [...new Set(existingNames)].sort().slice(0, 800);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${MISSING_PASS_PROMPT}\n\n---\nExisting location names (${uniqueNames.length}):\n${JSON.stringify(uniqueNames)}\n---\nRespond with JSON only.`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!res.ok) return [];
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed.additions) ? parsed.additions : [];
  } catch {
    return [];
  }
}

async function main() {
  const exportPath = join(__dirname, 'exports', 'locations-export.json');
  let data;
  try {
    data = JSON.parse(readFileSync(exportPath, 'utf8'));
  } catch (e) {
    console.error('Run export first: node scripts/export-locations-for-gemini.mjs');
    process.exit(1);
  }

  const toReview = data.filter((l) => PROVIDERS_TO_REVIEW.has(l.provider));
  console.error(`Reviewing ${toReview.length} locations (bcparks, rstbc, parks_canada)`);

  const allCorrections = [];
  const allAdditions = [];
  const seenAdditionKeys = new Set();

  for (let i = 0; i < toReview.length; i += BATCH_SIZE) {
    const batch = toReview.slice(i, i + BATCH_SIZE);
    const batchIndex = Math.floor(i / BATCH_SIZE);
    console.error(`Batch ${batchIndex + 1}/${Math.ceil(toReview.length / BATCH_SIZE)}...`);
    let result;
    try {
      result = await callGemini(batch, batchIndex);
    } catch (e) {
      console.error(`Retry batch ${batchIndex + 1}...`);
      await new Promise((r) => setTimeout(r, 3000));
      result = await callGemini(batch, batchIndex);
    }
    for (const c of result.corrections) {
      const loc = batch.find((l) => l.id === c.id);
      allCorrections.push({
        id: c.id,
        name: loc?.name ?? c.name,
        provider: loc?.provider ?? c.provider,
        original_lat: c.original_lat ?? loc?.lat,
        original_lon: c.original_lon ?? loc?.lon,
        lat: c.lat,
        lon: c.lon,
        reason: c.reason,
      });
    }
    for (const a of result.additions) {
      const key = `${(a.name || '').toLowerCase()}-${a.provider}-${a.lat}-${a.lon}`;
      if (!seenAdditionKeys.has(key) && a.name && a.provider && a.lat != null && a.lon != null) {
        seenAdditionKeys.add(key);
        allAdditions.push({
          name: a.name.trim(),
          provider: a.provider,
          lat: parseFloat(a.lat),
          lon: parseFloat(a.lon),
          type: a.type || 'campsite',
          reason: a.reason,
          capacity_total: a.capacity_total ?? null,
          metadata: a.metadata || {},
        });
      }
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.error('Final pass: identifying any remaining missing campsites...');
  const missingPass = await callMissingPass(toReview.map((l) => l.name));
  for (const a of missingPass) {
    const key = `${(a.name || '').toLowerCase()}-${a.provider}-${a.lat}-${a.lon}`;
    if (!seenAdditionKeys.has(key) && a.name && a.provider && a.lat != null && a.lon != null) {
      seenAdditionKeys.add(key);
      allAdditions.push({
        name: a.name.trim(),
        provider: a.provider,
        lat: parseFloat(a.lat),
        lon: parseFloat(a.lon),
        type: a.type || 'campsite',
        reason: a.reason || 'Identified in final missing-campsites pass',
      });
    }
  }

  const outPath = join(__dirname, 'exports', 'gemini-corrections.json');
  mkdirSync(dirname(outPath), { recursive: true });
  const output = {
    corrections: allCorrections,
    additions: allAdditions,
    source_export: 'locations-export.json',
    reviewed_at: new Date().toISOString(),
  };
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.error(`Saved ${allCorrections.length} corrections and ${allAdditions.length} additions to gemini-corrections.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
