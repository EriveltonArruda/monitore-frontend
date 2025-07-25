"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type AccountPayable = {
  id: number;
  name: string;
  category: string;
  value: number;
  dueDate: string;
  status: string;
  installmentType?: string;
  installments?: number | null;
  currentInstallment?: number | null;
  isRecurring?: boolean;
  recurringUntil?: string | null;
};

type AccountFormModalProps = {
  onClose: () => void;
  accountToEdit?: AccountPayable | null;
};

export function AccountFormModal({
  onClose,
  accountToEdit,
}: AccountFormModalProps) {
  const router = useRouter();
  const isEditMode = Boolean(accountToEdit);

  // Estado do formulário com todos os campos, inclusive os de recorrência
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    value: 0,
    dueDate: "",
    status: "A_PAGAR",
    installmentType: "UNICA",
    installments: "",
    currentInstallment: "",
    manualPaymentAmount: "",
    manualBankAccount: "",
    paidAt: "",
    isRecurring: false,
    recurringUntil: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preenche os campos no modo de edição
  useEffect(() => {
    if (isEditMode && accountToEdit) {
      setFormData((prev) => ({
        ...prev,
        name: accountToEdit.name || "",
        category: accountToEdit.category || "",
        value: accountToEdit.value || 0,
        dueDate: accountToEdit.dueDate
          ? format(new Date(accountToEdit.dueDate), "yyyy-MM-dd")
          : "",
        status: accountToEdit.status || "A_PAGAR",
        installmentType: accountToEdit.installmentType || "UNICA",
        installments: accountToEdit.installments?.toString() || "",
        currentInstallment: accountToEdit.currentInstallment?.toString() || "",
        isRecurring: accountToEdit.isRecurring || false,
        recurringUntil: accountToEdit.recurringUntil
          ? format(new Date(accountToEdit.recurringUntil), "yyyy-MM-dd")
          : "",
      }));
    }
  }, [isEditMode, accountToEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value, type } = e.target;

    // Se for checkbox, fazemos uma verificação de tipo (type guard)
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [id]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [id]: value,
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const dataToSend: any = {
      name: formData.name,
      category: formData.category,
      value: parseFloat(String(formData.value)),
      dueDate: new Date(formData.dueDate + "T00:00:00"),
      status: formData.status,
      installmentType: formData.installmentType,
      installments:
        formData.installmentType === "PARCELADO"
          ? parseInt(formData.installments)
          : null,
      currentInstallment:
        formData.installmentType === "PARCELADO"
          ? parseInt(formData.currentInstallment)
          : null,
      isRecurring: formData.isRecurring,
      recurringUntil: formData.isRecurring && formData.recurringUntil
        ? new Date(formData.recurringUntil + "T00:00:00")
        : null,
    };

    try {
      let response;

      if (isEditMode) {
        const url = `http://localhost:3001/accounts-payable/${accountToEdit!.id}`;
        response = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        });

        const amount = parseFloat(formData.manualPaymentAmount);
        if (!isNaN(amount) && amount > 0) {
          const paidAt =
            formData.paidAt && !isNaN(new Date(formData.paidAt).getTime())
              ? new Date(formData.paidAt)
              : new Date();

          await fetch("http://localhost:3001/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accountId: accountToEdit!.id,
              paidAt,
              amount,
              bankAccount: formData.manualBankAccount || null,
            }),
          });
        }
      } else {
        const url = "http://localhost:3001/accounts-payable";
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        });

        const result = await response.json();

        const amount = parseFloat(formData.manualPaymentAmount);
        if ((!isNaN(amount) && amount > 0) || formData.status === "PAGO") {
          const paidAt =
            formData.paidAt && !isNaN(new Date(formData.paidAt).getTime())
              ? new Date(formData.paidAt)
              : new Date();

          await fetch("http://localhost:3001/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accountId: result.id,
              paidAt,
              amount: isNaN(amount) || amount <= 0 ? formData.value : amount,
              bankAccount: formData.manualBankAccount || null,
            }),
          });
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao salvar conta.");
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">
            {isEditMode ? "Editar Conta" : "Nova Conta a Pagar"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Campos principais */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nome da Conta *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border rounded-md p-2"
            />
          </div>

          {/* Valor e Categoria */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">
                Categoria *
              </label>
              <input
                type="text"
                id="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label htmlFor="value" className="block text-sm font-medium mb-1">
                Valor *
              </label>
              <input
                type="number"
                step="0.01"
                id="value"
                value={formData.value}
                onChange={handleChange}
                required
                className="w-full border rounded-md p-2"
              />
            </div>
          </div>

          {/* Vencimento e Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium mb-1">
                Data de Vencimento *
              </label>
              <input
                type="date"
                id="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
                className="w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border rounded-md p-2 bg-white"
              >
                <option value="A_PAGAR">A Pagar</option>
                <option value="PAGO">Pago</option>
                <option value="VENCIDO">Vencido</option>
              </select>
            </div>
          </div>

          {/* Parcelamento */}
          <div>
            <label htmlFor="installmentType" className="block text-sm font-medium mb-1">
              Tipo de Parcela
            </label>
            <select
              id="installmentType"
              value={formData.installmentType}
              onChange={handleChange}
              className="w-full border rounded-md p-2 bg-white"
            >
              <option value="UNICA">Parcela única</option>
              <option value="PARCELADO">Parcelado</option>
            </select>
          </div>

          {formData.installmentType === "PARCELADO" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="currentInstallment" className="block text-sm font-medium mb-1">
                  Parcela Atual
                </label>
                <input
                  type="number"
                  id="currentInstallment"
                  value={formData.currentInstallment}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label htmlFor="installments" className="block text-sm font-medium mb-1">
                  Total de Parcelas
                </label>
                <input
                  type="number"
                  id="installments"
                  value={formData.installments}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>
            </div>
          )}

          {/* Repetição mensal */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={handleChange}
            />
            <label htmlFor="isRecurring" className="text-sm font-medium">
              Repetir mensalmente
            </label>
          </div>

          {formData.isRecurring && (
            <div>
              <label htmlFor="recurringUntil" className="block text-sm font-medium mb-1">
                Repetir até
              </label>
              <input
                type="date"
                id="recurringUntil"
                value={formData.recurringUntil}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
              />
            </div>
          )}

          {/* Pagamento manual */}
          {(formData.status === "A_PAGAR" || isEditMode) && (
            <>
              <div>
                <label htmlFor="manualPaymentAmount" className="block text-sm font-medium mb-1">
                  Valor do Pagamento (manual)
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="manualPaymentAmount"
                  value={formData.manualPaymentAmount}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  placeholder="Ex: 50.00"
                />
              </div>

              <div>
                <label htmlFor="manualBankAccount" className="block text-sm font-medium mb-1">
                  Conta Bancária Usada
                </label>
                <input
                  type="text"
                  id="manualBankAccount"
                  value={formData.manualBankAccount}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  placeholder="Ex: Banco do Brasil - Conta 12345-6"
                />
              </div>
            </>
          )}

          {(formData.status === "PAGO" || parseFloat(formData.manualPaymentAmount) > 0) && (
            <div>
              <label htmlFor="paidAt" className="block text-sm font-medium mb-1">
                Data e Hora do Pagamento
              </label>
              <input
                type="datetime-local"
                id="paidAt"
                value={formData.paidAt}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-4 pt-4 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2 px-4 border rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 bg-blue-600 text-white rounded-lg"
            >
              {isSubmitting ? "Salvando..." : "Salvar Conta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
