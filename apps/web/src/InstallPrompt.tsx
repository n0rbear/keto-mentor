import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { dict, type Lang } from "./i18n";
import { dismissInstall, isInstallDismissed, isIOS, isStandalone } from "./pwa";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * A small, non-nagging install affordance. Chromium browsers get a real
 * Install button fed by `beforeinstallprompt`; iOS Safari never fires that
 * event, so it gets concise "Share -> Add to Home Screen" copy instead.
 * Hidden entirely once already installed/standalone, or after the user
 * dismisses it once (persisted locally, never shown again on every launch).
 */
export function InstallPrompt({ lang }: { lang: Lang }) {
  const t = dict[lang].pwa;
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isStandalone() || isInstallDismissed()) return;
    setDismissed(false);
    if (isIOS()) { setShowIOS(true); return; }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    dismissInstall();
    setDismissed(true);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (dismissed || (!deferredPrompt && !showIOS)) return null;

  return (
    <div className="install-prompt" role="region" aria-label={t.installTitle}>
      <div className="install-prompt-copy">
        <strong>{t.installTitle}</strong>
        <span>{showIOS ? t.iosInstructions : t.installBody}</span>
      </div>
      <div className="install-prompt-actions">
        {!showIOS && <button type="button" className="btn primary" onClick={install}><Download size={16}/>{t.installButton}</button>}
        <button type="button" className="icon-button" aria-label={t.installDismiss} onClick={dismiss}><X size={16}/></button>
      </div>
    </div>
  );
}
