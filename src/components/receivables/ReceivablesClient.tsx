// src/app/dashboard/components/receivables/ReceivablesClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Calendar,
  FileSearch,
  Clock,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pagination } from "@/components/Pagination";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import ReceivablesFormModal from "./ReceivablesFormModal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

type Municipality = { id: number; name: string };
type Department = { id: number; name: string; municipalityId: number };
type Contract = { id: number; code: string };

type Receivable = {
  id: number;
  noteNumber: string | null;
  issueDate: string | null;
  grossAmount: number | null;
  netAmount: number | null;
  periodLabel: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  deliveryDate: string | null;
  receivedAt: string | null;
  status: "A_RECEBER" | "ATRASADO" | "RECEBIDO";
  contractId: number;
  contract: {
    id: number;
    code: string;
    municipalityId: number;
    departmentId: number | null;
    municipality?: { id: number; name: string };
    department?: { id: number; name: string; municipalityId: number };
  };
};

type Props = {
  initialReceivables: Receivable[];
  totalReceivables: number;
  page: number;
  totalPages: number;
  limit: number;
  municipalities: Municipality[];
};

const money = (v: number | null) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusClass: Record<Receivable["status"], string> = {
  A_RECEBER: "bg-amber-100 text-amber-700",
  ATRASADO: "bg-red-100 text-red-700",
  RECEBIDO: "bg-emerald-100 text-emerald-700",
};

const statusLabel: Record<Receivable["status"], string> = {
  A_RECEBER: "A Receber",
  ATRASADO: "Atrasado",
  RECEBIDO: "Recebido",
};

