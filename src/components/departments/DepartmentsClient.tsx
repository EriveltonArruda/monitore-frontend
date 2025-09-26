// src/app/dashboard/components/departments/DepartmentsClient.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusCircle, Pencil, Trash2, Printer } from 'lucide-react'; // ✅ add Printer
import DepartmentFormModal from './DepartmentFormModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { Pagination } from '../Pagination';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type Municipality = { id: number; name: string };
type Department = {
  id: number;
  name: string;
  municipalityId: number;
  municipality?: Municipality;
};

type Props = {
  initialDepartments: Department[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  municipalities: Municipality[];
};

export default function DepartmentsClient({
  initialDepartments,
  total,
  page,
  totalPages,
  limit,
  municipalities,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<Department[]>(initialDepartments);

  // modal de form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);

  // modal delete
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Department | null>(null);

  // filtros (querystring)
  const qSearch = searchParams.get('search') || '';
  const qMunicipalityId = searchParams.get('municipalityId') || '';
  const currentPage = Number(searchParams.get('page') || page || 1);

  // helpers de navegação de filtros
  const setParam = (key: string, value?: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== '') params.set(key, value);
    else params.delete(key);
    // reset page
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  // handlers dos filtros
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setParam('search', e.target.value);
  const handleMunicipality = (e: React.ChangeEvent<HTMLSelectElement>) => setParam('municipalityId', e.target.value);

  // ações
  const openCreate = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit = (d: Department) => { setEditing(d); setIsFormOpen(true); };
  const confirmDelete = (d: Department) => { setDeleting(d); setIsDeleteOpen(true); };

  // ✅ imprimir com filtros atuais
  const handlePrint = () => {
    const qs = new URLSearchParams();
    if (qSearch) qs.set('search', qSearch);
    if (qMunicipalityId) qs.set('municipalityId', qMunicipalityId);
    router.push(`/dashboard/print/orgaos?${qs.toString()}`);
  };

  return (
    <>
      {/* Modal Form */}
      {isFormOpen && (
        <DepartmentFormModal
          onClose={() => setIsFormOpen(false)}
          municipalities={municipalities}
          departmentToEdit={editing}
        />
      )}

      {/* Modal Delete */}
      {isDeleteOpen && deleting && (
        <DeleteConfirmationModal
          itemName={`${deleting.name} – ${deleting.municipality?.name ?? ''}`}
          onConfirm={async () => {
            try {
              await fetch(`${API_BASE}/departments/${deleting.id}`, { method: 'DELETE' });
              setIsDeleteOpen(false);
              setDeleting(null);
              router.refresh();
            } catch (e) {
              alert('Erro ao excluir órgão/secretaria.');
            }
          }}
          onClose={() => { setIsDeleteOpen(false); setDeleting(null); }}
          isDeleting={false}
        />
      )}

      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Órgãos / Secretarias</h1>
            <p className="text-sm text-gray-500">Vinculados a cada município</p>
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
              <span>Novo Órgão</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Buscar por nome</label>
              <input
                type="text"
                value={qSearch}
                onChange={handleSearch}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Ex.: Saúde"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Município</label>
              <select title="Município"
                value={qMunicipalityId}
                onChange={handleMunicipality}
                className="w-full border rounded-md px-3 py-2 bg-white"
              >
                <option value="">Todos</option>
                {municipalities.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <table className="w-full table-auto">
            <thead className="text-left border-b-2 border-gray-100">
              <tr>
                <th className="p-3 font-semibold text-gray-600">Nome</th>
                <th className="p-3 font-semibold text-gray-600">Município</th>
                <th className="p-3 font-semibold text-gray-600 w-32">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-b hover:bg-gray-50 last:border-b-0">
                  <td className="p-3 font-medium text-gray-800">{d.name}</td>
                  <td className="p-3 text-gray-700">{d.municipality?.name ?? '—'}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(d)}
                        className="text-gray-400 hover:text-blue-600"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => confirmDelete(d)}
                        className="text-gray-400 hover:text-red-600"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-500">
                    Nenhum órgão/secretaria encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação simples */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">
            Total: {total}
          </span>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              const params = new URLSearchParams(searchParams.toString());
              params.set('page', String(p));
              return (
                <button
                  key={p}
                  onClick={() => router.push(`?${params.toString()}`)}
                  className={`px-3 py-1 rounded border ${p === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
