// src/components/contracts/ContractsClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Info,
  FileDown,
  Printer,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ContractFormModal from "./ContractsFormModal";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { Pagination } from "@/components/Pagination";
import Topbar from "../layout/Topbar";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

// ---------- helpers download ----------
async function download(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Falha ao baixar arquivo");
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}
function tsFilename(prefix: string, ext: "pdf") {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `${prefix}_${stamp}.${ext}`;
}

type Municipality = { id: number; name: string };
type Department = { id: number; name: string; municipalityId: number };

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
  municipality?: { id: number; name: string };
  department?: { id: number; name: string; municipalityId: number } | null;
  daysToEnd: number | null;
  alertTag: "EXPIRADO" | "D-7" | "D-30" | "HOJE" | null;
};

type Props = {
  initialContracts: Contract[];
  totalContracts: number;
  page: number;
  totalPages: number;
  limit: number;
  municipalities: Municipality[];
};

const money = (v: number | null) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const alertStyles: Record<NonNullable<Contract["alertTag"]>, string> = {
  EXPIRADO: "bg-red-600 text-white",
  HOJE: "bg-amber-600 text-white",
  "D-7": "bg-orange-500 text-white",
  "D-30": "bg-emerald-500 text-white",
};

function alertTooltip(c: Contract) {
  if (!c.alertTag) return "";
  const label =
    c.alertTag === "EXPIRADO"
      ? "Contrato expirado"
      : c.alertTag === "HOJE"
        ? "Contrato vence hoje"
        : c.alertTag === "D-7"
          ? "Vence em até 7 dias"
          : "Vence em até 30 dias";

  const days =
    typeof c.daysToEnd === "number"
      ? c.daysToEnd < 0
        ? `${Math.abs(c.daysToEnd)} dia(s) em atraso`
        : c.daysToEnd === 0
          ? "vence hoje"
          : `faltam ${c.daysToEnd} dia(s)`
      : "";

  return [label, days].filter(Boolean).join(" • ");
}

