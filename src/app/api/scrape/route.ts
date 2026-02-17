import { NextResponse } from 'next/server';
import { runScrape } from '@/lib/run-scrape';

export const maxDuration = 60; // Allow up to 60s (Vercel Pro). Use limit to stay under.

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit) || 15, 1), 50);
    const provider = typeof body?.provider === 'string' ? body.provider : undefined;

    const result = await runScrape({ limit, provider });
    return NextResponse.json({
      ...result,
      ok: true,
      message: `Updated ${result.ok} locations. ${result.fail} skipped/failed.`,
    });
  } catch (err) {
    console.error('Scrape API error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Scrape failed',
      },
      { status: 500 }
    );
  }
}
