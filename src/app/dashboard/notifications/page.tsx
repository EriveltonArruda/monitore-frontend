// src/app/dashboard/notifications/page.tsx
import Link from "next/link";
import { Bell, Clock, CalendarDays, AlertTriangle, ArrowRight } from "lucide-react";

export const revalidate = 0;

export default function NotificationsPage() {
  // util: criação de links com classes consistentes
  const A = (
    { href, children, title }: { href: string; children: React.ReactNode; title?: string }
  ) => (
    <Link
      href={href}
      title={title}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
    >
      {children}
      <ArrowRight size={14} className="ml-0.5" />
    </Link>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Notificações</h1>
            <p className="text-sm text-gray-500">
              Atalhos rápidos para itens que exigem atenção (sem backend).
            </p>
          </div>
        </div>
      </div>

      {/* Grid de seções */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CONTRATOS */}
        <section className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Contratos</h2>
          <p className="text-sm text-gray-500 mb-3">
            Vencimentos por proximidade ou já expirados.
          </p>

          <div className="flex flex-col gap-2">
            <A
              href="/dashboard/contracts?expiredOnly=true&order=asc"
              title="Mostrar apenas contratos expirados"
            >
              <AlertTriangle size={16} /> Expirados
            </A>

            <A
              href="/dashboard/contracts?dueInDays=7&order=asc"
              title="Contratos que vencem em até 7 dias"
            >
              <Clock size={16} /> Vencendo em ≤ 7 dias
            </A>

            <A
              href="/dashboard/contracts?dueInDays=30&order=asc"
              title="Contratos que vencem em até 30 dias"
            >
              <CalendarDays size={16} /> Vencendo em ≤ 30 dias
            </A>

            <A
              href="/dashboard/contracts?endFrom=&endTo=&order=asc"
              title="Ir para lista de contratos"
            >
              Ver todos
            </A>
          </div>
        </section>

        {/* CONTAS A PAGAR */}
        <section className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Contas a Pagar</h2>
          <p className="text-sm text-gray-500 mb-3">
            Itens por status (veja detalhes/alertas na lista).
          </p>

          <div className="flex flex-col gap-2">
            <A
              href="/dashboard/accounts-payable?status=VENCIDO"
              title="Contas vencidas"
            >
              <AlertTriangle size={16} /> Vencidas
            </A>

            <A
              href="/dashboard/accounts-payable?status=A_PAGAR"
              title="Contas ainda a pagar"
            >
              <Clock size={16} /> A Pagar
            </A>

            <A
              href="/dashboard/accounts-payable?status=PAGO"
              title="Contas pagas"
            >
              <CalendarDays size={16} /> Pagas
            </A>

            <A
              href="/dashboard/accounts-payable"
              title="Ir para Contas a Pagar"
            >
              Ver todas
            </A>
          </div>
        </section>

        {/* RECEBÍVEIS */}
        <section className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Recebíveis</h2>
          <p className="text-sm text-gray-500 mb-3">
            Atalhos por status para contratos.
          </p>

          <div className="flex flex-col gap-2">
            <A
              href="/dashboard/receivables?status=ATRASADO"
              title="Recebíveis atrasados"
            >
              <AlertTriangle size={16} /> Atrasados
            </A>

            <A
              href="/dashboard/receivables?status=A_RECEBER"
              title="Recebíveis pendentes"
            >
              <Clock size={16} /> A Receber
            </A>

            <A
              href="/dashboard/receivables?status=RECEBIDO"
              title="Recebíveis já recebidos"
            >
              <CalendarDays size={16} /> Recebidos
            </A>

            <A
              href="/dashboard/receivables"
              title="Ir para Recebíveis"
            >
              Ver todos
            </A>
          </div>
        </section>
      </div>
    </div>
  );
}
