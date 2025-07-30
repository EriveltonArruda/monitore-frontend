import { SuppliersPageClient } from '@/components/suppliers/SuppliersPageClient';

type Supplier = {
  id: number;
  name: string;
  cnpj?: string | null;
  phone?: string | null;
  email?: string | null;
};

// Função de busca paginada
async function getPaginatedSuppliers(params: URLSearchParams) {
  const response = await fetch(`http://localhost:3001/suppliers?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    return { data: [], total: 0 };
  }
  return response.json();
}

export default async function SuppliersManagementPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const resolvedParams = await searchParams;

  const params = new URLSearchParams();
  const page = Array.isArray(resolvedParams.page)
    ? resolvedParams.page[0]
    : resolvedParams.page || '1';

  params.append('page', String(page));
  params.append('limit', '10');

  // Inclui o parâmetro search, se existir!
  const search = Array.isArray(resolvedParams.search)
    ? resolvedParams.search[0]
    : resolvedParams.search || '';
  if (search) {
    params.append('search', search);
  }

  const paginatedSuppliers = await getPaginatedSuppliers(params);

  return (
    <SuppliersPageClient
      initialSuppliers={paginatedSuppliers.data}
      totalSuppliers={paginatedSuppliers.total}
    />
  );
}
