// Push notifications to the owner through the NorbApp notification hub
// (Fuel: POST https://fuel.norbapp.com/api/notify, owner request 2026-10-27).
// The hub decides from its switches whether the notification goes out; the
// owner flips them from an iPhone shortcut. `on` is only the default for an
// event type the hub has not seen yet. Without NOTIFY_HUB_TOKEN nothing is
// sent (local, tests, staging). Fire and forget: never throws, never delays.

export type HubEvent = { event: string; label: string; on: boolean; title?: string; message: string; tags?: string[]; click?: string };

const DEFAULT_URL = "https://fuel.norbapp.com/api/notify";

/** Every event this API reports, so the owner can switch each one before it first happens. */
export const KETO_EVENTS: ReadonlyArray<{ event: string; label: string; on: boolean }> = [
  { event: "signup", label: "Új regisztráció", on: true },
  { event: "feedback", label: "Visszajelzés (hiba vagy ötlet)", on: true },
  { event: "account_deleted", label: "Fiók törölve", on: true },
  { event: "login", label: "Bejelentkezés", on: false },
  { event: "public_try", label: "Kipróbálás regisztráció nélkül", on: false },
  { event: "email_verified", label: "E-mail megerősítve", on: false },
];

/**
 * Announces KETO_EVENTS to the hub at startup (POST …/api/notify/register).
 * The hub may be asleep, so a failed attempt is retried a few times.
 */
export function registerWithHub(
  config: { url?: string; token?: string } = { url: process.env.NOTIFY_HUB_URL, token: process.env.NOTIFY_HUB_TOKEN },
  deps: { fetchImpl?: typeof fetch; log?: (line: string) => void; retryMs?: number; attempts?: number } = {},
): void {
  const token = config.token?.trim() ?? "";
  if (!token) return;
  const url = `${(config.url?.trim() || DEFAULT_URL).replace(/\/+$/, "")}/register`;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const log = deps.log ?? console.log;
  const attempts = deps.attempts ?? 4;
  const attempt = (left: number) => {
    void fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ site: "keto", siteLabel: "Keto Mentor", events: KETO_EVENTS.map((e) => ({ event: e.event, label: e.label, default: e.on })) }),
      signal: AbortSignal.timeout(90_000),
    })
      .then(async (response) => {
        await response.body?.cancel().catch(() => undefined);
        if (!response.ok) throw Object.assign(new Error("status"), { name: `status_${response.status}` });
      })
      .catch((error: any) => {
        log(`notify_hub register failed=${error?.name ?? "error"} left=${left - 1}`);
        if (left > 1) setTimeout(() => attempt(left - 1), deps.retryMs ?? 5 * 60 * 1000).unref?.();
      });
  };
  attempt(attempts);
}

export function hubNotifier(
  config: { url?: string; token?: string } = { url: process.env.NOTIFY_HUB_URL, token: process.env.NOTIFY_HUB_TOKEN },
  deps: { fetchImpl?: typeof fetch; log?: (line: string) => void } = {},
) {
  const token = config.token?.trim() ?? "";
  const url = config.url?.trim() || DEFAULT_URL;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const log = deps.log ?? console.log;
  return (e: HubEvent): void => {
    if (!token) return;
    const body = { site: "keto", siteLabel: "Keto Mentor", event: e.event, label: e.label, default: e.on, title: e.title, message: e.message.slice(0, 1000), tags: e.tags, click: e.click };
    void fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
      .then(async (response) => {
        await response.body?.cancel().catch(() => undefined);
        if (!response.ok) log(`notify_hub event=${e.event} status=${response.status}`);
      })
      .catch((error: any) => log(`notify_hub event=${e.event} failed=${error?.name ?? "error"}`));
  };
}

export const notifyOwner = hubNotifier();
