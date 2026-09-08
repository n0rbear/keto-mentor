import { useEffect, useState } from "react";
import { BookOpen, Home, UtensilsCrossed } from "lucide-react";
import { dict, type Lang } from "./i18n";

const DESTINATIONS = [
  { id: "today", icon: Home },
  { id: "log-meal", icon: UtensilsCrossed },
  { id: "recipes", icon: BookOpen }
] as const;

const ACTIVATION_LINE_PX = 120;

/**
 * Classic scroll-spy rule: given each destination's current top offset (in
 * DOM/page order), the active one is the LAST section whose top has
 * scrolled above the activation line. This stays correct even for a very
 * tall final section (e.g. Recipes) that no longer "intersects" a narrow
 * detection band once its own top has scrolled far above the viewport —
 * which a naive isIntersecting-only check gets wrong. Falls back to the
 * first destination before anything has scrolled.
 */
export function pickActiveSection(sections: { id: string; top: number }[], activationLine = ACTIVATION_LINE_PX): string | null {
  let active: string | null = null;
  for (const section of sections) {
    if (section.top <= activationLine) active = section.id;
  }
  return active ?? sections[0]?.id ?? null;
}

/**
 * Bottom app-shell navigation, mobile-only (hidden above the desktop
 * breakpoint via CSS). The product has no client-side router — every
 * destination is a section already on the single page — so this scrolls to
 * an anchor rather than swapping views, which keeps it a thin composition
 * over the existing page instead of a second navigation architecture.
 */
export function MobileNav({ lang }: { lang: Lang }) {
  const t = dict[lang].nav;
  const [active, setActive] = useState<string>("today");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const elements = DESTINATIONS
      .map((d) => document.getElementById(d.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!elements.length) return;

    function recompute() {
      const sections = elements.map((el) => ({ id: el.id, top: el.getBoundingClientRect().top }));
      const next = pickActiveSection(sections);
      if (next) setActive(next);
    }

    // IntersectionObserver just wakes this up on scroll (cheaper than a
    // scroll listener); every wake-up recomputes from fresh live rects for
    // all sections rather than trusting only the entries in this batch.
    const observer = new IntersectionObserver(recompute, { threshold: [0, 1] });
    elements.forEach((section) => observer.observe(section));
    recompute();
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="mobile-nav" aria-label={lang === "hu" ? "Fő navigáció" : lang === "de" ? "Hauptnavigation" : "Primary navigation"}>
      {DESTINATIONS.map(({ id, icon: Icon }) => (
        <a key={id} href={`#${id}`} className="mobile-nav-item" aria-current={active === id ? "page" : undefined}>
          <Icon size={22}/>
          <span>{t[id === "today" ? "today" : id === "log-meal" ? "log" : "recipes"]}</span>
        </a>
      ))}
    </nav>
  );
}
