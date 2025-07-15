// Este Server Component é a única fonte da verdade para buscar dados.

import { ProductPageClient } from '@/components/products/ProductPageClient';

type Category = { id: number; name: string; };
type Supplier = { id: number; name: string; };
type Product = {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  stockQuantity: number;
  minStockQuantity: number;
  salePrice: number;
  costPrice: number | null;
  location: string | null;
  status: string;
  categoryId: number | null;
  supplierId: number | null;
  category: Category | null;
  supplier: Supplier | null;
};

// Funções de busca de dados...
async function getPaginatedProducts(params: URLSearchParams) {
  const response = await fetch(`http://localhost:3001/products?${params.toString()}`, { cache: 'no-store' });
  if (!response.ok) return { data: [], total: 0 };
  return response.json();
}
async function getCategories(): Promise<Category[]> {
  const res = await fetch('http://localhost:3001/categories', { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}
async function getSuppliers(): Promise<Supplier[]> {
  const res = await fetch('http://localhost:3001/suppliers', { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // aguarda o objeto searchParams resolver
  const resolvedSearchParams = await searchParams;

  const params = new URLSearchParams();

  if (resolvedSearchParams.search) {
    params.append('search', Array.isArray(resolvedSearchParams.search) ? resolvedSearchParams.search[0] : resolvedSearchParams.search);
  }
  if (resolvedSearchParams.categoryId) {
    params.append('categoryId', Array.isArray(resolvedSearchParams.categoryId) ? resolvedSearchParams.categoryId[0] : resolvedSearchParams.categoryId);
  }
  if (resolvedSearchParams.status) {
    params.append('status', Array.isArray(resolvedSearchParams.status) ? resolvedSearchParams.status[0] : resolvedSearchParams.status);
  }
  if (resolvedSearchParams.stockLevel) {
    params.append('stockLevel', Array.isArray(resolvedSearchParams.stockLevel) ? resolvedSearchParams.stockLevel[0] : resolvedSearchParams.stockLevel);
  }
  params.append('page', Array.isArray(resolvedSearchParams.page) ? resolvedSearchParams.page[0] : resolvedSearchParams.page || '1');
  params.append('limit', '9');

  const [paginatedProducts, categories, suppliers] = await Promise.all([
    getPaginatedProducts(params),
    getCategories(),
    getSuppliers(),
  ]);

  return (
    <ProductPageClient
      products={paginatedProducts.data}
      totalProducts={paginatedProducts.total}
      categories={categories}
      suppliers={suppliers}
    />
  );
}
