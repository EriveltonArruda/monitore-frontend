"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type Municipality = {
  id: number;
  name: string;
  cnpj: string | null;
};

type Props = {
  onClose: () => void;
  municipalityToEdit?: Municipality | null;
};

export default function MunicipalityFormModal({
  onClose,
  municipalityToEdit,
}: Props) {
  const router = useRouter();
  const isEdit = Boolean(municipalityToEdit);

  const [form, setForm] = useState({
    name: '',
    cnpj: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && municipalityToEdit) {
      setForm({
        name: municipalityToEdit.name || '',
        cnpj: municipalityToEdit.cnpj || '',
      });
    }
  }, [isEdit, municipalityToEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
        cnpj: form.cnpj || undefined,
      };

      let res: Response;
      if (isEdit && municipalityToEdit) {
        res = await fetch(`${API_BASE}/municipalities/${municipalityToEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/municipalities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || 'Falha ao salvar município.');
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
          <h2 className="text-xl font-bold">
            {isEdit ? 'Editar Município' : 'Novo Município'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nome *
            </label>
            <input
              id="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border rounded-md p-2"
              placeholder="Ex.: Paulista"
            />
          </div>

          <div>
            <label htmlFor="cnpj" className="block text-sm font-medium mb-1">
              CNPJ
            </label>
            <input
              id="cnpj"
              value={form.cnpj}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
              placeholder="00.000.000/0000-00"
            />
          </div>

          {err && <div className="text-sm text-red-600">{err}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="py-2 px-4 border rounded-lg">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-blue-600 text-white rounded-lg">
              {isSubmitting ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Município')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
