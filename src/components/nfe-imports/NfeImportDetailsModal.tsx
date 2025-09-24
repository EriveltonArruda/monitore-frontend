// components/nfe-imports/NfeImportDetailsModal.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Search } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type Props = {
  importId: number;
  onClose: () => void;
  onApplied: () => void;
};

type NfeFull = {
  id: number;
  createdAt: string;
  rawXmlPath: string;
  accessKey?: string | null;
  number?: string | null;
  series?: string | null;
  issueDate?: string | null;
  emitterCnpj?: string | null;
  emitterName?: string | null;
  destCnpj?: string | null;
  destName?: string | null;
  totalAmount?: number | null;
  pdfPath?: string | null; // ✅ para exibir/abrir/remover o PDF
  items: Array<{
    id: number;
    productCode?: string | null;
    description?: string | null;
    quantity?: number | null;
    unit?: string | null;
    unitPrice?: number | null;
    total?: number | null;
  }>;
};

type ProductLite = {
  id: number;
  name: string;
  sku?: string | null;
  costPrice?: number | null;
  stockQuantity?: number;
  mainImageUrl?: string | null;
};

type Mapping = {
  itemId: number;
  productId: number;
  unitPrice?: number | null;
};

export function NfeImportDetailsModal({ importId, onClose, onApplied }: Props) {
  const [data, setData] = useState<NfeFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState<Record<number, Mapping>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Opções extras de aplicação
  const [setCostPriceFromItem, setSetCostPriceFromItem] = useState(true);
  const [updateProductStockMirror, setUpdateProductStockMirror] = useState(true);
  const [overrideAllUnitPrice, setOverrideAllUnitPrice] = useState<number | ''>('');

  // Busca de produtos
  const [prodQuery, setProdQuery] = useState('');
  const [prodLoading, setProdLoading] = useState(false);
  const [prodResults, setProdResults] = useState<ProductLite[]>([]);

  // PDF states
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfRemoving, setPdfRemoving] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  // ------- carregar detalhes (reutilizável) -------
  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/nfe-imports/${importId}`, { cache: 'no-store' });
      const json = await res.json();
      setData(json);
      const init: Record<number, Mapping> = {};
      (json?.items || []).forEach((it: any) => {
        init[it.id] = { itemId: it.id, productId: 0, unitPrice: it.unitPrice ?? null };
      });
      setMap(init);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importId]);

  // ------- produtos -------
  const doProdSearch = async () => {
    setProdLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '10');
      if (prodQuery) params.set('search', prodQuery);
      const res = await fetch(`${API_BASE}/products?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      const arr: ProductLite[] = (json?.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku ?? null,
        costPrice: p.costPrice ?? null,
        stockQuantity: p.stockQuantity ?? 0,
        mainImageUrl: p.mainImageUrl ?? null,
      }));
      setProdResults(arr);
    } finally {
      setProdLoading(false);
    }
  };

  // ------- mapping -------
  const setItemProduct = (itemId: number, productId: number) => {
    setMap((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || { itemId, productId }), itemId, productId },
    }));
  };

  const setItemUnitPrice = (itemId: number, v: string) => {
    const num = v === '' ? '' : Number(v.replace(',', '.'));
    setMap((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || { itemId }), unitPrice: (num === '' ? null : (isFinite(num) ? num : null)) as any },
    }));
  };

  const mappingsArray: Mapping[] = useMemo(() => {
    return Object.values(map).filter((m) => m.productId && m.itemId);
  }, [map]);

  const canSubmit = useMemo(() => mappingsArray.length > 0, [mappingsArray.length]);

  // ------- apply to stock -------
  const submit = async () => {
    if (!canSubmit || !data) return;
    setSubmitLoading(true);
    try {
      const payload: any = {
        mappings: mappingsArray.map((m) => ({
          itemId: m.itemId,
          productId: m.productId,
          unitPrice:
            overrideAllUnitPrice !== '' ? undefined : m.unitPrice != null ? Number(m.unitPrice) : undefined,
        })),
        setCostPriceFromItem,
        updateProductStockMirror,
      };
      if (overrideAllUnitPrice !== '') {
        payload.overrideAllUnitPrice = Number(overrideAllUnitPrice);
      }

      const res = await fetch(`${API_BASE}/nfe-imports/${data.id}/apply-to-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any));
        throw new Error(j.message || 'Falha ao aplicar ao estoque');
      }
      alert('Movimentações criadas com sucesso!');
      onApplied();
    } catch (e: any) {
      alert(e?.message || 'Erro ao aplicar');
    } finally {
      setSubmitLoading(false);
    }
  };

  // ------- PDF handlers -------
  const clickPickPdf = () => pdfInputRef.current?.click();

  const onPickPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPdfUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch(`${API_BASE}/nfe-imports/${importId}/pdf`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || 'Falha ao anexar PDF');
      }
      await fetchDetails();
      alert('PDF anexado com sucesso.');
    } catch (err: any) {
      alert(err?.message || 'Erro ao anexar PDF');
    } finally {
      setPdfUploading(false);
      // limpa o input pra permitir reenvio do mesmo arquivo
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const openPdf = () => {
    if (!data?.pdfPath) return;
    // como o backend serve estáticos em /uploads, o pdfPath já é /uploads/...
    const url = `${API_BASE}${data.pdfPath}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const removePdf = async () => {
    if (!confirm('Remover o PDF anexado desta NF-e?')) return;
    setPdfRemoving(true);
    try {
      const res = await fetch(`${API_BASE}/nfe-imports/${importId}/pdf`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || 'Falha ao remover PDF');
      }
      await fetchDetails();
      alert('PDF removido com sucesso.');
    } catch (err: any) {
      alert(err?.message || 'Erro ao remover PDF');
    } finally {
      setPdfRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Detalhes da Importação</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {loading && <div>Carregando...</div>}
          {!loading && data && (
            <>
              {/* Cabeçalho NF */}
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div><span className="text-gray-500">Número/Série:</span> <div className="font-semibold">{[data.number, data.series].filter(Boolean).join(' / ') || '—'}</div></div>
                <div><span className="text-gray-500">Data de Emissão:</span> <div className="font-semibold">{data.issueDate ? new Date(data.issueDate).toLocaleString('pt-BR') : '—'}</div></div>
                <div><span className="text-gray-500">Valor Total:</span> <div className="font-semibold">{data.totalAmount != null ? data.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}</div></div>
                <div className="sm:col-span-2"><span className="text-gray-500">Emissor:</span> <div className="font-semibold">{data.emitterName || '—'}</div></div>
                <div className="sm:col-span-2"><span className="text-gray-500">Destinatário:</span> <div className="font-semibold">{data.destName || '—'}</div></div>
                <div className="md:col-span-3"><span className="text-gray-500">Chave de Acesso:</span> <div className="font-semibold break-all">{data.accessKey || '—'}</div></div>
              </div>

              {/* PDF da NF-e */}
              <div className="mt-2 p-3 border rounded-lg">
                <div className="flex flex-col gap-2">
                  <div className="font-medium text-sm">Documento PDF da NF-e</div>

                  {data.pdfPath ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-gray-600 break-all">Arquivo: {data.pdfPath}</span>
                      <button
                        onClick={openPdf}
                        className="px-2 py-1 rounded-md bg-white border hover:bg-gray-50"
                        title="Visualizar PDF"
                      >
                        Visualizar
                      </button>
                      <button
                        onClick={removePdf}
                        disabled={pdfRemoving}
                        className="px-2 py-1 rounded-md bg-white border hover:bg-gray-50 disabled:opacity-50"
                        title="Remover PDF"
                      >
                        {pdfRemoving ? 'Removendo...' : 'Remover'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">Nenhum PDF anexado.</div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={onPickPdf}
                    />
                    <button
                      onClick={clickPickPdf}
                      disabled={pdfUploading}
                      className="px-3 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-300"
                    >
                      {pdfUploading ? 'Anexando...' : (data?.pdfPath ? 'Substituir PDF' : 'Anexar PDF')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Busca de produtos para mapear */}
              <div className="mt-2 p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="relative w-full max-w-md">
                    <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={prodQuery}
                      onChange={(e) => setProdQuery(e.target.value)}
                      placeholder="Buscar produto por nome/SKU"
                      className="pl-8 pr-2 py-2 border rounded-md w-full"
                    />
                  </div>
                  <button
                    onClick={doProdSearch}
                    className="px-3 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-300"
                    disabled={prodLoading}
                  >
                    {prodLoading ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>

                {prodResults.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2 border-b">#</th>
                          <th className="text-left p-2 border-b">Produto</th>
                          <th className="text-left p-2 border-b">SKU</th>
                          <th className="text-right p-2 border-b">Custo</th>
                          <th className="text-right p-2 border-b">Estoque</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prodResults.map((p) => (
                          <tr key={p.id} className="odd:bg-white even:bg-gray-50">
                            <td className="p-2 border-b">{p.id}</td>
                            <td className="p-2 border-b">{p.name}</td>
                            <td className="p-2 border-b">{p.sku || '—'}</td>
                            <td className="p-2 border-b text-right">
                              {p.costPrice != null
                                ? p.costPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                : '—'}
                            </td>
                            <td className="p-2 border-b text-right">{p.stockQuantity ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-xs text-gray-500 mt-1">
                      * Use o ID na lista de itens da NF para mapear rapidamente.
                    </div>
                  </div>
                )}
              </div>

              {/* Itens da NF + mapeamento */}
              <div className="mt-2 border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 border-b">Item</th>
                      <th className="text-left p-2 border-b">Descrição</th>
                      <th className="text-right p-2 border-b">Qtd</th>
                      <th className="text-right p-2 border-b">Vlr Unit</th>
                      <th className="text-left p-2 border-b">Produto (ID)</th>
                      <th className="text-right p-2 border-b">Override Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((it) => (
                      <tr key={it.id} className="odd:bg-white even:bg-gray-50">
                        <td className="p-2 border-b text-gray-500">{it.id}</td>
                        <td className="p-2 border-b">{it.description || '—'}</td>
                        <td className="p-2 border-b text-right">{it.quantity ?? '—'}</td>
                        <td className="p-2 border-b text-right">
                          {it.unitPrice != null
                            ? it.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : '—'}
                        </td>
                        <td className="p-2 border-b">
                          <input
                            type="number"
                            min={1}
                            placeholder="ID do produto"
                            value={map[it.id]?.productId || ''}
                            onChange={(e) => setItemProduct(it.id, Number(e.target.value || 0))}
                            className="w-32 border rounded-md px-2 py-1"
                          />
                        </td>
                        <td className="p-2 border-b text-right">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="(opcional)"
                            value={
                              map[it.id]?.unitPrice === null || map[it.id]?.unitPrice === undefined
                                ? ''
                                : String(map[it.id]?.unitPrice)
                            }
                            onChange={(e) => setItemUnitPrice(it.id, e.target.value)}
                            className="w-32 border rounded-md px-2 py-1 text-right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Opções extras */}
              <div className="grid md:grid-cols-3 gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={setCostPriceFromItem}
                    onChange={(e) => setSetCostPriceFromItem(e.target.checked)}
                  />
                  Atualizar custo do produto com valor unitário do item
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={updateProductStockMirror}
                    onChange={(e) => setUpdateProductStockMirror(e.target.checked)}
                  />
                  Incrementar estoque total do produto
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Override unitário (todos):</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="opcional"
                    value={overrideAllUnitPrice}
                    onChange={(e) => setOverrideAllUnitPrice(e.target.value as any)}
                    className="w-32 border rounded-md px-2 py-1 text-right"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button className="px-3 py-2 border rounded-md" onClick={onClose} disabled={submitLoading}>
            Fechar
          </button>
          <button
            className="px-3 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:bg-emerald-300"
            onClick={submit}
            disabled={submitLoading || !canSubmit}
          >
            {submitLoading ? 'Aplicando...' : 'Aplicar ao estoque'}
          </button>
        </div>
      </div>
    </div>
  );
}
