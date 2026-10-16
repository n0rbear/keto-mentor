import { api } from "./api";

// Campaign links (owner request 2026-10-16): ketomentor.norbapp.com/?ref=<code>
// counts one anonymous visit per browser session and remembers the code for
// 30 days, so a registration days later is still credited to that link.
const KEY = "km_ref";
const SENT = "km_ref_sent";
const CODE = /^[a-z0-9-]{2,40}$/;
const TTL = 30 * 24 * 60 * 60 * 1000;

export function captureCampaignRef(loc: Location = window.location, history: History = window.history) {
  const params = new URLSearchParams(loc.search);
  const raw = (params.get("ref") ?? params.get("utm_source") ?? "").trim().toLowerCase();
  if (!raw) return;
  // Tidy the address bar either way, so a shared screenshot or link does not carry it on.
  params.delete("ref"); params.delete("utm_source");
  const rest = params.toString();
  try { history.replaceState(history.state, "", loc.pathname + (rest ? `?${rest}` : "") + loc.hash); } catch { /* ignore */ }
  if (!CODE.test(raw)) return;
  try { localStorage.setItem(KEY, JSON.stringify({ code: raw, at: Date.now() })); } catch { /* storage unavailable */ }
  let sent: string | null = null;
  try { sent = sessionStorage.getItem(SENT); } catch { /* storage unavailable */ }
  if (sent === raw) return;
  try { sessionStorage.setItem(SENT, raw); } catch { /* storage unavailable */ }
  void api("/public/ref", { method: "POST", body: JSON.stringify({ code: raw }) }).catch(() => undefined);
}

/** The campaign code to credit a registration to, if it is still fresh. */
export function currentCampaignRef(now = Date.now()): string | undefined {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as { code?: string; at?: number } | null;
    if (saved?.code && CODE.test(saved.code) && typeof saved.at === "number" && now - saved.at < TTL) return saved.code;
  } catch { /* storage unavailable or malformed */ }
  return undefined;
}
