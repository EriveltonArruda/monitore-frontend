"use client";

import React, { FormEvent, useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type UserFormModalProps = {
  onClose: () => void;
};

export function UserFormModal({ onClose }: UserFormModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao criar usuário.');
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
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold">Novo Usuário</h2><button onClick={onClose}><X size={24} /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Nome *</label>
            <input type="text" id="name" value={formData.name} onChange={handleChange} required className="w-full border-gray-300 rounded-md p-2 border" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email *</label>
            <input type="email" id="email" value={formData.email} onChange={handleChange} required className="w-full border-gray-300 rounded-md p-2 border" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">Senha *</label>
            <input type="password" id="password" value={formData.password} onChange={handleChange} required className="w-full border-gray-300 rounded-md p-2 border" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-4 pt-4 border-t mt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="py-2 px-4 border rounded-lg">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-blue-600 text-white rounded-lg">{isSubmitting ? 'Salvando...' : 'Criar Usuário'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}