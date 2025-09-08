// src/app/dashboard/components/departments/DepartmentFormModal.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type Municipality = { id: number; name: string };
type Department = {
  id: number;
  name: string;
  municipalityId: number;
};

type Props = {
  onClose: () => void;
  municipalities: Municipality[];
  departmentToEdit?: Department | null;
};

export default function DepartmentFormModal({
  onClose,
  municipalities,
  departmentToEdit,
}: Props) {
  const router = useRouter();
  const isEdit = Boolean(departmentToEdit);

  const [form, setForm] = useState({
    name: '',
    municipalityId: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && departmentToEdit) {
      setForm({
        name: departmentToEdit.name,
        municipalityId: String(departmentToEdit.municipalityId),
      });
    }
  }, [isEdit, departmentToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErr(null);

    try {
      const payload = {
        name: form.name,
        municipalityId: Number(form.municipalityId),
      };

      let res: Response;
      if (isEdit && departmentToEdit) {
        res = await fetch(`${API_BASE}/departments/${departmentToEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/departments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any));
        throw new Error(j.message || 'Falha ao salvar órgão/secretaria.');
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
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">{isEdit ? 'Editar Órgão/Secretaria' : 'Novo Órgão/Secretaria'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Nome *</label>
            <input
              id="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border rounded-md p-2"
              placeholder="Ex.: Saúde, Educação"
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

          {err && <div className="text-sm text-red-600">{err}</div>}

          <div className="flex justify-end gap-3 pt-2">
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
              {isSubmitting ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Órgão')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
