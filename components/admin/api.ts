export type FieldErrors = Record<string, string[] | undefined>;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: FieldErrors = {},
  ) {
    super(message);
  }
}

/** Fetch para as rotas do admin. O cookie de sessão vai automaticamente (same-origin). */
export async function adminApi<T>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.href = "/admin/login";
  }
  if (!res.ok) throw new ApiError(json.error ?? "Erro inesperado", res.status, json.fields);
  return json as T;
}
