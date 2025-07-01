"use client";

import { useState, useEffect } from 'react';
import { PlusCircle, Search, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProductFormModal } from './ProductFormModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';

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
  const router = useRouter();
  // --- GERENCIAMENTO DE ESTADO ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [products, setProducts] = useState<Product[]>(initialProducts);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStockLevel, setSelectedStockLevel] = useState('');

  // Efeito para sincronizar o estado local com as props quando elas mudam (após router.refresh)
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);


  // Efeito que busca os produtos novamente sempre que um filtro muda
  useEffect(() => {
    const fetchProducts = async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedStockLevel) params.append('stockLevel', selectedStockLevel);

      try {
        const response = await fetch(`http://localhost:3001/products?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch (error) {
        setProducts([]);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(debounceTimer);

  }, [searchTerm, selectedCategory, selectedStatus, selectedStockLevel]);

  // Funções para gerenciar os modais
  const handleOpenCreateModal = () => { setEditingProduct(null); setIsModalOpen(true); };
  const handleOpenEditModal = (product: Product) => { setEditingProduct(product); setIsModalOpen(true); };
  const handleOpenDeleteModal = (product: Product) => { setDeletingProduct(product); setIsDeleteModalOpen(true); };
  const handleCloseModals = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setEditingProduct(null);
    setDeletingProduct(null);
  };

  // Callback para quando um produto é criado/editado com sucesso
  const handleSuccess = () => {
    handleCloseModals();
    router.refresh(); // Mantemos o refresh para garantir consistência geral
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      await fetch(`http://localhost:3001/products/${deletingProduct.id}`, { method: 'DELETE' });
      setProducts(products.filter(p => p.id !== deletingProduct.id)); // <-- Atualização otimista da UI
      handleCloseModals(); // Fecha o modal imediatamente
    } catch (error) {
      alert('Ocorreu um erro ao deletar o produto.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || typeof value === 'undefined') return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  return (
    <>
      {/* Modais de Criar/Editar e Deletar */}
      {isModalOpen && (
        <ProductFormModal
          onSuccess={handleSuccess}
          onClose={handleCloseModals} // Mantemos o onClose para o botão 'X' e clique fora
          categories={categories}
          suppliers={suppliers}
          productToEdit={editingProduct}
        />
      )}
      {isDeleteModalOpen && deletingProduct && (
        <DeleteConfirmationModal
          itemName={deletingProduct.name}
          onConfirm={handleDeleteConfirm}
          onClose={handleCloseModals}
          isDeleting={isDeleting}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho e Filtros */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Produtos</h1>
            <p className="text-sm text-gray-500">Gerencie todos os produtos do seu estoque</p>
          </div>
          <button onClick={handleOpenCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
            <PlusCircle size={20} />
            <span>Novo Produto</span>
          </button>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm mb-8 flex items-center gap-4">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Pesquisar produtos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg" />
          </div>
          <select title='Todas Categorias' value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700">
            <option value="">Todas Categorias</option>
            {categories.map(cat => <option key={cat.id} value={String(cat.id)}>{cat.name}</option>)}
          </select>
          <select title='Todos Status' value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700">
            <option value="">Todos Status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
          <select title='Todos Níveis' value={selectedStockLevel} onChange={(e) => setSelectedStockLevel(e.target.value)} className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700">
            <option value="">Todos Níveis</option>
            <option value="low">Estoque Baixo</option>
            <option value="normal">Estoque Normal</option>
          </select>
        </div>

        {/* Tabela de Produtos */}
        <div className="bg-white rounded-xl shadow-sm">
          <table className="w-full table-auto">
            <thead className="text-left border-b-2 border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Nome do Produto</th>
                <th className="p-4 font-semibold text-gray-600">SKU</th>
                <th className="p-4 font-semibold text-gray-600">Categoria</th>
                <th className="p-4 font-semibold text-gray-600">Estoque</th>
                <th className="p-4 font-semibold text-gray-600">Preço</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(products || []).map((product) => {
                const isLowStock = product.stockQuantity <= product.minStockQuantity;
                return (
                  <tr key={product.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{product.name}</td>
                    <td className="p-4 text-gray-600">{product.sku || '-'}</td>
                    <td className="p-4 text-gray-600">{product.category?.name || '-'}</td>
                    <td className="p-4 font-semibold">
                      <span className={isLowStock ? 'text-red-600' : 'text-gray-800'}>
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{formatCurrency(product.salePrice)}</td>
                    <td className="p-4">
                      {/* CORREÇÃO APLICADA AQUI */}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${product.status === 'ATIVO'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-4">
                        <button onClick={() => handleOpenEditModal(product)} className="text-gray-400 hover:text-blue-600">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleOpenDeleteModal(product)} className="text-gray-400 hover:text-red-600">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
