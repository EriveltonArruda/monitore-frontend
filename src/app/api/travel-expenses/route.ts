import { NextRequest, NextResponse } from 'next/server';

const API = process.env.API_BASE_URL ?? 'http://localhost:3001';
const BASE = `${API}/travel-expenses`;

export async function GET(req: NextRequest) {
  const url = `${BASE}?${req.nextUrl.searchParams.toString()}`;
  const r = await fetch(url, { cache: 'no-store' });
  const txt = await r.text();
  try { return NextResponse.json(JSON.parse(txt), { status: r.status }); }
  catch { return new NextResponse(txt, { status: r.status }); }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const r = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const txt = await r.text();
  try { return NextResponse.json(JSON.parse(txt), { status: r.status }); }
  catch { return new NextResponse(txt, { status: r.status }); }
}
