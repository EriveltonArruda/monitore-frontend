"use client";

import React, { useState } from 'react';
import { PlusCircle, Pencil, Trash2, CheckCircle, AlertCircle, XCircle, Clock, History } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AccountFormModal } from './AccountFormModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';
import { Pagination } from '../Pagination';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PaymentHistoryModal } from '../payments/PaymentHistoryModal';

type Payment = {
  id: number;
  paidAt: string;
};

type AccountPayable = {
  id: number;
  name: string;
  category: string;
  value: number;
  dueDate: string;
  status: string;
  installmentType?: string;
  installments?: number | null;
  currentInstallment?: number | null;
  payments?: Payment[];
};

type AccountsPayableClientProps = {
  initialAccounts: AccountPayable[];
  totalAccounts: number;
};

const ITEMS_PER_PAGE = 10;

export function AccountsPayableClient({ initialAccounts, totalAccounts }: AccountsPayableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountPayable | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<AccountPayable | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  // Filtro de status na URL ou padrão TODOS
  const status = searchParams.get('status') || 'TODOS';

  const handleOpenCreateModal = () => {
    setEditingAccount(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (account: AccountPayable) => {
    setEditingAccount(account);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (account: AccountPayable) => {
    setDeletingAccount(account);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setEditingAccount(null);
    setDeletingAccount(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAccount) return;
    setIsDeleting(true);
    try {
      await fetch(`http://localhost:3001/accounts-payable/${deletingAccount.id}`, {
        method: 'DELETE',
      });
      router.refresh();
      handleCloseModals();
    } catch (error) {
      alert('Erro ao deletar a conta.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PAGO':
        return 'bg-green-100 text-green-700';
      case 'VENCIDO':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const formatStatusText = (status: string) => {
    return status
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const totalPages = Math.ceil(totalAccounts / ITEMS_PER_PAGE);
  const currentPage = Number(searchParams.get('page')) || 1;

  const month = searchParams.get('month') || '';
  const year = searchParams.get('year') || '';

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const selectedMonth = e.target.value;
    if (selectedMonth) {
      params.set('month', selectedMonth);
    } else {
      params.delete('month');
    }
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const selectedYear = e.target.value;
    if (selectedYear) {
      params.set('year', selectedYear);
    } else {
      params.delete('year');
    }
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  // NOVO: handle para filtro de status
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const selectedStatus = e.target.value;
    if (selectedStatus && selectedStatus !== 'TODOS') {
      params.set('status', selectedStatus);
    } else {
      params.delete('status');
    }
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const monthOptions = [
    { value: '', label: 'Todos os meses' },
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const yearOptions = [
    { value: '', label: 'Todos os anos' },
    { value: '2023', label: '2023' },
    { value: '2024', label: '2024' },
    { value: '2025', label: '2025' },
  ];

  // NOVO: opções para status
  const statusOptions = [
    { value: 'TODOS', label: 'Todos os Status' },
    { value: 'A_PAGAR', label: 'A Pagar' },
    { value: 'PAGO', label: 'Pago' },
    { value: 'VENCIDO', label: 'Vencido' },
  ];

  return (
    <>
      {isFormModalOpen && (
        <AccountFormModal onClose={handleCloseModals} accountToEdit={editingAccount} />
      )}
      {isDeleteModalOpen && deletingAccount && (
        <DeleteConfirmationModal
          itemName={deletingAccount.name}
          onConfirm={handleDeleteConfirm}
          onClose={handleCloseModals}
          isDeleting={isDeleting}
        />
      )}
      {selectedAccountId && (
        <PaymentHistoryModal
          accountId={selectedAccountId}
          onClose={() => setSelectedAccountId(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Contas a Pagar</h1>
            <p className="text-sm text-gray-500">Gerencie suas despesas e contas a pagar</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <PlusCircle size={20} />
            <span>Nova Conta</span>
          </button>
        </div>

        {/* Filtros (agora com status) */}
        <div className="flex gap-4 mb-6">
          <select
            title="Selecione o mês"
            value={month}
            onChange={handleMonthChange}
            className="border rounded-lg px-3 py-2"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            title="Selecione o ano"
            value={year}
            onChange={handleYearChange}
            className="border rounded-lg px-3 py-2"
          >
            {yearOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Filtro de status */}
          <select
            title="Selecione o status"
            value={status}
            onChange={handleStatusChange}
            className="border rounded-lg px-3 py-2"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
                <th className="p-4 font-semibold text-gray-600 w-32">Ações</th>
              </tr>
            </thead>
            <tbody>
              {initialAccounts.map((account) => {
                const isParcelado =
                  account.installmentType === 'PARCELADO' &&
                  account.installments &&
                  account.currentInstallment;

                const installmentLabel = isParcelado
                  ? `${account.currentInstallment}/${account.installments}`
                  : 'Única';

                const installmentClass = isParcelado
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700';

                return (
                  <tr key={account.id} className="border-b hover:bg-gray-50 last:border-b-0">
                    <td className="p-4 font-medium text-gray-800">
                      {account.name}
                      <span
                        className={`ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${installmentClass}`}
                      >
                        {installmentLabel}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{account.category}</td>
                    <td className="p-4 text-gray-600">
                      {account.value.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="p-4 text-gray-600">
                      {format(new Date(account.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                    </td>
                    <td className="p-4">
                      <div className="inline-flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${getStatusClass(account.status)}`}
                        >
                          {account.status === 'PAGO' && <CheckCircle size={14} className="text-green-700" />}
                          {account.status === 'VENCIDO' && <XCircle size={14} className="text-red-700" />}
                          {account.status === 'A_PAGAR' && <AlertCircle size={14} className="text-yellow-700" />}
                          {formatStatusText(account.status)}
                        </span>

                        {account.status === 'PAGO' && Array.isArray(account.payments) && account.payments.length > 0 && (
                          <span className="inline-flex items-center text-xs text-gray-500 ml-1">
                            <Clock size={12} className="mr-1" />
                            {format(new Date(account.payments[0].paidAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedAccountId(account.id)}
                          className="text-gray-400 hover:text-yellow-600"
                          title="Ver histórico"
                        >
                          <History size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(account)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(account)}
                          className="text-gray-400 hover:text-red-600"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
