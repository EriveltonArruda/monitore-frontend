// src/components/accounts-payable/AccountsPayableClient.tsx
"use client";

/**
 * Client Component (Contas a Pagar)
 * - Lista/paginação/ações (criar, editar, excluir, histórico)
 * - Filtros (mês, ano, status, categoria) + busca via Topbar
 * - Exportar PDF (lista e individual)
 * - Cards-resumo (Vencido / ≤7 / ≤3 / Aberto / Pago) alinhados com os mesmos filtros da tabela
 * - Revalidação dos cards após salvar/editar/excluir usando summaryVersion
 * - Badges de alerta padronizados + tooltip + legenda
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  PlusCircle, Pencil, Trash2, CheckCircle, AlertCircle,
  XCircle, Clock, History, Printer, FileDown, Info
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AccountFormModal } from './AccountFormModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';
import { Pagination } from '../Pagination';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PaymentHistoryModal } from '../payments/PaymentHistoryModal';
import { APStatusCards } from './APStatusCards';
// ✅ caminho corrigido do Topbar (arquivo fica em src/app/...)
import Topbar from '../../components/layout/Topbar';

type Payment = { id: number; paidAt: string; };

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
  daysToDue?: number;
  alertTag?: 'VENCIDO' | 'D-3' | 'D-7' | null;
};

type AccountsPayableClientProps = {
  initialAccounts: AccountPayable[];
  totalAccounts: number;
};

const ITEMS_PER_PAGE = 10;
const API_BASE = 'http://localhost:3001';

// ---- Download helper (PDF) ----
async function download(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'Falha ao baixar arquivo');
  }
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

// ---- Nome de arquivo com timestamp ----
function tsFilename(prefix: string, ext: 'pdf') {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `${prefix}_${stamp}.${ext}`;
}

// ---- from/to (YYYY-MM-DD) a partir de month/year ----
function buildPeriodFromFilters(month: string, year: string) {
  if (!month || !year) return null;
  const m = Number(month) - 1;
  const y = Number(year);
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(first), to: fmt(last) };
}

// ---- estilização de status ----
function getStatusClass(status: string) {
  switch (status) {
    case 'PAGO': return 'bg-green-100 text-green-700';
    case 'VENCIDO': return 'bg-red-100 text-red-700';
    default: return 'bg-yellow-100 text-yellow-700';
  }
}
const formatStatusText = (status: string) =>
  status.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// ---- estilização de alerta ----
const alertStyles: Record<NonNullable<AccountPayable['alertTag']>, string> = {
  VENCIDO: 'bg-red-600 text-white',
  'D-3': 'bg-orange-500 text-white',
  'D-7': 'bg-amber-500 text-white',
};

// tooltip contextual
function alertTooltip(acc: AccountPayable) {
  if (!acc.alertTag) return '';
  const base =
    acc.alertTag === 'VENCIDO' ? 'Conta vencida' :
      acc.alertTag === 'D-3' ? 'Vence em até 3 dias' :
        'Vence em até 7 dias';

  const days =
    typeof acc.daysToDue === 'number'
      ? (acc.daysToDue < 0
        ? `${Math.abs(acc.daysToDue)} dia(s) em atraso`
        : acc.daysToDue === 0
          ? 'vence hoje'
          : `faltam ${acc.daysToDue} dia(s)`)
      : '';

  return [base, days].filter(Boolean).join(' • ');
}

export function AccountsPayableClient({ initialAccounts, totalAccounts }: AccountsPayableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- estado de modais/ações ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountPayable | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<AccountPayable | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  // --- filtros via querystring ---
  const status = searchParams.get('status') || 'TODOS';
  const category = searchParams.get('category') || 'TODAS';
  const search = searchParams.get('search') || '';
  const month = searchParams.get('month') || '';
  const year = searchParams.get('year') || '';

  // --- categorias dinâmicas a partir da listagem atual ---
  const categoryOptions = useMemo(() => {
    const unique: string[] = [];
    for (const acc of initialAccounts) {
      if (acc.category && !unique.includes(acc.category)) unique.push(acc.category);
    }
    unique.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return [{ value: 'TODAS', label: 'Todas as Categorias' }, ...unique.map(c => ({ value: c, label: c }))];
  }, [initialAccounts]);

  // --- paginação ---
  const totalPages = Math.ceil(totalAccounts / ITEMS_PER_PAGE);
  const currentPage = Number(searchParams.get('page')) || 1;

  // --- handlers de filtros (exceto busca, que está no Topbar) ---
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const selectedMonth = e.target.value;
    if (selectedMonth) {
      params.set('month', selectedMonth);
      const currentYear = String(new Date().getFullYear());
      if (!params.get('year') || params.get('year') === '') params.set('year', currentYear);
    } else {
      params.delete('month'); params.delete('year');
    }
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const selectedYear = e.target.value;
    if (selectedYear) params.set('year', selectedYear); else params.delete('year');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const selectedStatus = e.target.value;
    if (selectedStatus && selectedStatus !== 'TODOS') params.set('status', selectedStatus); else params.delete('status');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const selectedCategory = e.target.value;
    if (selectedCategory && selectedCategory !== 'TODAS') params.set('category', selectedCategory); else params.delete('category');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  // --- opções fixas ---
  const monthOptions = [
    { value: '', label: 'Todos os meses' },
    { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' }, { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' }, { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
  ];
  const yearOptions = [
    { value: '', label: 'Todos os anos' },
    { value: '2023', label: '2023' }, { value: '2024', label: '2024' }, { value: '2025', label: '2025' },
  ];
  const statusOptions = [
    { value: 'TODOS', label: 'Todos os Status' },
    { value: 'A_PAGAR', label: 'A Pagar' },
    { value: 'PAGO', label: 'Pago' },
    { value: 'VENCIDO', label: 'Vencido' },
  ];

  // ==================== CARDS-RESUMO ====================
  const [summaryVersion, setSummaryVersion] = useState(0);
  const refreshSummary = () => setSummaryVersion(v => v + 1);

  const summaryKey = `${month || ''}|${year || ''}|${status || ''}|${category || ''}`;

  const [summary, setSummary] = useState<null | {
    period: { from: string; to: string } | null;
    totals: { count: number; amount: number };
    buckets: {
      VENCIDO: { count: number; amount: number };
      ABERTO: { count: number; amount: number };
      PAGO: { count: number; amount: number };
      DUE_7?: { count: number; amount: number };
      DUE_3?: { count: number; amount: number };
    };
  }>(null);

  useEffect(() => {
    const qs = new URLSearchParams();
    const period = buildPeriodFromFilters(month, year);
    if (period) { qs.set('from', period.from); qs.set('to', period.to); }
    if (status && status !== 'TODOS') qs.set('status', status);
    if (category && category !== 'TODAS') qs.set('category', category);

    fetch(`${API_BASE}/accounts-payable/reports/status?${qs.toString()}`)
      .then((r) => r.json())
      .then((json) => setSummary(json))
      .catch(() => setSummary(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryKey, summaryVersion]);

  // 🔔 Contadores para o sino de notificações (seguros contra undefined)
  const notifCounts = useMemo(() => {
    const b = summary?.buckets;
    const safe = (n?: number) => (typeof n === 'number' && Number.isFinite(n) ? n : 0);
    return {
      apOverdue: safe(b?.VENCIDO?.count),
      apDue3: safe(b?.DUE_3?.count),
      apDue7: safe(b?.DUE_7?.count),
    };
  }, [summary]);

  // ==================== EXPORTAÇÃO (PDF) ====================
  const handleExportListPdf = async () => {
    const params = new URLSearchParams();
    if (month) params.set('month', month);
    if (year) params.set('year', year);
    if (status && status !== 'TODOS') params.set('status', status);
    if (category && category !== 'TODAS') params.set('category', category);
    if (search && search.trim() !== '') params.set('search', search);
    const url = `${API_BASE}/accounts-payable/export-pdf?${params.toString()}`;
    try {
      await download(url, tsFilename('relatorio_contas_a_pagar', 'pdf'));
    } catch {
      alert('Falha ao baixar o PDF. Verifique se o backend está rodando em 3001.');
    }
  };

  // ==================== RENDER ====================
  return (
    <>
      {/* Modais */}
      {isFormModalOpen && (
        <AccountFormModal
          onClose={() => { setIsFormModalOpen(false); refreshSummary(); }}
          accountToEdit={editingAccount}
        />
      )}
      {isDeleteModalOpen && deletingAccount && (
        <DeleteConfirmationModal
          itemName={deletingAccount.name}
          onConfirm={async () => {
            if (!deletingAccount) return;
            setIsDeleting(true);
            try {
              await fetch(`${API_BASE}/accounts-payable/${deletingAccount.id}`, { method: 'DELETE' });
              router.refresh();
              setIsDeleteModalOpen(false);
              setDeletingAccount(null);
              refreshSummary();
            } catch {
              alert('Erro ao deletar a conta.');
            } finally {
              setIsDeleting(false);
            }
          }}
          onClose={() => { setIsDeleteModalOpen(false); setDeletingAccount(null); }}
          isDeleting={isDeleting}
        />
      )}
      {selectedAccountId && (
        <PaymentHistoryModal accountId={selectedAccountId} onClose={() => setSelectedAccountId(null)} />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Topbar com busca + ações + notificações */}
        <Topbar
          title="Contas a Pagar"
          subtitle="Gerencie suas despesas e contas a pagar"
          withSearch
          searchPlaceholder="Buscar por nome..."
          notifications={notifCounts}
          actions={
            <>
              <button
                onClick={handleExportListPdf}
                className="border text-gray-700 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg flex items-center gap-2"
                title="Exportar lista (PDF)"
              >
                <FileDown size={18} />
                <span>Exportar PDF</span>
              </button>
              <button
                onClick={() => { setEditingAccount(null); setIsFormModalOpen(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
              >
                <PlusCircle size={20} />
                <span>Nova Conta</span>
              </button>
            </>
          }
        />

        {/* CARDS DE STATUS */}
        <APStatusCards summary={summary} />

        {/* Filtros (sem campo de busca aqui) */}
        <div className="flex gap-4 mb-3">
          <select title="Selecione o mês" value={month} onChange={handleMonthChange} className="border rounded-lg px-3 py-2">
            {monthOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <select title="Selecione o ano" value={year} onChange={handleYearChange} className="border rounded-lg px-3 py-2">
            {yearOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <select title="Selecione o status" value={status} onChange={handleStatusChange} className="border rounded-lg px-3 py-2">
            {statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <select title="Selecione a categoria" value={category} onChange={handleCategoryChange} className="border rounded-lg px-3 py-2">
            {categoryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        {/* Legenda dos alertas */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" /> D-7
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" /> D-3
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" /> VENCIDO
          </span>
          <span className="inline-flex items-center gap-1 text-gray-400 ml-2">
            <Info size={14} />
            Passe o mouse no selo para detalhes
          </span>
        </div>

        {/* Tabela */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <table className="w-full table-auto">
            <thead className="text-left border-b-2 border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Nome da Conta</th>
                <th className="p-4 font-semibold text-gray-600">Categoria</th>
                <th className="p-4 font-semibold text-gray-600">Valor</th>
                <th className="p-4 font-semibold text-gray-600">Vencimento</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 w-44">Ações</th>
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

                const daysText =
                  typeof account.daysToDue === 'number'
                    ? (account.daysToDue < 0
                      ? `${Math.abs(account.daysToDue)}d em atraso`
                      : account.daysToDue === 0
                        ? 'vence hoje'
                        : `faltam ${account.daysToDue}d`)
                    : null;

                return (
                  <tr key={account.id} className="border-b hover:bg-gray-50 last:border-b-0">
                    <td className="p-4 font-medium text-gray-800">
                      {account.name}
                      <span className={`ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${installmentClass}`}>
                        {installmentLabel}
                      </span>
                    </td>

                    <td className="p-4 text-gray-600">{account.category}</td>

                    <td className="p-4 text-gray-600">
                      {account.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">
                          {format(new Date(account.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                        </span>

                        {account.alertTag && (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${alertStyles[account.alertTag]}`}
                            title={alertTooltip(account)}
                            aria-label={alertTooltip(account)}
                          >
                            <Clock size={12} />
                            {account.alertTag}
                          </span>
                        )}
                      </div>

                      {daysText && account.status !== 'PAGO' && (
                        <div className="text-[11px] text-gray-500 mt-0.5">{daysText}</div>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="inline-flex flex-col gap-1">
                        <span className={`inline-flex w-fit items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${getStatusClass(account.status)}`}>
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
                          onClick={() => download(`${API_BASE}/accounts-payable/${account.id}/export-pdf`, tsFilename(`conta_${account.id}`, 'pdf'))}
                          className="text-gray-400 hover:text-indigo-600"
                          title="Imprimir conta (PDF)"
                        >
                          <Printer size={18} />
                        </button>

                        <button
                          onClick={() => { setEditingAccount(account); setIsFormModalOpen(true); }}
                          className="text-gray-400 hover:text-blue-600"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() => { setDeletingAccount(account); setIsDeleteModalOpen(true); }}
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
