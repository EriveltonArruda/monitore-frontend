"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PlusCircle, ArrowUpRight, ArrowDownLeft, Wrench, Trash2, Filter, Search } from "lucide-react";
import { MovementFormModal } from "./MovementFormModal";
import { Pagination } from "../Pagination";
import { DeleteConfirmationModal } from "../DeleteConfirmationModal";

// Tipos
type Product = { id: number; name: string; salePrice: number; };
type Supplier = { id: number; name: string; };
type Movement = {
  id: number; type: string; quantity: number; details: string | null; document: string | null;
  relatedParty: string | null; unitPriceAtMovement: number | null; notes: string | null;
  createdAt: string; product: Product;
};

type MovementsPageClientProps = {
  initialMovements: Movement[];
  totalMovements: number;
  products: Product[];
  suppliers: Supplier[];
};

const ITEMS_PER_PAGE = 10;

const TYPE_OPTIONS = [
  { value: "", label: "Todos os Tipos" },
  { value: "ENTRADA", label: "Entrada" },
  { value: "SAIDA", label: "Saída" },
  { value: "AJUSTE", label: "Ajuste" }
];

const PERIOD_OPTIONS = [
  { value: "", label: "Todo Período" },
  { value: "today", label: "Hoje" },
  { value: "last7", label: "Última Semana" },
  { value: "last30", label: "Último Mês" }
];

export function MovementsPageClient({
  initialMovements,
  totalMovements,
  products,
  suppliers,
}: MovementsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Inicializa os filtros lendo da URL
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "");
  const [selectedProduct, setSelectedProduct] = useState(searchParams.get("productId") || "");
  const [selectedPeriod, setSelectedPeriod] = useState(searchParams.get("period") || "");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");

  // Atualiza a URL com filtros (incluindo busca)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedType) params.set("type", selectedType); else params.delete("type");
    if (selectedProduct) params.set("productId", selectedProduct); else params.delete("productId");
    if (selectedPeriod) params.set("period", selectedPeriod); else params.delete("period");
    if (searchTerm) params.set("search", searchTerm); else params.delete("search");
    params.set("page", "1"); // Volta pra página 1 ao filtrar
    // Debounce pra não buscar a cada tecla
    const timer = setTimeout(() => {
      router.push(`${pathname}?${params.toString()}`);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [selectedType, selectedProduct, selectedPeriod, searchTerm]);

  // Modal de exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMovement, setDeletingMovement] = useState<Movement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal de movimentação
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingMovement) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`http://localhost:3001/stock-movements/${deletingMovement.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir movimentação!");
      setIsDeleteModalOpen(false);
      setDeletingMovement(null);
      window.location.reload();
    } catch (error: any) {
      alert(error.message || "Erro ao excluir movimentação!");
    } finally {
      setIsDeleting(false);
    }
  };

  // Paginação
  const totalPages = Math.ceil(totalMovements / ITEMS_PER_PAGE);
  const currentPage = Number(searchParams.get("page")) || 1;

  const formatCurrency = (value: number | null) => {
    if (value === null || typeof value === 'undefined') return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* MODAL DE EXCLUSÃO */}
      {isDeleteModalOpen && deletingMovement && (
        <DeleteConfirmationModal
          itemName={deletingMovement.product.name}
          onConfirm={handleDeleteConfirm}
          onClose={() => setIsDeleteModalOpen(false)}
          isDeleting={isDeleting}
        />
      )}

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
        <Filter size={18} className="text-gray-500" />
        <select title='Tipo de Movimentação'
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700"
        >
          {TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select title='Todos os Produtos'
          value={selectedProduct}
          onChange={e => setSelectedProduct(e.target.value)}
          className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700"
        >
          <option value="">Todos os Produtos</option>
          {products.map(prod => (
            <option key={prod.id} value={String(prod.id)}>{prod.name}</option>
          ))}
        </select>
        <select title='Período de Movimentação'
          value={selectedPeriod}
          onChange={e => setSelectedPeriod(e.target.value)}
          className="h-10 border border-gray-200 rounded-lg bg-white px-2 text-gray-700"
        >
          {PERIOD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="relative flex-grow max-w-xs">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar movimentação..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg"
          />
        </div>
      </div>

      {/* Histórico de Movimentações */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            Histórico de Movimentações ({totalMovements})
          </h2>
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
                <div className="col-span-3 text-right flex items-center justify-end gap-2">
                  <div>
                    <p className="font-bold text-lg text-gray-800">{formatCurrency(totalValue)}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(mov.unitPriceAtMovement)}/un</p>
                  </div>
                  <button
                    title="Excluir movimentação"
                    className="ml-4 text-gray-400 hover:text-red-600 transition-colors"
                    onClick={() => { setDeletingMovement(mov); setIsDeleteModalOpen(true); }}
                    disabled={isDeleting}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )
          })}
          {initialMovements.length === 0 && <p className="text-center text-gray-500 py-8">Nenhuma movimentação registrada.</p>}
        </div>
      </div>

      {/* Paginação */}
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}

// COMPONENTES AUXILIARES
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
  const styles: { [key: string]: { color: string; label: string; icon: React.ElementType } } = {
    ENTRADA: { color: 'text-green-700 bg-green-100', label: 'Entrada', icon: ArrowUpRight },
    SAIDA: { color: 'text-red-700 bg-red-100', label: 'Saída', icon: ArrowDownLeft },
    AJUSTE: { color: 'text-blue-700 bg-blue-100', label: 'Ajuste', icon: Wrench },
    AVARIA: { color: 'text-yellow-700 bg-yellow-100', label: 'Avaria', icon: Wrench },
    EMPRESTIMO: { color: 'text-purple-700 bg-purple-100', label: 'Empréstimo', icon: ArrowDownLeft },
    PERDA: { color: 'text-gray-700 bg-gray-100', label: 'Perda', icon: ArrowDownLeft },
    USO_INTERNO: { color: 'text-indigo-700 bg-indigo-100', label: 'Uso Interno', icon: ArrowDownLeft },
  };

  const info = styles[type] || styles.AJUSTE;
  const Icon = info.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${info.color}`}>
      <Icon size={14} />
      {info.label}
    </span>
  );
};
