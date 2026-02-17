import { NextRequest, NextResponse } from 'next/server';
import { toTitleCase } from '@/lib/format';
import { getCampingBadgeInfo, getCampingBadgeLabel } from '@/lib/booking-utils';

const PROVIDER_LABELS: Record<string, string> = {
  rstbc: 'Rec Sites (RSTBC)',
  bcparks: 'BC Parks',
  parks_canada: 'Parks Canada',
  bc_coastal: 'Coastal Campsites',
  wa_state_parks: 'WA State Parks',
  ridb: 'Recreation.gov',
  acc: 'ACC Huts',
  bcmc: 'BCMC',
  voc: 'VOC',
  spearhead_huts: 'Spearhead Huts',
  cvhs: 'Columbia Valley Huts',
  pwa: 'Pemberton Wildlife Assoc',
  tetrahedron: 'Tetrahedron Cabins',
  sct: 'Sunshine Coast Trail',
  commercial: 'Commercial',
  other: 'Other',
};

function describeRegion(lon: number, lat: number): string {
  if (lat >= 48.3 && lat <= 60 && lon >= -139 && lon <= -114) return 'British Columbia, Canada';
  if (lat >= 45.5 && lat <= 49 && lon >= -125 && lon <= -117) return 'Washington State, USA';
  return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°W`;
}

function buildContext(loc: {
  name: string;
  provider: string;
  type: string;
  capacity_total?: number | null;
  metadata?: Record<string, unknown>;
  lon?: number;
  lat?: number;
}): string {
  const providerLabel = PROVIDER_LABELS[loc.provider] ?? loc.provider.replace(/_/g, ' ');
  const badge = getCampingBadgeInfo({
    provider: loc.provider,
    booking_url: null,
    metadata: loc.metadata,
  });
  const badgeLabel = getCampingBadgeLabel(badge);
  const parts = [
    `Location: ${toTitleCase(loc.name)}`,
    `Provider: ${providerLabel}`,
    `Type: ${toTitleCase(loc.type)}`,
    `Camping: ${badgeLabel}${badge.requiresBooking ? ' (requires reservation)' : ''}`,
  ];
  if (loc.lon != null && loc.lat != null) {
    parts.push(`Coordinates: ${loc.lat.toFixed(4)}°N, ${loc.lon.toFixed(4)}°W (${describeRegion(loc.lon, loc.lat)})`);
  }
  const park = loc.metadata?.park;
  if (park && typeof park === 'string') {
    parts.push(`Park / Area: ${park}`);
  }
  if (loc.capacity_total != null && loc.capacity_total > 0) {
    parts.push(`Capacity: ${loc.capacity_total}`);
  }
  if (loc.metadata && Object.keys(loc.metadata).length > 0) {
    const meta = Object.entries(loc.metadata)
      .filter(([k, v]) => v != null && k !== 'park')
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(', ');
    if (meta) parts.push(`Details: ${meta}`);
  }
  return parts.join('\n');
}

const SYSTEM_PROMPT = `You are a helpful camping and outdoor recreation assistant. Given the location context below, produce TWO parts separated by exactly "---" on its own line:

PART 1 (Booking summary): One short sentence describing the camp/booking setup. Examples: "Marine park with backcountry camping only." "Drive-in reservation campground." "Wilderness FCFS trail campsite." "Water-access kayak sites." This helps users quickly understand what kind of place it is beyond basic type/capacity.

PART 2 (Need to know): 1-2 short sentences of "need to know" or "useful to know" tips. Do NOT repeat the booking setup from Part 1.

CRITICAL: The context describes ONE SPECIFIC place. Many campsites share names with other locations elsewhere. Use the coordinates and provider to ensure you refer ONLY to this exact location.

CRITICAL for Part 2: Do NOT repeat info visible on the card (provider, type, capacity, booking type) or the booking summary from Part 1. Focus ONLY on: road/trail conditions, access tips, seasonal considerations, what makes it unique, local knowledge (crowding, best sites, timing), caveats (exposed, mosquitoes, no water, popular — book early).

Write in a friendly, scannable style. No preamble. Each part max 1-2 sentences. End with proper punctuation.`;

interface RequestBody {
  name: string;
  provider: string;
  type: string;
  capacity_total?: number | null;
  metadata?: Record<string, unknown>;
  lon?: number;
  lat?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { name, provider, type, capacity_total, metadata, lon, lat } = body;
    if (!name || !provider) {
      return NextResponse.json(
        { message: 'Missing name or provider' },
        { status: 400 }
      );
    }

    const location = { name, provider, type, capacity_total, metadata, lon, lat };
    const context = buildContext(location);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { message: 'GEMINI_API_KEY is not configured. Add it to .env.local.' },
        { status: 503 }
      );
    }

    const systemWithContext = `${SYSTEM_PROMPT}\n\n---\n${context}\n---`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemWithContext }] },
          contents: [{ role: 'user', parts: [{ text: 'Write the two-part response: Part 1 (booking summary), then --- on its own line, then Part 2 (need to know).' }] }],
          generationConfig: { maxOutputTokens: 1024 },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = (err as { error?: { message?: string } })?.error?.message ?? res.statusText;
      return NextResponse.json(
        { message: msg || `Gemini error: ${res.status}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const fullText = parts
      .map((p) => p.text ?? '')
      .filter(Boolean)
      .join('');
    const trimmed = fullText.trim();

    const sepMatch = trimmed.match(/\n\s*---\s*\n/);
    let bookingSummary: string | null = null;
    let needToKnow: string | null = null;
    if (sepMatch) {
      const sepIdx = trimmed.indexOf(sepMatch[0]);
      bookingSummary = trimmed.slice(0, sepIdx).trim() || null;
      needToKnow = trimmed.slice(sepIdx + sepMatch[0].length).trim() || null;
    } else {
      needToKnow = trimmed || null;
    }

    return NextResponse.json({ bookingSummary, needToKnow });
  } catch (e) {
    console.error('location-summary error:', e);
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
