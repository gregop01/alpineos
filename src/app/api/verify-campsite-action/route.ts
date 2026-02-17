import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { locationId, action } = body as { locationId: string; action: 'approve' | 'reject' };

    if (!locationId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'locationId and action (approve|reject) required' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const supabase = createClient(url, key);

    const { data: loc } = await supabase.from('locations').select('metadata').eq('id', locationId).single();
    const meta = (loc?.metadata as Record<string, unknown>) ?? {};
    const status = action === 'approve' ? 'approved' : 'rejected';
    const updated = {
      ...meta,
      camping_verified: status,
      camping_verified_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('locations').update({ metadata: updated }).eq('id', locationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: action });
  } catch (err) {
    console.error('Verify action error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Action failed' }, { status: 500 });
  }
}
