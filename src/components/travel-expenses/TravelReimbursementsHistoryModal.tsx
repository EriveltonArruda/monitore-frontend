// src/components/travel/TravelReimbursementsHistoryModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { DeleteConfirmationModal } from "../DeleteConfirmationModal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

type Reimbursement = {
  id: number;
  amount: number;            // <- vem em reais do backend
  reimbursedAt: string;
  bankAccount?: string | null;
  notes?: string | null;
  createdAt: string;
};

type Props = {
  expenseId: number;
  currency?: string | null;
  onClose: () => void;
  onChanged?: () => void; // chamar depois de excluir para atualizar a lista pai
};

function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function TravelReimbursementsHistoryModal({
  expenseId,
  currency = "BRL",
  onClose,
  onChanged,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Reimbursement[]>([]);
  const [error, setError] = useState<string | null>(null);

  // delete
  const [deleting, setDeleting] = useState(false);
  const [toDelete, setToDelete] = useState<Reimbursement | null>(null);

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/travel-expenses/${expenseId}/reimbursements`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Falha ao carregar reembolsos");
      const j = await res.json();
      setList(j ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseId]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      const res = await fetch(
        `${API_BASE}/travel-expenses/${expenseId}/reimbursements/${toDelete.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.message
            ? Array.isArray(err.message) ? err.message.join("\n") : String(err.message)
            : "Falha ao excluir reembolso"
        );
      }
      setToDelete(null);
      await fetchList();
      onChanged?.();
    } catch (e: any) {
      alert(e?.message ?? "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Histórico de Reembolsos</h2>
            <p className="text-sm text-gray-500">Visualize ou exclua reembolsos desta despesa.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Fechar</button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="py-10 text-center text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={18} /> Carregando...
            </div>
          ) : error ? (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
          ) : list.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Nenhum reembolso cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="text-left border-b-2 border-gray-100">
                  <tr>
                    <th className="p-3 font-semibold text-gray-600">Valor ({currency})</th>
                    <th className="p-3 font-semibold text-gray-600">Data</th>
                    <th className="p-3 font-semibold text-gray-600">Conta Bancária</th>
                    <th className="p-3 font-semibold text-gray-600">Observações</th>
                    <th className="p-3 font-semibold text-gray-600 w-20">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="p-3">
                        <span className="text-gray-800">{formatBRL(r.amount)}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-600">
                          {r.reimbursedAt ? new Date(r.reimbursedAt).toLocaleDateString() : "-"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-600">{r.bankAccount || "-"}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-600">{r.notes || "-"}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            className="text-red-600 hover:text-red-700"
                            title="Excluir"
                            onClick={() => setToDelete(r)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toDelete && (
        <DeleteConfirmationModal
          itemName={`Reembolso de ${formatBRL(toDelete.amount)}`}
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
          isDeleting={deleting}
        />
      )}
    </div>
  );
}
