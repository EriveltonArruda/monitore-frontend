// src/app/dashboard/components/contracts/ContractsClient.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusCircle, Pencil, Trash2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ContractFormModal from './ContractsFormModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { Pagination } from '../Pagination';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type Municipality = { id: number; name: string; };
type Department = { id: number; name: string; municipalityId: number; };

type Contract = {
  id: number;
  code: string;
  description: string | null;
  municipalityId: number;
  departmentId: number | null;
  startDate: string | null;
  endDate: string | null;
  monthlyValue: number | null;
  status: string;
  signedAt?: string | null;
  processNumber?: string | null;
  municipality: { id: number; name: string; };
  department: { id: number; name: string; municipalityId: number } | null;
  daysToEnd: number | null;
  alertTag: 'EXPIRADO' | 'D-7' | 'D-30' | 'HOJE' | null;
};

type Props = {
  initialContracts: Contract[];
  totalContracts: number;
  page: number;
  totalPages: number;
  limit: number;
  municipalities: Municipality[];
};

export default function ContractsClient(props: Props) {
  const { initialContracts, totalContracts, page, totalPages, municipalities } = props;

  const router = useRouter();
  const searchParams = useSearchParams();

  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [deleting, setDeleting] = useState<Contract | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);

  // ✅ sincroniza a lista quando o server re-renderiza com novos dados
  useEffect(() => {
    setContracts(initialContracts);
  }, [initialContracts]);

  // filtros (querystring)
  const qSearch = searchParams.get('search') || '';
  const qMunicipalityId = searchParams.get('municipalityId') || '';
  const qDepartmentId = searchParams.get('departmentId') || '';
  const qEndFrom = searchParams.get('endFrom') || '';
  const qEndTo = searchParams.get('endTo') || '';
  const qDueInDays = searchParams.get('dueInDays') || '';
  const qExpiredOnly = searchParams.get('expiredOnly') || '';
  const qOrder = searchParams.get('order') || 'asc';
  const currentPage = Number(searchParams.get('page') || page || 1);

  // carregar órgãos (departments) por município
  const [departments, setDepartments] = useState<Department[]>([]);
  useEffect(() => {
    const load = async () => {
      if (!qMunicipalityId) { setDepartments([]); return; }
      const res = await fetch(`${API_BASE}/departments?municipalityId=${qMunicipalityId}&limit=9999`);
      const json = await res.json().catch(() => ({ data: [] }));
      setDepartments(json.data || []);
    };
    load();
  }, [qMunicipalityId]);

  const money = (v: number | null) =>
    v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const alertBadgeClass = (tag: Contract['alertTag']) => {
    switch (tag) {
      case 'EXPIRADO': return 'bg-red-600 text-white';
      case 'HOJE': return 'bg-amber-500 text-white';
      case 'D-7': return 'bg-orange-500 text-white';
      case 'D-30': return 'bg-emerald-500 text-white';
      default: return 'hidden';
    }
  };

  const setParam = (key: string, value?: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== '') params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setParam('search', e.target.value);
  const handleMunicipality = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDepartments([]); // opcional: limpa imediatamente a lista visível
    setParam('municipalityId', e.target.value);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('departmentId');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };
  const handleDepartment = (e: React.ChangeEvent<HTMLSelectElement>) => setParam('departmentId', e.target.value);
  const handleEndFrom = (e: React.ChangeEvent<HTMLInputElement>) => setParam('endFrom', e.target.value);
  const handleEndTo = (e: React.ChangeEvent<HTMLInputElement>) => setParam('endTo', e.target.value);
  const handleDueIn = (e: React.ChangeEvent<HTMLInputElement>) => setParam('dueInDays', e.target.value);
  const handleExpiredOnly = (e: React.ChangeEvent<HTMLInputElement>) => setParam('expiredOnly', e.target.checked ? 'true' : '');
  const handleOrder = (e: React.ChangeEvent<HTMLSelectElement>) => setParam('order', e.target.value);

  const openCreate = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit = (c: Contract) => { setEditing(c); setIsFormOpen(true); };
  const confirmDelete = (c: Contract) => { setDeleting(c); setIsDeleteModalOpen(true); };

  return (
    <>
      {/* Modal de Form */}
      {isFormOpen && (
        <ContractFormModal
          onClose={() => setIsFormOpen(false)}
          contractToEdit={editing}
        />
      )}

      {/* Modal de Exclusão */}
      {isDeleteModalOpen && deleting && (
        <DeleteConfirmationModal
          itemName={`${deleting.code} – ${deleting.municipality?.name ?? ''}`}
          onConfirm={async () => {
            try {
              await fetch(`${API_BASE}/contracts/${deleting.id}`, { method: 'DELETE' });
              setIsDeleteModalOpen(false);
              setDeleting(null);
              router.refresh();
            } catch {
              alert('Erro ao excluir contrato.');
            }
          }}
          onClose={() => { setIsDeleteModalOpen(false); setDeleting(null); }}
          isDeleting={false}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Contratos</h1>
            <p className="text-sm text-gray-500">Gerencie seus contratos por prefeitura e órgão</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <PlusCircle size={20} />
            <span>Novo Contrato</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Buscar (código/descr.)</label>
              <input
                type="text"
                value={qSearch}
                onChange={handleSearch}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Ex.: CT 001/2025"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Município</label>
              <select
                title="Município"
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

            <div>
              <label className="block text-xs text-gray-500 mb-1">Órgão/Secretaria</label>
              <select
                title="Órgão/Secretaria"
                value={qDepartmentId}
                onChange={handleDepartment}
                className="w-full border rounded-md px-3 py-2 bg-white"
                disabled={!qMunicipalityId}
              >
                <option value="">Todos</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Vigência (Fim) de</label>
              <input
                type="date"
                value={qEndFrom}
                onChange={handleEndFrom}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Vigência (Fim) até</label>
              <input
                type="date"
                value={qEndTo}
                onChange={handleEndTo}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Vencendo em (dias)</label>
              <input
                type="number"
                min={1}
                value={qDueInDays}
                onChange={handleDueIn}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Ex.: 30"
              />
            </div>

            <div className="flex items-end gap-2">
              <input
                id="expiredOnly"
                type="checkbox"
                checked={qExpiredOnly === 'true'}
                onChange={handleExpiredOnly}
              />
              <label htmlFor="expiredOnly" className="text-sm text-gray-700">Apenas expirados</label>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Ordenar por fim</label>
              <select
                title="Ordenar por fim"
                value={qOrder}
                onChange={handleOrder}
                className="w-full border rounded-md px-3 py-2 bg-white"
              >
                <option value="asc">Mais antigos → recentes</option>
                <option value="desc">Mais recentes → antigos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <table className="w-full table-auto">
            <thead className="text-left border-b-2 border-gray-100">
              <tr>
                <th className="p-3 font-semibold text-gray-600">Código</th>
                <th className="p-3 font-semibold text-gray-600">Município</th>
                <th className="p-3 font-semibold text-gray-600">Órgão</th>
                <th className="p-3 font-semibold text-gray-600">Vigência</th>
                <th className="p-3 font-semibold text-gray-600">Valor Mensal</th>
                <th className="p-3 font-semibold text-gray-600">Alerta</th>
                <th className="p-3 font-semibold text-gray-600 w-32">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const period = [
                  c.startDate ? format(new Date(c.startDate), 'dd/MM/yyyy', { locale: ptBR }) : '—',
                  c.endDate ? format(new Date(c.endDate), 'dd/MM/yyyy', { locale: ptBR }) : '—',
                ].join(' → ');

                return (
                  <tr key={c.id} className="border-b hover:bg-gray-50 last:border-b-0">
                    <td className="p-3 font-medium text-gray-800">{c.code}</td>
                    <td className="p-3 text-gray-700">{c.municipality?.name}</td>
                    <td className="p-3 text-gray-700">{c.department?.name ?? '—'}</td>
                    <td className="p-3 text-gray-700 flex items-center gap-1">
                      <Calendar size={16} className="text-gray-400" />
                      {period}
                    </td>
                    <td className="p-3 text-gray-700">{money(c.monthlyValue)}</td>
                    <td className="p-3">
                      {c.alertTag && (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${alertBadgeClass(c.alertTag)}`}>
                          <Clock size={12} />
                          {c.alertTag}
                          {typeof c.daysToEnd === 'number' && (
                            <span className="opacity-80 ml-1">({c.daysToEnd}d)</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => confirmDelete(c)}
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

              {contracts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    Nenhum contrato encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação simples */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">
            Total: {totalContracts}
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
