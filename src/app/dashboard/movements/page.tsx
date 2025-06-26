import { PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MovementsPageClient } from '@/components/movements/MovementsPageClient';


// --- DEFINIÇÃO DE TIPOS ---
// Precisamos garantir que nosso tipo Product tenha o salePrice para o modal
type Product = {
  id: number;
  name: string;
  salePrice: number;
};

// E o tipo Movement tenha todos os novos campos que o backend envia
type Movement = {
  id: number;
  type: string;
  quantity: number;
  details: string | null;      // O "Motivo"
  document: string | null;     // Documento de Referência
  relatedParty: string | null; // Cliente ou Fornecedor
  unitPriceAtMovement: number | null; // Preço no momento da transação
  notes: string | null;        // Observações
  createdAt: string;
  product: Product;
};

type Supplier = {
  id: number;
  name: string;
};


// --- FUNÇÕES DE BUSCA DE DADOS ---
// As funções que buscam os dados do backend continuam as mesmas

async function getMovements(): Promise<Movement[]> {
  const res = await fetch('http://localhost:3001/stock-movements', { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao buscar movimentações');
  return res.json();
}

async function getProducts(): Promise<Product[]> {
  const res = await fetch('http://localhost:3001/products', { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao buscar produtos');
  return res.json();
}

async function getSuppliers(): Promise<Supplier[]> {
  const res = await fetch('http://localhost:3001/suppliers', { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao buscar fornecedores');
  return res.json();
}


// --- O COMPONENTE DA PÁGINA ---
// Ele busca os dados e os entrega para o componente cliente
export default async function MovementsPage() {
  const [movements, products, suppliers] = await Promise.all([
    getMovements(),
    getProducts(),
    getSuppliers(),
  ]);

  return (
    <MovementsPageClient
      initialMovements={movements}
      products={products}
      suppliers={suppliers}
    />
  );
}
