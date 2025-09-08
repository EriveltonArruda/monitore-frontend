// src/app/dashboard/receivables/page.tsx
import ReceivablesClient from '../../../components/receivables/ReceivablesClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type SearchParams = Record<string, string | string[] | undefined>;

async function fetchReceivables(sp: SearchParams) {
  const params = new URLSearchParams();
  const keys = [
    'page', 'limit',
    'municipalityId', 'departmentId', 'contractId',
    'status', 'search',
    'issueFrom', 'issueTo',
    'periodFrom', 'periodTo',
    'receivedFrom', 'receivedTo',
    'orderBy', 'order',
  ];
  keys.forEach((k) => {
    const v = sp[k];
    if (!v) return;
    const value = Array.isArray(v) ? v[0] : v;
    if (value !== undefined && value !== null && value !== '') params.set(k, value);
  });

  if (!params.get('limit')) params.set('limit', '20');

  const res = await fetch(`${API_BASE}/receivables?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao carregar recebidos');
  return res.json();
}

async function fetchMunicipalities() {
  const r = await fetch(`${API_BASE}/municipalities?limit=9999}`, { cache: 'no-store' });
  if (!r.ok) return { data: [] };
  return r.json();
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  const [{ data, total, page, totalPages, limit }, municipalities] = await Promise.all([
    fetchReceivables(sp),
    fetchMunicipalities(),
  ]);

  const Client = ReceivablesClient as any;

  return (
    <Client
      initialReceivables={data}
      totalReceivables={total}
      page={page}
      totalPages={totalPages}
      limit={limit}
      municipalities={municipalities.data || []}
    />
  );
}
