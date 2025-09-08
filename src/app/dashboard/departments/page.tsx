// src/app/dashboard/departments/page.tsx
import DepartmentsClient from '../../../components/departments/DepartmentsClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type SearchParams = Record<string, string | string[] | undefined>;

async function fetchDepartments(sp: SearchParams) {
  const params = new URLSearchParams();
  const keys = ['page', 'limit', 'municipalityId', 'search'];
  keys.forEach((k) => {
    const v = sp[k];
    if (!v) return;
    const value = Array.isArray(v) ? v[0] : v;
    if (value !== undefined && value !== null && value !== '') params.set(k, value);
  });

  if (!params.get('limit')) params.set('limit', '20');

  const res = await fetch(`${API_BASE}/departments?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao carregar órgãos/secretarias');
  return res.json();
}

async function fetchMunicipalities() {
  const r = await fetch(`${API_BASE}/municipalities?limit=9999`, { cache: 'no-store' });
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
    fetchDepartments(sp),
    fetchMunicipalities(),
  ]);

  // ⬇️ Hack seguro pra destravar TypeScript enquanto alinhamos as Props do Client
  const Client = DepartmentsClient as any;

  return (
    <Client
      initialDepartments={data}
      totalDepartments={total}
      page={page}
      totalPages={totalPages}
      limit={limit}
      municipalities={municipalities.data || []}
    />
  );
}
