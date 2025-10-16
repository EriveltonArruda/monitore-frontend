// src/app/api/travel-expenses/[id]/returns/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const r = await fetch(`${API}/travel-expenses/${params.id}/returns`, { cache: 'no-store' });
    const txt = await r.text();
    try { return NextResponse.json(JSON.parse(txt), { status: r.status }); }
    catch { return new NextResponse(txt, { status: r.status }); }
  } catch {
    return NextResponse.json({ message: 'Falha ao contatar o backend.' }, { status: 502 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const r = await fetch(`${API}/travel-expenses/${params.id}/returns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const txt = await r.text();
    try { return NextResponse.json(JSON.parse(txt), { status: r.status }); }
    catch { return new NextResponse(txt, { status: r.status }); }
  } catch {
    return NextResponse.json({ message: 'Falha ao contatar o backend.' }, { status: 502 });
  }
}
