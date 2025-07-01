"use client";

import React, { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Tipagem para os dados do contato
type Contact = {
  id: number;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  type?: string;
};

// Tipagem para as props que o modal recebe
type ContactFormModalProps = {
  onClose: () => void;
  contactToEdit?: Contact | null;
};

export function ContactFormModal({
  onClose,
  contactToEdit,
}: ContactFormModalProps) {
  const router = useRouter();
  const isEditMode = Boolean(contactToEdit);

  // Estado para gerenciar os dados do formulário
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    type: 'Cliente',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Efeito para preencher o formulário se estiver em modo de edição
  useEffect(() => {
    if (isEditMode && contactToEdit) {
      setFormData({
        name: contactToEdit.name || '',
        company: contactToEdit.company || '',
        email: contactToEdit.email || '',
        phone: contactToEdit.phone || '',
        type: contactToEdit.type || 'Cliente',
      });
    }
  }, [isEditMode, contactToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let response;
      if (isEditMode) {
        if (!contactToEdit) throw new Error("Contato para edição não foi encontrado.");
        const url = `http://localhost:3001/contacts/${contactToEdit.id}`;
        response = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        const url = 'http://localhost:3001/contacts';
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar contato.');
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
        <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold">{isEditMode ? 'Editar Contato' : 'Novo Contato'}</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input type="text" id="name" placeholder="Digite o nome do contato" value={formData.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <input type="text" id="company" placeholder="Digite o nome da Empresa" value={formData.company} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select id="type" value={formData.type} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 bg-white">
                <option>Cliente</option>
                <option>Fornecedor</option>
                <option>Parceiro</option>
                <option>Outro</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" placeholder="Digite o email do contato" id="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input type="text" id="phone" placeholder='Digite o telefone do contato' value={formData.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-4 pt-4 border-t mt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="py-2 px-4 border rounded-lg">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-blue-600 text-white rounded-lg">{isSubmitting ? 'Salvando...' : 'Salvar Contato'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}