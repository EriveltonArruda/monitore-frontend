// src/app/dashboard/components/contracts/ContractsFormModal.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type Contract = {
  id: number;
  code: string;
  description: string | null;
  municipalityId: number;
  departmentId: number | null;
  startDate: string | null;
  endDate: string | null;
  monthlyValue: number | null;
  status: string;
};

type Municipality = { id: number; name: string; };
type Department = { id: number; name: string; municipalityId: number; };

type Props = {
  onClose: () => void;
  contractToEdit?: Contract | null;
};

export default function ContractFormModal({ onClose, contractToEdit }: Props) {
  const router = useRouter();
  const isEdit = Boolean(contractToEdit);

  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [form, setForm] = useState({
    code: '',
    description: '',
    municipalityId: '',
    departmentId: '',
    startDate: '',
    endDate: '',
    monthlyValue: '',
    status: 'ATIVO', // ATIVO | ENCERRADO | SUSPENSO
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // municípios
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_BASE}/municipalities?limit=9999`);
      const json = await res.json().catch(() => ({ data: [] }));
      setMunicipalities(json.data || []);
    };
    load();
  }, []);

  // preencher form em edição
  useEffect(() => {
    if (isEdit && contractToEdit) {
      setForm({
        code: contractToEdit.code || '',
        description: contractToEdit.description || '',
        municipalityId: String(contractToEdit.municipalityId || ''),
        departmentId: contractToEdit.departmentId ? String(contractToEdit.departmentId) : '',
        startDate: contractToEdit.startDate ? contractToEdit.startDate.slice(0, 10) : '',
        endDate: contractToEdit.endDate ? contractToEdit.endDate.slice(0, 10) : '',
        monthlyValue: contractToEdit.monthlyValue != null ? String(contractToEdit.monthlyValue) : '',
        status: contractToEdit.status || 'ATIVO',
      });
    }
  }, [isEdit, contractToEdit]);

  // carregar órgãos ao escolher município
  useEffect(() => {
    const loadDeps = async () => {
      if (!form.municipalityId) { setDepartments([]); return; }
      const res = await fetch(`${API_BASE}/departments?municipalityId=${form.municipalityId}&limit=9999`);
      const json = await res.json().catch(() => ({ data: [] }));
      setDepartments(json.data || []);
    };
    loadDeps();
  }, [form.municipalityId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErr(null);

    try {
      // ✅ envie datas como string 'YYYY-MM-DD' (compatível com @IsDateString)
      const payload: any = {
        code: form.code,
        description: form.description || undefined,
        municipalityId: Number(form.municipalityId),
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        monthlyValue: form.monthlyValue !== '' ? Number(form.monthlyValue) : undefined,
        status: form.status || undefined,
      };

      let res: Response;
      if (isEdit && contractToEdit) {
        res = await fetch(`${API_BASE}/contracts/${contractToEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/contracts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || 'Falha ao salvar contrato.');
      }

      router.refresh();
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">{isEdit ? 'Editar Contrato' : 'Novo Contrato'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            <label htmlFor="code" className="block text-sm font-medium mb-1">Código *</label>
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
            <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
            <select id="status" value={form.status} onChange={handleChange} className="w-full border rounded-md p-2 bg-white">
              <option value="ATIVO">ATIVO</option>
              <option value="ENCERRADO">ENCERRADO</option>
              <option value="SUSPENSO">SUSPENSO</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição</label>
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
            <label htmlFor="municipalityId" className="block text-sm font-medium mb-1">Município *</label>
            <select
              id="municipalityId"
              value={form.municipalityId}
              onChange={handleChange}
              required
              className="w-full border rounded-md p-2 bg-white"
            >
              <option value="">Selecione...</option>
              {municipalities.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="departmentId" className="block text-sm font-medium mb-1">Órgão/Secretaria</label>
            <select
              id="departmentId"
              value={form.departmentId}
              onChange={handleChange}
              className="w-full border rounded-md p-2 bg-white"
              disabled={!form.municipalityId}
            >
              <option value="">(Opcional)</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium mb-1">Vigência (Início)</label>
            <input
              type="date"
              id="startDate"
              value={form.startDate}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium mb-1">Vigência (Fim)</label>
            <input
              type="date"
              id="endDate"
              value={form.endDate}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </div>

          <div>
            <label htmlFor="monthlyValue" className="block text-sm font-medium mb-1">Valor Mensal</label>
            <input
              type="number"
              step="0.01"
              id="monthlyValue"
              value={form.monthlyValue}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
              placeholder="Ex.: 50000.00"
            />
          </div>

          {err && (
            <div className="md:col-span-2 text-sm text-red-600">{err}</div>
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
              {isSubmitting ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Contrato')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
