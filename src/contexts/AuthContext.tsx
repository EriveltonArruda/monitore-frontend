"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { UserModule } from '@/types/UserModule'; // Importa o enum de módulos
import { RequireModule } from "@/components/RequireModule";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  modules: UserModule[]; // Força ser array desse enum
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para garantir que modules seja array coerente (em caso de dados inconsistentes)
  function normalizeModules(modules: any): UserModule[] {
    if (!modules || !Array.isArray(modules)) return [];
    // Filtra só os valores válidos do enum
    return modules.filter((m) => Object.values(UserModule).includes(m));
  }

  useEffect(() => {
    const token = Cookies.get('auth_token');
    if (token) {
      fetch('http://localhost:3001/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Erro ao buscar usuário');
          return res.json();
        })
        .then((data) => {
          setUser({
            ...data,
            modules: normalizeModules(data.modules),
          });
        })
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setUser(null);
    }
  }, []);

  const login = (token: string) => {
    Cookies.set('auth_token', token, { expires: 1 });
    fetch('http://localhost:3001/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setUser({
          ...data,
          modules: normalizeModules(data.modules),
        });
      })
      .catch(() => setUser(null));
  };

  const logout = (router?: any) => {
    Cookies.remove('auth_token');
    setUser(null);
    if (router) router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro do AuthProvider');
  return context;
}
