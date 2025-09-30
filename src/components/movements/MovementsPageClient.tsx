"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  PlusCircle, ArrowUpRight, ArrowDownLeft, Wrench,
  Trash2, Filter, Search, Eye, X, Printer, FileDown
} from "lucide-react";
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
const API_BASE = "http://localhost:3001";

// ---- helpers de download PDF ----
async function download(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Falha ao baixar arquivo");
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}
function tsFilename(prefix: string, ext: "pdf") {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `${prefix}_${stamp}.${ext}`;
}

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

// 🔧 converte o filtro de período em dateFrom/dateTo (YYYY-MM-DD)
function periodToRange(period: string): { from: string; to: string } | null {
  const today = new Date();
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  if (period === "today") {
    return { from: toIso(today), to: toIso(today) };
  }
  if (period === "last7") {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from: toIso(from), to: toIso(today) };
  }
  if (period === "last30") {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    return { from: toIso(from), to: toIso(today) };
  }
  return null;
}

export function MovementsPageClient({
  initialMovements,
  totalMovements,
  products,
  suppliers,
}: MovementsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Filtros vindos da URL
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "");
  const [selectedProduct, setSelectedProduct] = useState(searchParams.get("productId") || "");
  const [selectedPeriod, setSelectedPeriod] = useState(searchParams.get("period") || "");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");

  // Atualiza a URL com filtros (inclui busca)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const setOrDel = (k: string, v: string) => (v ? params.set(k, v) : params.delete(k));

    setOrDel("type", selectedType);
    setOrDel("productId", selectedProduct);
    setOrDel("period", selectedPeriod);
    setOrDel("search", searchTerm);

    params.set("page", "1");
    const timer = setTimeout(() => {
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, selectedProduct, selectedPeriod, searchTerm, pathname, router]);

  // Labels amigáveis p/ chips
  const typeLabel = useMemo(() => {
    if (!selectedType) return null;
    return TYPE_OPTIONS.find(o => o.value === selectedType)?.label ?? selectedType;
  }, [selectedType]);

  const productLabel = useMemo(() => {
    if (!selectedProduct) return null;
    const p = products.find(pr => String(pr.id) === String(selectedProduct));
    return p?.name ?? `Produto #${selectedProduct}`;
  }, [selectedProduct, products]);

  const periodLabel = useMemo(() => {
    if (!selectedPeriod) return null;
    return PERIOD_OPTIONS.find(o => o.value === selectedPeriod)?.label ?? selectedPeriod;
  }, [selectedPeriod]);

  const hasActiveFilters = !!(
    (searchTerm && searchTerm.trim() !== "") ||
    selectedType || selectedProduct || selectedPeriod
  );

  const clearAll = () => {
    setSelectedType("");
    setSelectedProduct("");
    setSelectedPeriod("");
    setSearchTerm("");
    const params = new URLSearchParams(searchParams.toString());
    ["type", "productId", "period", "search", "page"].forEach(k => params.delete(k));
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const removeFilter = (key: "type" | "productId" | "period" | "search") => {
    if (key === "type") setSelectedType("");
    if (key === "productId") setSelectedProduct("");
    if (key === "period") setSelectedPeriod("");
    if (key === "search") setSearchTerm("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  // Modais
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMovement, setDeletingMovement] = useState<Movement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Detalhes
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState<Movement | null>(null);

  const openDetails = async (id: number) => {
    setDetailsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/stock-movements/${id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Falha ao carregar detalhes');
      const data = await res.json();
      setDetails(data);
      setIsDetailsOpen(true);
    } catch (e: any) {
      alert(e.message || 'Erro ao abrir detalhes');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMovement) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/stock-movements/${deletingMovement.id}`, {
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

  // Exportar PDF (lista) — usa os filtros atuais da URL
  const handleExportListPdf = async () => {
    const params = new URLSearchParams();
    if (selectedType) params.set("type", selectedType);
    if (selectedProduct) params.set("productId", selectedProduct);
    if (selectedPeriod) params.set("period", selectedPeriod);
    if (searchTerm) params.set("search", searchTerm);
    const url = `${API_BASE}/stock-movements/export-pdf?${params.toString()}`;
    try {
      await download(url, tsFilename("movimentacoes", "pdf"));
    } catch {
      alert("Falha ao baixar o PDF. Verifique se o backend está rodando em 3001.");
    }
  };

  // 🖨️ Imprimir (navega para /dashboard/print/movimentacoes com os filtros atuais)
  const handleGoPrint = () => {
    const qs = new URLSearchParams();
    if (selectedType) qs.set("type", selectedType);
    if (selectedProduct) qs.set("productId", selectedProduct);
    if (searchTerm) qs.set("search", searchTerm);
    const range = periodToRange(selectedPeriod);
    if (range) {
      qs.set("dateFrom", range.from);
      qs.set("dateTo", range.to);
    }
    window.open(`/dashboard/print/movimentacoes?${qs.toString()}`, "_blank");
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

      {/* MODAL NOVA MOVIMENTAÇÃO */}
      {isModalOpen && (
        <MovementFormModal
          onClose={() => setIsModalOpen(false)}
          products={products}
          suppliers={suppliers}
        />
      )}

      {/* MODAL DETALHES */}
      {isDetailsOpen && details && (
        <StockMovementDetailsModal
          movement={details}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}

      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Movimentações</h1>
          <p className="text-sm text-gray-500">Registre entradas, saídas e ajustes de estoque</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Exportar lista (PDF) */}
          <button
            onClick={handleExportListPdf}
            className="border text-gray-700 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg flex items-center gap-2"
            title="Exportar lista (PDF)"
          >
            <FileDown size={18} />
            <span>Exportar PDF</span>
          </button>

          {/* Imprimir (rota de impressão) */}
          <button
            onClick={handleGoPrint}
            className="border text-gray-700 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg flex items-center gap-2"
            title="Imprimir (tela de impressão)"
          >
            <Printer size={18} />
            <span>Imprimir</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <PlusCircle size={20} />
            <span>Nova Movimentação</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-3 flex items-center gap-4">
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

      {/* Chips + Limpar tudo */}
      {hasActiveFilters && (
        <div className="bg-white p-3 rounded-xl shadow-sm mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 mr-1">Filtros ativos:</span>

          {searchTerm.trim() !== "" && (
            <button
              className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
              onClick={() => removeFilter("search")}
              title={`Remover: "${searchTerm}"`}
            >
              <span>Busca: “{searchTerm}”</span>
              <X size={12} />
            </button>
          )}

          {selectedType && (
            <button
              className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
              onClick={() => removeFilter("type")}
              title="Remover filtro de tipo"
            >
              <span>Tipo: {typeLabel}</span>
              <X size={12} />
            </button>
          )}

          {selectedProduct && (
            <button
              className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
              onClick={() => removeFilter("productId")}
              title="Remover filtro de produto"
            >
              <span>Produto: {productLabel}</span>
              <X size={12} />
            </button>
          )}

          {selectedPeriod && (
            <button
              className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
              onClick={() => removeFilter("period")}
              title="Remover filtro de período"
            >
              <span>Período: {periodLabel}</span>
              <X size={12} />
            </button>
          )}

          <div className="grow" />
          <button
            className="text-xs text-blue-700 hover:underline"
            onClick={clearAll}
            title="Limpar todos os filtros"
          >
            Limpar tudo
          </button>
        </div>
      )}

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
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-800">{formatCurrency(totalValue)}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(mov.unitPriceAtMovement)}/un</p>
                  </div>

                  {/* Ver detalhes */}
                  <button
                    title="Ver detalhes"
                    className="ml-2 text-gray-600 hover:text-blue-600 transition-colors"
                    onClick={() => openDetails(mov.id)}
                    disabled={detailsLoading}
                  >
                    <Eye size={18} />
                  </button>

                  {/* Imprimir PDF individual */}
                  <button
                    title="Imprimir movimentação (PDF)"
                    className="ml-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    onClick={() =>
                      download(`${API_BASE}/stock-movements/${mov.id}/export-pdf`, tsFilename(`mov-${mov.id}`, "pdf"))
                        .catch(() => alert("Falha ao baixar o PDF."))
                    }
                  >
                    <Printer size={18} />
                  </button>

                  {/* Excluir */}
                  <button
                    title="Excluir movimentação"
                    className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
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

// ---------- Modal de Detalhes ----------
function StockMovementDetailsModal({
  movement,
  onClose,
}: {
  movement: Movement;
  onClose: () => void;
}) {
  const money = (n: number | null) =>
    (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const total = (movement.unitPriceAtMovement || 0) * movement.quantity;

  const typeLabel =
    movement.type === "ENTRADA" ? "Entrada" :
      movement.type === "SAIDA" ? "Saída" :
        movement.type === "AJUSTE" ? "Ajuste" : movement.type;

  return (
    <div className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Detalhes da Movimentação • {typeLabel}
          </h3>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose} title="Fechar">
            <X size={22} />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><span className="font-semibold text-gray-700">Produto:</span> {movement.product?.name}</div>
          <div><span className="font-semibold text-gray-700">Data:</span> {format(new Date(movement.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>

          <div><span className="font-semibold text-gray-700">Quantidade:</span> {movement.quantity}</div>
          <div><span className="font-semibold text-gray-700">Preço unit.:</span> {money(movement.unitPriceAtMovement)}</div>

          <div><span className="font-semibold text-gray-700">Total:</span> {money(total)}</div>
          <div><span className="font-semibold text-gray-700">Documento:</span> {movement.document || "—"}</div>

          <div className="sm:col-span-2"><span className="font-semibold text-gray-700">{movement.type === "ENTRADA" ? "Fornecedor" : "Cliente"}:</span> {movement.relatedParty || "—"}</div>

          <div className="sm:col-span-2"><span className="font-semibold text-gray-700">Detalhes/Motivo:</span> {movement.details || "—"}</div>

          {movement.notes && (
            <div className="sm:col-span-2">
              <span className="font-semibold text-gray-700">Observações:</span> {movement.notes}
            </div>
          )}
        </div>

        <div className="mt-6 text-right">
          <button className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
