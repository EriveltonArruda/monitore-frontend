import { AccountsPayableClient } from '@/components/accounts-payable/AccountsPayableClient';

type AccountPayable = {
  id: number;
  name: string;
  category: string;
  value: number;
  dueDate: string;
  status: string;
};

async function getPaginatedAccounts(params: URLSearchParams) {
  const response = await fetch(`http://localhost:3001/accounts-payable?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    return { data: [], total: 0 };
  }
  return response.json();
}

export default async function AccountsPayablePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const resolvedSearchParams = await searchParams;

  const params = new URLSearchParams();
  const page = resolvedSearchParams['page'] ?? '1';

  // Captura mês/ano atual caso não venha na URL
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0'); // '07'
  const currentYear = String(now.getFullYear()); // '2025'

  const month = resolvedSearchParams['month'] ?? currentMonth;
  const year = resolvedSearchParams['year'] ?? currentYear;

  params.append('page', String(page));
  params.append('limit', '10');
  if (month) params.append('month', String(month));
  if (year) params.append('year', String(year));
  // NOVO: adiciona o status se veio da URL (e não for 'TODOS')
  const status = resolvedSearchParams['status'];
  if (status && status !== 'TODOS') {
    params.append('status', String(status));
  }

  const category = resolvedSearchParams['category'] ?? '';
  if (category) params.append('category', String(category));

  // NOVO: inclui o search, se houver
  const search = resolvedSearchParams['search'] ?? '';
  if (search && String(search).trim() !== '') {
    params.append('search', String(search));
  }

  const paginatedAccounts = await getPaginatedAccounts(params);

  return (
    <AccountsPayableClient
      initialAccounts={paginatedAccounts.data}
      totalAccounts={paginatedAccounts.total}
    />
  );
}
