import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { dict, type Lang } from "./i18n";

/**
 * Full offline mode is out of scope — this is just an honest, controlled
 * "no network" state so the app never silently fails or implies unsaved
 * changes went through while offline.
 */
export function OfflineBanner({ lang }: { lang: Lang }) {
  const t = dict[lang].pwa;
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);

  useEffect(() => {
    function goOnline() { setOnline(true); }
    function goOffline() { setOnline(false); }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="offline-banner" role="alert">
      <WifiOff size={15}/><span>{t.offlineMessage}</span>
    </div>
  );
}
