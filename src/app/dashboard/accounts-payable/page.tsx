// Página (Server Component) que busca a lista paginada e entrega ao client component
import { AccountsPayableClient } from '@/components/accounts-payable/AccountsPayableClient';
import { RequireModule } from "@/components/RequireModule";
import { UserModule } from "@/types/UserModule";

// Tipagem refletindo os novos campos que o backend agora envia
type AccountPayable = {
  id: number;
  name: string;
  category: string;
  value: number;
  dueDate: string;
  status: string;
  // campos já existentes que podem chegar
  installmentType?: string;
  installments?: number | null;
  currentInstallment?: number | null;
  payments?: { id: number; paidAt: string }[];
  // NOVO: campos de alerta (opcionais)
  daysToDue?: number;
  alertTag?: 'VENCIDO' | 'D-3' | 'D-7' | null;
};

// Função server-side para buscar a lista paginada com filtros vindos da URL
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
  // Normaliza searchParams (Next pode entregar como string|string[]|undefined)
  const resolvedSearchParams = await searchParams;

  // Monta query para o backend com base nos filtros
  const params = new URLSearchParams();
  const getOne = (v: string | string[] | undefined, fallback = '') =>
    Array.isArray(v) ? (v[0] ?? fallback) : (v ?? fallback);

  const page = getOne(resolvedSearchParams['page'], '1');

  let month = getOne(resolvedSearchParams['month'], '');
  let year = getOne(resolvedSearchParams['year'], '');

  // Se veio mês sem ano, assume ano atual
  if (month && !year) {
    year = String(new Date().getFullYear());
  }

  params.append('page', String(page));
  params.append('limit', '10');

  if (month) params.append('month', String(month));
  if (year) params.append('year', String(year));

  const status = getOne(resolvedSearchParams['status']);
  if (status && status !== 'TODOS') {
    params.append('status', String(status));
  }

  const category = getOne(resolvedSearchParams['category']);
  if (category) params.append('category', String(category));

  const search = getOne(resolvedSearchParams['search']);
  if (search && String(search).trim() !== '') {
    params.append('search', String(search));
  }

  // Busca os dados paginados para render inicial
  const paginatedAccounts = await getPaginatedAccounts(params);

  return (
    <RequireModule module={UserModule.CONTAS_PAGAR}>
      <AccountsPayableClient
        initialAccounts={paginatedAccounts.data}
        totalAccounts={paginatedAccounts.total}
      />
    </RequireModule>
  );
}
