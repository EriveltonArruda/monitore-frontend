"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type Municipality = { id: number; name: string; };
type Department = { id: number; name: string; municipalityId: number; };
type Contract = { id: number; code: string; municipalityId: number; departmentId: number | null; };

type Receivable = {
  id: number;
  contractId: number;
  noteNumber: string | null;
  issueDate: string | null;
  grossAmount: number | null;
  netAmount: number | null;
  periodLabel: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  deliveryDate: string | null;
  receivedAt: string | null;
  status: 'A_RECEBER' | 'ATRASADO' | 'RECEBIDO';
};

type Props = {
  onClose: () => void;
  receivableToEdit?: (Receivable & {
    contract?: { municipalityId: number; departmentId: number | null };
  }) | null;
  presetMunicipalityId?: number;
  presetDepartmentId?: number;
};

export default function ReceivablesFormModal({ onClose, receivableToEdit, presetMunicipalityId, presetDepartmentId }: Props) {
  const router = useRouter();
  const isEdit = Boolean(receivableToEdit);

  // selects dependentes
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  // form state
  const [form, setForm] = useState({
    municipalityId: presetMunicipalityId ? String(presetMunicipalityId) : '',
    departmentId: presetDepartmentId ? String(presetDepartmentId) : '',
    contractId: '',
    noteNumber: '',
    issueDate: '',
    periodLabel: '',
    periodStart: '',
    periodEnd: '',
    deliveryDate: '',
    receivedAt: '',
    grossAmount: '',
    netAmount: '',
    status: 'A_RECEBER' as 'A_RECEBER' | 'ATRASADO' | 'RECEBIDO',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // carregar municípios
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
    if (isEdit && receivableToEdit) {
      setForm(prev => ({
        ...prev,
        municipalityId: receivableToEdit.contract?.municipalityId ? String(receivableToEdit.contract.municipalityId) : prev.municipalityId,
        departmentId: receivableToEdit.contract?.departmentId ? String(receivableToEdit.contract.departmentId) : '',
        contractId: String(receivableToEdit.contractId),
        noteNumber: receivableToEdit.noteNumber ?? '',
        issueDate: receivableToEdit.issueDate ? receivableToEdit.issueDate.slice(0, 10) : '',
        periodLabel: receivableToEdit.periodLabel ?? '',
        periodStart: receivableToEdit.periodStart ? receivableToEdit.periodStart.slice(0, 10) : '',
        periodEnd: receivableToEdit.periodEnd ? receivableToEdit.periodEnd.slice(0, 10) : '',
        deliveryDate: receivableToEdit.deliveryDate ? receivableToEdit.deliveryDate.slice(0, 10) : '',
        receivedAt: receivableToEdit.receivedAt ? receivableToEdit.receivedAt.slice(0, 10) : '',
        grossAmount: receivableToEdit.grossAmount != null ? String(receivableToEdit.grossAmount) : '',
        netAmount: receivableToEdit.netAmount != null ? String(receivableToEdit.netAmount) : '',
        status: receivableToEdit.status,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, receivableToEdit?.id]);

  // carregar órgãos ao trocar município
  useEffect(() => {
    const loadDeps = async () => {
      if (!form.municipalityId) { setDepartments([]); return; }
      const res = await fetch(`${API_BASE}/departments?municipalityId=${form.municipalityId}&limit=9999`);
      const json = await res.json().catch(() => ({ data: [] }));
      setDepartments(json.data || []);
    };
    loadDeps();
  }, [form.municipalityId]);

  // carregar contratos ao trocar município/órgão
  useEffect(() => {
    const params = new URLSearchParams();
    if (form.municipalityId) params.set('municipalityId', form.municipalityId);
    if (form.departmentId) params.set('departmentId', form.departmentId);
    params.set('limit', '9999');

    const loadContracts = async () => {
      if (!form.municipalityId) { setContracts([]); return; }
      const res = await fetch(`${API_BASE}/contracts?${params.toString()}`);
      const json = await res.json().catch(() => ({ data: [] }));
      setContracts(json.data || []);
    };
    loadContracts();
  }, [form.municipalityId, form.departmentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErr(null);

    try {
      if (!form.contractId) throw new Error('Selecione um contrato.');

      const payload: any = {
        contractId: Number(form.contractId),
        noteNumber: form.noteNumber || undefined,
        issueDate: form.issueDate ? new Date(form.issueDate + 'T00:00:00') : undefined,
        grossAmount: form.grossAmount !== '' ? Number(form.grossAmount) : undefined,
        netAmount: form.netAmount !== '' ? Number(form.netAmount) : undefined,
        periodLabel: form.periodLabel || undefined,
        periodStart: form.periodStart ? new Date(form.periodStart + 'T00:00:00') : undefined,
        periodEnd: form.periodEnd ? new Date(form.periodEnd + 'T00:00:00') : undefined,
        deliveryDate: form.deliveryDate ? new Date(form.deliveryDate + 'T00:00:00') : undefined,
        receivedAt: form.receivedAt ? new Date(form.receivedAt + 'T00:00:00') : undefined,
        status: form.status || undefined,
      };

      let res: Response;
      if (isEdit && receivableToEdit) {
        res = await fetch(`${API_BASE}/receivables/${receivableToEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/receivables`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || 'Falha ao salvar recebido.');
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
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">{isEdit ? 'Editar Recebido' : 'Novo Recebido'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Município *</label>
            <select title="Município"
              id="municipalityId"
              value={form.municipalityId}
              onChange={handleChange}
              className="w-full border rounded-md p-2 bg-white"
            >
              <option value="">Selecione...</option>
              {municipalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Órgão/Secretaria</label>
            <select title="Órgão/Secretaria"
              id="departmentId"
              value={form.departmentId}
              onChange={handleChange}
              className="w-full border rounded-md p-2 bg-white"
              disabled={!form.municipalityId}
            >
              <option value="">(Opcional)</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contrato *</label>
            <select title="Contrato"
              id="contractId"
              value={form.contractId}
              onChange={handleChange}
              className="w-full border rounded-md p-2 bg-white"
              disabled={!form.municipalityId}
            >
              <option value="">Selecione...</option>
              {contracts.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nº Nota</label>
            <input id="noteNumber" value={form.noteNumber} onChange={handleChange} className="w-full border rounded-md p-2" placeholder="Ex.: NF-0001" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Emissão</label>
            <input type="date" id="issueDate" value={form.issueDate} onChange={handleChange} className="w-full border rounded-md p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select title="Status" id="status" value={form.status} onChange={handleChange} className="w-full border rounded-md p-2 bg-white">
              <option value="A_RECEBER">A RECEBER</option>
              <option value="ATRASADO">ATRASADO</option>
              <option value="RECEBIDO">RECEBIDO</option>
            </select>
          </div>

          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Período (Label)</label>
              <input id="periodLabel" value={form.periodLabel} onChange={handleChange} className="w-full border rounded-md p-2" placeholder="Ex.: FEV/2025" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Período de</label>
              <input type="date" id="periodStart" value={form.periodStart} onChange={handleChange} className="w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Período até</label>
              <input type="date" id="periodEnd" value={form.periodEnd} onChange={handleChange} className="w-full border rounded-md p-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Entrega</label>
            <input type="date" id="deliveryDate" value={form.deliveryDate} onChange={handleChange} className="w-full border rounded-md p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Recebido em</label>
            <input type="date" id="receivedAt" value={form.receivedAt} onChange={handleChange} className="w-full border rounded-md p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Valor Bruto</label>
            <input type="number" step="0.01" id="grossAmount" value={form.grossAmount} onChange={handleChange} className="w-full border rounded-md p-2" placeholder="Ex.: 50000.00" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Valor Líquido</label>
            <input type="number" step="0.01" id="netAmount" value={form.netAmount} onChange={handleChange} className="w-full border rounded-md p-2" placeholder="Ex.: 48000.00" />
          </div>

          {err && <div className="md:col-span-3 text-sm text-red-600">{err}</div>}

          <div className="md:col-span-3 flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="py-2 px-4 border rounded-lg">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} onClick={handleSubmit} className="py-2 px-4 bg-blue-600 text-white rounded-lg">
              {isEdit ? (isSubmitting ? 'Salvando...' : 'Salvar Alterações') : (isSubmitting ? 'Criando...' : 'Criar Recebido')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
