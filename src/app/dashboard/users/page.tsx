// Este é o Server Component. Sua única tarefa é buscar os dados autenticados.

import { cookies } from 'next/headers';
import { UsersPageClient } from '@/components/users/UsersPageClient';

// Define o "contrato" dos dados que esperamos da API.
type User = {
  id: number;
  name: string;
  email: string;
};

// A função de busca agora precisa do token para se autenticar.
async function getPaginatedUsers(params: URLSearchParams, token: string) {
  const response = await fetch(`http://localhost:3001/users?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    return { data: [], total: 0 };
  }
  return response.json();
}

export default async function UsersManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 1. Lemos o token dos cookies no lado do servidor
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  // 2. Preparamos os parâmetros de paginação para a API.
  const params = new URLSearchParams();
  const page = resolvedSearchParams['page'] ?? '1';
  params.append('page', String(page));
  params.append('limit', '10');

  // 3. Buscamos os dados apenas se o token existir.
  const paginatedUsers = token
    ? await getPaginatedUsers(params, token)
    : { data: [], total: 0 };

  return (
    <UsersPageClient
      initialUsers={paginatedUsers.data}
      totalUsers={paginatedUsers.total}
    />
  );
}