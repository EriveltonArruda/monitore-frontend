import { PlusCircle, Search, Pencil } from 'lucide-react';

// --- DEFINIÇÃO DE TIPOS ---
// Definimos o formato dos dados que esperamos receber da API para cada entidade.
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
// Funções que rodam no servidor para buscar os dados ANTES da página ser renderizada.

async function getProducts(): Promise<Product[]> {
  // O `include` que fizemos no backend já traz a categoria e o fornecedor!
  const response = await fetch('http://localhost:3001/products', { cache: 'no-store' });
  if (!response.ok) throw new Error('Falha ao buscar produtos');
  return response.json();
}

async function getCategories(): Promise<Category[]> {
  const response = await fetch('http://localhost:3001/categories', { cache: 'no-store' });
  if (!response.ok) throw new Error('Falha ao buscar categorias');
  return response.json();
}

// --- O COMPONENTE DA PÁGINA ---
// Este Server Component espera os dados chegarem antes de renderizar o HTML (SSR).
export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    // Container principal que define a largura máxima e centraliza o conteúdo.
    <div className="max-w-7xl mx-auto">
      {/* Cabeçalho da Página */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Produtos</h1>
          <p className="text-sm text-gray-500">Gerencie todos os produtos do seu estoque</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
          <PlusCircle size={20} />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-8 flex items-center gap-4">
        <div className="relative flex-grow">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar produtos por nome ou SKU..."
            className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        {/* Futuramente, estes filtros serão componentes interativos */}
        <select title="Filtrar por categoria" className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700">
          <option>Todas Categorias</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
        <select title="Filtrar por status" className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700">
          <option>Todos Status</option>
        </select>
        <select title="Filtrar por nível de estoque" className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700">
          <option>Todos Níveis</option>
        </select>
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          // Card de Produto
          <div key={product.id} className="bg-white p-6 rounded-xl shadow-sm flex flex-col transition-shadow hover:shadow-lg">
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold text-gray-800">{product.name}</h2>
                {product.category && (
                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                    {product.category.name}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-4">SKU: {product.sku || 'N/A'}</p>

              <div className="text-sm space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estoque:</span>
                  <span className="font-semibold text-gray-800">{product.stockQuantity} unidades</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Preço:</span>
                  <span className="font-semibold text-gray-800">R$ {product.salePrice.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fornecedor:</span>
                  <span className="font-semibold text-gray-800">{product.supplier?.name || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Valor total em estoque</p>
                <p className="font-bold text-lg text-gray-800">R$ {(product.stockQuantity * product.salePrice).toFixed(2).replace('.', ',')}</p>
              </div>
              <button className="text-gray-500 hover:text-blue-600 flex items-center gap-2 font-semibold text-sm py-2 px-3 rounded-lg hover:bg-gray-100">
                <Pencil size={16} />
                <span>Editar</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
