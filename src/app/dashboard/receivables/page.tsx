// src/app/dashboard/receivables/page.tsx
import ReceivablesClient from "../../../components/receivables/ReceivablesClient";

export const revalidate = 0;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

type SearchParams = {
  page?: string;
  limit?: string;
  municipalityId?: string;
  departmentId?: string;
  contractId?: string;
  status?: string;
  search?: string;
  issueFrom?: string;
  issueTo?: string;
  periodFrom?: string;
  periodTo?: string;
  receivedFrom?: string;
  receivedTo?: string;
  orderBy?: "issueDate" | "receivedAt" | "grossAmount";
  order?: "asc" | "desc";
};

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
  searchParams: SearchParams;
}) {
  // defaults
  const page = Number(searchParams.page || 1);
  const limit = Number(searchParams.limit || 20);
  const orderBy =
    (searchParams.orderBy as "issueDate" | "receivedAt" | "grossAmount") ||
    "issueDate";
  const order = (searchParams.order as "asc" | "desc") || "desc";

  // monta query
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  qs.set("orderBy", orderBy);
  qs.set("order", order);

  if (searchParams.search) qs.set("search", searchParams.search);
  if (searchParams.municipalityId) qs.set("municipalityId", searchParams.municipalityId);
  if (searchParams.departmentId) qs.set("departmentId", searchParams.departmentId);
  if (searchParams.contractId) qs.set("contractId", searchParams.contractId);
  if (searchParams.status) qs.set("status", searchParams.status);
  if (searchParams.issueFrom) qs.set("issueFrom", searchParams.issueFrom);
  if (searchParams.issueTo) qs.set("issueTo", searchParams.issueTo);
  if (searchParams.periodFrom) qs.set("periodFrom", searchParams.periodFrom);
  if (searchParams.periodTo) qs.set("periodTo", searchParams.periodTo);
  if (searchParams.receivedFrom) qs.set("receivedFrom", searchParams.receivedFrom);
  if (searchParams.receivedTo) qs.set("receivedTo", searchParams.receivedTo);

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
