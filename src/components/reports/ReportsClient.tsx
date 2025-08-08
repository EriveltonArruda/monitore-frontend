"use client";

import {
  Boxes,
  DollarSign,
  ArrowRightLeft,
  TriangleAlert,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

// Tipos para os dados recebidos como props
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

const API_BASE = 'http://localhost:3001';

function formatCurrencyBR(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function tsFilename(prefix: string, ext: 'pdf' | 'xlsx') {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `${prefix}_${stamp}.${ext}`;
}

async function download(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'Falha ao baixar arquivo');
  }
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

export function ReportsClient({ data }: { data: ReportData }) {
  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Relatórios</h1>
          <p className="text-sm text-gray-500">Análise completa do seu estoque e movimentações</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg">
            Visão Geral
          </button>

          {/* Exportações reais via backend */}
          <button
            onClick={() => download(`${API_BASE}/products/export-pdf`, tsFilename('relatorio_produtos', 'pdf'))}
            className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
            title="Exportar lista de produtos em PDF"
          >
            <Download size={16} />
            <span>Exportar PDF (Produtos)</span>
          </button>

          <button
            onClick={() => download(`${API_BASE}/products/export-excel`, tsFilename('relatorio_produtos', 'xlsx'))}
            className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
            title="Exportar lista de produtos em Excel"
          >
            <Download size={16} />
            <span>Exportar Excel (Produtos)</span>
          </button>
        </div>
      </div>

      {/* Conteúdo da página (somente visual) */}
      <div className="space-y-8">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard icon={Boxes} title="Total de Produtos" value={data.summaryCards.totalProducts.toString()} />
          <SummaryCard icon={DollarSign} title="Valor do Estoque" value={formatCurrencyBR(data.summaryCards.stockValue)} />
          <SummaryCard icon={ArrowRightLeft} title="Movimentações" value={data.summaryCards.totalMovements.toString()} />
          <SummaryCard icon={TriangleAlert} title="Estoque Baixo" value={data.summaryCards.lowStockProducts.toString()} isAlert />
        </div>

        {/* Gráficos em duas colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Produtos por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data.productsByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {data.productsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Valor por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.valueByCategory}>
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => formatCurrencyBR(v as number)} />
                <Tooltip formatter={(v) => formatCurrencyBR(v as number)} />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Valor em Estoque" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Movimentações */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Movimentações dos Últimos 7 Dias</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.movementsLast7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" name="Movimentações" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para os cards de resumo
const SummaryCard = ({ icon: Icon, title, value, isAlert }: { icon: React.ElementType, title: string, value: string, isAlert?: boolean }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm">
    <div className="flex justify-between items-start">
      <p className="text-sm font-semibold text-gray-500">{title}</p>
      <Icon size={20} className={isAlert ? 'text-yellow-500' : 'text-gray-400'} />
    </div>
    <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
  </div>
);
