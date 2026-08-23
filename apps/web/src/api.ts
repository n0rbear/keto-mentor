const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4100";

export type ApiState = { token: string | null; setToken: (token: string | null) => void };

export class ApiError extends Error {
  constructor(public readonly code: string, public readonly status?: number, public readonly issues?: unknown) {
    super(code);
  }
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(state: ApiState): Promise<string | null> {
  // Single-flight: concurrent 401s share one refresh call.
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken: string };
      state.setToken(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function api<T>(path: string, init: RequestInit = {}, state?: ApiState, retry = true): Promise<T> {
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


  if (res.status === 401 && retry && state?.token) {
    const nextToken = await refreshAccessToken(state);
    if (nextToken) {
      return api<T>(path, { ...init, headers: { ...init.headers, Authorization: `Bearer ${nextToken}` } }, state, false);
    }
    state.setToken(null);
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: res.statusText || "request_failed" }));
    throw new ApiError(payload.error ?? "request_failed", res.status, payload.issues);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}