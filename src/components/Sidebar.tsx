"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Boxes,
  ArrowRightLeft,
  ScrollText,
  UserCircle,
  Power,
  Tags,
  Building,
  Landmark,
  Contact,
  Users,
  BarChart2,
} from 'lucide-react';

import { UserModule } from "@/types/UserModule";

// Links da navegação principal de estoque com módulos associados (usando enum UserModule)
const stockNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: UserModule.DASHBOARD },
  { href: '/dashboard/products', label: 'Produtos', icon: Boxes, module: UserModule.ESTOQUE },
  { href: '/dashboard/categories', label: 'Categorias', icon: Tags, module: UserModule.ESTOQUE },
  { href: '/dashboard/suppliers', label: 'Fornecedores', icon: Building, module: UserModule.FORNECEDORES },
  { href: '/dashboard/movements', label: 'Movimentações', icon: ArrowRightLeft, module: UserModule.MOVIMENTACOES },
  { href: '/dashboard/reports', label: 'Relatórios', icon: ScrollText, module: UserModule.RELATORIOS },
];

// Links para a seção de gerenciamento com módulos associados (usando enum UserModule)
const managementNavLinks = [
  { href: '/dashboard/accounts-payable', label: 'Contas a Pagar', icon: Landmark, module: UserModule.CONTAS_PAGAR },
  { href: '/dashboard/accounts-payable/reports', label: 'Relatório de Contas', icon: BarChart2, module: UserModule.RELATORIO_CONTAS_PAGAR },
  { href: '/dashboard/contacts', label: 'Lista de Contatos', icon: Contact, module: UserModule.CONTATOS },
  { href: '/dashboard/users', label: 'Gerenciar Usuários', icon: Users, module: UserModule.USUARIOS },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">Monitore</h1>
        </div>
        <div className="flex-grow flex items-center justify-center text-gray-400">
          Carregando...
        </div>
      </aside>
    );
  }

  // Função para verificar se o usuário pode acessar o módulo (comparando enums)
  const canAccessModule = (module: UserModule) => {
    if (user.role === 'ADMIN') return true; // Admin tem acesso total
    return user.modules.includes(module);
  };

  // Helper para verificar link ativo
  const checkIsActive = (href: string) => {
    return href === '/dashboard' ? pathname === href : pathname.startsWith(href);
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">Monitore</h1>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-grow p-4 space-y-6">
        {/* Seção de Navegação de Estoque */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
            Navegação
          </p>
          <ul>
            {stockNavLinks
              .filter(link => canAccessModule(link.module))
              .map(link => {
                const isActive = checkIsActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`flex items-center gap-3 py-2 px-3 rounded-md transition-colors ${isActive
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      <link.icon size={20} />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>

        {/* Seção de Gerenciamento */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
            Gerenciamento
          </p>
          <ul>
            {managementNavLinks
              .filter(link => canAccessModule(link.module))
              .map(link => {
                const isActive = checkIsActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`flex items-center gap-3 py-2 px-3 rounded-md transition-colors ${isActive
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      <link.icon size={20} />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      </nav>

      {/* Perfil do Usuário */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <UserCircle size={40} className="text-gray-400" />
          <div className="flex-grow">
            <p className="font-semibold text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500">{user.role}</p>
          </div>
          <button
            onClick={() => {
              logout();         // Limpa o usuário e o cookie
              router.push('/login'); // Redireciona para o login
            }}
            className="text-gray-400 hover:text-red-500"
          >
            <Power size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
}
