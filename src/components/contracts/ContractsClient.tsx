// src/app/dashboard/components/contracts/ContractsClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlusCircle, Pencil, Trash2, Calendar, Clock, Info } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ContractFormModal from "./ContractsFormModal";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { Pagination } from "@/components/Pagination";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

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
  municipality: { id: number; name: string };
  department: { id: number; name: string; municipalityId: number } | null;
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
  const { initialContracts, totalContracts, page, totalPages, municipalities } = props;

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
      const res = await fetch(`${API_BASE}/departments?municipalityId=${qMunicipalityId}&limit=9999`);
      const json = await res.json().catch(() => ({ data: [] }));
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

  // Busca no Enter para evitar push a cada tecla
  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const v = (e.target as HTMLInputElement).value;
    setParam("search", v && v.trim() !== "" ? v : "");
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

  const handleDepartment = (e: React.ChangeEvent<HTMLSelectElement>) => setParam("departmentId", e.target.value);
  const handleEndFrom = (e: React.ChangeEvent<HTMLInputElement>) => setParam("endFrom", e.target.value);
  const handleEndTo = (e: React.ChangeEvent<HTMLInputElement>) => setParam("endTo", e.target.value);
  const handleDueIn = (e: React.ChangeEvent<HTMLInputElement>) => setParam("dueInDays", e.target.value);
  const handleExpiredOnly = (e: React.ChangeEvent<HTMLInputElement>) => setParam("expiredOnly", e.target.checked ? "true" : "");
  const handleOrder = (e: React.ChangeEvent<HTMLSelectElement>) => setParam("order", e.target.value);

  const clearFilters = () => {
    const keep: Array<[string, string]> = []; // se quiser manter algo, adicione aqui
    const params = new URLSearchParams(keep);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const contracts = useMemo(() => initialContracts, [initialContracts]);

  const onDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/contracts/${deleting.id}`, { method: "DELETE" });
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
        <div className="bg-white p-4 rounded-xl shadow-sm mb-3">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Buscar (código/descr.)</label>
              <input
                type="text"
                defaultValue={qSearch}
                onKeyDown={handleSearchKey}
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
                {municipalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
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
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
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
                checked={qExpiredOnly === "true"}
                onChange={handleExpiredOnly}
              />
              <label htmlFor="expiredOnly" className="text-sm text-gray-700">
                Apenas expirados
              </label>
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
                <th className="p-3 font-semibold text-gray-600 w-32">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const period = [
                  c.startDate ? format(new Date(c.startDate), "dd/MM/yyyy", { locale: ptBR }) : "—",
                  c.endDate ? format(new Date(c.endDate), "dd/MM/yyyy", { locale: ptBR }) : "—",
                ].join(" → ");

                return (
                  <tr key={c.id} className="border-b hover:bg-gray-50 last:border-b-0">
                    <td className="p-3 font-medium text-gray-800">{c.code}</td>
                    <td className="p-3 text-gray-700">{c.municipality?.name}</td>
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
                          {typeof c.daysToEnd === "number" && <span className="opacity-80 ml-1">({c.daysToEnd}d)</span>}
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
