// src/components/travel/TravelExpensesFormModal.tsx
"use client";

import React, { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

type TravelExpense = {
  id: number;
  employeeName?: string | null;
  department?: string | null;
  description?: string | null;
  category?: string | null; // TRANSPORTE | HOSPEDAGEM | ALIMENTACAO | OUTROS
  city?: string | null;
  state?: string | null;
  expenseDate?: string | null; // yyyy-mm-dd
  currency?: string | null; // BRL
  amount: number; // em reais
  receiptUrl?: string | null;
  status: string; // PENDENTE | PARCIAL | REEMBOLSADO
};

type Props = {
  onClose: () => void;
  expenseToEdit?: TravelExpense;
  onSaved?: () => void;
};

// Aceita "50,00", "50.00" e "1.234,56"
function parseAmountBR(raw: string): number {
  const s = String(raw ?? "").trim();
  if (!s) return NaN;
  const normalized = s.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

export function TravelExpensesFormModal({ onClose, expenseToEdit, onSaved }: Props) {
  const [employeeName, setEmployeeName] = useState<string>(expenseToEdit?.employeeName ?? "");
  const [department, setDepartment] = useState<string>(expenseToEdit?.department ?? "");
  const [description, setDescription] = useState<string>(expenseToEdit?.description ?? "");
  const [category, setCategory] = useState<string>(expenseToEdit?.category ?? "OUTROS");
  const [city, setCity] = useState<string>(expenseToEdit?.city ?? "");
  const [stateUF, setStateUF] = useState<string>(expenseToEdit?.state ?? "");
  const [expenseDate, setExpenseDate] = useState<string>(() => {
    if (!expenseToEdit?.expenseDate) return "";
    const d = new Date(expenseToEdit.expenseDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [currency, setCurrency] = useState<string>(expenseToEdit?.currency ?? "BRL");
  const [amount, setAmount] = useState<string>(
    expenseToEdit ? String(expenseToEdit.amount.toFixed(2)).replace(".", ",") : ""
  );
  const [receiptUrl, setReceiptUrl] = useState<string>(expenseToEdit?.receiptUrl ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!expenseToEdit) return;
    setEmployeeName(expenseToEdit.employeeName ?? "");
    setDepartment(expenseToEdit.department ?? "");
    setDescription(expenseToEdit.description ?? "");
    setCategory(expenseToEdit.category ?? "OUTROS");
    setCity(expenseToEdit.city ?? "");
    setStateUF(expenseToEdit.state ?? "");
    if (expenseToEdit.expenseDate) {
      const d = new Date(expenseToEdit.expenseDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setExpenseDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setExpenseDate("");
    }
    setCurrency(expenseToEdit.currency ?? "BRL");
    setAmount(String(expenseToEdit.amount.toFixed(2)).replace(".", ",")); // mostra com vírgula
    setReceiptUrl(expenseToEdit.receiptUrl ?? "");
  }, [expenseToEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const isEdit = !!expenseToEdit?.id;

      // No create, amount é obrigatório; no edit, só envia se o usuário preencheu algo.
      const parsedAmount = amount ? parseAmountBR(amount) : NaN;
      if (!isEdit && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) {
        throw new Error("Informe um valor válido (ex.: 123,45).");
      }

      const payload: any = {
        employeeName: employeeName || undefined,
        department: department || undefined,
        description: description || undefined,
        category: category || undefined,
        city: city || undefined,
        state: stateUF ? stateUF.toUpperCase() : undefined,
        expenseDate: expenseDate || undefined,
        currency: currency ? currency.toUpperCase() : undefined,
        amount: Number.isFinite(parsedAmount) ? parsedAmount : undefined,
        receiptUrl: receiptUrl || undefined,
      };

      const url = isEdit
        ? `${API_BASE}/travel-expenses/${expenseToEdit!.id}`
        : `${API_BASE}/travel-expenses`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
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
            : "Falha ao salvar a despesa"
        );
      }

      onSaved?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Erro inesperado ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            {expenseToEdit ? "Editar Despesa" : "Nova Despesa"}
          </h2>
          <p className="text-sm text-gray-500">
            {expenseToEdit
              ? "Atualize os campos e salve para editar a despesa."
              : "Preencha os campos e salve para criar a despesa."}
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
              <label className="block text-sm text-gray-600 mb-1">Funcionário</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Nome"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Departamento</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ex.: Comercial"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Descrição</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 min-h-[100px] resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Táxi aeroporto → hotel"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Categoria</label>
              <select
                title="Categoria da despesa"
                className="w-full border rounded-lg px-3 py-2"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="TRANSPORTE">Transporte</option>
                <option value="HOSPEDAGEM">Hospedagem</option>
                <option value="ALIMENTACAO">Alimentação</option>
                <option value="OUTROS">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Data</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Cidade</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex.: Recife"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">UF</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={stateUF}
                onChange={(e) => setStateUF(e.target.value)}
                placeholder="Ex.: PE"
                maxLength={2}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Moeda</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="BRL"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Valor</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex.: 123,45"
                inputMode="decimal"
                required={!expenseToEdit} // obrigatório no create
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Comprovante (URL)</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                placeholder="https://..."
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
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Salvando..." : expenseToEdit ? "Salvar alterações" : "Criar despesa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
