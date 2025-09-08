// src/app/dashboard/contracts/page.tsx
import { Suspense } from 'react';
import ContractsClient from '../../../components/contracts/ContractsClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type SearchParams = Record<string, string | string[] | undefined>;

async function fetchContracts(sp: SearchParams) {
  const params = new URLSearchParams();
  const keys = [
    'page', 'limit', 'municipalityId', 'departmentId', 'search',
    'endFrom', 'endTo', 'dueInDays', 'expiredOnly', 'order',
  ];

  keys.forEach((k) => {
    const v = sp?.[k];
    if (!v) return;
    const value = Array.isArray(v) ? v[0] : v;
    if (value !== undefined && value !== null && value !== '') {
      params.set(k, value);
    }
  });

  const res = await fetch(`${API_BASE}/contracts?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao carregar contratos');
  return res.json();
}

async function fetchMunicipalities() {
  const res = await fetch(`${API_BASE}/municipalities?limit=9999`, { cache: 'no-store' });
  if (!res.ok) return { data: [] };
  return res.json();
}

export default async function Page({
  searchParams,
}: {
  // 🔧 Agora é Promise<SearchParams> e precisamos dar await nele
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams; // 👈 isso elimina o erro
  const { data, total, page, totalPages, limit } = await fetchContracts(sp);
  const municipalities = await fetchMunicipalities();

  return (
    <Suspense>
      <ContractsClient
        initialContracts={data}
        totalContracts={total}
        page={page}
        totalPages={totalPages}
        limit={limit}
        municipalities={municipalities.data || []}
      />
    </Suspense>
  );
}
