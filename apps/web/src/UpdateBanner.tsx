import { RefreshCw } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { dict, type Lang } from "./i18n";

/**
 * registerType is "prompt" (see vite.config.ts), so a new service worker
 * installs and waits — it never activates itself. needRefresh only becomes
 * true once a new version is ready; reloading is always the user's own
 * click, so this can never interrupt an in-progress meal/recipe edit.
 */
export function UpdateBanner({ lang }: { lang: Lang }) {
  const t = dict[lang].pwa;
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();

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
