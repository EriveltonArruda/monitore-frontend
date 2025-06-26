import { CategoriesPageClient } from '@/components/categories/CategoriesPageClient';

// Definimos o tipo de dados que esperamos receber da nossa API.
type Category = {
  id: number;
  name: string;
};

// Esta função assíncrona roda no servidor para buscar os dados.
async function getCategories(): Promise<Category[]> {
  const response = await fetch('http://localhost:3001/categories', {
    cache: 'no-store', // Garante que os dados sejam sempre os mais recentes.
  });

  if (!response.ok) {
    // Se a busca falhar, lançamos um erro.
    throw new Error('Falha ao buscar categorias');
  }

  return response.json();
}

// Este é o componente da página.
// Ele primeiro espera a função getCategories() terminar.
export default async function CategoriesManagementPage() {
  const categories = await getCategories();

  // Depois, ele renderiza o componente cliente, passando os dados buscados como props.
  return <CategoriesPageClient categories={categories} />;
}
