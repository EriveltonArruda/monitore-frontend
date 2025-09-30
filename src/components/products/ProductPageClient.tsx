"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PlusCircle, Search, Pencil, Trash2, Eye, FileDown, Printer, X } from 'lucide-react';
import { ProductFormModal } from './ProductFormModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';
import { Pagination } from '../Pagination';

const API_BASE = 'http://localhost:3001';

// ---------- helpers de download ----------
async function download(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) {
    let msg = 'Falha ao baixar arquivo';
    try { msg = (await res.text()) || msg; } catch { /* noop */ }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}
function tsFilename(prefix: string, ext: 'pdf' | 'xlsx') {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `${prefix}_${stamp}.${ext}`;
}

// Modal para visualizar imagem
function ProductImageModal({ product, onClose }: { product: Product | null, onClose: () => void }) {
  if (!product) return null;

  const src = product.mainImageUrl
    ? (product.mainImageUrl.startsWith('/uploads')
      ? `${API_BASE}${product.mainImageUrl}`
      : product.mainImageUrl)
    : '';

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div className="bg-white rounded-xl shadow-lg max-w-xs w-full flex flex-col items-center relative p-6" onClick={stop}>
        <button
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <span className="sr-only">Fechar</span>
          <svg width={24} height={24} viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /></svg>
        </button>
        <h2 className="text-lg font-bold mb-2 text-center">{product.name}</h2>
        {product.mainImageUrl ? (
          <img
            src={src}
            alt={product.name}
            className="max-h-64 max-w-full rounded shadow border border-gray-100 object-contain bg-gray-50"
          />
        ) : (
          <div className="flex items-center justify-center h-48 w-48 bg-gray-100 text-gray-400 rounded">
            <span>Sem imagem cadastrada</span>
          </div>
        )}
      </div>
    </div>
  );
}

