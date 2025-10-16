// src/components/travel/TravelReimbursementModal.tsx
"use client";

import React, { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

type Props = {
  expenseId: number;
  currency?: string | null;
  maxAmount?: number;            // valor máximo permitido (ex.: total - adiantado - reembolsado)
  onClose: () => void;
  onSaved?: () => void;          // callback para atualizar a listagem após salvar
};

// Aceita "50,00", "50.00" e "1.234,56"
function parseAmountBR(raw: string): number {
  const s = String(raw).trim();
  if (!s) return NaN;
  // remove separadores de milhar ".", troca vírgula por ponto
  const normalized = s.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

export function TravelReimbursementModal({
  expenseId,
  currency = "BRL",
  maxAmount,
  onClose,
  onSaved,
}: Props) {
  const [amount, setAmount] = useState<string>("");
  const [reimbursedAt, setReimbursedAt] = useState<string>("");
  const [bankAccount, setBankAccount] = useState<string>("");
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
        throw new Error("Informe um valor de reembolso válido e maior que zero.");
      }
      if (typeof maxAmount === "number" && value > maxAmount) {
        throw new Error(
          `Valor excede o restante a reembolsar (restante: ${maxAmount.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}).`
        );
      }

      const payload = {
        amount: value,
        reimbursedAt: reimbursedAt || undefined,
        bankAccount: bankAccount || undefined,
        notes: notes || undefined,
      };

      const res = await fetch(`${API_BASE}/travel-expenses/${expenseId}/reimbursements`, {
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
            : "Falha ao registrar reembolso"
        );
      }

      onSaved?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Erro inesperado ao registrar reembolso.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Registrar Reembolso</h2>
          <p className="text-sm text-gray-500">
            Informe o valor e, opcionalmente, a data/conta/observações.
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
              <label className="block text-sm text-gray-600 mb-1">Valor ({currency})</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex.: 50,00"
                inputMode="decimal"
              />
              {typeof maxAmount === "number" && (
                <p className="mt-1 text-xs text-gray-500">
                  Restante:{" "}
                  {maxAmount.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Data do Reembolso</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2"
                value={reimbursedAt}
                onChange={(e) => setReimbursedAt(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Conta Bancária</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Ex.: Banco 001 - Ag 123 - CC 456"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Observações</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 min-h-[90px] resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: Reembolso parcial referente ao táxi"
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
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Salvando..." : "Reembolsar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
