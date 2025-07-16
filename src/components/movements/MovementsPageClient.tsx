"use client";

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlusCircle, ArrowUpRight, ArrowDownLeft, Wrench } from 'lucide-react';
import { MovementFormModal } from './MovementFormModal';
import { Pagination } from '../Pagination'; // Importamos nosso componente padrão

// --- DEFINIÇÃO DE TIPOS ---
type Product = { id: number; name: string; salePrice: number; };
type Supplier = { id: number; name: string; };
type Movement = {
  id: number; type: string; quantity: number; details: string | null; document: string | null;
  relatedParty: string | null; unitPriceAtMovement: number | null; notes: string | null;
  createdAt: string; product: Product;
};

type MovementsPageClientProps = {
  initialMovements: Movement[];
  totalMovements: number; // Nova prop para o total de itens
  products: Product[];
  suppliers: Supplier[];
};

const ITEMS_PER_PAGE = 10;

export function MovementsPageClient({ initialMovements, totalMovements, products, suppliers }: MovementsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchParams = useSearchParams();

  // Lógica para a paginação
  const totalPages = Math.ceil(totalMovements / ITEMS_PER_PAGE);
  const currentPage = Number(searchParams.get('page')) || 1;

  // Função para formatar moeda
  const formatCurrency = (value: number | null) => {
    if (value === null || typeof value === 'undefined') return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {isModalOpen && <MovementFormModal onClose={() => setIsModalOpen(false)} products={products} suppliers={suppliers} />}

      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Movimentações</h1>
          <p className="text-sm text-gray-500">Registre entradas, saídas e ajustes de estoque</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
          <PlusCircle size={20} />
          <span>Nova Movimentação</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-8 flex items-center gap-4">
        <h3 className="font-semibold text-gray-600">Filtros:</h3>
        <select title='Todos os Tipos' className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700"><option>Todos os Tipos</option></select>
        <select title='Todos os Produtos' className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700"><option>Todos os Produtos</option></select>
        <select title='Todos os Fornecedores' className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700"><option>Todo Período</option></select>
      </div>

      {/* Histórico de Movimentações */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Histórico de Movimentações ({totalMovements})</h2>
        </div>
        <div className="p-6 space-y-4">
          {initialMovements.map(mov => {
            const totalValue = (mov.unitPriceAtMovement || 0) * mov.quantity;
            return (
              <div key={mov.id} className="grid grid-cols-12 gap-4 items-center p-4 rounded-lg hover:bg-gray-50 border-b last:border-b-0">
                <div className="col-span-1">
                  <MovementIcon type={mov.type} />
                </div>
                <div className="col-span-5">
                  <p className="font-bold text-gray-800 flex items-center gap-2">
                    <span>{mov.product.name}</span>
                    <MovementTypeTag type={mov.type} />
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    <span>Qtd: {mov.quantity}</span>
                    <span className="mx-1.5">&middot;</span>
                    <span>{mov.details}</span>
                    <span className="mx-1.5">&middot;</span>
                    <span>{mov.type === 'ENTRADA' ? 'Forn.' : 'Cli.'}: {mov.relatedParty || 'N/A'}</span>
                    <span className="mx-1.5">&middot;</span>
                    <span>Doc: {mov.document || 'N/A'}</span>
                  </p>
                  {mov.notes && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      Obs: {mov.notes}
                    </p>
                  )}
                </div>
                <div className="col-span-3 text-right text-sm text-gray-500">
                  {format(new Date(mov.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
                <div className="col-span-3 text-right">
                  <p className="font-bold text-lg text-gray-800">{formatCurrency(totalValue)}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(mov.unitPriceAtMovement)}/un</p>
                </div>
              </div>
            )
          })}
          {initialMovements.length === 0 && <p className="text-center text-gray-500 py-8">Nenhuma movimentação registrada.</p>}
        </div>
      </div>

      {/* Componente de Paginação Adicionado */}
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}

// --- COMPONENTES AUXILIARES PARA ESTILIZAÇÃO ---
// Preservando suas customizações completas

const MovementIcon = ({ type }: { type: string }) => {
  const styles: { [key: string]: { icon: React.ElementType; color: string } } = {
    ENTRADA: { icon: ArrowUpRight, color: 'text-green-600 bg-green-100' },
    SAIDA: { icon: ArrowDownLeft, color: 'text-red-600 bg-red-100' },
    AJUSTE: { icon: Wrench, color: 'text-blue-600 bg-blue-100' },
    AVARIA: { icon: Wrench, color: 'text-yellow-600 bg-yellow-100' },
    EMPRESTIMO: { icon: ArrowDownLeft, color: 'text-purple-600 bg-purple-100' },
    PERDA: { icon: ArrowDownLeft, color: 'text-gray-600 bg-gray-100' },
    USO_INTERNO: { icon: ArrowDownLeft, color: 'text-indigo-600 bg-indigo-100' },
  };
  const info = styles[type] || styles.AJUSTE;
  const Icon = info.icon;
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${info.color}`}><Icon size={20} /></div>
  );
}

const MovementTypeTag = ({ type }: { type: string }) => {
  const styles: { [key: string]: { color: string; label: string } } = {
    ENTRADA: { color: 'text-green-700 bg-green-100', label: 'Entrada' },
    SAIDA: { color: 'text-red-700 bg-red-100', label: 'Saída' },
    AJUSTE: { color: 'text-blue-700 bg-blue-100', label: 'Ajuste' },
    AVARIA: { color: 'text-yellow-700 bg-yellow-100', label: 'Avaria' },
    EMPRESTIMO: { color: 'text-purple-700 bg-purple-100', label: 'Empréstimo' },
    PERDA: { color: 'text-gray-700 bg-gray-100', label: 'Perda' },
    USO_INTERNO: { color: 'text-indigo-700 bg-indigo-100', label: 'Uso Interno' },
  };
  const info = styles[type] || styles.AJUSTE;
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${info.color}`}>{info.label}</span>
  )
}