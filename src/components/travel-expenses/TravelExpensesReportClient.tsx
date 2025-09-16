// src/app/dashboard/components/travel-expenses/TravelExpensesReportClient.tsx
"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileDown, Printer, Loader2 } from "lucide-react";
import { Pagination } from "@/components/Pagination";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

type Row = {
  id: number;
  employeeName?: string | null;
  department?: string | null;
  description?: string | null;
  category?: "TRANSPORTE" | "HOSPEDAGEM" | "ALIMENTACAO" | "OUTROS" | string | null;
  city?: string | null;
  state?: string | null;
  expenseDate?: string | null; // ISO string
  currency?: string | null; // BRL
  amount: number; // total
  reimbursedAmount?: number; // total reembolsado
  advancesAmount?: number; // total adiantado
  returnsAmount?: number; // total devolvido
  status: "PENDENTE" | "PARCIAL" | "REEMBOLSADO" | string;
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

  // filtros atuais (querystring)
  const search = searchParams.get("search") || "";
  const month = searchParams.get("month") || "";
  const year = searchParams.get("year") || "";
  const status = searchParams.get("status") || "";
  const category = searchParams.get("category") || "";

  // estado de exportação
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // helpers
  const setParam = (key: string, value?: string | null) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value && value !== "") p.set(key, value);
    else p.delete(key);
    p.set("page", "1");
    router.push(`?${p.toString()}`);
  };

  const clearFilters = () => {
    const p = new URLSearchParams();
    p.set("page", "1");
    router.push(`?${p.toString()}`);
  };

  const fmtMoney = (n: number | undefined | null) =>
    (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const catBadge = (c?: string | null) => {
    switch (c) {
      case "TRANSPORTE":
        return "bg-indigo-100 text-indigo-700";
      case "HOSPEDAGEM":
        return "bg-purple-100 text-purple-700";
      case "ALIMENTACAO":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const statusBadge = (s?: string | null) => {
    switch (s) {
      case "REEMBOLSADO":
        return "bg-emerald-100 text-emerald-700";
      case "PARCIAL":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-yellow-100 text-yellow-700"; // PENDENTE/Outros
    }
  };

  // monta os mesmos params dos filtros atuais, reutilizado por exportações
  const buildParams = () => {
    const p = new URLSearchParams();
    if (search && search.trim() !== "") p.set("search", search);
    if (month) p.set("month", month);
    if (year) p.set("year", year);
    if (status) p.set("status", status);
    if (category) p.set("category", category);
    // export não respeita paginação (exporta o conjunto filtrado)
    return p;
  };

  // tenta usar o nome vindo do servidor (Content-Disposition); senão, usa fallback
  const parseServerFilename = (res: Response, fallback: string) => {
    const cd = res.headers.get("content-disposition") || "";
    const match = cd.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
    if (match && match[1]) {
      try {
        return decodeURIComponent(match[1].replace(/(^")|("$)/g, ""));
      } catch {
        return match[1];
      }
    }
    return fallback;
  };

  // helper local para baixar blobs (preserva nome do servidor quando possível)
  const downloadBlob = async (url: string, fallbackFilename: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Falha ao exportar");
    const blob = await res.blob();
    const a = document.createElement("a");
    const href = URL.createObjectURL(blob);
    a.href = href;
    a.download = parseServerFilename(res, fallbackFilename);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  const exportPdf = async () => {
    try {
      setExportingPdf(true);
      const p = buildParams();
      await downloadBlob(
        `${API_BASE}/travel-expenses/export-pdf?${p.toString()}`,
        `relatorio_despesas_viagem.pdf`
      );
    } catch {
      alert("Erro ao exportar PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const exportCsv = async () => {
    try {
      setExportingCsv(true);
      const p = buildParams();
      await downloadBlob(
        `${API_BASE}/travel-expenses/export-csv?${p.toString()}`,
        `relatorio_despesas_viagem.csv`
      );
    } catch {
      alert("Erro ao exportar CSV.");
    } finally {
      setExportingCsv(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // barra de export embutida (sem criar novo arquivo)
  const ExportBar = () => (
    <div className="flex items-center gap-2">
      <button
        onClick={exportCsv}
        disabled={exportingCsv}
        aria-disabled={exportingCsv}
        aria-busy={exportingCsv}
        className="border text-gray-700 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg flex items-center gap-2 disabled:opacity-60"
        title="Exportar CSV"
      >
        {exportingCsv ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
        <span>{exportingCsv ? "Exportando..." : "Exportar CSV"}</span>
      </button>

      <button
        onClick={exportPdf}
        disabled={exportingPdf}
        aria-disabled={exportingPdf}
        aria-busy={exportingPdf}
        className="border text-gray-700 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg flex items-center gap-2 disabled:opacity-60"
        title="Exportar PDF"
      >
        {exportingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
        <span>{exportingPdf ? "Exportando..." : "Exportar PDF"}</span>
      </button>

      <button
        onClick={handlePrint}
        className="border text-gray-700 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg flex items-center gap-2"
        title="Imprimir"
      >
        <Printer size={18} />
        <span>Imprimir</span>
      </button>
    </div>
  );

  // totais da página atual (facilita conferência rápida; impressão já mostra totais no PDF)
  const pageTotals = initialRows.reduce(
    (acc, r) => {
      acc.amount += r.amount ?? 0;
      acc.adv += r.advancesAmount ?? 0;
      acc.ret += r.returnsAmount ?? 0;
      acc.rei += r.reimbursedAmount ?? 0;
      return acc;
    },
    { amount: 0, adv: 0, ret: 0, rei: 0 }
  );

  return (
    <div className="max-w-7xl mx-auto print:max-w-none">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Relatório de Despesas de Viagem</h1>
          <p className="text-sm text-gray-500">
            Filtros por mês/ano/status/categoria + exportação em PDF/CSV
          </p>
        </div>

        <ExportBar />
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setParam("search", e.target.value)}
            placeholder="Buscar por funcionário/descrição/cidade..."
            className="border rounded-lg px-3 py-2 w-64"
            title="Buscar"
          />

          <input
            type="number"
            placeholder="Mês"
            value={month}
            onChange={(e) => setParam("month", e.target.value)}
            className="border rounded-lg px-3 py-2 w-28"
            title="Mês (1-12)"
            min={1}
            max={12}
          />

          <input
            type="number"
            placeholder="Ano"
            value={year}
            onChange={(e) => setParam("year", e.target.value)}
            className="border rounded-lg px-3 py-2 w-28"
            title="Ano (ex.: 2025)"
            min={2000}
            max={2100}
          />

          <select
            title="Status"
            value={status}
            onChange={(e) => setParam("status", e.target.value)}
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
            onChange={(e) => setParam("category", e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todas as Categorias</option>
            <option value="TRANSPORTE">Transporte</option>
            <option value="HOSPEDAGEM">Hospedagem</option>
            <option value="ALIMENTACAO">Alimentação</option>
            <option value="OUTROS">Outros</option>
          </select>

          <button
            onClick={clearFilters}
            className="ml-auto border text-gray-700 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg"
            title="Limpar filtros"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="text-sm text-gray-600 mb-3 print:hidden">
          Total encontrado: {totalRows}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto min-w-[1000px]">
            <thead className="text-left border-b-2 border-gray-100">
              <tr>
                <th className="p-3 font-semibold text-gray-600">Funcionário</th>
                <th className="p-3 font-semibold text-gray-600">Categoria</th>
                <th className="p-3 font-semibold text-gray-600">Data</th>
                <th className="p-3 font-semibold text-gray-600">Local</th>
                <th className="p-3 font-semibold text-gray-600 text-right">Valor</th>
                <th className="p-3 font-semibold text-gray-600 text-right">Adiantado</th>
                <th className="p-3 font-semibold text-gray-600 text-right">Devolvido</th>
                <th className="p-3 font-semibold text-gray-600 text-right">Reembolsado</th>
                <th className="p-3 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {initialRows.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50 last:border-b-0">
                  <td className="p-3 text-gray-800">
                    {r.employeeName ?? "-"}
                    {r.description && (
                      <span className="ml-2 text-xs text-gray-500">• {r.description}</span>
                    )}
                  </td>

                  <td className="p-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${catBadge(
                        r.category || "OUTROS"
                      )}`}
                    >
                      {String(r.category ?? "OUTROS")
                        .toLowerCase()
                        .replace(/^\w/, (c) => c.toUpperCase())}
                    </span>
                  </td>

                  <td className="p-3 text-gray-600 whitespace-nowrap">
                    {r.expenseDate ? new Date(r.expenseDate).toLocaleDateString("pt-BR") : "—"}
                  </td>

                  <td className="p-3 text-gray-600">
                    {[r.city, r.state].filter(Boolean).join(" / ") || "—"}
                  </td>

                  <td className="p-3 text-gray-700 whitespace-nowrap text-right">
                    {fmtMoney(r.amount)}
                  </td>
                  <td className="p-3 text-gray-700 whitespace-nowrap text-right">
                    {fmtMoney(r.advancesAmount)}
                  </td>
                  <td className="p-3 text-gray-700 whitespace-nowrap text-right">
                    {fmtMoney(r.returnsAmount)}
                  </td>
                  <td className="p-3 text-gray-700 whitespace-nowrap text-right">
                    {fmtMoney(r.reimbursedAmount)}
                  </td>

                  <td className="p-3">
                    <span
                      className={`inline-flex w-fit items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(
                        r.status
                      )}`}
                    >
                      {String(r.status ?? "")
                        .toLowerCase()
                        .replace(/^\w/, (c) => c.toUpperCase())}
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

            {/* Rodapé com totais da página (não interfere em impressão do PDF) */}
            {initialRows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-100 font-semibold bg-gray-50">
                  <td className="p-3 text-gray-700" colSpan={4}>
                    Totais desta página
                  </td>
                  <td className="p-3 text-right">{fmtMoney(pageTotals.amount)}</td>
                  <td className="p-3 text-right">{fmtMoney(pageTotals.adv)}</td>
                  <td className="p-3 text-right">{fmtMoney(pageTotals.ret)}</td>
                  <td className="p-3 text-right">{fmtMoney(pageTotals.rei)}</td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="print:hidden">
          <Pagination currentPage={page} totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}
