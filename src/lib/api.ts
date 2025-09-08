const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store', ...init });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiJson<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
