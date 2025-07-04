import { cookies } from 'next/headers'; // Importa a função para ler cookies no servidor
import { UsersPageClient } from '@/components/users/UsersPageClient';

// Definimos o tipo de dados que esperamos da nossa API.
type User = {
  id: number;
  name: string;
  email: string;
};

// A função de busca agora precisa do token para se autenticar.
async function getUsers(token: string): Promise<User[]> {
  const response = await fetch('http://localhost:3001/users', {
    headers: {
      // Enviamos o token no cabeçalho da requisição
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    // Se o token for inválido ou expirado, o backend retornará 401,
    // e o middleware cuidará do redirecionamento.
    console.error('Falha ao buscar usuários, acesso não autorizado.');
    return [];
  }

  return response.json();
}

// O Server Component busca os dados e os passa para o Client Component.
export default async function UsersManagementPage() {
  // CORREÇÃO APLICADA AQUI:
  // A função cookies() pode se comportar de forma assíncrona em alguns contextos.
  // Adicionamos 'await' para garantir que esperamos a resolução dos cookies.
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  // Se não houver token, o middleware já teria redirecionado,
  // mas por segurança, buscamos apenas se o token existir.
  const users = token ? await getUsers(token) : [];

  return <UsersPageClient initialUsers={users} />;
}
