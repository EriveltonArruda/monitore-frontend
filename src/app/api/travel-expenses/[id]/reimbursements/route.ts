import { NextRequest, NextResponse } from 'next/server';

const API = process.env.API_BASE_URL ?? 'http://localhost:3001';
const BASE = `${API}/travel-expenses`;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const r = await fetch(`${BASE}/${params.id}/reimbursements`, { cache: 'no-store' });
  const txt = await r.text();
  try { return NextResponse.json(JSON.parse(txt), { status: r.status }); }
  catch { return new NextResponse(txt, { status: r.status }); }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const r = await fetch(`${BASE}/${params.id}/reimbursements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const txt = await r.text();
  try { return NextResponse.json(JSON.parse(txt), { status: r.status }); }
  catch { return new NextResponse(txt, { status: r.status }); }
}
