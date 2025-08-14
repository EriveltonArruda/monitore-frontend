"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlusCircle, Pencil, Trash2, DollarSign } from "lucide-react";
import { Pagination } from "../Pagination"; // mesmo padrão do AccountsPayableClient
import { TravelExpensesFormModal } from "./TravelExpensesFormModal";
import { TravelReimbursementModal } from "./TravelReimbursementModal";
import { DeleteConfirmationModal } from "../DeleteConfirmationModal";

type TravelExpense = {
  id: number;
  employeeName?: string | null;
  department?: string | null;
  description?: string | null;
  category?: string | null;
  city?: string | null;
  state?: string | null;
  expenseDate?: string | null;
  currency?: string | null;
  amount: number;
  reimbursedAmount: number;
  status: string;
};

// Helper: só a primeira letra maiúscula
function capitalizeFirst(str?: string | null) {
  if (!str) return "-";
  const lower = String(str).toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default function TravelExpensesPageClient({
  initialData,
}: {
  initialData: { data: TravelExpense[]; total: number };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // dados
  const [data, setData] = useState<TravelExpense[]>(initialData.data ?? []);
  const [total, setTotal] = useState<number>(initialData.total ?? 0);

  // paginação (igual contas a pagar)
  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  // filtros
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const category = searchParams.get("category") || "";
  const month = searchParams.get("month") || "";
  const year = searchParams.get("year") || "";

  // modais (form / edição)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TravelExpense | null>(null);

  // modal de reembolso
  const [reimbExpense, setReimbExpense] = useState<TravelExpense | null>(null);

  // modal de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<TravelExpense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function refresh() {
    const params = new URLSearchParams(searchParams as any);
    if (!params.get("page")) params.set("page", "1");
    if (!params.get("pageSize")) params.set("pageSize", String(pageSize));

    const r = await fetch(`/api/travel-expenses?${params.toString()}`, {
      cache: "no-store",
    });
    const j = await r.json();
    setData(j.data ?? []);
    setTotal(j.total ?? 0);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // helpers
  const updateQuery = (mut: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(searchParams.toString());
    mut(p);
    router.push(`?${p.toString()}`);
  };

  // filtros
  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const v = (e.target as HTMLInputElement).value;
    updateQuery((p) => {
      v && v.trim() !== "" ? p.set("search", v) : p.delete("search");
      p.set("page", "1");
      if (!p.get("pageSize")) p.set("pageSize", String(pageSize));
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateQuery((p) => {
      e.target.value ? p.set("status", e.target.value) : p.delete("status");
      p.set("page", "1");
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateQuery((p) => {
      e.target.value ? p.set("category", e.target.value) : p.delete("category");
      p.set("page", "1");
    });
  };

  const handleMonthBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value;
    updateQuery((p) => {
      val ? p.set("month", val) : p.delete("month");
      p.set("page", "1");
    });
  };

  const handleYearBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value;
    updateQuery((p) => {
      val ? p.set("year", val) : p.delete("year");
      p.set("page", "1");
    });
  };

  // paginação
  const onPageChange = (next: number) => {
    updateQuery((p) => {
      p.set("page", String(next));
      if (!p.get("pageSize")) p.set("pageSize", String(pageSize));
    });
  };

  // ====== modal handlers ======
  const openCreate = () => {
    setEditingExpense(null);
    setIsFormModalOpen(true);
  };
  const openEdit = (exp: TravelExpense) => {
    setEditingExpense(exp);
    setIsFormModalOpen(true);
  };
  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingExpense(null);
  };

  const openReimburse = (exp: TravelExpense) => {
    setReimbExpense(exp);
  };
  const closeReimburse = () => {
    setReimbExpense(null);
  };

  // exclusão
  const openDelete = (exp: TravelExpense) => {
    setExpenseToDelete(exp);
    setShowDeleteModal(true);
  };
  const closeDelete = () => {
    setShowDeleteModal(false);
    setExpenseToDelete(null);
  };
  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      // chama diretamente o backend (igual a outros pontos do projeto)
      const res = await fetch(`http://localhost:3001/travel-expenses/${expenseToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.message
            ? Array.isArray(err.message) ? err.message.join("\n") : String(err.message)
            : "Falha ao excluir a despesa"
        );
      }
      closeDelete();
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "Erro ao excluir a despesa.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Modal de formulário (novo/edição) */}
      {isFormModalOpen && (
        <TravelExpensesFormModal
          onClose={closeFormModal}
          expenseToEdit={editingExpense ?? undefined}
          onSaved={() => {
            closeFormModal();
            refresh();
          }}
        />
      )}

      {/* Modal de reembolso */}
      {reimbExpense && (
        <TravelReimbursementModal
          expenseId={reimbExpense.id}
          currency={reimbExpense.currency ?? "BRL"}
          maxAmount={Math.max(0, (reimbExpense.amount ?? 0) - (reimbExpense.reimbursedAmount ?? 0))}
          onClose={closeReimburse}
          onSaved={() => {
            closeReimburse();
            refresh();
          }}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && expenseToDelete && (
        <DeleteConfirmationModal
          itemName={expenseToDelete.employeeName || expenseToDelete.description || `Despesa #${expenseToDelete.id}`}
          onConfirm={confirmDelete}
          onClose={closeDelete}
          isDeleting={isDeleting}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Despesas de Viagem</h1>
            <p className="text-sm text-gray-500">
              Gerencie suas despesas de viagem e reembolsos
            </p>
          </div>
          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <PlusCircle size={20} />
            <span>Nova Despesa</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar..."
            defaultValue={search}
            onKeyDown={handleSearchKey}
            className="border rounded-lg px-3 py-2 w-56"
            title="Buscar por funcionário/descrição/cidade"
          />

          <input
            type="number"
            placeholder="Mês"
            defaultValue={month}
            onBlur={handleMonthBlur}
            className="border rounded-lg px-3 py-2 w-32"
            title="Filtrar por mês (1-12)"
          />

          <input
            type="number"
            placeholder="Ano"
            defaultValue={year}
            onBlur={handleYearBlur}
            className="border rounded-lg px-3 py-2 w-32"
            title="Filtrar por ano (ex.: 2025)"
          />

          <select
            title="Selecione o status"
            defaultValue={status}
            onChange={handleStatusChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos os Status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="PARCIAL">Parcial</option>
            <option value="REEMBOLSADO">Reembolsado</option>
          </select>

          <select
            title="Selecione a categoria"
            defaultValue={category}
            onChange={handleCategoryChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todas as Categorias</option>
            <option value="TRANSPORTE">Transporte</option>
            <option value="HOSPEDAGEM">Hospedagem</option>
            <option value="ALIMENTACAO">Alimentação</option>
            <option value="OUTROS">Outros</option>
          </select>
        </div>

        {/* Tabela */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <table className="w-full table-auto">
            <thead className="text-left border-b-2 border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Funcionário</th>
                <th className="p-4 font-semibold text-gray-600">Categoria</th>
                <th className="p-4 font-semibold text-gray-600">Data</th>
                <th className="p-4 font-semibold text-gray-600">Local</th>
                <th className="p-4 font-semibold text-gray-600">Valor</th>
                <th className="p-4 font-semibold text-gray-600">Reembolsado</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 w-40">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((exp) => {
                const statusClass =
                  exp.status === "REEMBOLSADO"
                    ? "bg-green-100 text-green-700"
                    : exp.status === "PARCIAL"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700";

                const categoryClass =
                  exp.category === "TRANSPORTE"
                    ? "bg-indigo-100 text-indigo-700"
                    : exp.category === "HOSPEDAGEM"
                      ? "bg-purple-100 text-purple-700"
                      : exp.category === "ALIMENTACAO"
                        ? "bg-pink-100 text-pink-700"
                        : "bg-gray-100 text-gray-700";

                return (
                  <tr key={exp.id} className="border-b hover:bg-gray-50 last:border-b-0">
                    <td className="p-4 font-medium text-gray-800">
                      {exp.employeeName ?? "-"}
                      {exp.description && (
                        <span className="ml-2 text-xs text-gray-500">
                          • {exp.description}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${categoryClass}`}
                      >
                        {capitalizeFirst(exp.category || "outros")}
                      </span>
                    </td>

                    <td className="p-4 text-gray-600">
                      {exp.expenseDate
                        ? new Date(exp.expenseDate).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="p-4 text-gray-600">
                      {[exp.city, exp.state].filter(Boolean).join(" / ") || "-"}
                    </td>

                    <td className="p-4 text-gray-600">
                      {(exp.currency ?? "BRL")}{" "}
                      {exp.amount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="p-4 text-gray-600">
                      {(exp.currency ?? "BRL")}{" "}
                      {exp.reimbursedAmount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex w-fit items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusClass}`}
                      >
                        {capitalizeFirst(exp.status)}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          className="text-gray-400 hover:text-green-600"
                          title="Registrar reembolso"
                          onClick={() => openReimburse(exp)}
                        >
                          <DollarSign size={18} />
                        </button>
                        <button
                          className="text-gray-400 hover:text-blue-600"
                          title="Editar"
                          onClick={() => openEdit(exp)}
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          className="text-gray-400 hover:text-red-600"
                          title="Excluir"
                          onClick={() => openDelete(exp)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Nenhuma despesa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* paginação idêntica ao contas a pagar */}
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
