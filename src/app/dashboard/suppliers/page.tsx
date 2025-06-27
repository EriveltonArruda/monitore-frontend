import { SuppliersPageClient } from '@/components/suppliers/SuppliersPageClient';

type Supplier = {
  id: number;
  name: string;
};

// Função para buscar os dados do nosso backend
async function getSuppliers(): Promise<Supplier[]> {
  const response = await fetch('http://localhost:3001/suppliers', {
    cache: 'no-store', // Sempre buscar os dados mais recentes
  });
  if (!response.ok) {
    throw new Error('Falha ao buscar fornecedores');
  }
  return response.json();
}

// O Server Component busca os dados e os passa para o Client Component
export default async function SuppliersManagementPage() {
  const suppliers = await getSuppliers();
  return <SuppliersPageClient suppliers={suppliers} />;
}
