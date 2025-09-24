// components/nfe-imports/NfeImportsClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { NfeUploadModal } from './NfeUploadModal';
import { NfeImportDetailsModal } from './NfeImportDetailsModal';
import { Download, Eye, FileUp, RefreshCw } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

export type NfeImportRow = {
  id: number;
  createdAt: string;
  accessKey?: string | null;
  number?: string | null;
  series?: string | null;
  issueDate?: string | null;
  emitterName?: string | null;
  destName?: string | null;
  totalAmount?: number | null;
  pdfPath?: string | null;
};

type PageResp = {
  data: NfeImportRow[];
  total: number;
  page: number;
  limit: number;
};

export function NfeImportsClient() {
  const [rows, setRows] = useState<NfeImportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [showUpload, setShowUpload] = useState(false);
  const [detailsId, setDetailsId] = useState<number | null>(null);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const load = async (_page = page, _search = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(_page));
      params.set('limit', String(limit));
      if (_search) params.set('search', _search);
      const res = await fetch(`${API_BASE}/nfe-imports?${params.toString()}`, {
        cache: 'no-store',
      });
      const data: PageResp = await res.json();
      setRows(data.data || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReprocess = async (id: number) => {
    if (!confirm('Reprocessar este XML?')) return;
    try {
      await fetch(`${API_BASE}/nfe-imports/${id}/reprocess`, { method: 'POST' });
      await load();
      alert('XML reprocessado com sucesso.');
    } catch (e: any) {
      alert(e?.message || 'Falha ao reprocessar');
    }
  };

  const handleDownloadXml = async (id: number) => {
    try {
      // alinhado com backend: GET /nfe-imports/:id/download
      const res = await fetch(`${API_BASE}/nfe-imports/${id}/download`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Falha ao baixar XML');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nfe-${id}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || 'Falha ao baixar XML');
    }
  };

  return (
    <div className="space-y-3">
      {/* Ações topo */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por chave, número, emissor, destinatário..."
            className="w-full sm:w-80 border rounded-md px-3 py-2"
          />
          <button
            onClick={() => load(1, search)}
            className="px-3 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            Buscar
          </button>
          {search && (
            <button
              onClick={() => {
                setSearch('');
                load(1, '');
              }}
              className="px-3 py-2 rounded-md bg-gray-100 border font-semibold"
            >
              Limpar
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
          >
            <FileUp size={16} />
            Importar XML
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">Data</th>
              <th className="text-left p-2 border-b">Número / Série</th>
              <th className="text-left p-2 border-b">Emissor</th>
              <th className="text-left p-2 border-b">Destinatário</th>
              <th className="text-right p-2 border-b">Valor</th>
              <th className="text-left p-2 border-b">Chave</th>
              <th className="text-right p-2 border-b">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border-b">
                  {r.issueDate ? new Date(r.issueDate).toLocaleString('pt-BR') : '—'}
                </td>
                <td className="p-2 border-b">{[r.number, r.series].filter(Boolean).join(' / ') || '—'}</td>
                <td className="p-2 border-b">{r.emitterName || '—'}</td>
                <td className="p-2 border-b">{r.destName || '—'}</td>
                <td className="p-2 border-b text-right">
                  {r.totalAmount != null
                    ? r.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : '—'}
                </td>
                <td className="p-2 border-b">{r.accessKey || '—'}</td>
                <td className="p-2 border-b">
                  <div className="flex items-center gap-2 justify-end">
                    {r.pdfPath && (
                      <a
                        href={`${API_BASE}${r.pdfPath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-white border hover:bg-gray-50"
                        title="Abrir PDF da NF-e"
                      >
                        PDF
                      </a>
                    )}
                    <button
                      onClick={() => setDetailsId(r.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-white border hover:bg-gray-50"
                      title="Ver detalhes / Aplicar ao estoque"
                    >
                      <Eye size={14} /> Detalhes
                    </button>
                    <button
                      onClick={() => handleDownloadXml(r.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-white border hover:bg-gray-50"
                      title="Baixar XML"
                    >
                      <Download size={14} /> XML
                    </button>
                    <button
                      onClick={() => handleReprocess(r.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-white border hover:bg-gray-50"
                      title="Reprocessar XML"
                    >
                      <RefreshCw size={14} /> Reprocessar
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  Carregando...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Total: <strong>{total}</strong>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1, search)}
            className="px-3 py-1 rounded-md border bg-white disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm">Página {page} de {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => load(page + 1, search)}
            className="px-3 py-1 rounded-md border bg-white disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      </div>

      {/* Modais */}
      {showUpload && (
        <NfeUploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            load();
          }}
        />
      )}
      {detailsId != null && (
        <NfeImportDetailsModal
          importId={detailsId}
          onClose={() => setDetailsId(null)}
          onApplied={() => {
            setDetailsId(null);
          }}
        />
      )}
    </div>
  );
}
