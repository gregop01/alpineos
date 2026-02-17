import { NextRequest, NextResponse } from 'next/server';
import { getCampingBadgeInfo, getCampingBadgeLabel } from '@/lib/booking-utils';
import { toTitleCase } from '@/lib/format';

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

function buildLocationContext(loc: {
  name: string;
  provider: string;
  type: string;
  capacity_total?: number | null;
  booking_url?: string | null;
  metadata?: Record<string, unknown>;
  lon?: number;
  lat?: number;
}): string {
  const providerLabel = PROVIDER_LABELS[loc.provider] ?? loc.provider.replace(/_/g, ' ');
  const badge = getCampingBadgeInfo({
    provider: loc.provider,
    booking_url: loc.booking_url,
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
    if (meta) parts.push(`Metadata: ${meta}`);
  }
  return parts.join('\n');
}

const SYSTEM_PROMPT = `You are a helpful camping and outdoor recreation assistant. You have:
1. Location context below (structured data about this specific place)
2. Google Search – you can search the web for current info, official pages, reviews, etc.

CRITICAL: The location context describes ONE SPECIFIC place. Many campsites share names with other locations elsewhere. Use the coordinates and provider to ensure you refer ONLY to this exact location—never to a different place with the same name. When searching, include region/coordinates to avoid confusion with other locations.

Use both. Start with the location context (it's authoritative for this map). When the question needs more – current conditions, official rules, permits, fees, trail status, recent reviews – use web search. Prefer official provider and government sites.

Fact-check: clearly distinguish what comes from our location data vs what you found via search. Cite or link to sources when you use web results.

Be brief. Keep responses short (2–4 sentences unless the question clearly needs more). Use markdown (bold, lists, links) sparingly. When asked about camping, clarify:
- Traditional campground vs wilderness/backcountry
- First-come first-served vs reservation-only
- Any permit or booking requirements
- Drive-in vs wilderness distinction`;

interface RequestBody {
  messages: { role: 'user' | 'assistant'; content: string }[];
  location: {
    id: string;
    name: string;
    provider: string;
    type: string;
    capacity_total?: number | null;
    booking_url?: string | null;
    metadata?: Record<string, unknown>;
    lon?: number;
    lat?: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { messages, location } = body;
    if (!messages?.length || !location?.name) {
      return NextResponse.json(
        { message: 'Missing messages or location' },
        { status: 400 }
      );
    }

    const locationContext = buildLocationContext(location);
    const systemWithContext = `${SYSTEM_PROMPT}\n\n---\nLocation context:\n${locationContext}\n---`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { message: 'GEMINI_API_KEY is not configured. Add it to .env.local.' },
        { status: 503 }
      );
    }

    // Gemini uses "user" and "model" roles; interleave conversation
    const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = messages.map(
      (m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })
    );

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemWithContext }] },
          contents,
          generationConfig: { maxOutputTokens: 1024 },
          tools: [{ google_search: {} }],
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
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    return NextResponse.json({ content });
  } catch (e) {
    console.error('location-chat error:', e);
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
