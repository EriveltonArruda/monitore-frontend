"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import React from "react";
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
  Plane,         // ícone Despesas de Viagem
  FilePieChart,  // ícone Relatório de Despesas de Viagem
  FileText,      // ícone Contratos
  HandCoins,     // ícone Recebidos
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { UserModule } from "@/types/UserModule";

/* ========================= LINKS POR MÓDULO ========================= */

/** 🟦 ESTOQUE */
const estoqueLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, module: UserModule.DASHBOARD },
  { href: "/dashboard/products", label: "Produtos", icon: Boxes, module: UserModule.ESTOQUE },
  { href: "/dashboard/categories", label: "Categorias", icon: Tags, module: UserModule.ESTOQUE },
  { href: "/dashboard/suppliers", label: "Fornecedores", icon: Building, module: UserModule.FORNECEDORES },
  { href: "/dashboard/movements", label: "Movimentações", icon: ArrowRightLeft, module: UserModule.MOVIMENTACOES },
  { href: "/dashboard/reports", label: "Relatórios", icon: ScrollText, module: UserModule.RELATORIOS },
];

/** 💸 FINANCEIRO */
const financeiroLinks = [
  { href: "/dashboard/accounts-payable", label: "Contas a Pagar", icon: Landmark, module: UserModule.CONTAS_PAGAR },
  { href: "/dashboard/accounts-payable/reports", label: "Relatório de Contas a Pagar", icon: BarChart2, module: UserModule.RELATORIO_CONTAS_PAGAR },
  { href: "/dashboard/contacts", label: "Lista de Contatos", icon: Contact, module: UserModule.CONTATOS },

  // Despesas de viagem + relatório
  { href: "/dashboard/travel-expenses", label: "Despesas de Viagem", icon: Plane, module: UserModule.CONTAS_PAGAR },
  { href: "/dashboard/reports/travel-expenses", label: "Relatório de Despesas de Viagem", icon: FilePieChart, module: UserModule.RELATORIOS },

  // Recebidos (financeiro)
  { href: "/dashboard/receivables", label: "Recebidos", icon: HandCoins, module: UserModule.CONTAS_PAGAR },
];

/** 🏛️ PREFEITURA */
const prefeituraLinks = [
  { href: "/dashboard/contracts", label: "Contratos", icon: FileText, module: UserModule.CONTAS_PAGAR },
  { href: "/dashboard/departments", label: "Órgãos / Secretarias", icon: Landmark, module: UserModule.CONTAS_PAGAR },
  { href: "/dashboard/municipalities", label: "Municípios", icon: Landmark, module: UserModule.CONTAS_PAGAR },
];

/** 👤 USUÁRIOS */
const usuariosLinks = [
  { href: "/dashboard/users", label: "Gerenciar Usuários", icon: Users, module: UserModule.USUARIOS },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // ⬅️➡️ Modo compacto/expandido
  const [collapsed, setCollapsed] = React.useState(false);

  if (!user) {
    return (
      <aside className={`flex-shrink-0 bg-white border-r border-gray-200 flex flex-col ${collapsed ? "w-20" : "w-64"}`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">Monitore</h1>
        </div>
        <div className="flex-grow flex items-center justify-center text-gray-400">Carregando...</div>
      </aside>
    );
  }

  // ✅ Permissões mais robustas
  const canAccessModule = (module: UserModule) => {
    if (user.role === "ADMIN") return true;
    const mods = user.modules as unknown;
    if (mods === "*") return true;
    if (Array.isArray(mods)) return (mods as UserModule[]).includes(module);
    if (typeof mods === "string") {
      const parts = mods.split(",").map((s) => s.trim());
      return parts.includes(String(module));
    }
    return false;
  };

  // Ativo
  const checkIsActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  // Render seção
  const renderSection = (title: string, links: typeof estoqueLinks) => (
    <div>
      <p
        className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ${collapsed ? "px-0 text-center" : "px-2"}`}
        title={collapsed ? title : undefined}
      >
        {collapsed ? title.slice(0, 1) : title}
      </p>
      <ul>
        {links.filter((l) => canAccessModule(l.module)).map((l) => {
          const isActive = checkIsActive(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                title={l.label}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} py-2 ${collapsed ? "px-0" : "px-3"} rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${isActive ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <l.icon size={20} />
                {!collapsed && <span>{l.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <aside
      className={`flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen ${collapsed ? "w-20" : "w-64"
        } transition-[width]`}
    >
      {/* Cabeçalho */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        <h1
          className={`text-xl font-bold text-blue-600 truncate ${collapsed ? "opacity-0 pointer-events-none w-0" : "opacity-100"
            } transition-opacity`}
        >
          Monitore
        </h1>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
          title={collapsed ? "Expandir" : "Recolher"}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-grow p-4 space-y-6 overflow-y-auto">
        {renderSection("Estoque", estoqueLinks)}
        {renderSection("Financeiro", financeiroLinks)}
        {renderSection("Prefeitura", prefeituraLinks)}
        {renderSection("Usuários", usuariosLinks)}
      </nav>

      {/* Rodapé / usuário */}
      <div className="p-4 border-t border-gray-200">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <UserCircle size={40} className="text-gray-400" />
          {!collapsed && (
            <div className="flex-grow">
              <p className="font-semibold text-gray-800 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.role}</p>
            </div>
          )}
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="text-gray-400 hover:text-red-500"
            title="Sair"
          >
            <Power size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
}
