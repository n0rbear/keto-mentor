import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { api, type ApiState } from "./api";
import type { Lang } from "./i18n";

// Beta reward (owner, 2026-10-16): every tester sees their current place;
// the 10 with the most logged meals by the end of the round get lifetime
// premium. The API decides who competes (not the owner or admins).
type Rank = { eligible: false } | { eligible: true; rank: number | null; meals: number; participants: number; winners: number; endsAt: string; ended: boolean; mealsToTop: number };

const copy = {
  hu: {
    place: (r: number, m: number) => `Helyezésed most: ${r}. hely (${m} naplózott étkezés)`,
    start: "Naplózd az első étkezésed, és máris versenyben vagy!",
    inTop: "Benne vagy a legjobb 10-ben – így tovább!",
    toTop: (n: number) => `Még ${n} étkezés, és bekerülsz a legjobb 10 közé.`,
    rule: (w: number, d: string) => `A ${w} legtöbb étkezést naplózó tesztelő élethosszig tartó prémiumot kap. Az első kör vége: ${d}.`,
    ended: (r: number | null) => r ? `A béta első köre lezárult. Végső helyezésed: ${r}. hely.` : "A béta első köre lezárult."
  },
  de: {
    place: (r: number, m: number) => `Dein aktueller Platz: ${r} (${m} erfasste Mahlzeiten)`,
    start: "Erfasse deine erste Mahlzeit, und du bist dabei!",
    inTop: "Du bist unter den Top 10 – weiter so!",
    toTop: (n: number) => `Noch ${n} Mahlzeit${n === 1 ? "" : "en"}, und du bist unter den Top 10.`,
    rule: (w: number, d: string) => `Die ${w} Tester mit den meisten erfassten Mahlzeiten erhalten Premium auf Lebenszeit. Ende der ersten Runde: ${d}.`,
    ended: (r: number | null) => r ? `Die erste Beta-Runde ist beendet. Dein Endplatz: ${r}.` : "Die erste Beta-Runde ist beendet."
  },
  en: {
    place: (r: number, m: number) => `Your current place: #${r} (${m} logged meal${m === 1 ? "" : "s"})`,
    start: "Log your first meal and you're in the running!",
    inTop: "You're in the top 10 – keep it up!",
    toTop: (n: number) => `${n} more meal${n === 1 ? "" : "s"} and you're in the top 10.`,
    rule: (w: number, d: string) => `The ${w} testers who log the most meals get lifetime premium. First round ends: ${d}.`,
    ended: (r: number | null) => r ? `The first beta round has ended. Your final place: #${r}.` : "The first beta round has ended."
  }
} as const;

const LOCALE = { hu: "hu-HU", de: "de-AT", en: "en-GB" } as const;

export function BetaRankBanner({ lang, state, refreshKey }: { lang: Lang; state: ApiState; refreshKey?: unknown }) {
  const [data, setData] = useState<Rank | null>(null);
  useEffect(() => { api<Rank>("/me/beta-rank", {}, state).then(setData).catch(() => setData(null)); }, [refreshKey]);
  if (!data?.eligible) return null;
  const t = copy[lang];
  const date = new Date(data.endsAt).toLocaleDateString(LOCALE[lang], { month: "long", day: "numeric", timeZone: "Europe/Vienna" }).replace(/\.$/, "");
  return (
    <div className="beta-rank-banner" role="status">
      <Trophy size={20} aria-hidden="true"/>
      {data.ended ? <p><b>{t.ended(data.rank)}</b></p> : (
        <p>
          <b>{data.rank ? t.place(data.rank, data.meals) : t.start}</b>{" "}
          {data.rank && (data.mealsToTop === 0 ? t.inTop : t.toTop(data.mealsToTop))}{" "}
          <span className="text-muted">{t.rule(data.winners, date)}</span>
        </p>
      )}
    </div>
  );
}
