const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4100";

export type ApiState = { token: string | null; setToken: (token: string | null) => void };

export async function api<T>(path: string, init: RequestInit = {}, state?: ApiState): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(state?.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...init.headers
    }
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ error: res.statusText }))).error);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
