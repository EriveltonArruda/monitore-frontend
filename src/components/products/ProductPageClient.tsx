"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PlusCircle, Search, Pencil, Trash2 } from 'lucide-react';
import { ProductFormModal } from './ProductFormModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';
import { Pagination } from '../Pagination';

// Tipos para os dados do componente
type Category = { id: number; name: string; };
type Supplier = { id: number; name: string; };
type Product = {
  id: number;
  name: string;
  sku: string | null;
  stockQuantity: number;
  minStockQuantity: number;
  salePrice: number;
  status: string;
  category: Category | null;
  supplier: Supplier | null;
  description: string | null;
  costPrice: number | null;
  location: string | null;
  categoryId: number | null;
  supplierId: number | null;
};

type ProductPageClientProps = {
  products: Product[];
  totalProducts: number;
  categories: Category[];
  suppliers: Supplier[];
};

const ITEMS_PER_PAGE = 9;

export function ProductPageClient({ products, totalProducts, categories, suppliers }: ProductPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [selectedStockLevel, setSelectedStockLevel] = useState(searchParams.get('stockLevel') || '');

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const updateParam = (key: string, value: string) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    };

    updateParam('search', searchTerm);
    updateParam('categoryId', selectedCategory);
    updateParam('status', selectedStatus);
    updateParam('stockLevel', selectedStockLevel);

    params.set('page', '1');

    const debounceTimer = setTimeout(() => {
      router.push(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory, selectedStatus, selectedStockLevel, pathname, router, searchParams]);

  // Modais e produto a editar/excluir
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreateModal = () => { setEditingProduct(null); setIsModalOpen(true); };
  const handleOpenEditModal = (product: Product) => { setEditingProduct(product); setIsModalOpen(true); };
  const handleOpenDeleteModal = (product: Product) => { setDeletingProduct(product); setIsDeleteModalOpen(true); };
  const handleCloseModals = () => { setIsModalOpen(false); setIsDeleteModalOpen(false); };

  // FUNÇÃO DELETAR AJUSTADA!
  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`http://localhost:3001/products/${deletingProduct.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        // Tenta extrair a mensagem do backend (NestJS)
        let message = "Erro ao excluir produto!";
        try {
          const data = await res.json();
          // O backend NestJS geralmente retorna { message: '...' }
          if (data && data.message) {
            message = Array.isArray(data.message) ? data.message.join("\n") : data.message;
          }
        } catch {
          // fallback
        }
        throw new Error(message);
      }

      setIsDeleteModalOpen(false);
      setDeletingProduct(null);

      // Atualiza a lista (Server Component revalida!)
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Erro ao excluir produto!");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || typeof value === 'undefined') return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  const currentPage = Number(searchParams.get('page')) || 1;

  return (
    <>
      {isModalOpen && (<ProductFormModal onClose={handleCloseModals} onSuccess={() => router.refresh()} categories={categories} suppliers={suppliers} productToEdit={editingProduct} />)}
      {isDeleteModalOpen && deletingProduct && (<DeleteConfirmationModal itemName={deletingProduct.name} onConfirm={handleDeleteConfirm} onClose={handleCloseModals} isDeleting={isDeleting} />)}

      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho da Página */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Produtos</h1>
            <p className="text-sm text-gray-500">Gerencie todos os produtos do seu estoque</p>
          </div>
          <button onClick={handleOpenCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
            <PlusCircle size={20} /><span>Novo Produto</span>
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-8 flex items-center gap-4">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg" />
          </div>
          <select title='Todas as categorias' value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700">
            <option value="">Todas Categorias</option>
            {categories.map(cat => <option key={cat.id} value={String(cat.id)}>{cat.name}</option>)}
          </select>
          <select title='Todos os status' value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700">
            <option value="">Todos Status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
          <select title='Todos os níveis de estoque' value={selectedStockLevel} onChange={(e) => setSelectedStockLevel(e.target.value)} className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700">
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
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${product.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-4">
                        <button onClick={() => handleOpenEditModal(product)} className="text-gray-400 hover:text-blue-600"><Pencil size={18} /></button>
                        <button onClick={() => handleOpenDeleteModal(product)} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Componente de Paginação */}
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
