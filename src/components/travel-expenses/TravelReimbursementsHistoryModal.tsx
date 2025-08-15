"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Save, X, Loader2 } from "lucide-react";
import { DeleteConfirmationModal } from "../DeleteConfirmationModal";

type Reimbursement = {
  id: number;
  amountCents: number;
  reimbursedAt: string;
  bankAccount?: string | null;
  notes?: string | null;
  createdAt: string;
};

type Props = {
  expenseId: number;
  currency?: string | null;
  onClose: () => void;
  onChanged?: () => void; // chamar depois de editar/excluir para atualizar a lista pai
};

// Aceita "50,00", "50.00" e "1.234,56"
function parseAmountBR(raw: string): number {
  const s = String(raw).trim();
  if (!s) return NaN;
  const normalized = s.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

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

  // edição inline
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const [editBank, setEditBank] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");

  const [saving, setSaving] = useState(false);

  // delete
  const [deleting, setDeleting] = useState(false);
  const [toDelete, setToDelete] = useState<Reimbursement | null>(null);

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3001/travel-expenses/${expenseId}/reimbursements`, {
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

  // abrir edição
  const startEdit = (r: Reimbursement) => {
    setEditingId(r.id);
    setEditAmount((r.amountCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setEditDate(r.reimbursedAt ? r.reimbursedAt.substring(0, 10) : "");
    setEditBank(r.bankAccount ?? "");
    setEditNotes(r.notes ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount("");
    setEditDate("");
    setEditBank("");
    setEditNotes("");
  };

  const saveEdit = async () => {
    if (editingId == null) return;
    try {
      setSaving(true);
      const value = parseAmountBR(editAmount);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("Informe um valor válido e maior que zero.");
      }

      const payload: any = {
        amount: value,
        reimbursedAt: editDate || undefined,
        bankAccount: editBank || undefined,
        notes: editNotes || undefined,
      };

      const res = await fetch(
        `http://localhost:3001/travel-expenses/${expenseId}/reimbursements/${editingId}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.message
            ? Array.isArray(err.message) ? err.message.join("\n") : String(err.message)
            : "Falha ao atualizar reembolso"
        );
      }

      await fetchList();
      onChanged?.();
      cancelEdit();
    } catch (e: any) {
      alert(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      const res = await fetch(
        `http://localhost:3001/travel-expenses/${expenseId}/reimbursements/${toDelete.id}`,
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
            <p className="text-sm text-gray-500">Edite ou exclua reembolsos desta despesa.</p>
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
                    <th className="p-3 font-semibold text-gray-600 w-28">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => {
                    const isEditing = editingId === r.id;
                    const amount = r.amountCents / 100;
                    return (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              className="border rounded-lg px-2 py-1 w-32"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              placeholder="Ex.: 50,00"
                              inputMode="decimal"
                            />
                          ) : (
                            <span className="text-gray-800">{formatBRL(amount)}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="date"
                              className="border rounded-lg px-2 py-1"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                            />
                          ) : (
                            <span className="text-gray-600">
                              {r.reimbursedAt ? new Date(r.reimbursedAt).toLocaleDateString() : "-"}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              className="border rounded-lg px-2 py-1 w-full"
                              value={editBank}
                              onChange={(e) => setEditBank(e.target.value)}
                              placeholder="Banco / Agência / Conta"
                            />
                          ) : (
                            <span className="text-gray-600">{r.bankAccount || "-"}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <textarea
                              className="border rounded-lg px-2 py-1 w-full min-h-[60px]"
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Observações"
                            />
                          ) : (
                            <span className="text-gray-600">{r.notes || "-"}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  className="text-green-600 hover:text-green-700"
                                  title="Salvar"
                                  onClick={saveEdit}
                                  disabled={saving}
                                >
                                  <Save size={18} />
                                </button>
                                <button
                                  className="text-gray-500 hover:text-gray-700"
                                  title="Cancelar"
                                  onClick={cancelEdit}
                                  disabled={saving}
                                >
                                  <X size={18} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="text-blue-600 hover:text-blue-700"
                                  title="Editar"
                                  onClick={() => startEdit(r)}
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-700"
                                  title="Excluir"
                                  onClick={() => setToDelete(r)}
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toDelete && (
        <DeleteConfirmationModal
          itemName={`Reembolso de ${formatBRL(toDelete.amountCents / 100)}`}
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
          isDeleting={deleting}
        />
      )}
    </div>
  );
}
