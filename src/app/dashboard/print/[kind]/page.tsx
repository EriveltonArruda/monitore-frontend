// app/dashboard/print/[kind]/page.tsx
import { notFound } from 'next/navigation';
import { PrintLayout } from '@/components/print/PrintLayout';
import { kinds } from '@/lib/print/config';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type SearchParamsObj = { [key: string]: string | string[] | undefined };

// ---- Aliases PT-BR -> chaves do config ----
const aliases: Record<string, keyof typeof kinds> = {
  produtos: 'products',
  movimentacoes: 'stock-movements',
  'contas-a-pagar': 'accounts-payable',
  contratos: 'contracts',
  recebidos: 'receivables',
  recebiveis: 'receivables',
  fornecedores: 'suppliers',
  contatos: 'contacts',
  municipios: 'municipalities', // ✅ novo
  orgaos: 'departments',       // ✅ novo
};

function normalizeKind(k: string): keyof typeof kinds | undefined {
  if (k in kinds) return k as keyof typeof kinds;
  if (k in aliases) return aliases[k];
  return undefined;
}

// Converte o objeto de search params resolvido para Record<string,string>
function coerceSearchParams(sp: SearchParamsObj): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(sp)) {
    if (typeof val === 'string') out[key] = val;
    else if (Array.isArray(val) && val.length) out[key] = val[0]!;
  }
  return out;
}

// Busca lista no backend com filtros (limit alto para impressão)
async function fetchList(kind: keyof typeof kinds, searchParams: Record<string, string>) {
  const cfg = kinds[kind];
  if (!cfg) return { rows: [], meta: { total: 0, page: 1, limit: 9999 } };

  const params = new URLSearchParams();

  // Repassa todos filtros simples (exceto paginação local)
  for (const [k, v] of Object.entries(searchParams)) {
    if (v == null) continue;
    if (k === 'page' || k === 'limit') continue;
    params.set(k, v);
  }

  // Para impressão, sempre pega um lote grande
  params.set('page', '1');
  params.set('limit', '1000');

  const res = await fetch(`${API_BASE}${cfg.endpoint}?${params.toString()}`, { cache: 'no-store' });
  const json = await res.json().catch(() => ({}));

  // Normaliza estrutura { data, total, page, limit }
  const data = Array.isArray(json) ? json : json?.data || [];
  const total = json?.total ?? data.length ?? 0;
  const page = json?.page ?? 1;
  const limit = json?.limit ?? data.length ?? 1000;

  return { rows: data as any[], meta: { total, page, limit } };
}

// Aplica formatters do config NO SERVIDOR para não enviar funções ao cliente
function applyFormatters(rows: any[], formatters?: Record<string, (v: any, row: any) => any>) {
  if (!formatters) return rows;
  return rows.map((row) => {
    const out: any = { ...row };
    for (const [key, fn] of Object.entries(formatters)) {
      try {
        out[key] = fn(row[key], row);
      } catch {
        out[key] = row[key];
      }
    }
    return out;
  });
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<SearchParamsObj>;
}) {
  // ✅ Aguarda os objetos antes de usar
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const kind = normalizeKind(resolvedParams.kind);
  if (!kind) return notFound();

  const plainSP = coerceSearchParams(resolvedSearchParams);
  const cfg = kinds[kind];

  const { rows, meta } = await fetchList(kind, plainSP);
  const formattedRows = applyFormatters(rows, cfg.formatters);

  return (
    <PrintLayout
      title={cfg.title}
      subtitle={cfg.subtitle?.(plainSP) ?? null}
      columns={cfg.columns}
      rows={formattedRows}
      meta={meta}
    />
  );
}
