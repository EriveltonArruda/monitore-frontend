import { NextRequest, NextResponse } from 'next/server';

const API = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001';

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string; returnId: string } }
) {
  try {
    const r = await fetch(`${API}/travel-expenses/${params.id}/returns/${params.returnId}`, {
      method: 'DELETE',
    });
    const txt = await r.text();
    try { return NextResponse.json(JSON.parse(txt), { status: r.status }); }
    catch { return new NextResponse(txt, { status: r.status }); }
  } catch {
    return NextResponse.json({ message: 'Falha ao contatar o backend.' }, { status: 502 });
  }
}
