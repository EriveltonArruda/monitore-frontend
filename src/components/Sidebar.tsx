"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  ArrowRightLeft,
  ScrollText,
  UserCircle,
  Power,
  Tags,
  Building, // Ícone adicionado para Fornecedores
} from 'lucide-react';

// Adicionamos o novo link para Fornecedores
const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Produtos', icon: Boxes },
  { href: '/dashboard/categories', label: 'Categorias', icon: Tags },
  { href: '/dashboard/suppliers', label: 'Fornecedores', icon: Building }, // NOVO LINK
  { href: '/dashboard/movements', label: 'Movimentações', icon: ArrowRightLeft },
  { href: '/dashboard/reports', label: 'Relatórios', icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = { name: 'Erivelton', role: 'Administrador' };

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">Estoque Monitore</h1>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-grow p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
          Navegação
        </p>
        <ul>
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
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
      </nav>

      {/* Status e Perfil */}
      <div className="p-4 border-t border-gray-200">
        {/* ... (código de status do sistema) ... */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200 mt-4">
          <UserCircle size={40} className="text-gray-400" />
          <div className="flex-grow">
            <p className="font-semibold text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500">{user.role}</p>
          </div>
          <button className="text-gray-400 hover:text-red-500">
            <Power size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
}
