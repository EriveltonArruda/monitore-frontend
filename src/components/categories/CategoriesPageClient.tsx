"use client";

import React, { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash2, Search } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { CategoryFormModal } from './CategoryFormModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';
import { Pagination } from '../Pagination';

type Category = {
  id: number;
  name: string;
};

type CategoriesPageClientProps = {
  initialCategories: Category[];
  totalCategories: number;
};

const ITEMS_PER_PAGE = 10;

export function CategoriesPageClient({ initialCategories, totalCategories }: CategoriesPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Novo estado para busca!
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  // Estados para modais e ações
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Atualiza a URL (busca/página) sempre que searchTerm mudar
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Atualiza o filtro de busca na URL
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    params.set('page', '1'); // Volta pra página 1 ao buscar

    // Debounce para evitar busca a cada tecla
    const debounceTimer = setTimeout(() => {
      router.push(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line
  }, [searchTerm, pathname, router]);

  // Modais
  const handleOpenCreateModal = () => { setEditingCategory(null); setIsFormModalOpen(true); };
  const handleOpenEditModal = (category: Category) => { setEditingCategory(category); setIsFormModalOpen(true); };
  const handleOpenDeleteModal = (category: Category) => { setDeletingCategory(category); setIsDeleteModalOpen(true); };
  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setEditingCategory(null);
    setDeletingCategory(null);
  };

  // Excluir categoria
  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:3001/categories/${deletingCategory.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Falha ao deletar categoria.');

      router.refresh();
      handleCloseModals();
    } catch (error) {
      console.error(error);
      alert('Ocorreu um erro ao deletar a categoria.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Paginação
  const totalPages = Math.ceil(totalCategories / ITEMS_PER_PAGE);
  const currentPage = Number(searchParams.get('page')) || 1;

  return (
    <>
      {isFormModalOpen && (
        <CategoryFormModal
          onClose={handleCloseModals}
          categoryToEdit={editingCategory}
        />
      )}
      {isDeleteModalOpen && deletingCategory && (
        <DeleteConfirmationModal
          itemName={deletingCategory.name}
          onConfirm={handleDeleteConfirm}
          onClose={handleCloseModals}
          isDeleting={isDeleting}
        />
      )}
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gerenciar Categorias</h1>
            <p className="text-sm text-gray-500">Adicione, edite ou remova as categorias</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <PlusCircle size={20} />
            <span>Nova Categoria</span>
          </button>
        </div>

        {/* Campo de busca */}
        <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 mb-4">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar categoria..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg"
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <table className="w-full table-auto">
            <thead className="text-left border-b-2 border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Nome da Categoria</th>
                <th className="p-4 font-semibold text-gray-600 w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {initialCategories.map((category) => (
                <tr key={category.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{category.name}</td>
                  <td className="p-4">
                    <div className="flex gap-4">
                      <button onClick={() => handleOpenEditModal(category)} className="text-gray-400 hover:text-blue-600">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleOpenDeleteModal(category)} className="text-gray-400 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </>
  );
}
