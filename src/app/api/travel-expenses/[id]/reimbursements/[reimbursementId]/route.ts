import { NextRequest, NextResponse } from 'next/server';

const API = process.env.API_BASE_URL ?? 'http://localhost:3001';
const BASE = `${API}/travel-expenses`;

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; reimbursementId: string } }) {
  const r = await fetch(`${BASE}/${params.id}/reimbursements/${params.reimbursementId}`, { method: 'DELETE' });
  const txt = await r.text();
  try { return NextResponse.json(JSON.parse(txt), { status: r.status }); }
  catch { return new NextResponse(txt, { status: r.status }); }
}
