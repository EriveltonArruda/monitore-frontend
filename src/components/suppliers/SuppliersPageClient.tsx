"use client";

import React, { useState } from 'react';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SupplierFormModal } from './SupplierFormModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';
// CORREÇÃO: Importamos o componente de paginação padrão.
import { Pagination } from '../Pagination';

type Supplier = {
  id: number;
  name: string;
  cnpj?: string | null;
  phone?: string | null;
  email?: string | null;
};

type SuppliersPageClientProps = {
  initialSuppliers: Supplier[];
  totalSuppliers: number;
};

const ITEMS_PER_PAGE = 10;

export function SuppliersPageClient({ initialSuppliers, totalSuppliers }: SuppliersPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // A lógica de modais continua a mesma...
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreateModal = () => { setEditingSupplier(null); setIsFormModalOpen(true); };
  const handleOpenEditModal = (supplier: Supplier) => { setEditingSupplier(supplier); setIsFormModalOpen(true); };
  const handleOpenDeleteModal = (supplier: Supplier) => { setDeletingSupplier(supplier); setIsDeleteModalOpen(true); };
  const handleCloseModals = () => { setIsFormModalOpen(false); setIsDeleteModalOpen(false); setEditingSupplier(null); setDeletingSupplier(null); };

  const handleDeleteConfirm = async () => {
    if (!deletingSupplier) return;
    setIsDeleting(true);
    try {
      await fetch(`http://localhost:3001/suppliers/${deletingSupplier.id}`, { method: 'DELETE' });
      router.refresh();
      handleCloseModals();
    } catch (error) {
      alert('Ocorreu um erro ao deletar o fornecedor.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Lógica para a paginação
  const totalPages = Math.ceil(totalSuppliers / ITEMS_PER_PAGE);
  const currentPage = Number(searchParams.get('page')) || 1;

  return (
    <>
      {isFormModalOpen && (
        <SupplierFormModal
          onClose={handleCloseModals}
          supplierToEdit={editingSupplier}
        />
      )}
      {isDeleteModalOpen && deletingSupplier && (
        <DeleteConfirmationModal
          itemName={deletingSupplier.name}
          onConfirm={handleDeleteConfirm}
          onClose={handleCloseModals}
          isDeleting={isDeleting}
        />
      )}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Fornecedores</h1>
            <p className="text-sm text-gray-500">Gerencie os fornecedores dos seus produtos</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <PlusCircle size={20} />
            <span>Novo Fornecedor</span>
          </button>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <table className="w-full table-auto">
            <thead className="text-left border-b-2 border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Nome da Empresa</th>
                <th className="p-4 font-semibold text-gray-600">CNPJ</th>
                <th className="p-4 font-semibold text-gray-600">Telefone</th>
                <th className="p-4 font-semibold text-gray-600">Email</th>
                <th className="p-4 font-semibold text-gray-600 w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {initialSuppliers.map((supplier) => (
                <tr key={supplier.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{supplier.name}</td>
                  <td className="p-4 text-gray-600">{supplier.cnpj || '-'}</td>
                  <td className="p-4 text-gray-600">{supplier.phone || '-'}</td>
                  <td className="p-4 text-gray-600">{supplier.email || '-'}</td>
                  <td className="p-4">
                    <div className="flex gap-4">
                      <button onClick={() => handleOpenEditModal(supplier)} className="text-gray-400 hover:text-blue-600">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleOpenDeleteModal(supplier)} className="text-gray-400 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CORREÇÃO: Adicionamos o componente de paginação padrão e passamos as props corretas */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </>
  );
}