export default function ReceivablesClient(props: Props) {
  const {
    initialReceivables,
    totalReceivables,
    page,
    totalPages,
    municipalities,
  } = props;

  const router = useRouter();
  const searchParams = useSearchParams();

  const [rows] = useState<Receivable[]>(initialReceivables);

  // modal excluir
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Receivable | null>(null);

  // modal form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Receivable | null>(null);

  // filtros (querystring)
  const qSearch = searchParams.get("search") || "";
  const qMunicipalityId = searchParams.get("municipalityId") || "";
  const qDepartmentId = searchParams.get("departmentId") || "";
  const qStatus = searchParams.get("status") || "";
  const qIssueFrom = searchParams.get("issueFrom") || "";
  const qIssueTo = searchParams.get("issueTo") || "";
  const qOrderBy = searchParams.get("orderBy") || "issueDate";
  const qOrder = searchParams.get("order") || "desc";
  const currentPage = Number(searchParams.get("page") || page || 1);

  // órgãos dependentes do município
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
      const json = await res.json().catch(() => ({ data: [] }));
      setDepartments(json.data || []);
    };
    load();
  }, [qMunicipalityId]);

  // contratos dependentes do órgão (opcional — lista curta para pesquisa)
  const [contracts, setContracts] = useState<Contract[]>([]);
  const qContractId = searchParams.get("contractId") || "";
  useEffect(() => {
    const load = async () => {
      const qs = new URLSearchParams();
      if (qMunicipalityId) qs.set("municipalityId", qMunicipalityId);
      if (qDepartmentId) qs.set("departmentId", qDepartmentId);
      qs.set("limit", "9999");

      const res = await fetch(`${API_BASE}/contracts?${qs.toString()}`);
      const json = await res.json().catch(() => ({ data: [] }));
      const list: Receivable[] = json.data || [];
      // mapear {id, code}
      setContracts(list.map((c: any) => ({ id: c.id, code: c.code })));
    };
    load();
  }, [qMunicipalityId, qDepartmentId]);

  // navegação de filtros
  const setParam = (key: string, value?: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "") params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  // handlers filtros
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setParam("search", e.target.value);
  const handleMunicipality = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const val = e.target.value;
    if (val) params.set("municipalityId", val);
    else params.delete("municipalityId");
    // reset dependentes
    params.delete("departmentId");
    params.delete("contractId");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };
  const handleDepartment = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const val = e.target.value;
    if (val) params.set("departmentId", val);
    else params.delete("departmentId");
    // reset contrato
    params.delete("contractId");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };
  const handleContract = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setParam("contractId", e.target.value);
  const handleStatus = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setParam("status", e.target.value);
  const handleIssueFrom = (e: React.ChangeEvent<HTMLInputElement>) =>
    setParam("issueFrom", e.target.value);
  const handleIssueTo = (e: React.ChangeEvent<HTMLInputElement>) =>
    setParam("issueTo", e.target.value);
  const handleOrderBy = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setParam("orderBy", e.target.value);
  const handleOrder = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setParam("order", e.target.value);

  // options estáticas
  const statusOptions = [
    { value: "", label: "Todos" },
    { value: "A_RECEBER", label: "A Receber" },
    { value: "ATRASADO", label: "Atrasado" },
    { value: "RECEBIDO", label: "Recebido" },
  ];

  const orderByOptions = [
    { value: "issueDate", label: "Emissão" },
    { value: "receivedAt", label: "Recebimento" },
    { value: "grossAmount", label: "Valor Bruto" },
  ];

  const orderIcon =
    qOrder === "asc" ? <SortAsc size={14} /> : <SortDesc size={14} />;

  // ===== RENDER =====
  return (
    <>
      {/* Modal Form */}
      {isFormOpen && (
        <ReceivablesFormModal
          onClose={() => setIsFormOpen(false)}
          receivableToEdit={editing}
        />
      )}

      {/* Modal Delete */}
      {isDeleteOpen && deleting && (
        <DeleteConfirmationModal
          itemName={`${deleting.noteNumber ?? "Sem NF"} – ${deleting.contract?.code ?? ""}`}
          onConfirm={async () => {
            try {
              await fetch(`${API_BASE}/receivables/${deleting.id}`, {
                method: "DELETE",
              });
              setIsDeleteOpen(false);
              setDeleting(null);
              router.refresh();
            } catch {
              alert("Erro ao excluir recebível.");
            }
          }}
          onClose={() => {
            setIsDeleteOpen(false);
            setDeleting(null);
          }}
          isDeleting={false}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Recebidos</h1>
            <p className="text-sm text-gray-500">
              Notas / parcelas recebíveis por contrato
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setIsFormOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <PlusCircle size={20} />
            <span>Novo Recebido</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-3">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">
                Buscar (NF / período / código)
              </label>
              <input
                type="text"
                value={qSearch}
                onChange={handleSearch}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Ex.: NF-001 ou MAR/2025 ou CT 001/2025"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Município
              </label>
              <select
                value={qMunicipalityId}
                onChange={handleMunicipality}
                className="w-full border rounded-md px-3 py-2 bg-white"
                title="Município"
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
                value={qDepartmentId}
                onChange={handleDepartment}
                className="w-full border rounded-md px-3 py-2 bg-white"
                title="Órgão/Secretaria"
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
                Contrato
              </label>
              <select
                value={qContractId}
                onChange={handleContract}
                className="w-full border rounded-md px-3 py-2 bg-white"
                title="Contrato"
                disabled={!qDepartmentId && !qMunicipalityId}
              >
                <option value="">Todos</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Status
              </label>
              <select
                value={qStatus}
                onChange={handleStatus}
                className="w-full border rounded-md px-3 py-2 bg-white"
                title="Status"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Emissão de
              </label>
              <input
                type="date"
                value={qIssueFrom}
                onChange={handleIssueFrom}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Emissão até
              </label>
              <input
                type="date"
                value={qIssueTo}
                onChange={handleIssueTo}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Ordenar por
              </label>
              <select
                value={qOrderBy}
                onChange={handleOrderBy}
                className="w-full border rounded-md px-3 py-2 bg-white"
                title="Ordenar por"
              >
                {orderByOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Ordem
              </label>
              <select
                value={qOrder}
                onChange={handleOrder}
                className="w-full border rounded-md px-3 py-2 bg-white"
                title="Ordem"
              >
                <option value="asc">Ascendente</option>
                <option value="desc">Descendente</option>
              </select>
              <div className="mt-1 text-gray-400">{orderIcon}</div>
            </div>
          </div>
        </div>

        {/* Legenda de status */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" /> A
            Receber
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />{" "}
            Atrasado
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />{" "}
            Recebido
          </span>
          <span className="inline-flex items-center gap-1 text-gray-400 ml-2">
            <FileSearch size={14} />
            Passe o mouse no selo para detalhes
          </span>
        </div>

        {/* Tabela */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <table className="w-full table-auto">
            <thead className="text-left border-b-2 border-gray-100">
              <tr>
                <th className="p-3 font-semibold text-gray-600">Contrato</th>
                <th className="p-3 font-semibold text-gray-600">NF</th>
                <th className="p-3 font-semibold text-gray-600">Período</th>
                <th className="p-3 font-semibold text-gray-600">Emissão</th>
                <th className="p-3 font-semibold text-gray-600">Valor Líquido</th>
                <th className="p-3 font-semibold text-gray-600">Status</th>
                <th className="p-3 font-semibold text-gray-600 w-32">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const period =
                  r.periodStart || r.periodEnd
                    ? [
                      r.periodStart
                        ? format(new Date(r.periodStart), "dd/MM/yyyy", {
                          locale: ptBR,
                        })
                        : "—",
                      r.periodEnd
                        ? format(new Date(r.periodEnd), "dd/MM/yyyy", {
                          locale: ptBR,
                        })
                        : "—",
                    ].join(" → ")
                    : r.periodLabel || "—";

                const issue = r.issueDate
                  ? format(new Date(r.issueDate), "dd/MM/yyyy", { locale: ptBR })
                  : "—";

                const receivedInfo =
                  r.receivedAt &&
                  `Recebido em ${format(new Date(r.receivedAt), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}`;

                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50 last:border-b-0">
                    <td className="p-3 text-gray-700">{r.contract?.code}</td>
                    <td className="p-3 text-gray-700">{r.noteNumber ?? "—"}</td>
                    <td className="p-3 text-gray-700">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} className="text-gray-400" />
                        {period}
                      </div>
                    </td>
                    <td className="p-3 text-gray-700">{issue}</td>
                    <td className="p-3 text-gray-700">{money(r.netAmount)}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${statusClass[r.status]}`}
                        title={receivedInfo || statusLabel[r.status]}
                        aria-label={receivedInfo || statusLabel[r.status]}
                      >
                        <Clock size={12} />
                        {statusLabel[r.status]}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditing(r);
                            setIsFormOpen(true);
                          }}
                          className="text-gray-400 hover:text-blue-600"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleting(r);
                            setIsDeleteOpen(true);
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

              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    Nenhum recebido encontrado com os filtros atuais.
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