export default function ContractsClient(props: Props) {
  const { initialContracts, totalContracts, page, totalPages, limit, municipalities } =
    props;

  const router = useRouter();
  const searchParams = useSearchParams();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Contract | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);

  // filtros (querystring)
  const qSearch = searchParams.get("search") || "";
  const qMunicipalityId = searchParams.get("municipalityId") || "";
  const qDepartmentId = searchParams.get("departmentId") || "";
  const qEndFrom = searchParams.get("endFrom") || "";
  const qEndTo = searchParams.get("endTo") || "";
  const qDueInDays = searchParams.get("dueInDays") || "";
  const qExpiredOnly = searchParams.get("expiredOnly") || "";
  const qOrder = searchParams.get("order") || "asc";
  const currentPage = Number(searchParams.get("page") || page || 1);

  // órgãos por município
  const [departments, setDepartments] = useState<Department[]>([]);
  useEffect(() => {
    const load = async () => {
      if (!qMunicipalityId) {
        setDepartments([]);
        return;
      }
      const res = await fetch(
        `${API_BASE}/departments?municipalityId=${qMunicipalityId}&limit=9999`
      );
      const json = await res.json().catch(() => ({ data: [] as Department[] }));
      setDepartments(json.data || []);
    };
    load();
  }, [qMunicipalityId]);

  const setParam = (key: string, value?: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "") params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleMunicipality = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("municipalityId", value);
    else params.delete("municipalityId");
    // ao trocar município, zera órgão
    params.delete("departmentId");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleDepartment = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setParam("departmentId", e.target.value);
  const handleEndFrom = (e: React.ChangeEvent<HTMLInputElement>) =>
    setParam("endFrom", e.target.value);
  const handleEndTo = (e: React.ChangeEvent<HTMLInputElement>) =>
    setParam("endTo", e.target.value);
  const handleDueIn = (e: React.ChangeEvent<HTMLInputElement>) =>
    setParam("dueInDays", e.target.value);
  const handleExpiredOnly = (e: React.ChangeEvent<HTMLInputElement>) =>
    setParam("expiredOnly", e.target.checked ? "true" : "");
  const handleOrder = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setParam("order", e.target.value);

  // ===== Chips / Limpar tudo =====
  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    // dependência: remover órgão se tirar município
    if (key === "municipalityId") params.delete("departmentId");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const municipalityLabel = useMemo(() => {
    if (!qMunicipalityId) return null;
    const m = municipalities.find((x) => String(x.id) === qMunicipalityId);
    return m?.name || `Município #${qMunicipalityId}`;
  }, [qMunicipalityId, municipalities]);

  const departmentLabel = useMemo(() => {
    if (!qDepartmentId) return null;
    const d = departments.find((x) => String(x.id) === qDepartmentId);
    return d?.name || `Órgão #${qDepartmentId}`;
  }, [qDepartmentId, departments]);

  const endFromLabel = qEndFrom ? format(new Date(qEndFrom), "dd/MM/yyyy") : null;
  const endToLabel = qEndTo ? format(new Date(qEndTo), "dd/MM/yyyy") : null;
  const orderLabel = qOrder === "desc" ? "Mais recentes → antigos" : "Mais antigos → recentes";

  const hasActive =
    !!qSearch ||
    !!qMunicipalityId ||
    !!qDepartmentId ||
    !!qEndFrom ||
    !!qEndTo ||
    !!qDueInDays ||
    qExpiredOnly === "true" ||
    !!qOrder;

  const contracts = useMemo(() => initialContracts, [initialContracts]);

  // 🔔 Contadores para o sino (derivados da lista exibida)
  const notifCounts = useMemo(() => {
    let d30 = 0,
      d7 = 0,
      today = 0;
    for (const c of contracts) {
      if (c.alertTag === "D-30") d30++;
      else if (c.alertTag === "D-7") d7++;
      else if (c.alertTag === "HOJE") today++;
    }
    return {
      contractsD30: d30,
      contractsD7: d7,
      contractsToday: today,
    };
  }, [contracts]);

  const onDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/contracts/${deleting.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao excluir contrato.");
      setIsDeleteModalOpen(false);
      setDeleting(null);
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "Erro ao excluir contrato.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };
  const openEdit = (c: Contract) => {
    setEditing(c);
    setIsFormOpen(true);
  };

  // 📄 Exportar PDF (lista com filtros da URL) — backend direto
  const exportListPdf = async () => {
    const qs = new URLSearchParams();
    if (qMunicipalityId) qs.set("municipalityId", qMunicipalityId);
    if (qDepartmentId) qs.set("departmentId", qDepartmentId);
    if (qSearch) qs.set("search", qSearch);
    if (qEndFrom) qs.set("endFrom", qEndFrom);
    if (qEndTo) qs.set("endTo", qEndTo);
    if (qDueInDays) qs.set("dueInDays", qDueInDays);
    if (qExpiredOnly) qs.set("expiredOnly", qExpiredOnly);
    if (qOrder) qs.set("order", qOrder);

    const url = `${API_BASE}/contracts/export-pdf?${qs.toString()}`;
    try {
      await download(url, tsFilename("contratos", "pdf"));
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // 🖨️ Imprimir (navega para rota de impressão com filtros atuais)
  const goToPrint = () => {
    const qs = new URLSearchParams();
    if (qMunicipalityId) qs.set("municipalityId", qMunicipalityId);
    if (qDepartmentId) qs.set("departmentId", qDepartmentId);
    if (qSearch) qs.set("search", qSearch);
    if (qEndFrom) qs.set("endFrom", qEndFrom);
    if (qEndTo) qs.set("endTo", qEndTo);
    if (qDueInDays) qs.set("dueInDays", qDueInDays);
    if (qExpiredOnly) qs.set("expiredOnly", qExpiredOnly);
    if (qOrder) qs.set("order", qOrder);
    // alias 'contratos' → 'contracts' já existe no [kind]/page.tsx
    router.push(`/dashboard/print/contratos?${qs.toString()}`);
  };

  // presets para “Novo Contrato” com base nos filtros aplicados
  const presetMunicipalityId = qMunicipalityId
    ? Number(qMunicipalityId)
    : undefined;
  const presetDepartmentId = qDepartmentId ? Number(qDepartmentId) : undefined;

  // ===== Render =====
  return (
    <>
      {/* Modal de Form */}
      {isFormOpen && (
        <ContractFormModal
          onClose={() => setIsFormOpen(false)}
          onSaved={() => {
            setIsFormOpen(false);
            router.refresh();
          }}
          contractToEdit={editing}
          presetMunicipalityId={editing ? undefined : presetMunicipalityId}
          presetDepartmentId={editing ? undefined : presetDepartmentId}
        />
      )}

      {/* Modal de Exclusão */}
      {isDeleteModalOpen && deleting && (
        <DeleteConfirmationModal
          itemName={`${deleting.code} – ${deleting.municipality?.name ?? ""}`}
          onConfirm={onDelete}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleting(null);
          }}
          isDeleting={isDeleting}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* ========= TOPBAR ========= */}
        <Topbar
          title="Contratos"
          subtitle="Gerencie seus contratos por prefeitura e órgão"
          withSearch
          searchPlaceholder="Buscar por código/descrição…"
          notifications={notifCounts}
          actions={
            <>
              {/* 🖨️ Imprimir (rota de impressão) */}
              <button
                onClick={goToPrint}
                className="border text-gray-700 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg flex items-center gap-2"
                title="Imprimir / Página de impressão"
              >
                <Printer size={18} />
                <span>Imprimir</span>
              </button>

              {/* PDF direto do backend */}
              <button
                onClick={exportListPdf}
                className="border text-gray-700 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg flex items-center gap-2"
                title="Exportar lista (PDF)"
              >
                <FileDown size={18} />
                <span>Exportar PDF</span>
              </button>

              <button
                onClick={openCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
              >
                <PlusCircle size={20} />
                <span>Novo Contrato</span>
              </button>
            </>
          }
        />

        {/* Filtros (sem campo de busca; Topbar cuida do ?search=) */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Município</label>
              <select
                title="Município"
                value={qMunicipalityId}
                onChange={handleMunicipality}
                className="w-full border rounded-md px-3 py-2 bg-white"
              >
                <option value="">Todos</option>
                {municipalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Órgão/Secretaria
              </label>
              <select
                title="Órgão/Secretaria"
                value={qDepartmentId}
                onChange={handleDepartment}
                className="w-full border rounded-md px-3 py-2 bg-white"
                disabled={!qMunicipalityId}
              >
                <option value="">Todos</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Vigência (Fim) de
              </label>
              <input
                type="date"
                value={qEndFrom}
                onChange={handleEndFrom}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Vigência (Fim) até
              </label>
              <input
                type="date"
                value={qEndTo}
                onChange={handleEndTo}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Ordenar por fim
              </label>
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

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Vencendo em (dias)
              </label>
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
                checked={qExpiredOnly === "true"}
                onChange={handleExpiredOnly}
              />
              <label htmlFor="expiredOnly" className="text-sm text-gray-700">
                Apenas expirados
              </label>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Chips dos filtros ativos */}
        {hasActive && (
          <div className="bg-white p-3 rounded-xl shadow-sm mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 mr-1">Filtros ativos:</span>

            {!!qSearch && (
              <button
                className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
                onClick={() => removeFilter("search")}
                title={`Remover busca: “${qSearch}”`}
              >
                <span>Busca: “{qSearch}”</span>
                <X size={12} />
              </button>
            )}

            {!!qMunicipalityId && (
              <button
                className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
                onClick={() => removeFilter("municipalityId")}
                title="Remover município"
              >
                <span>Município: {municipalityLabel}</span>
                <X size={12} />
              </button>
            )}

            {!!qDepartmentId && (
              <button
                className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
                onClick={() => removeFilter("departmentId")}
                title="Remover órgão"
              >
                <span>Órgão: {departmentLabel}</span>
                <X size={12} />
              </button>
            )}

            {!!qEndFrom && (
              <button
                className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
                onClick={() => removeFilter("endFrom")}
                title="Remover data início (fim de)"
              >
                <span>Fim de: {endFromLabel}</span>
                <X size={12} />
              </button>
            )}

            {!!qEndTo && (
              <button
                className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
                onClick={() => removeFilter("endTo")}
                title="Remover data final (fim até)"
              >
                <span>Fim até: {endToLabel}</span>
                <X size={12} />
              </button>
            )}

            {!!qDueInDays && (
              <button
                className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
                onClick={() => removeFilter("dueInDays")}
                title="Remover 'vencendo em X dias'"
              >
                <span>Vencendo em: {qDueInDays}d</span>
                <X size={12} />
              </button>
            )}

            {qExpiredOnly === "true" && (
              <button
                className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
                onClick={() => removeFilter("expiredOnly")}
                title="Remover 'apenas expirados'"
              >
                <span>Apenas expirados</span>
                <X size={12} />
              </button>
            )}

            {!!qOrder && (
              <button
                className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
                onClick={() => removeFilter("order")}
                title="Remover ordenação"
              >
                <span>Ordenação: {orderLabel}</span>
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

        {/* Legenda dos alertas */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> D-30
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" /> D-7
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-600" /> HOJE
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" /> EXPIRADO
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
                <th className="p-3 font-semibold text-gray-600">Código</th>
                <th className="p-3 font-semibold text-gray-600">Município</th>
                <th className="p-3 font-semibold text-gray-600">Órgão</th>
                <th className="p-3 font-semibold text-gray-600">Vigência</th>
                <th className="p-3 font-semibold text-gray-600">Valor Mensal</th>
                <th className="p-3 font-semibold text-gray-600">Alerta</th>
                <th className="p-3 font-semibold text-gray-600 w-40">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const period = [
                  c.startDate
                    ? format(new Date(c.startDate), "dd/MM/yyyy", { locale: ptBR })
                    : "—",
                  c.endDate
                    ? format(new Date(c.endDate), "dd/MM/yyyy", { locale: ptBR })
                    : "—",
                ].join(" → ");

                return (
                  <tr key={c.id} className="border-b hover:bg-gray-50 last:border-b-0">
                    <td className="p-3 font-medium text-gray-800">{c.code}</td>
                    <td className="p-3 text-gray-700">{c.municipality?.name ?? "—"}</td>
                    <td className="p-3 text-gray-700">{c.department?.name ?? "—"}</td>
                    <td className="p-3 text-gray-700">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} className="text-gray-400" />
                        {period}
                      </div>
                    </td>
                    <td className="p-3 text-gray-700">{money(c.monthlyValue)}</td>
                    <td className="p-3">
                      {c.alertTag && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${alertStyles[c.alertTag]}`}
                          title={alertTooltip(c)}
                          aria-label={alertTooltip(c)}
                        >
                          <Clock size={12} />
                          {c.alertTag}
                          {typeof c.daysToEnd === "number" && (
                            <span className="opacity-80 ml-1">({c.daysToEnd}d)</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {/* PDF individual */}
                        <button
                          className="text-gray-400 hover:text-indigo-600"
                          title="Baixar PDF do contrato"
                          onClick={() =>
                            download(
                              `${API_BASE}/contracts/${c.id}/export-pdf`,
                              tsFilename(`contrato_${c.id}`, "pdf")
                            )
                          }
                        >
                          <Printer size={18} />
                        </button>

                        <button
                          onClick={() => openEdit(c)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleting(c);
                            setIsDeleteModalOpen(true);
                          }}
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

        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
