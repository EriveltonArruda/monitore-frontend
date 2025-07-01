// Este é o Server Component. Ele busca os dados e os passa para o cliente.

import { AccountsPayableClient } from '@/components/accounts-payable/AccountsPayableClient';

// Definimos o tipo de dados que esperamos da nossa API.
type AccountPayable = {
  id: number;
  name: string;
  category: string;
  value: number;
  dueDate: string; // A data virá como string no formato ISO
  status: string;
};

// Função para buscar os dados do nosso backend.
async function getAccounts(): Promise<AccountPayable[]> {
  const response = await fetch('http://localhost:3001/accounts-payable', {
    cache: 'no-store', // Sempre buscar os dados mais recentes.
  });

  if (!response.ok) {
    throw new Error('Falha ao buscar contas a pagar');
  }

  return response.json();
}

// O Server Component busca os dados e os passa para o Client Component.
export default async function AccountsPayablePage() {
  const accounts = await getAccounts();
  return <AccountsPayableClient initialAccounts={accounts} />;
}