type Category = { id: number; name: string; };
type Supplier = { id: number; name: string; };
type Product = {
  id: number;
  name: string;
  sku: string | null;
  stockQuantity: number;
  minStockQuantity: number;
  status: string;
  category: Category | null;
  supplier: Supplier | null;
  description: string | null;
  costPrice: number | null;
  location: string | null;
  categoryId: number | null;
  supplierId: number | null;
  createdAt: string;
  mainImageUrl?: string | null;
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

  // estado derivado da URL para filtros
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [selectedStockLevel, setSelectedStockLevel] = useState(searchParams.get('stockLevel') || '');

  // aplica filtros na URL (debounce) e reseta page=1
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    const setOrDelete = (key: string, value: string) => {
      if (value && value.trim() !== '') params.set(key, value);
      else params.delete(key);
    };

    setOrDelete('search', searchTerm);
    setOrDelete('categoryId', selectedCategory);
    setOrDelete('status', selectedStatus);
    setOrDelete('stockLevel', selectedStockLevel);

    params.set('page', '1');

    const t = setTimeout(() => {
      router.push(`${pathname}?${params.toString()}`);
    }, 250);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory, selectedStatus, selectedStockLevel, pathname, router]);

  // chips: labels amigáveis
  const categoryLabel = useMemo(() => {
    if (!selectedCategory) return null;
    const found = categories.find(c => String(c.id) === String(selectedCategory));
    return found?.name ?? selectedCategory;
  }, [selectedCategory, categories]);

  const statusLabel = useMemo(() => {
    if (!selectedStatus) return null;
    return selectedStatus === 'ATIVO' ? 'Status: Ativo' : selectedStatus === 'INATIVO' ? 'Status: Inativo' : `Status: ${selectedStatus}`;
  }, [selectedStatus]);

  const stockLevelLabel = useMemo(() => {
    if (!selectedStockLevel) return null;
    return selectedStockLevel === 'low' ? 'Estoque: Baixo' :
      selectedStockLevel === 'normal' ? 'Estoque: Normal' :
        `Estoque: ${selectedStockLevel}`;
  }, [selectedStockLevel]);

  const hasActiveFilters = !!(
    (searchTerm && searchTerm.trim() !== '') ||
    selectedCategory ||
    selectedStatus ||
    selectedStockLevel
  );

  const clearAll = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSelectedStockLevel('');
    const params = new URLSearchParams(searchParams.toString());
    ['search', 'categoryId', 'status', 'stockLevel'].forEach(k => params.delete(k));
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const removeFilter = (key: 'search' | 'categoryId' | 'status' | 'stockLevel') => {
    if (key === 'search') setSearchTerm('');
    if (key === 'categoryId') setSelectedCategory('');
    if (key === 'status') setSelectedStatus('');
    if (key === 'stockLevel') setSelectedStockLevel('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal de visualização de imagem
  const [imageModalProduct, setImageModalProduct] = useState<Product | null>(null);

  const handleOpenCreateModal = () => { setEditingProduct(null); setIsModalOpen(true); };
  const handleOpenEditModal = (product: Product) => { setEditingProduct(product); setIsModalOpen(true); };
  const handleOpenDeleteModal = (product: Product) => { setDeletingProduct(product); setIsDeleteModalOpen(true); };
  const handleCloseModals = () => { setIsModalOpen(false); setIsDeleteModalOpen(false); };

  const handleOpenImageModal = (product: Product) => setImageModalProduct(product);
  const handleCloseImageModal = () => setImageModalProduct(null);

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`${API_BASE}/products/${deletingProduct.id}`, { method: "DELETE" });
      if (!res.ok) {
        let message = "Erro ao excluir produto!";
        try {
          const data = await res.json();
          if (data && data.message) {
            message = Array.isArray(data.message) ? data.message.join("\n") : data.message;
          }
        } catch { /* noop */ }
        throw new Error(message);
      }

      setIsDeleteModalOpen(false);
      setDeletingProduct(null);
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
  };

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  const currentPage = Number(searchParams.get('page')) || 1;

  // ====== exportações ======
  const handleExportPdf = async () => {
    try {
      await download(`${API_BASE}/products/export-pdf`, tsFilename('produtos', 'pdf'));
    } catch (e: any) {
      alert(e?.message || 'Falha ao baixar PDF');
    }
  };
  const handleExportExcel = async () => {
    try {
      await download(`${API_BASE}/products/export-excel`, tsFilename('produtos', 'xlsx'));
    } catch (e: any) {
      alert(e?.message || 'Falha ao baixar Excel');
    }
  };

  // ====== impressão ======
  const handleGoToPrint = () => {
    const qs = new URLSearchParams();
    if (searchTerm) qs.set('search', searchTerm);
    if (selectedCategory) qs.set('categoryId', selectedCategory);
    if (selectedStatus) qs.set('status', selectedStatus);
    if (selectedStockLevel) qs.set('stockLevel', selectedStockLevel);
    router.push(`/dashboard/print/produtos?${qs.toString()}`);
  };

  return (
    <>
      {isModalOpen && (
        <ProductFormModal
          onClose={handleCloseModals}
          onSuccess={() => router.refresh()}
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

      {/* Modal de visualização da imagem */}
      {imageModalProduct && (
        <ProductImageModal product={imageModalProduct} onClose={handleCloseImageModal} />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho da Página */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Produtos</h1>
            <p className="text-sm text-gray-500">Gerencie todos os produtos do seu estoque</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Imprimir */}
            <button
              onClick={handleGoToPrint}
              className="border text-gray-700 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg flex items-center gap-2"
              title="Imprimir (tela de impressão)"
            >
              <Printer size={18} />
              <span>Imprimir</span>
            </button>

            {/* Exportações */}
            <button
              onClick={handleExportPdf}
              className="border text-gray-700 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg flex items-center gap-2"
              title="Exportar lista (PDF)"
            >
              <FileDown size={18} />
              <span>Exportar PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="border text-gray-700 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg flex items-center gap-2"
              title="Exportar lista (Excel)"
            >
              <FileDown size={18} />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
            >
              <PlusCircle size={20} /><span>Novo Produto</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-3 flex items-center gap-4">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg"
            />
          </div>
          <select
            title='Todas as categorias'
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700"
          >
            <option value="">Todas Categorias</option>
            {categories.map(cat => <option key={cat.id} value={String(cat.id)}>{cat.name}</option>)}
          </select>
          <select
            title='Todos os status'
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700"
          >
            <option value="">Todos Status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
          <select
            title='Todos os níveis de estoque'
            value={selectedStockLevel}
            onChange={(e) => setSelectedStockLevel(e.target.value)}
            className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700"
          >
            <option value="">Todos Níveis</option>
            <option value="low">Estoque Baixo</option>
            <option value="normal">Estoque Normal</option>
          </select>
        </div>

        {/* Chips dos filtros ativos + Limpar tudo */}
        {hasActiveFilters && (
          <div className="bg-white p-3 rounded-xl shadow-sm mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 mr-1">Filtros ativos:</span>

            {searchTerm?.trim() !== '' && (
              <button
                className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
                onClick={() => removeFilter('search')}
                title={`Remover: "${searchTerm}"`}
              >
                <span>Busca: “{searchTerm}”</span>
                <X size={12} />
              </button>
            )}

            {selectedCategory && (
              <button
                className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
                onClick={() => removeFilter('categoryId')}
                title="Remover filtro de categoria"
              >
                <span>Categoria: {categoryLabel}</span>
                <X size={12} />
              </button>
            )}

            {selectedStatus && (
              <button
                className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
                onClick={() => removeFilter('status')}
                title="Remover filtro de status"
              >
                <span>{statusLabel}</span>
                <X size={12} />
              </button>
            )}

            {selectedStockLevel && (
              <button
                className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
                onClick={() => removeFilter('stockLevel')}
                title="Remover filtro de estoque"
              >
                <span>{stockLevelLabel}</span>
                <X size={12} />
              </button>
            )}

            <div className="grow" />
            <button
              className="text-xs text-blue-700 hover:underline"
              onClick={clearAll}
              title="Limpar todos os filtros"
            >
              Limpar tudo
            </button>
          </div>
        )}

        {/* Tabela de Produtos */}
        <div className="bg-white rounded-xl shadow-sm">
          <table className="w-full table-auto">
            <thead className="text-left border-b-2 border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Nome do Produto</th>
                <th className="p-4 font-semibold text-gray-600">SKU</th>
                <th className="p-4 font-semibold text-gray-600">Categoria</th>
                <th className="p-4 font-semibold text-gray-600">Estoque</th>
                <th className="p-4 font-semibold text-gray-600">Preço de Custo</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Data Cadastro</th>
                <th className="p-4 font-semibold text-gray-600 w-28">Ações</th>
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
                    <td className="p-4 text-gray-600">{formatCurrency(product.costPrice)}</td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${product.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {product.createdAt
                        ? new Date(product.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleOpenImageModal(product)}
                          className="text-gray-400 hover:text-indigo-600"
                          title="Visualizar imagem"
                        >
                          <Eye size={18} />
                        </button>
                        <button onClick={() => handleOpenEditModal(product)} className="text-gray-400 hover:text-blue-600" title="Editar">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleOpenDeleteModal(product)} className="text-gray-400 hover:text-red-600" title="Excluir">
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

        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
