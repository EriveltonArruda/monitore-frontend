// src/app/dashboard/municipalities/page.tsx
import MunicipalitiesClient from '../../../components/municipalities/MunicipalitiesClient';
import { RequireModule } from '@/components/RequireModule';
import { UserModule } from '@/types/UserModule';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type SearchParams = Record<string, string | string[] | undefined>;

async function fetchMunicipalities(sp: SearchParams) {
  const params = new URLSearchParams();
  const keys = ['page', 'limit', 'search'];
  keys.forEach((k) => {
    const v = sp[k];
    if (!v) return;
    const value = Array.isArray(v) ? v[0] : v;
    if (value !== undefined && value !== null && value !== '') params.set(k, value);
  });

  if (!params.get('limit')) params.set('limit', '20');

  const res = await fetch(`${API_BASE}/municipalities?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao carregar municípios');
  return res.json();
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  const { data, total, page, totalPages, limit } = await fetchMunicipalities(sp);

  return (
    <RequireModule module={UserModule.MUNICIPIOS}>
      <MunicipalitiesClient
        initialRows={data}
        total={total}
        page={page}
        totalPages={totalPages}
        limit={limit}
      />
    </RequireModule>
  );
}
