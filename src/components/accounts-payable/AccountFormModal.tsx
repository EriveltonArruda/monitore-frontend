"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

// Tipagem da conta para edição (opcional)
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

  // Estado de todos os campos do formulário
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

  // Guarda os valores anteriores de recorrência para restaurar caso o usuário alterne entre tipos de parcela
  const [prevRecurring, setPrevRecurring] = useState(false);
  const [prevRecurringUntil, setPrevRecurringUntil] = useState("");

  // Preenche o formulário no modo de edição e armazena valores de recorrência originais
  useEffect(() => {
    if (isEditMode && accountToEdit) {
      setFormData((prev) => ({
        ...prev,
        name: accountToEdit.name,
        category: accountToEdit.category,
        value: accountToEdit.value,
        dueDate: format(new Date(accountToEdit.dueDate), "yyyy-MM-dd"),
        status: accountToEdit.status,
        installmentType: accountToEdit.installmentType || "UNICA",
        installments: accountToEdit.installments?.toString() || "",
        currentInstallment: accountToEdit.currentInstallment?.toString() || "",
        isRecurring: accountToEdit.isRecurring || false,
        recurringUntil: accountToEdit.recurringUntil
          ? format(new Date(accountToEdit.recurringUntil), "yyyy-MM-dd")
          : "",
      }));
      setPrevRecurring(accountToEdit.isRecurring || false);
      setPrevRecurringUntil(
        accountToEdit.recurringUntil
          ? format(new Date(accountToEdit.recurringUntil), "yyyy-MM-dd")
          : ""
      );
    }
  }, [isEditMode, accountToEdit]);

  // Controla o comportamento do campo de recorrência conforme o tipo de parcela
  useEffect(() => {
    if (formData.installmentType === "PARCELADO") {
      // Ao selecionar Parcelado, limpa os campos de recorrência
      setPrevRecurring(formData.isRecurring);
      setPrevRecurringUntil(formData.recurringUntil);
      setFormData((prev) => ({
        ...prev,
        isRecurring: false,
        recurringUntil: "",
      }));
    }
    if (formData.installmentType === "UNICA") {
      // Ao voltar para Única, restaura os valores salvos
      setFormData((prev) => ({
        ...prev,
        isRecurring: prevRecurring,
        recurringUntil: prevRecurringUntil,
      }));
    }
    // eslint-disable-next-line
  }, [formData.installmentType]);

  // Handler para inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [id]: checked });
    } else {
      setFormData({ ...formData, [id]: value });
    }
  };

  // Handler de envio do formulário
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Monta payload base
    const dataToSend: any = {
      name: formData.name,
      category: formData.category,
      value: parseFloat(String(formData.value)),
      dueDate: new Date(formData.dueDate + "T00:00:00"),
      status: formData.status, // ALTERADO: garantimos enviar sempre o status escolhido
      installmentType: formData.installmentType,
      installments:
        formData.installmentType === "PARCELADO"
          ? parseInt(formData.installments)
          : null,
      currentInstallment:
        formData.installmentType === "PARCELADO"
          ? parseInt(formData.currentInstallment)
          : null,
      // ALTERADO: recorrência só vale quando UNICA
      isRecurring: formData.installmentType === "UNICA" ? formData.isRecurring : false,
      recurringUntil:
        formData.installmentType === "UNICA" &&
          formData.isRecurring &&
          formData.recurringUntil
          ? new Date(formData.recurringUntil + "T00:00:00")
          : null,
    };

    // Normaliza valor manual (se houver)
    const rawAmount = (formData.manualPaymentAmount || "").toString().replace(",", ".");
    const manual = parseFloat(rawAmount);

    // ALTERADO: Regras de envio de pagamento
    // - Se status = A_PAGAR e tiver valor manual > 0 => manda paymentAmount (pagamento parcial)
    // - Se status = PAGO e NÃO tiver valor manual => NÃO manda paymentAmount (backend quita o restante no update)
    // - Se status = VENCIDO => não manda paymentAmount
    if (formData.status === "A_PAGAR" && !isNaN(manual) && manual > 0) {
      dataToSend.paymentAmount = rawAmount; // envia string; backend normaliza
      dataToSend.bankAccount = formData.manualBankAccount || null;
      dataToSend.paidAt =
        formData.paidAt && !isNaN(new Date(formData.paidAt).getTime())
          ? new Date(formData.paidAt)
          : new Date();
    } else if (formData.status === "PAGO") {
      // Sem paymentAmount aqui: backend trata quitação no update se trocou para PAGO
      if (formData.paidAt) dataToSend.paidAt = new Date(formData.paidAt);
      if (formData.manualBankAccount)
        dataToSend.bankAccount = formData.manualBankAccount;
    }
    // (status VENCIDO não envia valores de pagamento)

    try {
      let response: Response;

      if (isEditMode) {
        const url = `http://localhost:3001/accounts-payable/${accountToEdit!.id}`;
        response = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        });
      } else {
        const url = "http://localhost:3001/accounts-payable";
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        });

        // Se for criação e houver pagamento manual sem status=PAGO, backend não faz auto, então aqui enviamos
        if (!isNaN(manual) && manual > 0 && formData.status !== "PAGO") {
          const result = await response.json();
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
              amount: manual,
              bankAccount: formData.manualBankAccount || null,
            }),
          });
        }
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Falha ao salvar conta.");
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
          {/* --- Campos principais --- */}
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
              <label
                htmlFor="category"
                className="block text-sm font-medium mb-1"
              >
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
              <label
                htmlFor="dueDate"
                className="block text-sm font-medium mb-1"
              >
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
            <label
              htmlFor="installmentType"
              className="block text-sm font-medium mb-1"
            >
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

          {/* Campos só aparecem se for parcelado */}
          {formData.installmentType === "PARCELADO" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="currentInstallment"
                  className="block text-sm font-medium mb-1"
                >
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
                <label
                  htmlFor="installments"
                  className="block text-sm font-medium mb-1"
                >
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

          {/* Checkbox de repetição mensal aparece só se for parcela única */}
          {formData.installmentType === "UNICA" && (
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
              {formData.isRecurring && (
                <input
                  type="date"
                  id="recurringUntil"
                  value={formData.recurringUntil}
                  onChange={handleChange}
                  className="border rounded-lg px-2 py-1 ml-2"
                  min={new Date().toISOString().slice(0, 10)}
                  required
                />
              )}
            </div>
          )}

          {/* Pagamento manual (mantido só para status A_PAGAR, não mostra se status for PAGO!) */}
          {formData.status === "A_PAGAR" && (
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
                  placeholder="Ex: Banco do Brasil – Conta 12345-6"
                />
              </div>
            </>
          )}

          {/* Campos de pagamento só para status "PAGO" OU quando valor manual é informado,
              MAS só mostra o campo Conta Bancária aqui se status for PAGO! */}
          {(formData.status === "PAGO" ||
            parseFloat((formData.manualPaymentAmount || "0").toString().replace(",", ".")) > 0) && (
              <>
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
                {/* Só mostra o campo Conta Bancária nesse bloco se o status for PAGO */}
                {formData.status === "PAGO" && (
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
                      placeholder="Ex: Banco do Brasil – Conta 12345-6"
                    />
                  </div>
                )}
              </>
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
