const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const TOKEN_KEY = "miller.token";

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(t: string | null) {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* private mode */ }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Pull something human out of FastAPI's error shapes, including 422 arrays. */
function readDetail(body: unknown, fallback: string): string {
  if (typeof body === "string") return body;
  const detail = (body as { detail?: unknown })?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0] as { msg?: string; loc?: unknown[] };
    const field = Array.isArray(first.loc) ? String(first.loc[first.loc.length - 1]) : "";
    return field ? `${field}: ${first.msg ?? "invalid"}` : (first.msg ?? fallback);
  }
  return fallback;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check your connection and try again.");
  }

  if (res.status === 401) {
    setToken(null);
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, readDetail(body, `Request failed (${res.status})`));
  return body as T;
}

export const api = {
  get:  <T>(p: string) => request<T>(p),
  post: <T>(p: string, data?: unknown) =>
    request<T>(p, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  put:  <T>(p: string, data: unknown) =>
    request<T>(p, { method: "PUT", body: JSON.stringify(data) }),
  patch:<T>(p: string, data?: unknown) =>
    request<T>(p, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  del:  <T>(p: string) => request<T>(p, { method: "DELETE" }),
};

export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "" && v !== "any") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
