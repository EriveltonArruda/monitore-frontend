// src/app/dashboard/components/municipalities/MunicipalitiesClient.tsx
"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { PlusCircle, Pencil, Trash2, Printer, X } from 'lucide-react';
import { Pagination } from '../../components/Pagination';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';
import Topbar from '../layout/Topbar';
import MunicipalityFormModal from './MunicipalityFormModal';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type Municipality = {
  id: number;
  name: string;
  cnpj: string | null;
};

type Props = {
  initialRows: Municipality[] | undefined;
  total: number;
  page: number;
  totalPages: number;
  limit: number;
};

export default function MunicipalitiesClient({
  initialRows,
  total,
  page,
  totalPages,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [rows] = useState<Municipality[]>(initialRows ?? []);

  // modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Municipality | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Municipality | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // filtros (querystring)
  const qSearch = searchParams.get('search') || '';
  const currentPage = Number(searchParams.get('page') || page || 1);

  // helpers de URL
  const setParam = (key: string, value?: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== '') params.set(key, value); else params.delete(key);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };
  const clearFilters = () => {
    const params = new URLSearchParams();
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };
  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  // imprimir com filtros atuais
  const handlePrint = () => {
    const qs = new URLSearchParams();
    if (qSearch) qs.set('search', qSearch);
    router.push(`/dashboard/print/municipios?${qs.toString()}`);
  };

  // ações
  const openCreate = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit = (m: Municipality) => { setEditing(m); setIsFormOpen(true); };
  const confirmDelete = (m: Municipality) => { setDeleting(m); setIsDeleteModalOpen(true); };

  return (
    <>
      {/* Modal Form */}
      {isFormOpen && (
        <MunicipalityFormModal
          onClose={() => setIsFormOpen(false)}
          municipalityToEdit={editing}
        />
      )}

      {/* Modal Delete */}
      {isDeleteModalOpen && deleting && (
        <DeleteConfirmationModal
          itemName={`${deleting.name}`}
          onConfirm={async () => {
            try {
              setIsDeleting(true);
              await fetch(`${API_BASE}/municipalities/${deleting.id}`, { method: 'DELETE' });
              setIsDeleteModalOpen(false);
              setDeleting(null);
              router.refresh();
            } catch {
              alert('Erro ao excluir município.');
            } finally {
              setIsDeleting(false);
            }
          }}
          onClose={() => { setIsDeleteModalOpen(false); setDeleting(null); }}
          isDeleting={isDeleting}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* TOPBAR com busca integrada */}
        <Topbar
          title="Municípios"
          subtitle="Gerencie os municípios atendidos"
          withSearch
          searchPlaceholder="Buscar por nome ou CNPJ…"
          actions={
            <>
              <button
                onClick={handlePrint}
                className="border text-gray-700 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg flex items-center gap-2"
                title="Imprimir (com filtros atuais)"
              >
                <Printer size={18} />
                <span>Imprimir</span>
              </button>

              <button
                onClick={openCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
              >
                <PlusCircle size={20} />
                <span>Novo Município</span>
              </button>
            </>
          }
        />

        {/* Chips de filtros ativos */}
        {qSearch && (
          <div className="bg-white p-3 rounded-xl shadow-sm mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 mr-1">Filtros ativos:</span>

            <button
              className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
              onClick={() => removeFilter('search')}
              title={`Remover busca: “${qSearch}”`}
            >
              <span>Busca: “{qSearch}”</span>
              <X size={12} />
            </button>

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
                <th className="p-3 font-semibold text-gray-600">Nome</th>
                <th className="p-3 font-semibold text-gray-600">CNPJ</th>
                <th className="p-3 font-semibold text-gray-600 w-28">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((m) => (
                <tr key={m.id} className="border-b hover:bg-gray-50 last:border-b-0">
                  <td className="p-3 font-medium text-gray-800">{m.name}</td>
                  <td className="p-3 text-gray-700">{m.cnpj ?? '—'}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(m)}
                        className="text-gray-400 hover:text-blue-600"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => confirmDelete(m)}
                        className="text-gray-400 hover:text-red-600"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {(rows ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-500">
                    Nenhum município encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
