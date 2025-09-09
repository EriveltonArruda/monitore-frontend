// src/app/dashboard/reports/travel-expenses/page.tsx
import TravelExpensesReportClient from '@/components/travel-expenses/TravelExpensesReportClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type SearchParams = Record<string, string | string[] | undefined>;

async function fetchTravelExpenses(sp: SearchParams) {
  const params = new URLSearchParams();
  const keys = [
    'page', 'limit',
    'status', 'category', 'search',
    'month', 'year',
    'orderBy', 'order',
  ];
  keys.forEach((k) => {
    const v = sp[k];
    if (!v) return;
    const value = Array.isArray(v) ? v[0] : v;
    if (value !== undefined && value !== null && value !== '') params.set(k, value);
  });

  if (!params.get('limit')) params.set('limit', '10');

  const res = await fetch(`${API_BASE}/travel-expenses?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao carregar despesas de viagem (relatório)');
  // esperado do backend: { data, total, page, totalPages, limit }
  return res.json();
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const { data, total, page, totalPages } = await fetchTravelExpenses(sp);

  return (
    <TravelExpensesReportClient
      initialRows={data}
      totalRows={total}
      page={page}
      totalPages={totalPages}
    />
  );
}
