// components/print/PrintLayout.tsx
'use client';

import React, { useEffect } from 'react';

type Col = {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  // width?: string; // ❌ evitamos inline style; se quiser, trocamos depois por widthClass no config
};

type Meta = {
  total: number;
  page: number;
  limit: number;
};

type Formatters = {
  [key: string]: (v: any, row: any) => string | number | React.ReactNode;
};

export function PrintLayout({
  title,
  subtitle,
  subtitleChips, // ✅ NOVO (opcional)
  columns,
  rows,
  meta,
  formatters = {},
}: {
  title: string;
  subtitle?: string | null;
  subtitleChips?: string[]; // ✅ NOVO (opcional)
  columns: Col[];
  rows: any[];
  meta: Meta;
  formatters?: Formatters;
}) {
  useEffect(() => {
    document.title = `${title} — Relatório`;
  }, [title]);

  const alignClass = (a?: Col['align']) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  return (
    <div className="p-6 print:p-0">
      {/* Cabeçalho */}
      <div className="mb-4 border-b pb-4">
        <div className="text-lg font-bold">{title}</div>

        {subtitle ? (
          <div className="text-sm text-gray-600 mt-1">{subtitle}</div>
        ) : null}

        {/* Chips de filtros (opcional) */}
        {Array.isArray(subtitleChips) && subtitleChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {subtitleChips.map((chip, i) => (
              <span
                key={`${chip}-${i}`}
                className="px-2 py-0.5 text-xs bg-gray-100 border border-gray-200 rounded-full text-gray-700"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500 mt-2">
          Gerado em {new Date().toLocaleString('pt-BR')}
          {' · '}
          Registros: <b>{meta?.total ?? rows.length}</b>
        </div>

        <div className="mt-2 no-print">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`p-2 border-b font-medium ${alignClass(c.align)}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="odd:bg-white even:bg-gray-50">
                {columns.map((c) => {
                  const raw = r[c.key];
                  const val = formatters[c.key] ? formatters[c.key](raw, r) : raw ?? '—';
                  return (
                    <td
                      key={c.key}
                      className={`p-2 border-b align-top ${alignClass(c.align)}`}
                    >
                      {typeof val === 'number' ? (
                        <span className="tabular-nums">{val}</span>
                      ) : (
                        val
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center text-gray-500">
                  Nenhum registro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Rodapé */}
      <div className="text-xs text-gray-500 mt-2">
        Total de itens: <b>{meta?.total ?? rows.length}</b>
        {meta?.limit ? (
          <>
            {' · '}Página <b>{meta.page ?? 1}</b> com limite <b>{meta.limit}</b>
          </>
        ) : null}
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          table, th, td {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
