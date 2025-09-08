"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusCircle, Pencil, Trash2, Calendar, FileText, Building2, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReceivablesFormModal from './ReceivablesFormModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { Pagination } from '../Pagination';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type Municipality = { id: number; name: string; };
type Department = { id: number; name: string; municipalityId: number; };
type Contract = { id: number; code: string; municipalityId: number; departmentId: number | null; };

type Receivable = {
  id: number;
  contractId: number;
  noteNumber: string | null;
  issueDate: string | null;
  grossAmount: number | null;
  netAmount: number | null;
  periodLabel: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  deliveryDate: string | null;
  receivedAt: string | null;
  status: 'A_RECEBER' | 'ATRASADO' | 'RECEBIDO';
  createdAt: string;
  updatedAt: string;
  contract: {
    id: number;
    code: string;
    municipalityId: number;
    departmentId: number | null;
    municipality: { id: number; name: string; };
    department: { id: number; name: string; municipalityId: number } | null;
  };
};

type Props = {
  initialRows: Receivable[];
  totalRows: number;
  page: number;
  totalPages: number;
  limit: number;
  municipalities: Municipality[];
};

export default function ReceivablesClient(props: Props) {
  const { initialRows, totalRows, page, totalPages, municipalities } = props;

  const router = useRouter();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<Receivable[]>(initialRows);

  // modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Receivable | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Receivable | null>(null);

  // filtros (querystring)
  const qSearch = searchParams.get('search') || '';
  const qMunicipalityId = searchParams.get('municipalityId') || '';
  const qDepartmentId = searchParams.get('departmentId') || '';
  const qContractId = searchParams.get('contractId') || '';
  const qStatus = searchParams.get('status') || '';
  const qIssueFrom = searchParams.get('issueFrom') || '';
  const qIssueTo = searchParams.get('issueTo') || '';
  const qPeriodFrom = searchParams.get('periodFrom') || '';
  const qPeriodTo = searchParams.get('periodTo') || '';
  const qReceivedFrom = searchParams.get('receivedFrom') || '';
  const qReceivedTo = searchParams.get('receivedTo') || '';
  const qOrderBy = searchParams.get('orderBy') || 'issueDate';
  const qOrder = searchParams.get('order') || 'desc';
  const currentPage = Number(searchParams.get('page') || page || 1);

  // dependências de filtros (carregar órgãos e contratos conforme município/órgão)
  const [departments, setDepartments] = useState<Department[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    const loadDeps = async () => {
      if (!qMunicipalityId) { setDepartments([]); return; }
      const res = await fetch(`${API_BASE}/departments?municipalityId=${qMunicipalityId}&limit=9999`);
      const json = await res.json().catch(() => ({ data: [] }));
      setDepartments(json.data || []);
    };
    loadDeps();
  }, [qMunicipalityId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (qMunicipalityId) params.set('municipalityId', qMunicipalityId);
    if (qDepartmentId) params.set('departmentId', qDepartmentId);
    params.set('limit', '9999');

    const loadContracts = async () => {
      if (!qMunicipalityId) { setContracts([]); return; }
      const res = await fetch(`${API_BASE}/contracts?${params.toString()}`);
      const json = await res.json().catch(() => ({ data: [] }));
      setContracts(json.data || []);
    };
    loadContracts();
  }, [qMunicipalityId, qDepartmentId]);

  // helpers
  const money = (v: number | null) =>
    (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const setParam = (key: string, value?: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== '') params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setParam('search', e.target.value);
  const handleMunicipality = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const val = e.target.value;
    if (val) params.set('municipalityId', val); else params.delete('municipalityId');
    // reset dependentes
    params.delete('departmentId');
    params.delete('contractId');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };
  const handleDepartment = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const val = e.target.value;
    if (val) params.set('departmentId', val); else params.delete('departmentId');
    params.delete('contractId');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };
  const handleContract = (e: React.ChangeEvent<HTMLSelectElement>) => setParam('contractId', e.target.value);
  const handleStatus = (e: React.ChangeEvent<HTMLSelectElement>) => setParam('status', e.target.value);

  return (
    <>
      {/* Modal form */}
      {isFormOpen && (
        <ReceivablesFormModal
          onClose={() => setIsFormOpen(false)}
          receivableToEdit={editing}
          presetMunicipalityId={qMunicipalityId ? Number(qMunicipalityId) : undefined}
          presetDepartmentId={qDepartmentId ? Number(qDepartmentId) : undefined}
        />
      )}

      {/* Modal excluir */}
      {isDeleteModalOpen && deleting && (
        <DeleteConfirmationModal
          itemName={`NF ${deleting.noteNumber ?? '(sem nº)'} – ${deleting.contract?.code ?? ''}`}
          onConfirm={async () => {
            try {
              await fetch(`${API_BASE}/receivables/${deleting.id}`, { method: 'DELETE' });
              setIsDeleteModalOpen(false);
              setDeleting(null);
              router.refresh();
            } catch {
              alert('Erro ao excluir recebível.');
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
            <h1 className="text-3xl font-bold text-gray-800">Recebidos</h1>
            <p className="text-sm text-gray-500">Notas/faturas por contrato e prefeitura</p>
          </div>
          <button
            onClick={() => { setEditing(null); setIsFormOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <PlusCircle size={20} />
            <span>Novo Recebido</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Buscar (nº nota / período)</label>
              <input
                type="text"
                value={qSearch}
                onChange={handleSearch}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Ex.: NF-0001 ou FEV/2025"
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
                {municipalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Órgão/Secretaria</label>
              <select
                value={qDepartmentId}
                onChange={handleDepartment}
                className="w-full border rounded-md px-3 py-2 bg-white"
                disabled={!qMunicipalityId}
                title="Órgão/Secretaria"
              >
                <option value="">Todos</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Contrato</label>
              <select title="Contrato"
                value={qContractId}
                onChange={handleContract}
                className="w-full border rounded-md px-3 py-2 bg-white"
                disabled={!qMunicipalityId}
              >
                <option value="">Todos</option>
                {contracts.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select title="Status"
                value={qStatus}
                onChange={handleStatus}
                className="w-full border rounded-md px-3 py-2 bg-white"
              >
                <option value="">Todos</option>
                <option value="A_RECEBER">A RECEBER</option>
                <option value="ATRASADO">ATRASADO</option>
                <option value="RECEBIDO">RECEBIDO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Emissão de</label>
              <input type="date" value={qIssueFrom} onChange={(e) => setParam('issueFrom', e.target.value)} className="w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Emissão até</label>
              <input type="date" value={qIssueTo} onChange={(e) => setParam('issueTo', e.target.value)} className="w-full border rounded-md px-3 py-2" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Período de</label>
              <input type="date" value={qPeriodFrom} onChange={(e) => setParam('periodFrom', e.target.value)} className="w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Período até</label>
              <input type="date" value={qPeriodTo} onChange={(e) => setParam('periodTo', e.target.value)} className="w-full border rounded-md px-3 py-2" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Recebido de</label>
              <input type="date" value={qReceivedFrom} onChange={(e) => setParam('receivedFrom', e.target.value)} className="w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Recebido até</label>
              <input type="date" value={qReceivedTo} onChange={(e) => setParam('receivedTo', e.target.value)} className="w-full border rounded-md px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ordenar por</label>
              <select title="Ordenar por"
                value={qOrderBy}
                onChange={(e) => setParam('orderBy', e.target.value)}
                className="w-full border rounded-md px-3 py-2 bg-white"
              >
                <option value="issueDate">Emissão</option>
                <option value="receivedAt">Recebido em</option>
                <option value="periodStart">Início do Período</option>
                <option value="periodEnd">Fim do Período</option>
                <option value="grossAmount">Valor Bruto</option>
                <option value="netAmount">Valor Líquido</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Direção</label>
              <select title="Direção"
                value={qOrder}
                onChange={(e) => setParam('order', e.target.value)}
                className="w-full border rounded-md px-3 py-2 bg-white"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <table className="w-full table-auto">
            <thead className="text-left border-b-2 border-gray-100">
              <tr>
                <th className="p-3 font-semibold text-gray-600">Nº Nota</th>
                <th className="p-3 font-semibold text-gray-600">Contrato</th>
                <th className="p-3 font-semibold text-gray-600">Município</th>
                <th className="p-3 font-semibold text-gray-600">Órgão</th>
                <th className="p-3 font-semibold text-gray-600">Período</th>
                <th className="p-3 font-semibold text-gray-600">Emissão</th>
                <th className="p-3 font-semibold text-gray-600">Entrega</th>
                <th className="p-3 font-semibold text-gray-600">Recebido em</th>
                <th className="p-3 font-semibold text-gray-600">Bruto</th>
                <th className="p-3 font-semibold text-gray-600">Líquido</th>
                <th className="p-3 font-semibold text-gray-600 w-28">Status</th>
                <th className="p-3 font-semibold text-gray-600 w-28">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const period = [
                  r.periodStart ? format(new Date(r.periodStart), 'dd/MM/yyyy', { locale: ptBR }) : '—',
                  r.periodEnd ? format(new Date(r.periodEnd), 'dd/MM/yyyy', { locale: ptBR }) : '—',
                ].join(' → ');
                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50 last:border-b-0">
                    <td className="p-3 font-medium text-gray-800">
                      <div className="inline-flex items-center gap-1">
                        <FileText size={16} className="text-gray-400" />
                        {r.noteNumber ?? '—'}
                      </div>
                    </td>
                    <td className="p-3 text-gray-700">{r.contract?.code}</td>
                    <td className="p-3 text-gray-700">
                      <div className="inline-flex items-center gap-1">
                        <Building2 size={16} className="text-gray-400" />
                        {r.contract?.municipality?.name}
                      </div>
                    </td>
                    <td className="p-3 text-gray-700">
                      <div className="inline-flex items-center gap-1">
                        <Landmark size={16} className="text-gray-400" />
                        {r.contract?.department?.name ?? '—'}
                      </div>
                    </td>
                    <td className="p-3 text-gray-700">{period}</td>
                    <td className="p-3 text-gray-700">
                      {r.issueDate ? format(new Date(r.issueDate), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                    </td>
                    <td className="p-3 text-gray-700">
                      {r.deliveryDate ? format(new Date(r.deliveryDate), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                    </td>
                    <td className="p-3 text-gray-700">
                      {r.receivedAt ? format(new Date(r.receivedAt), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                    </td>
                    <td className="p-3 text-gray-700">{money(r.grossAmount)}</td>
                    <td className="p-3 text-gray-700">{money(r.netAmount)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full
                        ${r.status === 'RECEBIDO' ? 'bg-emerald-100 text-emerald-700' :
                          r.status === 'ATRASADO' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditing(r); setIsFormOpen(true); }}
                          className="text-gray-400 hover:text-blue-600"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => { setDeleting(r); setIsDeleteModalOpen(true); }}
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
              {rows.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-6 text-center text-gray-500">
                    Nenhum recebido encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Total: {totalRows}</span>
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
