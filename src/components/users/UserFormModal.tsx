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
  { value: 'DESPESAS_VIAGEM', label: 'Despesas de Viagem' },
];

type UserFormModalProps = {
  onClose: () => void;
  user?: User; // se passar, é edição
};

// Função auxiliar para verificar se o token JWT está expirado
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true; // Se não conseguir decodificar, considera expirado
  }
};

// Função auxiliar para obter o token de autenticação
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // Primeiro, tenta pegar do cookies (mais recente no seu caso)
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth_token' && value) {
        if (!isTokenExpired(value)) {
          console.log('Token válido encontrado nos cookies');
          return value;
        } else {
          console.warn('Token dos cookies está expirado');
        }
      }
    }

    // Se não encontrar nos cookies, tenta localStorage
    const localToken = localStorage.getItem('auth_token');
    if (localToken) {
      if (!isTokenExpired(localToken)) {
        console.log('Token válido encontrado no localStorage');
        return localToken;
      } else {
        console.warn('Token do localStorage está expirado');
        // Remove token expirado
        localStorage.removeItem('auth_token');
      }
    }

    // Tenta sessionStorage
    const sessionToken = sessionStorage.getItem('auth_token');
    if (sessionToken) {
      if (!isTokenExpired(sessionToken)) {
        console.log('Token válido encontrado no sessionStorage');
        return sessionToken;
      } else {
        console.warn('Token do sessionStorage está expirado');
        sessionStorage.removeItem('auth_token');
      }
    }

    console.error('Nenhum token válido encontrado');
  }
  return null;
};

// Função auxiliar para criar headers com autenticação
const createAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
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
        // EDIÇÃO - sempre precisa de token
        const token = getAuthToken();
        if (!token) {
          throw new Error('Sessão expirada ou token inválido. Faça login novamente.');
        }

        const headers = createAuthHeaders();
        console.log('Fazendo PATCH para:', `http://localhost:3001/users/${user.id}`);
        console.log('Headers:', headers);

        response = await fetch(`http://localhost:3001/users/${user.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            modules: formData.modules,
          }),
        });
      } else {
        // CRIAÇÃO - não precisa de token (baseado no seu controller)
        console.log('Fazendo POST para:', 'http://localhost:3001/users');

        response = await fetch('http://localhost:3001/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não autorizado. Verifique se você está logado e tem permissão para esta operação.');
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Falha ao salvar usuário (${response.status}).`);
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nome *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              className="w-full border-gray-300 rounded-md p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={!!user || isSubmitting} // Não deixa editar o email
              className="w-full border-gray-300 rounded-md p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Senha - só na criação */}
          {!user && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Senha *
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="w-full border-gray-300 rounded-md p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
            </div>
          )}

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Função *
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border-gray-300 rounded-md p-2 border bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {USER_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Módulos */}
          <fieldset disabled={isSubmitting}>
            <legend className="text-sm font-medium mb-2">Módulos de Acesso</legend>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
              {AVAILABLE_MODULES.map(mod => (
                <label key={mod.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    id={mod.value}
                    value={mod.value}
                    checked={formData.modules.includes(mod.value)}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="border-gray-300 rounded text-blue-600 focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm select-none">{mod.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selecione os módulos que o usuário terá acesso
            </p>
          </fieldset>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4 border-t mt-4 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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