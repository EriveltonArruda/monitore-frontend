"use client";

import React, { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

// O tipo agora inclui os novos campos, que são opcionais
type Supplier = {
  id: number;
  name: string;
  cnpj?: string | null;
  phone?: string | null;
  email?: string | null;
};

type SupplierFormModalProps = {
  onClose: () => void;
  supplierToEdit?: Supplier | null;
};

export function SupplierFormModal({ onClose, supplierToEdit }: SupplierFormModalProps) {
  const router = useRouter();
  const isEditMode = Boolean(supplierToEdit);

  // O estado do formulário agora inclui os novos campos
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    phone: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // O useEffect agora preenche todos os campos ao editar
  useEffect(() => {
    if (isEditMode && supplierToEdit) {
      setFormData({
        name: supplierToEdit.name || '',
        cnpj: supplierToEdit.cnpj || '',
        phone: supplierToEdit.phone || '',
        email: supplierToEdit.email || '',
      });
    }
  }, [isEditMode, supplierToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let response;

      // CORREÇÃO: Lógica de Edição e Criação totalmente separada em blocos if/else.
      // Isso torna explícito para o TypeScript que, dentro deste bloco,
      // a variável 'supplierToEdit' não pode ser nula.
      if (isEditMode) {
        if (!supplierToEdit) {
          throw new Error("Erro: Fornecedor para edição não foi encontrado.");
        }

        const url = `http://localhost:3001/suppliers/${supplierToEdit.id}`;
        response = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

      } else {
        // Lógica de Criação
        const url = 'http://localhost:3001/suppliers';
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar fornecedor.');
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
        <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold">{isEditMode ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa *</label>
            <input type="text" id="name" value={formData.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <input type="text" id="cnpj" value={formData.cnpj} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input type="text" id="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" id="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-4 pt-4 border-t mt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="py-2 px-4 border rounded-lg">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-blue-600 text-white rounded-lg">{isSubmitting ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Criar')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
