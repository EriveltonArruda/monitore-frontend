import { MovementsPageClient } from "@/components/movements/MovementsPageClient";

// --- DEFINIÇÃO DE TIPOS ---
// O tipo Product agora inclui o salePrice, necessário para o modal
type Product = {
  id: number;
  name: string;
  salePrice: number;
};

// CORREÇÃO APLICADA AQUI:
// O tipo Movement agora inclui todos os campos que o backend envia
// e que os componentes cliente esperam receber.
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
async function getMovements(): Promise<Movement[]> {
  const res = await fetch('http://localhost:3001/stock-movements', { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao buscar movimentações');
  return res.json();
}

// A função agora espera um objeto { data, total } e retorna apenas o array 'data'.
async function getProducts(): Promise<Product[]> {
  const res = await fetch('http://localhost:3001/products', { cache: 'no-store' });
  if (!res.ok) {
    console.error("Falha ao buscar produtos");
    return [];
  }
  const paginatedResult = await res.json();
  return paginatedResult.data || []; // Retorna o array de dentro do objeto, ou um array vazio
}

async function getSuppliers(): Promise<Supplier[]> {
  const res = await fetch('http://localhost:3001/suppliers', { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

// --- O COMPONENTE DA PÁGINA ---
export default async function MovementsPage() {
  // Buscamos todos os dados necessários em paralelo
  const [movements, products, suppliers] = await Promise.all([
    getMovements(),
    getProducts(),
    getSuppliers(),
  ]);

  // Passamos os dados corretos para o componente cliente
  return (
    <MovementsPageClient
      initialMovements={movements}
      products={products}
      suppliers={suppliers}
    />
  );
}
