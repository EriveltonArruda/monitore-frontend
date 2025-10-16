// src/components/travel/TravelAdvanceModal.tsx
"use client";

import React, { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

type Props = {
  expenseId: number;
  currency?: string | null;
  onClose: () => void;
  onSaved?: () => void;
};

// Aceita "50,00", "50.00" e "1.234,56"
function parseAmountBR(raw: string): number {
  const s = String(raw).trim();
  if (!s) return NaN;
  const normalized = s.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

export function TravelAdvanceModal({
  expenseId,
  currency = "BRL",
  onClose,
  onSaved,
}: Props) {
  const [amount, setAmount] = useState<string>("");
  const [issuedAt, setIssuedAt] = useState<string>("");
  const [method, setMethod] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const value = parseAmountBR(amount);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("Informe um valor de adiantamento válido e maior que zero.");
      }

      const payload = {
        amount: value,
        issuedAt: issuedAt || undefined,
        method: method || undefined,
        notes: notes || undefined,
      };

      const res = await fetch(`${API_BASE}/travel-expenses/${expenseId}/advances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.message
            ? Array.isArray(err.message)
              ? err.message.join("\n")
              : String(err.message)
            : "Falha ao registrar adiantamento"
        );
      }

      onSaved?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Erro inesperado ao registrar adiantamento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Registrar Adiantamento</h2>
          <p className="text-sm text-gray-500">
            Informe o valor e, opcionalmente, a data/método/observações.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {errorMsg && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Valor ({currency})
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex.: 500,00"
                inputMode="decimal"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Data do Adiantamento
              </label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Método</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="Ex.: Dinheiro, Pix, Cartão corporativo..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">
                Observações
              </label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 min-h-[90px] resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: Adiantamento para combustível e alimentação"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Salvando..." : "Salvar Adiantamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
