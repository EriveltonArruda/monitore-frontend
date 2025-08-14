import TravelExpensesPageClient from '@/components/travel-expenses/TravelExpensesPageClient';

type TravelExpense = {
  id: number;
  employeeName?: string | null;
  department?: string | null;
  description?: string | null;
  category?: string | null;
  city?: string | null;
  state?: string | null;
  expenseDate?: string | null;
  currency?: string | null;
  amount: number;
  reimbursedAmount: number;
  status: string;
};

async function getPaginatedTravelExpenses(params: URLSearchParams) {
  // MESMO PADRÃO DO ACCOUNTS-PAYABLE: URL ABSOLUTA FIXA
  const response = await fetch(`http://localhost:3001/travel-expenses?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    return { data: [], total: 0 };
  }
  return response.json();
}

export default async function TravelExpensesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // manter o mesmo padrão do seu accounts-payable (mesmo que não seja Promise aqui)
  const resolvedSearchParams = await searchParams as Record<string, string | string[] | undefined>;

  const params = new URLSearchParams();

  const getOne = (v: string | string[] | undefined, fallback = '') =>
    Array.isArray(v) ? (v[0] ?? fallback) : (v ?? fallback);

  const page = getOne(resolvedSearchParams['page'], '1');
  const pageSize = getOne(resolvedSearchParams['pageSize'], '10');

  let month = getOne(resolvedSearchParams['month'], '');
  let year = getOne(resolvedSearchParams['year'], '');

  // se veio mês sem ano, define ano atual
  if (month && !year) {
    year = String(new Date().getFullYear());
  }

  params.append('page', String(page));
  params.append('pageSize', String(pageSize)); // o backend de travel-expenses usa 'pageSize'

  if (month) params.append('month', String(month));
  if (year) params.append('year', String(year));

  const status = getOne(resolvedSearchParams['status']);
  if (status) params.append('status', String(status));

  const category = getOne(resolvedSearchParams['category']);
  if (category) params.append('category', String(category));

  const search = getOne(resolvedSearchParams['search']);
  if (search && String(search).trim() !== '') {
    params.append('search', String(search));
  }

  const initial = await getPaginatedTravelExpenses(params);

  return <TravelExpensesPageClient initialData={initial} />;
}
