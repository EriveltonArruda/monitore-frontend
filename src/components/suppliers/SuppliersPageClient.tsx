"use client";

import React, { useState } from 'react';
import { PlusCircle, Pencil, Trash2, Printer, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SupplierFormModal } from './SupplierFormModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';
import { Pagination } from '../Pagination';
import Topbar from '../layout/Topbar';

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
  const pathname = usePathname();

  // Modais e estados
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Paginação
  const totalPages = Math.ceil(totalSuppliers / ITEMS_PER_PAGE);
  const currentPage = Number(searchParams.get('page')) || 1;

  // Navegar para a página de impressão, preservando filtros relevantes
  const goToPrint = () => {
    const qs = new URLSearchParams();
    const s = searchParams.get('search');
    if (s) qs.set('search', s);
    // alias “fornecedores” → “suppliers” já existe no [kind]/page.tsx
    router.push(`/dashboard/print/fornecedores?${qs.toString()}`);
  };

  // Chips / limpar
  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };
  const clearFilters = () => {
    const params = new URLSearchParams();
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  // Modais
  const handleOpenCreateModal = () => { setEditingSupplier(null); setIsFormModalOpen(true); };
  const handleOpenEditModal = (supplier: Supplier) => { setEditingSupplier(supplier); setIsFormModalOpen(true); };
  const handleOpenDeleteModal = (supplier: Supplier) => { setDeletingSupplier(supplier); setIsDeleteModalOpen(true); };
  const handleCloseModals = () => { setIsFormModalOpen(false); setIsDeleteModalOpen(false); setEditingSupplier(null); setDeletingSupplier(null); };

  // Exclusão
  const handleDeleteConfirm = async () => {
    if (!deletingSupplier) return;
    setIsDeleting(true);
    try {
      await fetch(`http://localhost:3001/suppliers/${deletingSupplier.id}`, { method: 'DELETE' });
      router.refresh();
      handleCloseModals();
    } catch {
      alert('Ocorreu um erro ao deletar o fornecedor.');
    } finally {
      setIsDeleting(false);
    }
  };

  const qSearch = searchParams.get('search') || '';
  const hasActive = !!qSearch;

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
        {/* TOPBAR com busca integrada (atualiza ?search= e reseta page=1) */}
        <Topbar
          title="Fornecedores"
          subtitle="Gerencie os fornecedores dos seus produtos"
          withSearch
          searchPlaceholder="Buscar fornecedor…"
          actions={
            <>
              {/* Imprimir (rota de impressão) */}
              <button
                onClick={goToPrint}
                className="border text-gray-700 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg flex items-center gap-2"
                title="Imprimir (visualizar versão de impressão)"
              >
                <Printer size={18} />
                <span>Imprimir</span>
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
              >
                <PlusCircle size={20} />
                <span>Novo Fornecedor</span>
              </button>
            </>
          }
        />

        {/* Chips dos filtros ativos */}
        {hasActive && (
          <div className="bg-white p-3 rounded-xl shadow-sm mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 mr-1">Filtros ativos:</span>

            {!!qSearch && (
              <button
                className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
                onClick={() => removeFilter('search')}
                title={`Remover busca: “${qSearch}”`}
              >
                <span>Busca: “{qSearch}”</span>
                <X size={12} />
              </button>
            )}

            <div className="grow" />
            <button
              className="text-xs text-blue-700 hover:underline"
              onClick={clearFilters}
              title="Limpar todos os filtros"
            >
              Limpar tudo
            </button>
          </div>
        )}

        {/* Tabela */}
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

              {initialSuppliers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Nenhum fornecedor encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
