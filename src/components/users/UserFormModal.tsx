"use client";

import React, { FormEvent, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types/User';
import { RequireModule } from "@/components/RequireModule";
import { UserModule } from "@/types/UserModule";

// Mesmas variáveis
const USER_ROLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'MANAGER', label: 'Gerente' },
  { value: 'USER', label: 'Usuário' },
];

const AVAILABLE_MODULES = [
  { value: 'CONTAS_PAGAR', label: 'Contas a Pagar' },
  { value: 'RELATORIO_CONTAS_PAGAR', label: 'Relatório de Contas' },
  { value: 'ESTOQUE', label: 'Estoque' },
  { value: 'MOVIMENTACOES', label: 'Movimentações' },
  { value: 'RELATORIOS', label: 'Relatórios' },
  { value: 'FORNECEDORES', label: 'Fornecedores' },
  { value: 'CATEGORIAS', label: 'Categorias' },
  { value: 'DASHBOARD', label: 'Dashboard' },
  { value: 'CONTATOS', label: 'Lista de Contatos' },
  { value: 'USUARIOS', label: 'Gerenciar Usuários' },
];

// type User = {
//   id: number;
//   name: string;
//   email: string;
//   role: string;
//   modules: string[];
// };

type UserFormModalProps = {
  onClose: () => void;
  user?: User; // se passar, é edição
};

export function UserFormModal({ onClose, user }: UserFormModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    role: user?.role ?? 'USER',
    modules: user?.modules ?? [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preenche o formulário se vier um usuário para edição (evita bug se user mudar após abertura)
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        modules: user.modules ?? [],
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const id = target.id;

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      const value = target.value;
      const checked = target.checked;
      setFormData(prev => {
        const mods = new Set(prev.modules);
        if (checked) mods.add(value);
        else mods.delete(value);
        return { ...prev, modules: Array.from(mods) };
      });
    } else {
      const value = target.value;
      setFormData(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let response;
      if (user) {
        // Edição (PATCH)
        response = await fetch(`http://localhost:3001/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            modules: formData.modules,
            // Não envia senha ao editar
          }),
        });
      } else {
        // Criação (POST)
        response = await fetch('http://localhost:3001/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar usuário.');
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
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Nome *</label>
            <input
              type="text" id="name" value={formData.name}
              onChange={handleChange} required
              className="w-full border-gray-300 rounded-md p-2 border"
            />
          </div>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email *</label>
            <input
              type="email" id="email" value={formData.email}
              onChange={handleChange} required
              className="w-full border-gray-300 rounded-md p-2 border"
              disabled={!!user} // Não deixa editar o email, pode alterar se quiser
            />
          </div>
          {/* Senha - só na criação */}
          {!user && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium">Senha *</label>
              <input
                type="password" id="password" value={formData.password}
                onChange={handleChange} required
                className="w-full border-gray-300 rounded-md p-2 border"
              />
            </div>
          )}
          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium">Função *</label>
            <select
              id="role" value={formData.role}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md p-2 border bg-white"
            >
              {USER_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          {/* Módulos */}
          <fieldset>
            <legend className="text-sm font-medium mb-1">Módulos de Acesso</legend>
            <div className="space-y-1">
              {AVAILABLE_MODULES.map(mod => (
                <label key={mod.value} className="flex items-center gap-2">
                  <input
                    type="checkbox" id={mod.value}
                    value={mod.value}
                    checked={formData.modules.includes(mod.value)}
                    onChange={handleChange}
                    className="border-gray-300 rounded"
                  />
                  <span className="text-sm">{mod.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4 border-t mt-4">
            <button
              type="button" onClick={onClose} disabled={isSubmitting}
              className="py-2 px-4 border rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className="py-2 px-4 bg-blue-600 text-white rounded-lg"
            >
              {isSubmitting
                ? (user ? 'Salvando...' : 'Criando...')
                : (user ? 'Salvar Alterações' : 'Criar Usuário')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
