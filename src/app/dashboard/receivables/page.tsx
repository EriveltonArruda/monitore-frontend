// src/app/dashboard/receivables/page.tsx
import ReceivablesClient from "../../../components/receivables/ReceivablesClient";

export const revalidate = 0;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

type SearchParams = Record<string, string | string[] | undefined>;

async function fetchReceivables(qs: URLSearchParams) {
  const res = await fetch(`${API_BASE}/receivables?${qs.toString()}`, {
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || "Falha ao carregar recebidos");
  }
  return json as {
    data: any[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

async function fetchMunicipalities() {
  const r = await fetch(`${API_BASE}/municipalities?limit=9999`, {
    cache: "no-store",
  });
  const json = await r.json().catch(() => ({ data: [] }));
  return json.data || [];
}

export default async function Page({
  searchParams,
}: {
  // ✅ Next 14+: searchParams é Promise em Server Components
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const getOne = (v: string | string[] | undefined, fallback = "") =>
    Array.isArray(v) ? v[0] ?? fallback : v ?? fallback;

  // defaults
  const page = Number(getOne(sp.page, "1"));
  const limit = Number(getOne(sp.limit, "20"));

  const orderBy =
    (getOne(sp.orderBy, "issueDate") as "issueDate" | "receivedAt" | "grossAmount") ||
    "issueDate";
  const order = (getOne(sp.order, "desc") as "asc" | "desc") || "desc";

  // monta query
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  qs.set("orderBy", orderBy);
  qs.set("order", order);

  const search = getOne(sp.search);
  if (search) qs.set("search", search);

  const municipalityId = getOne(sp.municipalityId);
  if (municipalityId) qs.set("municipalityId", municipalityId);

  const departmentId = getOne(sp.departmentId);
  if (departmentId) qs.set("departmentId", departmentId);

  const contractId = getOne(sp.contractId);
  if (contractId) qs.set("contractId", contractId);

  const status = getOne(sp.status);
  if (status) qs.set("status", status);

  const issueFrom = getOne(sp.issueFrom);
  if (issueFrom) qs.set("issueFrom", issueFrom);

  const issueTo = getOne(sp.issueTo);
  if (issueTo) qs.set("issueTo", issueTo);

  const periodFrom = getOne(sp.periodFrom);
  if (periodFrom) qs.set("periodFrom", periodFrom);

  const periodTo = getOne(sp.periodTo);
  if (periodTo) qs.set("periodTo", periodTo);

  const receivedFrom = getOne(sp.receivedFrom);
  if (receivedFrom) qs.set("receivedFrom", receivedFrom);

  const receivedTo = getOne(sp.receivedTo);
  if (receivedTo) qs.set("receivedTo", receivedTo);

  const [municipalities, recv] = await Promise.all([
    fetchMunicipalities(),
    fetchReceivables(qs),
  ]);

  return (
    <ReceivablesClient
      initialReceivables={recv.data || []}
      totalReceivables={recv.total || 0}
      page={recv.page || page}
      totalPages={recv.totalPages || 1}
      limit={recv.limit || limit}
      municipalities={municipalities}
    />
  );
}
