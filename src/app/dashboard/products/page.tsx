// ARQUIVO: src/app/dashboard/products/page.tsx
// Este é o Server Component, responsável apenas por buscar os dados do backend.

import { ProductPageClient } from '@/components/products/ProductPageClient';

// --- DEFINIÇÃO DE TIPOS ---
// Os tipos precisam corresponder aos que o ProductPageClient espera receber como props.
type Category = {
  id: number;
  name: string;
};

type Supplier = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  stockQuantity: number;
  salePrice: number;
  category: Category | null;
  supplier: Supplier | null;
};

// --- FUNÇÕES DE BUSCA DE DADOS ---
// Funções que rodam no servidor para buscar os dados.
async function getProducts(): Promise<Product[]> {
  const response = await fetch('http://localhost:3001/products', { cache: 'no-store' });
  if (!response.ok) throw new Error('Falha ao buscar produtos');
  return response.json();
}

async function getCategories(): Promise<Category[]> {
  const response = await fetch('http://localhost:3001/categories', { cache: 'no-store' });
  if (!response.ok) throw new Error('Falha ao buscar categorias');
  return response.json();
}

async function getSuppliers(): Promise<Supplier[]> {
  const response = await fetch('http://localhost:3001/suppliers', { cache: 'no-store' });
  if (!response.ok) throw new Error('Falha ao buscar fornecedores');
  return response.json();
}

// --- O COMPONENTE DA PÁGINA ---
// A única responsabilidade deste Server Component agora é buscar os dados
// e passá-los para o Client Component, que cuidará da interface e da interatividade.
export default async function ProductsPage() {
  const [products, categories, suppliers] = await Promise.all([
    getProducts(),
    getCategories(),
    getSuppliers(),
  ]);

  return (
    <ProductPageClient
      products={products}
      categories={categories}
      suppliers={suppliers}
    />
  );
}
