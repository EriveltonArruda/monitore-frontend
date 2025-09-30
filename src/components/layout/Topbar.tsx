// src/app/dashboard/components/layout/Topbar.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bell, Clock, Search, X, Printer } from "lucide-react";

type NotificationCounts = {
  apOverdue?: number;
  apDue3?: number;
  apDue7?: number;
  contractsD30?: number;
  contractsD7?: number;
  contractsToday?: number;
  receivablesLate?: number;
};

type TopbarProps = {
  title: string;
  subtitle?: string;
  /** Mostra o input de busca que atualiza ?search= e reseta page=1 (default: true) */
  withSearch?: boolean;
  /** Placeholder do input de busca */
  searchPlaceholder?: string;
  /** Nó(s) à direita (ex.: botões de ação) */
  actions?: React.ReactNode;
  /** Nome do parâmetro de busca (default: "search") */
  searchParamName?: string;
  /** Classe extra do wrapper */
  className?: string;
  /** Exibir sino de notificações (default: true) */
  showNotifications?: boolean;
  /** Contadores opcionais para o dropdown do sino */
  notifications?: NotificationCounts;

  /* ========= NOVO: filtros avançados ========= */

  /**
   * Chips prontos para exibir (ex.: ["Status: Ativo", "Período: 01/01 a 31/01"]).
   * Se vazio/ausente, nada é exibido.
   */
  filterChips?: string[];

  /**
   * Caminho de impressão (ex.: "/dashboard/print/produtos").
   * Se informado, mostra um botão "Imprimir" que abre este caminho com os filtros atuais anexados.
   */
  printPath?: string;

  /**
   * Chaves que devem ser preservadas quando clicar em "Limpar filtros"
   * (ex.: ["module"] para manter um contexto).
   * Por padrão, nada é preservado; a página volta para ?page=1 sem outros filtros.
   */
  preserveKeys?: string[];

  /**
   * Ocultar/mostrar botão "Limpar filtros".
   * Por padrão, aparece se houver chips OU campo de busca preenchido.
   */
  showClearButton?: boolean;
};

