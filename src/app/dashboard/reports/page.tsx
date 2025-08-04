import { ReportsClient } from '@/components/reports/ReportsClient';
import { RequireModule } from "@/components/RequireModule";
import { UserModule } from "@/types/UserModule";

// A definição de tipos para os dados que vêm da API
type ReportData = {
  summaryCards: {
    totalProducts: number;
    stockValue: number;
    totalMovements: number;
    lowStockProducts: number;
  };
  productsByCategory: { name: string; value: number }[];
  valueByCategory: { name: string; value: number }[];
  movementsLast7Days: { date: string; count: number }[];
};

// Função que busca os dados do nosso endpoint de relatórios
async function getReportData(): Promise<ReportData> {
  const response = await fetch('http://localhost:3001/reports/general', {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Falha ao buscar dados do relatório');
  }
  return response.json();
}

export default async function ReportsPage() {
  const reportData = await getReportData();

  // Passamos os dados para o componente cliente, que cuidará da renderização
  return (
    <RequireModule module={UserModule.RELATORIOS}>
      <ReportsClient data={reportData} />;
    </RequireModule>
  )
}
