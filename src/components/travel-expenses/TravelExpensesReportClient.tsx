// src/app/dashboard/components/travel-expenses/TravelExpensesReportClient.tsx
"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileDown } from 'lucide-react';
import { Pagination } from '@/components/Pagination';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type Row = {
  id: number;
  employeeName?: string | null;
  department?: string | null;
  description?: string | null;
  category?: 'TRANSPORTE' | 'HOSPEDAGEM' | 'ALIMENTACAO' | 'OUTROS' | string | null;
  city?: string | null;
  state?: string | null;
  expenseDate?: string | null;  // ISO string
  currency?: string | null;     // BRL
  amount: number;               // total
  reimbursedAmount?: number;    // total reembolsado
  advancesAmount?: number;      // total adiantado
  returnsAmount?: number;       // total devolvido
  status: 'PENDENTE' | 'PARCIAL' | 'REEMBOLSADO' | string;
};

type Props = {
  initialRows: Row[];
  totalRows: number;
  page: number;
  totalPages: number;
};

export default function TravelExpensesReportClient({
  initialRows,
  totalRows,
  page,
  totalPages,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // filtros atuais
  const search = searchParams.get('search') || '';
  const month = searchParams.get('month') || '';
  const year = searchParams.get('year') || '';
  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';

  // helpers
  const setParam = (key: string, value?: string | null) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value && value !== '') p.set(key, value); else p.delete(key);
    p.set('page', '1');
    router.push(`?${p.toString()}`);
  };

  const exportPdf = async () => {
    const p = new URLSearchParams();
    if (search && search.trim() !== '') p.set('search', search);
    if (month) p.set('month', month);
    if (year) p.set('year', year);
    if (status) p.set('status', status);
    if (category) p.set('category', category);

    try {
      const res = await fetch(`${API_BASE}/travel-expenses/export-pdf?${p.toString()}`);
      if (!res.ok) throw new Error('Falha ao exportar PDF');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `relatorio_despesas_viagem_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch {
      alert('Erro ao exportar PDF.');
    }
  };

  const fmtMoney = (n: number | undefined | null) =>
    (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const catBadge = (c?: string | null) => {
    switch (c) {
      case 'TRANSPORTE': return 'bg-indigo-100 text-indigo-700';
      case 'HOSPEDAGEM': return 'bg-purple-100 text-purple-700';
      case 'ALIMENTACAO': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const statusBadge = (s?: string | null) => {
    switch (s) {
      case 'REEMBOLSADO': return 'bg-emerald-100 text-emerald-700';
      case 'PARCIAL': return 'bg-blue-100 text-blue-700';
      default: return 'bg-yellow-100 text-yellow-700'; // PENDENTE/Outros
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Relatório de Despesas de Viagem</h1>
          <p className="text-sm text-gray-500">Filtros por mês/ano/status/categoria + exportação em PDF</p>
        </div>
        <button
          onClick={exportPdf}
          className="border text-gray-700 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg flex items-center gap-2"
          title="Exportar PDF"
        >
          <FileDown size={18} />
          <span>Exportar PDF</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setParam('search', e.target.value)}
            placeholder="Buscar por funcionário/descrição/cidade..."
            className="border rounded-lg px-3 py-2 w-64"
            title="Buscar"
          />

          <input
            type="number"
            placeholder="Mês"
            value={month}
            onChange={(e) => setParam('month', e.target.value)}
            className="border rounded-lg px-3 py-2 w-28"
            title="Mês (1-12)"
            min={1}
            max={12}
          />

          <input
            type="number"
            placeholder="Ano"
            value={year}
            onChange={(e) => setParam('year', e.target.value)}
            className="border rounded-lg px-3 py-2 w-28"
            title="Ano (ex.: 2025)"
            min={2000}
            max={2100}
          />

          <select
            title="Status"
            value={status}
            onChange={(e) => setParam('status', e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos os Status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="PARCIAL">Parcial</option>
            <option value="REEMBOLSADO">Reembolsado</option>
          </select>

          <select
            title="Categoria"
            value={category}
            onChange={(e) => setParam('category', e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todas as Categorias</option>
            <option value="TRANSPORTE">Transporte</option>
            <option value="HOSPEDAGEM">Hospedagem</option>
            <option value="ALIMENTACAO">Alimentação</option>
            <option value="OUTROS">Outros</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="text-sm text-gray-600 mb-3">Total encontrado: {totalRows}</div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto min-w-[1000px]">
            <thead className="text-left border-b-2 border-gray-100">
              <tr>
                <th className="p-3 font-semibold text-gray-600">Funcionário</th>
                <th className="p-3 font-semibold text-gray-600">Categoria</th>
                <th className="p-3 font-semibold text-gray-600">Data</th>
                <th className="p-3 font-semibold text-gray-600">Local</th>
                <th className="p-3 font-semibold text-gray-600">Valor</th>
                <th className="p-3 font-semibold text-gray-600">Adiantado</th>
                <th className="p-3 font-semibold text-gray-600">Devolvido</th>
                <th className="p-3 font-semibold text-gray-600">Reembolsado</th>
                <th className="p-3 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {initialRows.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50 last:border-b-0">
                  <td className="p-3 text-gray-800">
                    {r.employeeName ?? '-'}
                    {r.description && (
                      <span className="ml-2 text-xs text-gray-500">• {r.description}</span>
                    )}
                  </td>

                  <td className="p-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${catBadge(r.category || 'OUTROS')}`}>
                      {String(r.category ?? 'OUTROS').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                    </span>
                  </td>

                  <td className="p-3 text-gray-600 whitespace-nowrap">
                    {r.expenseDate ? new Date(r.expenseDate).toLocaleDateString('pt-BR') : '—'}
                  </td>

                  <td className="p-3 text-gray-600">
                    {[r.city, r.state].filter(Boolean).join(' / ') || '—'}
                  </td>

                  <td className="p-3 text-gray-700 whitespace-nowrap">
                    {fmtMoney(r.amount)}
                  </td>
                  <td className="p-3 text-gray-700 whitespace-nowrap">
                    {fmtMoney(r.advancesAmount)}
                  </td>
                  <td className="p-3 text-gray-700 whitespace-nowrap">
                    {fmtMoney(r.returnsAmount)}
                  </td>
                  <td className="p-3 text-gray-700 whitespace-nowrap">
                    {fmtMoney(r.reimbursedAmount)}
                  </td>

                  <td className="p-3">
                    <span className={`inline-flex w-fit items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(r.status)}`}>
                      {String(r.status ?? '').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                    </span>
                  </td>
                </tr>
              ))}

              {initialRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-500">
                    Nada para exibir com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={page} totalPages={totalPages} />
      </div>
    </div>
  );
}
