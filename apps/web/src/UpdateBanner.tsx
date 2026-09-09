import { RefreshCw } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { dict, type Lang } from "./i18n";

// One hour: frequent enough that a deployed fix/feature is noticed within
// the same session rather than only on the browser's own (much slower,
// unpredictable) background check cadence, infrequent enough to be a
// negligible network/battery cost. This only makes the banner appear
// sooner — it never changes WHEN the update is applied, still always an
// explicit click (see the component doc below).
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * registerType is "prompt" (see vite.config.ts), so a new service worker
 * installs and waits — it never activates itself. needRefresh only becomes
 * true once a new version is ready; reloading is always the user's own
 * click, so this can never interrupt an in-progress meal/recipe edit. A
 * periodic background check (registration.update()) only makes that
 * "ready" detection happen sooner in a long-lived open tab — it never
 * auto-applies anything, so it carries none of the risk of the two things
 * explicitly ruled out here: an aggressive reload loop, or losing unsaved
 * meal/recipe input.
 */
export function UpdateBanner({ lang }: { lang: Lang }) {
  const t = dict[lang].pwa;
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => { registration.update().catch(() => {}); }, UPDATE_CHECK_INTERVAL_MS);
    }
  });

  if (!needRefresh) return null;

  return (
    <div className="update-banner" role="status">
      <span>{t.updateAvailable}</span>
      <button type="button" className="btn primary" onClick={() => updateServiceWorker(true)}>
        <RefreshCw size={15}/>{t.updateButton}
      </button>
    </div>
  );
}
