import { CategoriesPageClient } from '@/components/categories/CategoriesPageClient';

type Category = {
  id: number;
  name: string;
};

// A função de busca agora aceita parâmetros de paginação
async function getPaginatedCategories(params: URLSearchParams) {
  const response = await fetch(`http://localhost:3001/categories?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    return { data: [], total: 0 };
  }
  return response.json();
}

export default async function CategoriesManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Aguarda os parâmetros resolverem
  const resolvedParams = await searchParams;

  const params = new URLSearchParams();
  const page = Array.isArray(resolvedParams.page)
    ? resolvedParams.page[0]
    : resolvedParams.page || '1';

  params.append('page', String(page));
  params.append('limit', '10');

  const paginatedCategories = await getPaginatedCategories(params);

  return (
    <CategoriesPageClient
      initialCategories={paginatedCategories.data}
      totalCategories={paginatedCategories.total}
    />
  );
}
