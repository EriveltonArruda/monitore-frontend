import { ProductPageClient } from '@/components/products/ProductPageClient';

// --- DEFINIÇÃO DE TIPOS ---
// Estes tipos garantem que sabemos o formato dos dados que vêm da API.
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
export default async function ProductsPage() {
  const [products, categories, suppliers] = await Promise.all([
    getProducts(),
    getCategories(),
    getSuppliers(),
  ]);

  // CORREÇÃO APLICADA AQUI:
  // A propriedade agora é 'initialProducts', exatamente como o ProductPageClient espera.
  return (
    <ProductPageClient
      initialProducts={products}
      categories={categories}
      suppliers={suppliers}
    />
  );
}
