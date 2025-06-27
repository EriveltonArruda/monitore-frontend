"use client";

import React, { useState } from 'react';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SupplierFormModal } from './SupplierFormModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';

// O tipo para os dados de um único fornecedor, incluindo os novos campos.
type Supplier = {
  id: number;
  name: string;
  cnpj?: string | null;
  phone?: string | null;
  email?: string | null;
};

// As props que este componente recebe da página do servidor.
type SuppliersPageClientProps = {
  suppliers: Supplier[];
};

export function SuppliersPageClient({ suppliers }: SuppliersPageClientProps) {
  const router = useRouter();

  // --- Gerenciamento de Estado ---
  // Controla se o modal de formulário (criar/editar) está aberto.
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  // Controla se o modal de confirmação de deleção está aberto.
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // Guarda os dados do fornecedor que está sendo editado.
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  // Guarda os dados do fornecedor que será deletado.
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  // Controla o estado de "carregando" do botão de deletar.
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Funções para Manipular os Modais ---
  const handleOpenCreateModal = () => {
    setEditingSupplier(null); // Garante que estamos criando, não editando
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (supplier: Supplier) => {
    setDeletingSupplier(supplier);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setEditingSupplier(null);
    setDeletingSupplier(null);
  };

  // Função para confirmar e executar a deleção
  const handleDeleteConfirm = async () => {
    if (!deletingSupplier) return;

    setIsDeleting(true);
    try {
      await fetch(`http://localhost:3001/suppliers/${deletingSupplier.id}`, { method: 'DELETE' });
      router.refresh(); // Atualiza a lista de fornecedores na tela
      handleCloseModals();
    } catch (error) {
      alert('Ocorreu um erro ao deletar o fornecedor.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Renderização condicional dos modais */}
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

      {/* Layout Principal da Página */}
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
            {/* Cabeçalho da Tabela com as Novas Colunas */}
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
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50">
                  {/* Células da Tabela Exibindo os Novos Dados */}
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
      </div>
    </>
  );
}
