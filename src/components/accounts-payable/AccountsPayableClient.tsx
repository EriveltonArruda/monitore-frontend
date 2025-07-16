"use client";

import React, { useState } from 'react';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AccountFormModal } from './AccountFormModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';
import { Pagination } from '../Pagination'; // Reutilizando nosso componente de paginação
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- DEFINIÇÃO DE TIPOS ---
// Define o "contrato" dos dados que este componente espera receber.
type AccountPayable = {
  id: number;
  name: string;
  category: string;
  value: number;
  dueDate: string;
  status: string;
};

type AccountsPayableClientProps = {
  initialAccounts: AccountPayable[];
  totalAccounts: number;
};

const ITEMS_PER_PAGE = 10;

export function AccountsPayableClient({ initialAccounts, totalAccounts }: AccountsPayableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Gerenciamento de Estado para os Modais ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountPayable | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<AccountPayable | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Funções para Abrir e Fechar os Modais ---
  const handleOpenCreateModal = () => { setEditingAccount(null); setIsFormModalOpen(true); };
  const handleOpenEditModal = (account: AccountPayable) => { setEditingAccount(account); setIsFormModalOpen(true); };
  const handleOpenDeleteModal = (account: AccountPayable) => { setDeletingAccount(account); setIsDeleteModalOpen(true); };
  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setEditingAccount(null);
    setDeletingAccount(null);
  };

  // --- Função para Deletar uma Conta ---
  const handleDeleteConfirm = async () => {
    if (!deletingAccount) return;
    setIsDeleting(true);
    try {
      // Futuramente, adicionaremos o token de autenticação aqui.
      await fetch(`http://localhost:3001/accounts-payable/${deletingAccount.id}`, { method: 'DELETE' });
      router.refresh();
      handleCloseModals();
    } catch (error) {
      alert('Ocorreu um erro ao deletar a conta.');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Funções de Estilização e Paginação ---
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PAGO': return 'bg-green-100 text-green-700';
      case 'VENCIDO': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const formatStatusText = (status: string) => {
    const text = status.replace('_', ' ');
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const totalPages = Math.ceil(totalAccounts / ITEMS_PER_PAGE);
  const currentPage = Number(searchParams.get('page')) || 1;

  return (
    <>
      {/* Renderização condicional dos modais */}
      {isFormModalOpen && (
        <AccountFormModal
          onClose={handleCloseModals}
          accountToEdit={editingAccount}
        />
      )}
      {isDeleteModalOpen && deletingAccount && (
        <DeleteConfirmationModal
          itemName={deletingAccount.name}
          onConfirm={handleDeleteConfirm}
          onClose={handleCloseModals}
          isDeleting={isDeleting}
        />
      )}

      {/* Layout Principal da Página */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Contas a Pagar</h1>
            <p className="text-sm text-gray-500">Gerencie suas despesas e contas a pagar</p>
          </div>
          <button onClick={handleOpenCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
            <PlusCircle size={20} />
            <span>Nova Conta</span>
          </button>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <table className="w-full table-auto">
            <thead className="text-left border-b-2 border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Nome da Conta</th>
                <th className="p-4 font-semibold text-gray-600">Categoria</th>
                <th className="p-4 font-semibold text-gray-600">Valor</th>
                <th className="p-4 font-semibold text-gray-600">Vencimento</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {initialAccounts.map((account) => (
                <tr key={account.id} className="border-b hover:bg-gray-50 last:border-b-0">
                  <td className="p-4 font-medium text-gray-800">{account.name}</td>
                  <td className="p-4 text-gray-600">{account.category}</td>
                  <td className="p-4 text-gray-600">{account.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="p-4 text-gray-600">{format(new Date(account.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</td>
                  <td className="p-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusClass(account.status)}`}>
                      {formatStatusText(account.status)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-4">
                      <button onClick={() => handleOpenEditModal(account)} className="text-gray-400 hover:text-blue-600"><Pencil size={18} /></button>
                      <button onClick={() => handleOpenDeleteModal(account)} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Componente de Paginação */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </>
  );
}