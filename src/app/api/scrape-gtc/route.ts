import { NextResponse } from 'next/server';
import { runScrapeGtc } from '@/lib/run-scrape-gtc';

/** Allow up to 90s for camply (BC Parks) - can be slower than RIDB. */
export const maxDuration = 90;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const recArea = Number(body?.recArea) || 12; // 12 = BC Parks
    const limit = Math.min(Math.max(Number(body?.limit) || 120, 1), 150);

    const result = await runScrapeGtc({ recArea, limit });

    if (result.error) {
      return NextResponse.json(
        {
          ...result,
          ok: false,
          message: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...result,
      ok: true,
      message: `BC Parks: updated ${result.ok} locations (${result.skip} unmatched).`,
    });
  } catch (err) {
    console.error('Scrape GTC API error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Scrape failed',
      },
      { status: 500 }
    );
  }
}