export default function Topbar({
  title,
  subtitle,
  withSearch = true,
  searchPlaceholder = "Buscar...",
  actions,
  searchParamName = "search",
  className = "",
  showNotifications = true,
  notifications,

  // novos
  filterChips,
  printPath,
  preserveKeys = [],
  showClearButton,
}: TopbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const searchValue = searchParams.get(searchParamName) || "";

  const onChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val && val.trim() !== "") params.set(searchParamName, val);
    else params.delete(searchParamName);
    // sempre voltar pra primeira página ao alterar filtros
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  // Botão "Limpar filtros"
  const hasChips = Array.isArray(filterChips) && filterChips.length > 0;
  const hasSearch = withSearch && !!searchValue;
  const shouldShowClear =
    typeof showClearButton === "boolean" ? showClearButton : hasChips || hasSearch;

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    // remove tudo exceto as chaves preservadas
    for (const key of Array.from(params.keys())) {
      if (!preserveKeys.includes(key)) params.delete(key);
    }
    // garante que page volte a 1
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  // URL de imprimir com filtros atuais
  const printHref = (() => {
    if (!printPath) return null;
    const params = new URLSearchParams(searchParams.toString());
    // não precisamos de page/limit no PDF, mas manter não quebra nada; se quiser filtrar:
    // params.delete('page'); params.delete('limit');
    const qs = params.toString();
    return qs ? `${printPath}?${qs}` : printPath;
  })();

  // Sanitize + total
  const counts = useMemo(() => {
    const n = notifications ?? {};
    const v = (x?: number) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
    const safe = {
      apOverdue: v(n.apOverdue),
      apDue3: v(n.apDue3),
      apDue7: v(n.apDue7),
      contractsD30: v(n.contractsD30),
      contractsD7: v(n.contractsD7),
      contractsToday: v(n.contractsToday),
      receivablesLate: v(n.receivablesLate),
    };
    const total =
      safe.apOverdue +
      safe.apDue3 +
      safe.apDue7 +
      safe.contractsD30 +
      safe.contractsD7 +
      safe.contractsToday +
      safe.receivablesLate;
    return { ...safe, total };
  }, [notifications]);

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-3xl font-bold text-gray-800 truncate">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}

        {/* Chips visuais de filtros (opcional) */}
        {hasChips && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {filterChips!.map((c, i) => (
              <span
                key={`${c}-${i}`}
                className="px-2 py-0.5 text-xs bg-gray-100 border border-gray-200 rounded-full text-gray-700"
                title={c}
              >
                {c}
              </span>
            ))}

            {shouldShowClear && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
                title="Limpar todos os filtros"
              >
                <X size={12} />
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex w-full sm:w-auto items-center gap-2">
        {withSearch && (
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchValue}
              onChange={onChangeSearch}
              placeholder={searchPlaceholder}
              className="w-full border rounded-lg pl-8 pr-3 py-2"
            />
          </div>
        )}

        {/* Botão Limpar (também aparece mesmo sem chips, se houver busca) */}
        {shouldShowClear && !hasChips && (
          <button
            type="button"
            onClick={clearAll}
            className="px-2.5 py-2 text-sm text-gray-700 border rounded-lg hover:bg-gray-50"
            title="Limpar todos os filtros"
          >
            Limpar filtros
          </button>
        )}

        {/* Botão Imprimir com filtros atuais (opcional) */}
        {printHref && (
          <Link
            href={printHref}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Imprimir / Salvar PDF"
            prefetch={false}
          >
            <Printer size={16} />
            Imprimir
          </Link>
        )}

        {/* Sino de notificações (opcional) */}
        {showNotifications && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="relative rounded-lg p-2 border hover:bg-gray-50"
              aria-haspopup="menu"
              aria-expanded={open}
              title="Notificações"
            >
              <Bell size={18} className="text-gray-700" />
              {counts.total > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {counts.total}
                </span>
              )}
            </button>

            {open && (
              <div
                className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                role="menu"
                onMouseLeave={() => setOpen(false)}
              >
                <div className="px-3 py-2 border-b bg-gray-50 text-sm font-medium text-gray-700">
                  Notificações
                </div>

                <div className="max-h-80 overflow-auto text-sm">
                  <NotifSection
                    title="Contas a Pagar"
                    items={[
                      { label: "Vencidas", count: counts.apOverdue, href: "/dashboard/accounts-payable?status=VENCIDO" },
                      { label: "Vence em ≤ 3 dias", count: counts.apDue3, href: "/dashboard/accounts-payable" },
                      { label: "Vence em ≤ 7 dias", count: counts.apDue7, href: "/dashboard/accounts-payable" },
                    ]}
                  />
                  <NotifSection
                    title="Contratos"
                    items={[
                      { label: "D-30", count: counts.contractsD30, href: "/dashboard/contracts?dueInDays=30" },
                      { label: "D-7", count: counts.contractsD7, href: "/dashboard/contracts?dueInDays=7" },
                      { label: "Hoje", count: counts.contractsToday, href: "/dashboard/contracts?expiredOnly=true&dueInDays=0" },
                    ]}
                  />
                  <NotifSection
                    title="Recebíveis"
                    items={[
                      { label: "Atrasados", count: counts.receivablesLate, href: "/dashboard/receivables?status=ATRASADO" },
                    ]}
                  />
                </div>

                <div className="px-3 py-2 border-t bg-gray-50 text-right">
                  <Link
                    href="/dashboard/notifications"
                    className="text-xs text-blue-700 hover:underline inline-flex items-center gap-1"
                    onClick={() => setOpen(false)}
                  >
                    Ver tudo
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

function NotifSection({
  title,
  items,
}: {
  title: string;
  items: { label: string; count: number; href: string }[];
}) {
  const visible = items.filter((i) => (typeof i.count === "number" ? i.count > 0 : false));
  return (
    <div className="px-3 py-2 border-b last:border-b-0">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{title}</div>
      {visible.length === 0 ? (
        <div className="text-gray-400 text-xs">Sem notificações.</div>
      ) : (
        <ul className="space-y-1">
          {visible.map((i) => (
            <li key={i.label} className="flex items-center justify-between">
              <span className="text-gray-700 inline-flex items-center gap-1">
                <Clock size={12} className="text-gray-400" />
                {i.label}
              </span>
              <Link
                href={i.href}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md"
              >
                {i.count}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
