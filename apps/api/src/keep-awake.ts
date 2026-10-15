// Keeps other sites of the owner awake (owner request 2026-10-15). A Render
// free web service spins down after 15 minutes without inbound requests and
// then needs ~50 s to start again; one request every 10 minutes from this
// always-on API keeps it up. Only the outcome is logged, never page content.

export const KEEP_AWAKE_INTERVAL_MS = 10 * 60 * 1000;

export function keepAwakeUrls(raw: string | undefined): string[] {
  if (raw?.trim().toLowerCase() === "off") return [];
  return (raw ?? "https://norbapp.com").split(",").map((value) => value.trim()).filter((value) => {
    try { return new URL(value).protocol === "https:"; } catch { return false; }
  });
}

export async function pingOnce(urls: string[], fetchImpl: typeof fetch = fetch, log: (line: string) => void = console.log) {
  await Promise.all(urls.map(async (url) => {
    const started = Date.now();
    try {
      const response = await fetchImpl(url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(90_000), headers: { "user-agent": "keto-mentor-keep-awake" } });
      await response.body?.cancel().catch(() => undefined);
      if (response.status >= 500) log(`keep_awake host=${new URL(url).host} status=${response.status} ms=${Date.now() - started}`);
    } catch (error: any) {
      log(`keep_awake host=${new URL(url).host} failed=${error?.name ?? "error"} ms=${Date.now() - started}`);
    }
  }));
}

export function startKeepAwake(urls: string[], deps: { fetchImpl?: typeof fetch; log?: (line: string) => void; intervalMs?: number } = {}) {
  if (!urls.length) return () => undefined;
  const tick = () => { void pingOnce(urls, deps.fetchImpl, deps.log); };
  tick();
  const timer = setInterval(tick, deps.intervalMs ?? KEEP_AWAKE_INTERVAL_MS);
  timer.unref?.();
  return () => clearInterval(timer);
}
