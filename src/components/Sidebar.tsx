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
  Plane,         // ⟵ ícone Despesas de Viagem
  FilePieChart,  // ⟵ ícone Relatório de Despesas
  FileText,      // ⟵ ícone Contratos
  HandCoins,     // ⟵ ícone Recebidos
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

  // Obs.: usando CONTAS_PAGAR como permissão base para não quebrar seu enum.
  // Se depois você criar UserModule.TRAVEL_EXPENSES / TRAVEL_EXPENSES_REPORT, é só trocar aqui.
  { href: "/dashboard/travel-expenses", label: "Despesas de Viagem", icon: Plane, module: UserModule.CONTAS_PAGAR },
  { href: "/dashboard/reports/travel-expenses", label: "Relatório de Despesas (Em Construção)", icon: FilePieChart, module: UserModule.RELATORIOS },

  // Recebidos (financeiro)
  { href: "/dashboard/receivables", label: "Recebidos", icon: HandCoins, module: UserModule.CONTAS_PAGAR },
];

/** 🏛️ PREFEITURA */
const prefeituraLinks = [
  // Mantendo a mesma regra de permissão por enquanto (CONTAS_PAGAR).
  // Quando criar enums específicos (ex.: CONTRATOS / RECEBIVEIS), basta atualizar aqui.
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

  // ✅ Permissões mais robustas (cobre "*", array ou string/CSV)
  const canAccessModule = (module: UserModule) => {
    if (user.role === "ADMIN") return true; // Admin tem acesso total

    const mods = user.modules as unknown;
    if (mods === "*") return true;

    if (Array.isArray(mods)) {
      return (mods as UserModule[]).includes(module);
    }

    if (typeof mods === "string") {
      const parts = mods.split(",").map((s) => s.trim());
      // compara por string do enum (garante compatibilidade)
      return parts.includes(String(module));
    }

    return false;
  };

  // Helper para verificar link ativo
  const checkIsActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  // Render genérico de sessão para evitar repetição
  const renderSection = (title: string, links: typeof estoqueLinks) => (
    <div>
      {/* Título da seção */}
      <p
        className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ${collapsed ? "px-0 text-center" : "px-2"
          }`}
        title={collapsed ? title : undefined}
      >
        {collapsed ? title.slice(0, 1) : title}
      </p>

      {/* Lista de links */}
      <ul>
        {links
          .filter((link) => canAccessModule(link.module))
          .map((link) => {
            const isActive = checkIsActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  title={link.label} // ajuda no modo compacto
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} py-2 ${collapsed ? "px-0" : "px-3"
                    } rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${isActive ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <link.icon size={20} />
                  {!collapsed && <span>{link.label}</span>}
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
        {/* Logo */}
        <h1
          className={`text-xl font-bold text-blue-600 truncate ${collapsed ? "opacity-0 pointer-events-none w-0" : "opacity-100"
            } transition-opacity`}
        >
          Monitore
        </h1>

        {/* Botão colapsar/expandir */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
          title={collapsed ? "Expandir" : "Recolher"}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>

      {/* Navegação com rolagem interna */}
      <nav className="flex-grow p-4 space-y-6 overflow-y-auto">
        {/* 🟦 ESTOQUE */}
        {renderSection("Estoque", estoqueLinks)}

        {/* 💸 FINANCEIRO */}
        {renderSection("Financeiro", financeiroLinks)}

        {/* 🏛️ PREFEITURA */}
        {renderSection("Prefeitura", prefeituraLinks)}

        {/* 👤 USUÁRIOS */}
        {renderSection("Usuários", usuariosLinks)}
      </nav>

      {/* Perfil do Usuário (fixo no rodapé) */}
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
              logout(); // Limpa o usuário e o cookie
              router.push("/login"); // Redireciona para o login
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
