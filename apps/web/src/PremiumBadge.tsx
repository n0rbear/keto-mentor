import { Crown } from "lucide-react";
import type { Lang } from "./i18n";

// Premium features are marked clearly (owner request 2026-10-15): free to
// try while testing, part of the paid plan later.
const copy = {
  hu: { badge: "Prémium funkció", note: "A tesztidőszak alatt ingyenesen kipróbálhatod, később a prémium csomag része lesz." },
  de: { badge: "Premium-Funktion", note: "Während der Testphase kostenlos, später Teil des Premium-Pakets." },
  en: { badge: "Premium feature", note: "Free to try during testing, later part of the premium plan." }
} as const;

export function PremiumBadge({ lang }: { lang: Lang }) {
  return <span className="premium-badge"><Crown size={14} aria-hidden="true"/>{copy[lang].badge}</span>;
}

export function PremiumNote({ lang }: { lang: Lang }) {
  return <p className="premium-note">{copy[lang].note}</p>;
}
