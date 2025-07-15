// Este Client Component agora tem toda a lógica para os modais e a paginação.
"use client";

import React, { useState } from 'react';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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

  // Estados para controlar os modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Estados para saber qual item está sendo editado ou deletado
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  // Funções para abrir os modais
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  // Função para fechar todos os modais
  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setEditingCategory(null);
    setDeletingCategory(null);
  };

  // Função para confirmar e executar a deleção
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

  // Lógica para a paginação
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

        {/* Adicionamos o componente de paginação ao final */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </>
  );
}