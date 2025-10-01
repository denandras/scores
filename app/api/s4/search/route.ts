import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Search is disabled per request. Return 410 Gone for any method.
export async function GET() {
  return NextResponse.json({ ok: false, error: 'search_disabled' }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ ok: false, error: 'search_disabled' }, { status: 410 });
}
