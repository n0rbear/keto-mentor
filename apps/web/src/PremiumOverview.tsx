import { Crown } from "lucide-react";
import type { Lang } from "./i18n";
import { PremiumNote } from "./PremiumBadge";

// What premium will hold (owner-approved tier list, 2026-10-15). A feature
// moves from "soon" to "beta" when it ships; beta features are free to try
// during testing. Everything not listed stays free.
type Status = "beta" | "soon";
type Feature = { key: string; status: Status; title: Record<Lang, string>; text: Record<Lang, string> };

export const PREMIUM_FEATURES: Feature[] = [
  { key: "dinner", status: "beta", title: { hu: "Vacsoraajánló", de: "Abendessen-Vorschlag", en: "Dinner ideas" }, text: { hu: "Vacsora, ami belefér a mai keretedbe.", de: "Ein Abendessen, das in dein heutiges Budget passt.", en: "A dinner that fits today's targets." } },
  { key: "plan", status: "beta", title: { hu: "Heti étrendtervező és bevásárlólista", de: "Wochenplaner und Einkaufsliste", en: "Weekly meal plan and shopping list" }, text: { hu: "Egy hét reggeli, ebéd, vacsora a céljaidhoz, bevásárlólistával.", de: "Eine Woche Frühstück, Mittag- und Abendessen passend zu deinen Zielen, mit Einkaufsliste.", en: "A week of breakfasts, lunches and dinners for your targets, with a shopping list." } },
  { key: "ai", status: "soon", title: { hu: "Bővebb AI-keretek", de: "Mehr KI-Kontingent", en: "Larger AI allowance" }, text: { hu: "Több hangbevitel, recept-import és AI-becslés.", de: "Mehr Spracheingabe, Rezeptimport und KI-Schätzungen.", en: "More voice input, recipe imports and AI estimates." } },
  { key: "stats", status: "soon", title: { hu: "Haladó statisztika és testsúlynapló", de: "Erweiterte Statistik und Gewichtstagebuch", en: "Advanced stats and weight log" }, text: { hu: "Keto-tartás hétről hétre, trendek, testsúly grafikonon.", de: "Keto-Treue Woche für Woche, Trends, Gewicht im Diagramm.", en: "Keto adherence week by week, trends, weight chart." } },
  { key: "export", status: "soon", title: { hu: "Export (PDF/CSV)", de: "Export (PDF/CSV)", en: "Export (PDF/CSV)" }, text: { hu: "Naplód orvosnak vagy dietetikusnak.", de: "Dein Tagebuch für Arzt oder Ernährungsberatung.", en: "Your diary for your doctor or dietitian." } },
  { key: "micros", status: "soon", title: { hu: "Mikrotápanyagok", de: "Mikronährstoffe", en: "Micronutrients" }, text: { hu: "Vitaminok és ásványi anyagok naponta.", de: "Vitamine und Mineralstoffe pro Tag.", en: "Vitamins and minerals per day." } },
  { key: "goals", status: "soon", title: { hu: "Rugalmas célok", de: "Flexible Ziele", en: "Flexible goals" }, text: { hu: "Napokra bontott célok, például carb cycling.", de: "Ziele je Wochentag, z. B. Carb Cycling.", en: "Goals per weekday, e.g. carb cycling." } },
  { key: "reminders", status: "soon", title: { hu: "Emlékeztetők", de: "Erinnerungen", en: "Reminders" }, text: { hu: "Például: „még nem rögzítetted az ebédet”.", de: "Zum Beispiel: „Mittagessen noch nicht eingetragen“.", en: "For example: \"lunch not logged yet\"." } }
];

const copy = {
  hu: { title: "Prémium – hamarosan", lead: "Ezek a funkciók a prémium csomag részei lesznek. Minden más ingyenes marad.", beta: "Kipróbálható", soon: "Hamarosan" },
  de: { title: "Premium – demnächst", lead: "Diese Funktionen werden Teil des Premium-Pakets. Alles andere bleibt kostenlos.", beta: "Testbar", soon: "Demnächst" },
  en: { title: "Premium – coming soon", lead: "These features will be part of the premium plan. Everything else stays free.", beta: "Try it now", soon: "Coming soon" }
} as const;

export function PremiumOverview({ lang, statusOverrides = {} }: { lang: Lang; statusOverrides?: Partial<Record<string, Status>> }) {
  const t = copy[lang];
  return (
    <section className="card premium-overview is-premium" aria-labelledby="premium-overview-title">
      <h2 id="premium-overview-title" className="section-heading"><Crown size={20} aria-hidden="true"/>{t.title}</h2>
      <p className="text-sm text-muted">{t.lead}</p>
      <ul className="premium-list">
        {PREMIUM_FEATURES.map((feature) => {
          const status = statusOverrides[feature.key] ?? feature.status;
          return (
            <li key={feature.key} className="premium-item">
              <div><strong>{feature.title[lang]}</strong><span className="text-xs text-muted">{feature.text[lang]}</span></div>
              <span className={`premium-status is-${status}`}>{status === "beta" ? t.beta : t.soon}</span>
            </li>
          );
        })}
      </ul>
      <PremiumNote lang={lang}/>
    </section>
  );
}
