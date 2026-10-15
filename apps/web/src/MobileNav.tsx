import { useEffect, useRef, useState } from "react";
import { BookOpen, CalendarDays, CalendarRange, LineChart, Crown, Gem, Home, Lightbulb, Menu, Moon, UtensilsCrossed, X } from "lucide-react";
import type { Lang } from "./i18n";

// Phone layout (owner request 2026-10-15: "ne legyen ennyire hosszan
// görgetendő"): below the desktop breakpoint the dashboard shows one part at
// a time, chosen from the header drop-down menu or the bottom bar. Desktop
// keeps everything on one page; the switch is pure CSS on <main
// data-mobile-view>, so the DOM (and every flow) stays the same.

export const MOBILE_VIEWS = ["today", "log", "week", "stats", "dinner", "plan", "recipes", "premium", "idea"] as const;
export type MobileView = (typeof MOBILE_VIEWS)[number];

export const MOBILE_VIEW_LABELS: Record<Lang, Record<MobileView, string>> = {
  hu: { today: "Ma", log: "Rögzítés", week: "Heti áttekintés", stats: "Haladó statisztika", dinner: "Vacsoraajánló", plan: "Heti étrendterv", recipes: "Receptek", premium: "Prémium – hamarosan", idea: "Ötletem van" },
  de: { today: "Heute", log: "Erfassen", week: "Wochenübersicht", stats: "Erweiterte Statistik", dinner: "Abendessen-Vorschlag", plan: "Wochenplan", recipes: "Rezepte", premium: "Premium – demnächst", idea: "Ich habe eine Idee" },
  en: { today: "Today", log: "Log", week: "Week overview", stats: "Advanced stats", dinner: "Dinner ideas", plan: "Weekly meal plan", recipes: "Recipes", premium: "Premium – coming soon", idea: "I have an idea" }
};
const SHORT: Record<Lang, Partial<Record<MobileView, string>>> = { hu: { dinner: "Vacsora" }, de: { dinner: "Abendessen" }, en: { dinner: "Dinner" } };
const ICONS: Record<MobileView, typeof Home> = { today: Home, log: UtensilsCrossed, week: CalendarDays, stats: LineChart, dinner: Moon, plan: CalendarRange, recipes: BookOpen, premium: Gem, idea: Lightbulb };
const PREMIUM: ReadonlySet<MobileView> = new Set(["stats", "dinner", "plan"]);
const BAR: MobileView[] = ["today", "log", "dinner", "recipes"];

const menuCopy = { hu: { open: "Menü", close: "Menü bezárása", premium: "Prémium" }, de: { open: "Menü", close: "Menü schließen", premium: "Premium" }, en: { open: "Menu", close: "Close menu", premium: "Premium" } } as const;

/** Header drop-down (phones only): every part of the dashboard in one list. */
export function MobileMenu({ lang, active, onSelect }: { lang: Lang; active: MobileView; onSelect: (view: MobileView) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = menuCopy[lang];
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent | TouchEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("touchstart", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div className="mobile-menu" ref={ref}>
      <button type="button" className="btn ghost mobile-menu-button" aria-haspopup="menu" aria-expanded={open} aria-label={open ? t.close : t.open} onClick={() => setOpen((value) => !value)}>
        {open ? <X size={18}/> : <Menu size={18}/>}<span>{t.open}</span>
      </button>
      {open && (
        <ul className="mobile-menu-list" role="menu" aria-label={t.open}>
          {MOBILE_VIEWS.map((view) => {
            const Icon = ICONS[view];
            return (
              <li key={view} role="none">
                <button type="button" role="menuitem" aria-current={active === view ? "page" : undefined} className="mobile-menu-item" onClick={() => { onSelect(view); setOpen(false); }}>
                  <Icon size={18} aria-hidden="true"/><span>{MOBILE_VIEW_LABELS[lang][view]}</span>
                  {PREMIUM.has(view) && <span className="premium-badge is-small"><Crown size={12} aria-hidden="true"/>{t.premium}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Bottom bar (phones only): the four most used parts. */
export function MobileNav({ lang, active, onSelect }: { lang: Lang; active: MobileView; onSelect: (view: MobileView) => void }) {
  return (
    <nav className="mobile-nav" aria-label={lang === "hu" ? "Fő navigáció" : lang === "de" ? "Hauptnavigation" : "Primary navigation"}>
      {BAR.map((view) => {
        const Icon = ICONS[view];
        return (
          <button key={view} type="button" className="mobile-nav-item" aria-current={active === view ? "page" : undefined} onClick={() => onSelect(view)}>
            <Icon size={22}/>
            <span>{SHORT[lang][view] ?? MOBILE_VIEW_LABELS[lang][view]}</span>
          </button>
        );
      })}
    </nav>
  );
}
