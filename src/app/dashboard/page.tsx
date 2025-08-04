'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserModule } from '@/types/UserModule';
import { DashboardContent } from '../../components/dashboard/DashboardContent';

type DashboardSummary = Parameters<typeof DashboardContent>[0]['summary'];

const moduleToHome: Record<UserModule, string> = {
  [UserModule.CONTAS_PAGAR]: '/dashboard/accounts-payable',
  [UserModule.ESTOQUE]: '/dashboard/products',
  [UserModule.MOVIMENTACOES]: '/dashboard/movements',
  [UserModule.RELATORIOS]: '/dashboard/reports',
  [UserModule.USUARIOS]: '/dashboard/users',
  [UserModule.DASHBOARD]: '/dashboard',
  [UserModule.FORNECEDORES]: '/dashboard/suppliers',
  [UserModule.CATEGORIAS]: '/dashboard/categories',
  [UserModule.CONTATOS]: '/dashboard/contacts',
  [UserModule.RELATORIO_CONTAS_PAGAR]: '/dashboard/accounts-payable/reports',
};

async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch('http://localhost:3001/dashboard', {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Falha ao buscar os dados do dashboard');
  return response.json();
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'ADMIN' && !user.modules.includes(UserModule.DASHBOARD)) {
      const firstModule = user.modules[0] as UserModule | undefined;
      router.replace(
        (firstModule && moduleToHome[firstModule]) || '/not-authorized'
      );
      return;
    }

    getDashboardSummary()
      .then((data) => setSummary(data))
      .finally(() => setDataLoading(false));
  }, [user, loading, router]);

  if (loading || dataLoading) return <div>Carregando...</div>;
  if (!user) return null;
  if (user.role === 'ADMIN' || user.modules.includes(UserModule.DASHBOARD)) {
    return summary ? <DashboardContent summary={summary} /> : null;
  }
  return null;
}