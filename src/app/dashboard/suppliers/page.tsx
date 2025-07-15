import { SuppliersPageClient } from '@/components/suppliers/SuppliersPageClient';

type Supplier = {
  id: number;
  name: string;
  cnpj?: string | null;
  phone?: string | null;
  email?: string | null;
};

// A função de busca agora aceita parâmetros de paginação
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
  // Aguarda os parâmetros resolverem
  const resolvedParams = await searchParams;

  const params = new URLSearchParams();
  const page = Array.isArray(resolvedParams.page)
    ? resolvedParams.page[0]
    : resolvedParams.page || '1';

  params.append('page', String(page));
  params.append('limit', '10');

  const paginatedSuppliers = await getPaginatedSuppliers(params);

  return (
    <SuppliersPageClient
      initialSuppliers={paginatedSuppliers.data}
      totalSuppliers={paginatedSuppliers.total}
    />
  );
}