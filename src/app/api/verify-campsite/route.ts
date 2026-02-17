import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GEMINI_VERIFY_PROMPT = `You are validating whether a location is a real place where you can camp or make overnight reservations.

Given this location:
- Name: {{name}}
- Provider: {{provider}}
- Type: {{type}}
- Coordinates: {{lat}}, {{lon}}
{{#if metadata}}Metadata: {{metadata}}{{/if}}

Consider: Is this a campground, campsite, hut, or reservable overnight accommodation? Or could it be a day-use area, trailhead, visitor center, ecological reserve without camping, parking lot, or other non-camping facility?

Respond with JSON only:
{
  "is_likely_campsite": boolean,
  "confidence": number (0-1),
  "concern": "string or null - brief reason if uncertain (e.g. 'May be day-use only', 'Ecological reserve - no camping')",
  "summary": "one sentence"
}`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      locationId,
      name,
      provider,
      type,
      lat,
      lon,
      metadata,
    } = body as {
      locationId: string;
      name: string;
      provider?: string;
      type?: string;
      lat?: number;
      lon?: number;
      metadata?: Record<string, unknown>;
    };

    if (!locationId || !name) {
      return NextResponse.json({ error: 'locationId and name required' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const supabase = createClient(url, key);

    // Check existing verification
    const { data: loc } = await supabase
      .from('locations')
      .select('metadata')
      .eq('id', locationId)
      .single();

    const meta = (loc?.metadata as Record<string, unknown>) ?? {};
    const verified = meta.camping_verified as string | undefined;
    if (verified === 'approved') {
      return NextResponse.json({ needsReview: false, status: 'approved' });
    }
    if (verified === 'rejected') {
      return NextResponse.json({ needsReview: false, status: 'rejected' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        needsReview: true,
        concern: 'Verification unavailable (GEMINI_API_KEY not set)',
        summary: 'Manual review needed.',
      });
    }

    const prompt = GEMINI_VERIFY_PROMPT
      .replace('{{name}}', String(name))
      .replace('{{provider}}', String(provider ?? 'unknown'))
      .replace('{{type}}', String(type ?? 'campsite'))
      .replace('{{lat}}', String(lat ?? ''))
      .replace('{{lon}}', String(lon ?? ''))
      .replace('{{#if metadata}}{{metadata}}{{/if}}', metadata ? JSON.stringify(metadata) : '');

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { needsReview: true, concern: err?.error?.message ?? 'Gemini API error', summary: 'Manual review needed.' },
        { status: 200 }
      );
    }

    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '{}';
    text = text.replace(/^```json\s*|\s*```$/g, '').trim();
    let parsed: { is_likely_campsite?: boolean; confidence?: number; concern?: string | null; summary?: string };
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({
        needsReview: true,
        concern: 'Could not parse verification',
        summary: 'Manual review needed.',
      });
    }

    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5;
    const isLikely = parsed.is_likely_campsite !== false;
    const concern = parsed.concern ?? parsed.summary ?? null;

    // Show Approve/Reject when Gemini is uncertain or says not a campsite
    const needsReview =
      !isLikely ||
      confidence < 0.7 ||
      (typeof concern === 'string' && concern.length > 0);

    return NextResponse.json({
      needsReview,
      concern: concern ?? undefined,
      summary: parsed.summary ?? undefined,
      isLikelyCampsite: isLikely,
      confidence,
    });
  } catch (err) {
    console.error('Verify campsite error:', err);
    return NextResponse.json(
      { needsReview: true, concern: err instanceof Error ? err.message : 'Verification failed', summary: 'Manual review needed.' },
      { status: 200 }
    );
  }
}
