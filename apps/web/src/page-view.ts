import { api } from "./api";

// Page views for the owner's push notifications (owner request 2026-10-27):
// the app reports where it is when it opens and when the shown part changes.
// Only the view name goes out (no account, no input); the API forwards it to
// the NorbApp notification hub, where the owner can switch it off. The same
// view is reported at most once a minute.
const recent = new Map<string, number>();

export function reportPageView(view: string, now = Date.now()) {
  const name = view.trim().slice(0, 60);
  if (!name) return;
  const last = recent.get(name);
  if (last !== undefined && now - last < 60_000) return;
  recent.set(name, now);
  void api("/public/pageview", { method: "POST", body: JSON.stringify({ view: name }) }).catch(() => undefined);
}
