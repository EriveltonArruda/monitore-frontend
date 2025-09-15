// src/app/dashboard/travel-expenses/page.tsx
import TravelExpensesPageClient from "../../../components/travel-expenses/TravelExpensesPageClient";

export const revalidate = 0;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

type SearchParams = {
  page?: string;
  pageSize?: string; // backend usa pageSize
  month?: string;
  year?: string;
  status?: string;
  category?: string;
  search?: string;
};

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
  searchParams: SearchParams;
}) {
  // defaults
  const page = Number(searchParams.page || 1);
  const pageSize = Number(searchParams.pageSize || 10);

  // completa ano se vier só mês
  const month = searchParams.month || "";
  const year =
    searchParams.year || (month ? String(new Date().getFullYear()) : "");

  // monta query
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("pageSize", String(pageSize));
  if (month) qs.set("month", month);
  if (year) qs.set("year", year);
  if (searchParams.status) qs.set("status", searchParams.status);
  if (searchParams.category) qs.set("category", searchParams.category);
  if (searchParams.search && searchParams.search.trim() !== "") {
    qs.set("search", searchParams.search);
  }

  const initial = await getPaginatedTravelExpenses(qs);
  return <TravelExpensesPageClient initialData={initial} />;
}
