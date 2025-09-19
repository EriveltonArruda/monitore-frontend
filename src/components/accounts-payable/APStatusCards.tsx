// src/components/accounts-payable/APStatusCards.tsx
"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, BellRing, Timer, FolderOpen } from "lucide-react";

type Summary = {
  period: { from: string; to: string } | null;
  totals: { count: number; amount: number };
  buckets: {
    VENCIDO: { count: number; amount: number };
    ABERTO: { count: number; amount: number };
    PAGO: { count: number; amount: number };
    DUE_7?: { count: number; amount: number };
    DUE_3?: { count: number; amount: number };
  };
};

type Props = {
  summary: Summary | null;
};

const money = (n: number) =>
  (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function APStatusCards({ summary }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const applyFilter = (patch: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    });
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  // Ações de clique:
  // - Vencido => status=VENCIDO
  // - Aberto  => status=A_PAGAR
  // - Pago    => status=PAGO
  // - D-7 / D-3 => garantimos mês/ano atuais e tiramos status (mostrar tudo do período)
  const now = new Date();
  const currMonth = String(now.getMonth() + 1);
  const currYear = String(now.getFullYear());

  const clickVencido = () => applyFilter({ status: "VENCIDO" });
  const clickAberto = () => applyFilter({ status: "A_PAGAR" });
  const clickPago = () => applyFilter({ status: "PAGO" });
  const clickD7 = () =>
    applyFilter({ month: currMonth, year: currYear, status: null });
  const clickD3 = () =>
    applyFilter({ month: currMonth, year: currYear, status: null });

  const cards = [
    {
      key: "DUE_7",
      title: "≤ 7 dias",
      value: summary?.buckets.DUE_7?.count ?? 0,
      amount: summary?.buckets.DUE_7?.amount ?? 0,
      icon: Timer,
      className: "bg-amber-50 border-amber-200",
      onClick: clickD7,
    },
    {
      key: "DUE_3",
      title: "≤ 3 dias",
      value: summary?.buckets.DUE_3?.count ?? 0,
      amount: summary?.buckets.DUE_3?.amount ?? 0,
      icon: BellRing,
      className: "bg-orange-50 border-orange-200",
      onClick: clickD3,
    },
    {
      key: "VENCIDO",
      title: "Vencido",
      value: summary?.buckets.VENCIDO?.count ?? 0,
      amount: summary?.buckets.VENCIDO?.amount ?? 0,
      icon: AlertTriangle,
      className: "bg-red-50 border-red-200",
      onClick: clickVencido,
    },
    {
      key: "ABERTO",
      title: "Aberto",
      value: summary?.buckets.ABERTO?.count ?? 0,
      amount: summary?.buckets.ABERTO?.amount ?? 0,
      icon: FolderOpen,
      className: "bg-yellow-50 border-yellow-200",
      onClick: clickAberto,
    },
    {
      key: "PAGO",
      title: "Pago",
      value: summary?.buckets.PAGO?.count ?? 0,
      amount: summary?.buckets.PAGO?.amount ?? 0,
      icon: CheckCircle2,
      className: "bg-emerald-50 border-emerald-200",
      onClick: clickPago,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
      {cards.map(({ key, title, value, amount, icon: Icon, className, onClick }) => (
        <button
          key={key}
          onClick={onClick}
          className={`text-left rounded-xl border p-3 shadow-sm hover:shadow transition ${className}`}
          title={`Filtrar por: ${title}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{title}</span>
            <Icon size={18} className="text-gray-500" />
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-800">{value}</div>
          <div className="text-xs text-gray-500 mt-0.5">{money(Number(amount))}</div>
        </button>
      ))}
    </div>
  );
}

export default APStatusCards;
