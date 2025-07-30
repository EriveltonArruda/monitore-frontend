"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // 1. Importamos o useRouter
import Cookies from 'js-cookie'; // 2. Importamos a biblioteca de cookies
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

// Links da navegação principal de estoque
const stockNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Produtos', icon: Boxes },
  { href: '/dashboard/categories', label: 'Categorias', icon: Tags },
  { href: '/dashboard/suppliers', label: 'Fornecedores', icon: Building },
  { href: '/dashboard/movements', label: 'Movimentações', icon: ArrowRightLeft },
  { href: '/dashboard/reports', label: 'Relatórios', icon: ScrollText },
];

// Links para a seção de gerenciamento
const managementNavLinks = [
  { href: '/dashboard/accounts-payable', label: 'Contas a Pagar', icon: Landmark },
  { href: '/dashboard/accounts-payable/reports', label: 'Relatório de Contas', icon: BarChart2 },
  { href: '/dashboard/contacts', label: 'Lista de Contatos', icon: Contact },
  { href: '/dashboard/users', label: 'Gerenciar Usuários', icon: Users },
]


export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter(); // 3. Inicializamos o router
  const user = { name: 'Erivelton', role: 'Administrador' };

  // 4. Criamos a função de Logout
  const handleLogout = () => {
    // Remove o cookie de autenticação
    Cookies.remove('auth_token');
    // Redireciona o usuário para a página de login
    router.push('/login');
  };

  // Helper function para verificar o link ativo
  const checkIsActive = (href: string) => {
    return href === '/dashboard'
      ? pathname === href
      : pathname.startsWith(href);
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
            {stockNavLinks.map((link) => {
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
            {managementNavLinks.map((link) => {
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
          {/* 5. O botão agora chama a função de logout */}
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">
            <Power size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
}
