import { AccountsPayableClient } from '@/components/accounts-payable/AccountsPayableClient';

type AccountPayable = {
  id: number;
  name: string;
  category: string;
  value: number;
  dueDate: string;
  status: string;
};

// A função de busca agora aceita parâmetros de paginação
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
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  const params = new URLSearchParams();
  const page = resolvedSearchParams['page'] ?? '1';
  params.append('page', String(page));
  params.append('limit', '10');

  const paginatedAccounts = await getPaginatedAccounts(params);

  return (
    <AccountsPayableClient
      initialAccounts={paginatedAccounts.data}
      totalAccounts={paginatedAccounts.total}
    />
  );
}