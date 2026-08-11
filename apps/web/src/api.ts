const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4100";

export type ApiState = { token: string | null; setToken: (token: string | null) => void };

export class ApiError extends Error {
  constructor(public readonly code: string, public readonly status?: number, public readonly issues?: unknown) {
    super(code);
  }
}

export async function api<T>(path: string, init: RequestInit = {}, state?: ApiState): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(state?.token ? { Authorization: `Bearer ${state.token}` } : {}), ...init.headers }
    });
  } catch {
    throw new ApiError("network_error");
  }
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: res.statusText || "request_failed" }));
    throw new ApiError(payload.error ?? "request_failed", res.status, payload.issues);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
