import {
  Boxes,
  DollarSign,
  ArrowRightLeft,
  TriangleAlert,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

type RecentMovement = {
  id: number;
  type: string;
  quantity: number;
  details: string | null;
  relatedParty: string | null;
  document: string | null;
  unitPriceAtMovement: number | null;
  createdAt: string;
  product: {
    name: string;
  };
};

type LowStockProduct = {
  id: number;
  name: string;
  stockQuantity: number;
  minStockQuantity: number;
};

type DashboardSummary = {
  totalProducts: number;
  totalMovements: number;
  stockValue: number;
  lowStockProductsCount: number;
  recentMovements: RecentMovement[];
  lowStockProducts: LowStockProduct[];
};

export function DashboardContent({ summary }: { summary: DashboardSummary }) {
  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500">Visão geral do seu estoque em tempo real</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/movements" className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
            <ArrowRightLeft size={16} />
            <span>Nova Movimentação</span>
          </Link>
          <Link href="/dashboard/products" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
            <PlusCircle size={20} />
            <span>Novo Produto</span>
          </Link>
        </div>
      </div>

      {/* Estrutura do Layout Principal */}
      <div className="space-y-8">
        {/* LINHA 1: Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard icon={CheckCircle2} title="Total de Produtos" value={summary.totalProducts.toString()} description="Produtos cadastrados" />
          <SummaryCard icon={DollarSign} title="Valor do Estoque" value={formatCurrency(summary.stockValue)} description="Valor total em produtos" />
          <SummaryCard icon={BarChart2} title="Movimentações" value={summary.totalMovements.toString()} description="Últimas movimentações" />
          <SummaryCard icon={TriangleAlert} title="Estoque Baixo" value={summary.lowStockProductsCount.toString()} description="Produtos com estoque baixo" isAlert />
        </div>

        {/* LINHA 2: Grid com duas colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna da Esquerda (Maior) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Movimentações Recentes</h3>
              <div className="space-y-2">
                {summary.recentMovements.map((mov) => (<RecentMovementItem key={mov.id} movement={mov} />))}
                {summary.recentMovements.length === 0 && <p className="text-sm text-gray-500">Nenhuma movimentação recente.</p>}
              </div>
            </div>
          </div>

          {/* Coluna da Direita (Menor) */}
          <div className="space-y-8">
            <div className="bg-yellow-50 p-6 rounded-xl">
              <h3 className="text-lg font-bold text-yellow-800 mb-4">Estoque Baixo</h3>
              <div className="space-y-3">
                {summary.lowStockProducts.length > 0 ? (
                  summary.lowStockProducts.map(product => (
                    <div key={product.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Boxes size={20} className="text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          {product.stockQuantity} unidades &middot; Mín {product.minStockQuantity}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-yellow-700">Nenhum produto com estoque baixo.</p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Ações Rápidas</h3>
              <div className="space-y-1">
                <QuickActionLink icon={Boxes} href="/dashboard/products" title="Gerenciar Produtos" description="Adicionar ou editar produtos" />
                <QuickActionLink icon={ArrowRightLeft} href="/dashboard/movements" title="Registrar Movimento" description="Entrada ou saída de estoque" />
                <QuickActionLink icon={BarChart2} href="/dashboard/reports" title="Ver Relatórios" description="Análises e métricas" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---
const SummaryCard = ({ icon: Icon, title, value, description, isAlert }: { icon: React.ElementType, title: string, value: string, description: string, isAlert?: boolean }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm">
    <div className="flex justify-between items-start">
      <p className="text-sm font-semibold text-gray-500">{title}</p>
      <Icon size={20} className={isAlert ? 'text-yellow-500' : 'text-gray-400'} />
    </div>
    <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
    <p className="text-xs text-gray-400">{description}</p>
  </div>
);

const RecentMovementItem = ({ movement }: { movement: RecentMovement }) => {
  const isEntry = movement.type === 'ENTRADA';
  const totalValue = (movement.unitPriceAtMovement || 0) * movement.quantity;
  const movementTypeLabel = movement.type.charAt(0).toUpperCase() + movement.type.slice(1).toLowerCase();

  return (
    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50">
      <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isEntry ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
        {isEntry ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-center">
          <p className="font-bold text-gray-800">{movement.product.name}
            <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${isEntry ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {movementTypeLabel}
            </span>
          </p>
          <p className="font-semibold text-gray-800 text-right">{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          <span>Qtd: {movement.quantity}</span>
          <span className="mx-1.5">&middot;</span>
          <span>{movement.details}</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 text-right w-28">{format(new Date(movement.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
    </div>
  );
};

const QuickActionLink = ({ icon: Icon, href, title, description }: { icon: React.ElementType, href: string, title: string, description: string }) => (
  <Link href={href} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600">
      <Icon size={20} />
    </div>
    <div>
      <p className="font-semibold text-gray-800">{title}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </Link>
);