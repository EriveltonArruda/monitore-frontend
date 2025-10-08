"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

type Contract = {
  id: number;
  code: string;
  description: string | null;
  municipalityId: number;
  departmentId: number | null;
  startDate: string | null;
  endDate: string | null;
  monthlyValue: number | null;
  status: string; // backend envia string
};

type Municipality = { id: number; name: string };
type Department = { id: number; name: string; municipalityId: number };

type Props = {
  onClose: () => void;
  onSaved?: () => void; // pai fecha e dá refresh
  contractToEdit?: Contract | null;
  presetMunicipalityId?: number; // presets para Novo
  presetDepartmentId?: number; // presets para Novo
};

function parseBRNumber(raw: string): number | null {
  if (!raw) return null;
  const s = raw.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export default function ContractFormModal({
  onClose,
  onSaved,
  contractToEdit,
  presetMunicipalityId,
  presetDepartmentId,
}: Props) {
  const router = useRouter();
  const isEdit = Boolean(contractToEdit);

  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [form, setForm] = useState({
    code: "",
    description: "",
    municipalityId: presetMunicipalityId ? String(presetMunicipalityId) : "",
    departmentId: presetDepartmentId ? String(presetDepartmentId) : "",
    startDate: "",
    endDate: "",
    monthlyValue: "", // "50.000,00"
    status: "PENDENTE" as string, // ✅ padrão agora PENDENTE
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Carregar municípios
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_BASE}/municipalities?limit=9999`);
      const json = await res.json().catch(() => ({ data: [] as Municipality[] }));
      setMunicipalities(json.data || []);
    };
    load();
  }, []);

  // Preencher form em edição (ou aplicar presets em criação)
  useEffect(() => {
    if (isEdit && contractToEdit) {
      const statusUpper = (contractToEdit.status || "PENDENTE").toString().toUpperCase();
      setForm({
        code: contractToEdit.code || "",
        description: contractToEdit.description || "",
        municipalityId: String(contractToEdit.municipalityId || ""),
        departmentId: contractToEdit.departmentId ? String(contractToEdit.departmentId) : "",
        startDate: contractToEdit.startDate ? contractToEdit.startDate.slice(0, 10) : "",
        endDate: contractToEdit.endDate ? contractToEdit.endDate.slice(0, 10) : "",
        monthlyValue:
          contractToEdit.monthlyValue != null
            ? String(contractToEdit.monthlyValue).replace(".", ",")
            : "",
        status: statusUpper,
      });
    } else if (!isEdit) {
      setForm((prev) => ({
        ...prev,
        municipalityId: presetMunicipalityId ? String(presetMunicipalityId) : prev.municipalityId,
        departmentId: presetDepartmentId ? String(presetDepartmentId) : prev.departmentId,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, contractToEdit?.id, presetMunicipalityId, presetDepartmentId]);

  // Carregar órgãos ao trocar município
  useEffect(() => {
    const loadDeps = async () => {
      if (!form.municipalityId) {
        setDepartments([]);
        return;
      }
      const res = await fetch(
        `${API_BASE}/departments?municipalityId=${form.municipalityId}&limit=9999`
      );
      const json = await res.json().catch(() => ({ data: [] as Department[] }));
      setDepartments(json.data || []);
    };
    loadDeps();
  }, [form.municipalityId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErr(null);

    try {
      // Validação básica de período
      if (form.startDate && form.endDate) {
        const start = new Date(form.startDate);
        const end = new Date(form.endDate);
        if (end < start) {
          throw new Error("A data de fim deve ser igual ou posterior à data de início.");
        }
      }

      const monthlyValueParsed =
        form.monthlyValue !== "" ? parseBRNumber(form.monthlyValue) : null;
      if (form.monthlyValue !== "" && monthlyValueParsed == null) {
        throw new Error("Valor Mensal inválido. Use formato 1234,56.");
      }

      const payload: any = {
        code: form.code,
        description: form.description || undefined,
        municipalityId: Number(form.municipalityId),
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        monthlyValue: monthlyValueParsed ?? undefined,
        status: form.status ? form.status.toUpperCase() : undefined, // sempre UPPERCASE
      };

      let res: Response;
      if (isEdit && contractToEdit) {
        res = await fetch(`${API_BASE}/contracts/${contractToEdit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/contracts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(
          j?.message
            ? Array.isArray(j.message)
              ? j.message.join("\n")
              : String(j.message)
            : "Falha ao salvar contrato."
        );
      }

      // sucesso → fecha e atualiza lista
      if (onSaved) onSaved();
      else {
        router.refresh();
        onClose();
      }
    } catch (e: any) {
      setErr(e?.message ?? "Erro inesperado ao salvar contrato.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">{isEdit ? "Editar Contrato" : "Novo Contrato"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fechar">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            <label htmlFor="code" className="block text-sm font-medium mb-1">
              Código *
            </label>
            <input
              id="code"
              value={form.code}
              onChange={handleChange}
              required
              className="w-full border rounded-md p-2"
              placeholder="Ex.: CT 001/2025"
            />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="status" className="block text-sm font-medium mb-1">
              Status
            </label>
            <select
              id="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border rounded-md p-2 bg-white"
            >
              <option value="PENDENTE">PENDENTE</option>
              <option value="ATIVO">ATIVO</option>
              <option value="ENCERRADO">ENCERRADO</option>
              <option value="SUSPENSO">SUSPENSO</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Descrição
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
              rows={2}
              placeholder="Ex.: Serviços de saúde 2025"
            />
          </div>

          <div>
            <label htmlFor="municipalityId" className="block text-sm font-medium mb-1">
              Município *
            </label>
            <select
              id="municipalityId"
              value={form.municipalityId}
              onChange={handleChange}
              required
              className="w-full border rounded-md p-2 bg-white"
            >
              <option value="">Selecione...</option>
              {municipalities.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="departmentId" className="block text-sm font-medium mb-1">
              Órgão/Secretaria
            </label>
            <select
              id="departmentId"
              value={form.departmentId}
              onChange={handleChange}
              className="w-full border rounded-md p-2 bg-white"
              disabled={!form.municipalityId}
            >
              <option value="">(Opcional)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium mb-1">
              Vigência (Início)
            </label>
            <input
              type="date"
              id="startDate"
              value={form.startDate}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium mb-1">
              Vigência (Fim)
            </label>
            <input
              type="date"
              id="endDate"
              value={form.endDate}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </div>

          <div>
            <label htmlFor="monthlyValue" className="block text-sm font-medium mb-1">
              Valor Mensal
            </label>
            <input
              id="monthlyValue"
              value={form.monthlyValue}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
              placeholder="Ex.: 50.000,00"
              inputMode="decimal"
            />
          </div>

          {err && (
            <div className="md:col-span-2 text-sm text-red-600 whitespace-pre-line">
              {err}
            </div>
          )}

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
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
              {isSubmitting ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar Contrato"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
