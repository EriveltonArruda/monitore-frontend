// Este é o Server Component. Ele busca os dados e os passa para o cliente.

import { MovementsPageClient } from "@/components/movements/MovementsPageClient";
import { RequireModule } from "@/components/RequireModule";
import { UserModule } from "@/types/UserModule";

// --- DEFINIÇÃO DE TIPOS ---
// Definimos os tipos de dados que esperamos da nossa API.
type Product = {
  id: number;
  name: string;
  salePrice: number;
};

type Movement = {
  id: number;
  type: string;
  quantity: number;
  details: string | null;
  document: string | null;
  relatedParty: string | null;
  unitPriceAtMovement: number | null;
  notes: string | null;
  createdAt: string;
  product: Product;
};

type Supplier = {
  id: number;
  name: string;
};

// --- FUNÇÕES DE BUSCA DE DADOS ---
// Estas funções rodam no servidor antes de a página ser renderizada.

// Busca as movimentações de forma paginada.
async function getPaginatedMovements(params: URLSearchParams) {
  const res = await fetch(`http://localhost:3001/stock-movements?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) return { data: [], total: 0 };
  return res.json();
}

// Busca a lista COMPLETA de produtos para o dropdown do modal.
async function getProducts(): Promise<Product[]> {
  const res = await fetch('http://localhost:3001/products/all', { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

// Busca a lista COMPLETA de fornecedores para o dropdown do modal.
async function getSuppliers(): Promise<Supplier[]> {
  const res = await fetch('http://localhost:3001/suppliers/all', { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

// --- O COMPONENTE DA PÁGINA ---
// Ele lê os parâmetros da URL, busca os dados e os entrega para o componente cliente.
export default async function MovementsPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  const params = new URLSearchParams();
  const page = resolvedSearchParams['page'] ?? '1';
  params.append('page', String(page));
  params.append('limit', '10');

  if (resolvedSearchParams['type']) params.append('type', String(resolvedSearchParams['type']));
  if (resolvedSearchParams['productId']) params.append('productId', String(resolvedSearchParams['productId']));
  if (resolvedSearchParams['period']) params.append('period', String(resolvedSearchParams['period']));
  if (resolvedSearchParams['search']) params.append('search', String(resolvedSearchParams['search']));

  // Campo de busca
  const search = Array.isArray(resolvedSearchParams['search'])
    ? resolvedSearchParams['search'][0]
    : resolvedSearchParams['search'] || '';
  if (search) params.append('search', search);

  const [paginatedMovements, products, suppliers] = await Promise.all([
    getPaginatedMovements(params),
    getProducts(),
    getSuppliers(),
  ]);

  return (
    <RequireModule module={UserModule.MOVIMENTACOES}>
      <MovementsPageClient
        initialMovements={paginatedMovements.data}
        totalMovements={paginatedMovements.total}
        products={products}
        suppliers={suppliers}
      />
    </RequireModule>
  );
}