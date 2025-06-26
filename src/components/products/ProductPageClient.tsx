"use client";

import { useState, useEffect } from 'react';
import { PlusCircle, Search, Pencil } from 'lucide-react';
import { ProductFormModal } from './ProductFormModal';

// Os tipos para os dados do componente
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

// As props que o componente recebe da página do servidor
type ProductPageClientProps = {
  initialProducts: Product[];
  categories: Category[];
  suppliers: Supplier[];
};

export function ProductPageClient({ initialProducts, categories, suppliers }: ProductPageClientProps) {
  // --- ESTADO DO COMPONENTE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [products, setProducts] = useState<Product[]>(initialProducts);

  // O estado dos filtros agora inclui status e nível de estoque
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStockLevel, setSelectedStockLevel] = useState('');

  // Efeito que busca os produtos novamente sempre que um filtro muda
  useEffect(() => {
    const fetchProducts = async () => {
      // Construímos a URL com todos os parâmetros de query
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedStockLevel) params.append('stockLevel', selectedStockLevel);

      try {
        const response = await fetch(`http://localhost:3001/products?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data); // Atualiza a lista de produtos na tela
        } else {
          console.error("Falha ao buscar produtos filtrados");
          setProducts([]); // Limpa a lista em caso de erro
        }
      } catch (error) {
        console.error("Erro de conexão:", error);
        setProducts([]);
      }
    };

    // Usamos um timeout para não fazer buscas a cada tecla digitada na busca
    const debounceTimer = setTimeout(() => {
      fetchProducts();
    }, 300); // Aguarda 300ms após o usuário parar de digitar

    // Limpa o timer se o usuário digitar novamente
    return () => clearTimeout(debounceTimer);

  }, [searchTerm, selectedCategory, selectedStatus, selectedStockLevel]); // O efeito agora reage a todos os filtros

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || typeof value === 'undefined') return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  return (
    <div className="max-w-7xl mx-auto">
      {isModalOpen && (
        <ProductFormModal
          onClose={handleCloseModal}
          categories={categories}
          suppliers={suppliers}
          productToEdit={editingProduct}
        />
      )}

      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Produtos</h1>
          <p className="text-sm text-gray-500">Gerencie todos os produtos do seu estoque</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <PlusCircle size={20} />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Barra de Filtros - AGORA 100% INTERATIVA */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-8 flex items-center gap-4">
        <div className="relative flex-grow">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar produtos por nome ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg"
          />
        </div>
        <select title='Filtrar por categoria'
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700"
        >
          <option value="">Todas Categorias</option>
          {categories.map(cat => <option key={cat.id} value={String(cat.id)}>{cat.name}</option>)}
        </select>
        <select title='Filtrar por status'
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700"
        >
          <option value="">Todos Status</option>
          <option value="ATIVO">Ativo</option>
          <option value="INATIVO">Inativo</option>
        </select>
        <select title='Filtrar por nível de estoque'
          value={selectedStockLevel}
          onChange={(e) => setSelectedStockLevel(e.target.value)}
          className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700"
        >
          <option value="">Todos Níveis</option>
          <option value="low">Estoque Baixo</option>
          <option value="normal">Estoque Normal</option>
        </select>
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(products || []).map((product) => (
          <div key={product.id} className="bg-white p-6 rounded-xl shadow-sm flex flex-col">
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
                  <span className="font-semibold text-gray-800">{formatCurrency(product.salePrice)}</span>
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
                <p className="font-bold text-lg text-gray-800">{formatCurrency(product.stockQuantity * product.salePrice)}</p>
              </div>
              <button
                onClick={() => handleOpenEditModal(product)}
                className="text-gray-500 hover:text-blue-600 flex items-center gap-2"
              >
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
