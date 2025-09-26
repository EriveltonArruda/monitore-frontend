// MunicipalitiesClient.tsx
"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusCircle, Pencil, Trash2, Printer } from 'lucide-react'; // ✅ add Printer
import { Pagination } from '../../components/Pagination';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';
import MunicipalityFormModal from './MunicipalityFormModal';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type Municipality = {
  id: number;
  name: string;
  cnpj: string | null;
};

type Props = {
  initialRows: Municipality[] | undefined; // pode vir undefined do server
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

  // ✅ fallback seguro para evitar "Cannot read properties of undefined (reading 'map')"
  const [rows] = useState<Municipality[]>(initialRows ?? []);

  // modal form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Municipality | null>(null);

  // modal delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Municipality | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // filtros (query string)
  const qSearch = searchParams.get('search') || '';
  const currentPage = Number(searchParams.get('page') || page || 1);

  const setParam = (key: string, value?: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== '') params.set(key, value); else params.delete(key);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setParam('search', e.target.value);

  const openCreate = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit = (m: Municipality) => { setEditing(m); setIsFormOpen(true); };
  const confirmDelete = (m: Municipality) => { setDeleting(m); setIsDeleteModalOpen(true); };

  // ✅ imprimir com filtros atuais
  const handlePrint = () => {
    const qs = new URLSearchParams();
    if (qSearch) qs.set('search', qSearch);
    router.push(`/dashboard/print/municipios?${qs.toString()}`);
  };

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
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Municípios</h1>
            <p className="text-sm text-gray-500">Gerencie os municípios atendidos</p>
          </div>
          <div className="flex items-center gap-2">
            {/* ✅ Botão Imprimir */}
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
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="block text-xs text-gray-500 mb-1">Buscar (nome/CNPJ)</label>
              <input
                type="text"
                value={qSearch}
                onChange={handleSearch}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Ex.: Paulista"
              />
            </div>
          </div>
        </div>

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
