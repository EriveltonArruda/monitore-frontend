"use client";

import React, { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

type AccountPayable = {
  id: number;
  name: string;
  category: string;
  value: number;
  dueDate: string;
  status: string;
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

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    value: 0,
    dueDate: '',
    status: 'A_PAGAR',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && accountToEdit) {
      setFormData({
        name: accountToEdit.name || '',
        category: accountToEdit.category || '',
        value: accountToEdit.value || 0,
        // Formata a data para o formato yyyy-MM-dd que o input type="date" espera
        dueDate: accountToEdit.dueDate ? format(new Date(accountToEdit.dueDate), 'yyyy-MM-dd') : '',
        status: accountToEdit.status || 'A_PAGAR',
      });
    }
  }, [isEditMode, accountToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Garante que o valor seja um número
    const dataToSend = {
      ...formData,
      value: parseFloat(String(formData.value)),
      dueDate: new Date(formData.dueDate), // Converte a data de volta para o formato correto
    };

    try {
      let response;
      if (isEditMode) {
        if (!accountToEdit) throw new Error("Conta para edição não foi encontrada.");
        const url = `http://localhost:3001/accounts-payable/${accountToEdit.id}`;
        response = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        });
      } else {
        const url = 'http://localhost:3001/accounts-payable';
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar conta.');
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
        <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold">{isEditMode ? 'Editar Conta' : 'Nova Conta a Pagar'}</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome da Conta *</label>
            <input type="text" id="name" placeholder="Digie o nome da conta" value={formData.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <input type="text" id="category" placeholder="Digite a categoria da conta" value={formData.category} onChange={handleChange} required className="w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
              <input type="number" step="0.01" id="value" value={formData.value} onChange={handleChange} required className="w-full border border-gray-300 rounded-md p-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento *</label>
              <input type="date" id="dueDate" value={formData.dueDate} onChange={handleChange} required className="w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select id="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 bg-white">
                <option value="A_PAGAR">A Pagar</option>
                <option value="PAGO">Pago</option>
                <option value="VENCIDO">Vencido</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-4 pt-4 border-t mt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="py-2 px-4 border rounded-lg">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-blue-600 text-white rounded-lg">{isSubmitting ? 'Salvando...' : 'Salvar Conta'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}