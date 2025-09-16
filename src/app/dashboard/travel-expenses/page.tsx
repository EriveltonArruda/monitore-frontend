// src/app/dashboard/travel-expenses/page.tsx
import TravelExpensesPageClient from "../../../components/travel-expenses/TravelExpensesPageClient";

export const revalidate = 0;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

type SearchParams = Record<string, string | string[] | undefined>;

async function getPaginatedTravelExpenses(qs: URLSearchParams) {
  const res = await fetch(`${API_BASE}/travel-expenses?${qs.toString()}`, {
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // mantém shape básico pra não quebrar o Client
    return { data: [], total: 0, page: 1, totalPages: 1, pageSize: 10 };
  }
  return json;
}

export default async function TravelExpensesPage({
  searchParams,
}: {
  // ✅ Next 14+: searchParams é Promise em Server Components
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  // helper p/ pegar 1 valor de string|string[]
  const getOne = (v: string | string[] | undefined, fallback = "") =>
    Array.isArray(v) ? v[0] ?? fallback : v ?? fallback;

  // defaults
  const page = Number(getOne(sp.page, "1"));
  const pageSize = Number(getOne(sp.pageSize, "10"));

  // completa ano se vier só mês
  const month = getOne(sp.month, "");
  const year = getOne(sp.year, month ? String(new Date().getFullYear()) : "");

  // monta query
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("pageSize", String(pageSize));
  if (month) qs.set("month", month);
  if (year) qs.set("year", year);

  const status = getOne(sp.status);
  if (status) qs.set("status", status);

  const category = getOne(sp.category);
  if (category) qs.set("category", category);

  const search = getOne(sp.search);
  if (search && search.trim() !== "") qs.set("search", search);

  const initial = await getPaginatedTravelExpenses(qs);
  return <TravelExpensesPageClient initialData={initial} />;
}
