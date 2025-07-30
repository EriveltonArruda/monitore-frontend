import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") || "";
  const category = searchParams.get("category") || "";
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "12";

  // URL do seu backend NestJS
  const backendUrl = `http://localhost:3001/accounts-payable/reports/month?year=${year}&category=${category}&page=${page}&limit=${limit}`;

  const response = await fetch(backendUrl, { cache: 'no-store' });
  const data = await response.json();

  return NextResponse.json(data);
}