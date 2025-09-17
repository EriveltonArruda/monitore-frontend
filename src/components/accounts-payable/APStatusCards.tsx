"use client";

import { AlertTriangle, CheckCircle2, Clock, Hourglass, XOctagon } from "lucide-react";
import React from "react";

type Bucket = { count: number; amount: number };
type Summary = {
  period: { from: string; to: string } | null;
  totals: Bucket;
  buckets: {
    VENCIDO: Bucket;
    ABERTO: Bucket;
    PAGO: Bucket;
    DUE_7?: Bucket;
    DUE_3?: Bucket;
  };
  currency?: string;
};

type Props = {
  summary: Summary | null;
};

const moneyBRL = (n: number) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Card = ({
  title,
  value,
  subtitle,
  icon,
  className,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  className: string;
}) => (
  <div
    className={`flex flex-1 min-w-[200px] items-center gap-3 rounded-xl p-4 border shadow-sm ${className}`}
  >
    <div className="p-2 rounded-lg bg-white/60">{icon}</div>
    <div className="flex flex-col">
      <span className="text-sm text-white/90">{title}</span>
      <span className="text-xl font-semibold text-white leading-6">{value}</span>
      <span className="text-xs text-white/80">{subtitle}</span>
    </div>
  </div>
);

const Skeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-[84px] rounded-xl bg-gray-100 animate-pulse" />
    ))}
  </div>
);

export function APStatusCards({ summary }: Props) {
  if (!summary) return <Skeleton />;

  const { buckets } = summary;
  const due7 = buckets.DUE_7 ?? { count: 0, amount: 0 };
  const due3 = buckets.DUE_3 ?? { count: 0, amount: 0 };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
      <Card
        title="Vencido"
        value={moneyBRL(buckets.VENCIDO.amount)}
        subtitle={`${buckets.VENCIDO.count} conta(s)`}
        icon={<XOctagon size={22} className="text-white" />}
        className="bg-red-600 border-red-700"
      />

      <Card
        title="≤ 7 dias"
        value={moneyBRL(due7.amount)}
        subtitle={`${due7.count} a vencer`}
        icon={<Clock size={22} className="text-white" />}
        className="bg-amber-500 border-amber-600"
      />

      <Card
        title="≤ 3 dias"
        value={moneyBRL(due3.amount)}
        subtitle={`${due3.count} a vencer`}
        icon={<Hourglass size={22} className="text-white" />}
        className="bg-orange-500 border-orange-600"
      />

      <Card
        title="Aberto"
        value={moneyBRL(buckets.ABERTO.amount)}
        subtitle={`${buckets.ABERTO.count} conta(s)`}
        icon={<AlertTriangle size={22} className="text-white" />}
        className="bg-blue-600 border-blue-700"
      />

      <Card
        title="Pago"
        value={moneyBRL(buckets.PAGO.amount)}
        subtitle={`${buckets.PAGO.count} conta(s)`}
        icon={<CheckCircle2 size={22} className="text-white" />}
        className="bg-green-600 border-green-700"
      />
    </div>
  );
}
