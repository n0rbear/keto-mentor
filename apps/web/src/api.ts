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

// Owner-beta (2026-09-12): truthful real-stage progress for long
// interpretation operations — reads newline-delimited {"stage":"..."} lines
// from GET /meal-input/progress/:operationId (see meal-input/progress-bus.ts
// on the API). Purely additive: a network hiccup here just means the user
// sees no progress text, never an error, and never affects the actual
// interpretation result. Does not retry on 401 (unlike `api()`) — a stale
// token here only costs a cosmetic progress display, not correctness.
export function streamProgress(operationId: string, state: ApiState | undefined, onStage: (stage: string) => void): () => void {
  const controller = new AbortController();
  (async () => {
    try {
      const res = await fetch(`${API_URL}/meal-input/progress/${operationId}`, {
        credentials: "include",
        headers: { ...(state?.token ? { Authorization: `Bearer ${state.token}` } : {}) },
        signal: controller.signal
      });
      if (!res.ok || !res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (!line) continue;
          try {
            const parsed = JSON.parse(line) as { stage?: string };
            if (parsed.stage) onStage(parsed.stage);
          } catch {
            // Malformed line — ignore, purely cosmetic stream.
          }
        }
      }
    } catch {
      // Aborted (normal, once the main request resolves) or a network error
      // — either way, the progress stream is optional and non-fatal.
    }
  })();
  return () => controller.abort();
}