import { useState } from "react";
import { UtensilsCrossed, X } from "lucide-react";
import { api, type ApiState } from "./api";
import { dict, type Lang } from "./i18n";
import { PlatePortion, type Plate } from "./PlatePortion";

// Owner decision (2026-10-11, locked): "After registration, ask the user what
// plates they have. If they say they don't want to provide them, use average
// plate sizes." Shown once: right after the first setup, and once for an
// existing user with no saved plate who never answered. Either exit stores
// the answer (profile.plateSetup), so it never comes back. The plate editor
// is the existing saved-plates one (PlatePortion, manage mode).

/** Whether the one-time plate question is still open for this /me user. */
export function plateSetupPending(user: { profile?: { onboardingDone?: boolean; plateSetup?: string | null } | null; _count?: { plates?: number } } | null | undefined): boolean {
  return !!user?.profile?.onboardingDone && !user.profile.plateSetup && user._count?.plates === 0;
}

export function PlateSetup({ lang, state, onAnswered }: { lang: Lang; state: ApiState; onAnswered: (answer: "saved" | "skipped") => void }) {
  const t = dict[lang].plateSetup;
  const [plates, setPlates] = useState<Plate[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function answer(value: "saved" | "skipped") {
    setBusy(true); setFailed(false);
    try {
      await api("/me/plate-setup", { method: "PUT", body: JSON.stringify({ answer: value }) }, state);
      onAnswered(value);
    } catch { setFailed(true); } finally { setBusy(false); }
  }

  return <section className="card plate-setup-panel" aria-labelledby="plate-setup-title">
    <div className="auth-intro">
      <p className="panel-kicker"><UtensilsCrossed aria-hidden="true" size={13}/> {t.kicker}</p>
      <h2 id="plate-setup-title">{t.title}</h2>
      <p>{t.lead}</p>
    </div>
    <PlatePortion lang={lang} state={state} mode="manage" onPlatesChange={setPlates}/>
    <div className="plate-setup-actions">
      <button type="button" className="btn primary" disabled={busy || !plates.length} onClick={() => { void answer("saved"); }}>{t.done}</button>
      <button type="button" className="btn secondary" disabled={busy} onClick={() => { void answer("skipped"); }}>{t.skip}</button>
    </div>
    <small className="plate-setup-later">{t.later}</small>
    {failed && <small className="plate-portion-error" role="alert">{t.failed}</small>}
  </section>;
}

/** "Tányérjaim" (header entry): the same saved-plates editor, any time. */
export function MyPlates({ lang, state, onClose }: { lang: Lang; state: ApiState; onClose: () => void }) {
  const t = dict[lang].myPlates;
  return <section className="card plate-setup-panel" aria-labelledby="my-plates-title">
    <div className="auth-intro">
      <p className="panel-kicker"><UtensilsCrossed aria-hidden="true" size={13}/> {t.open}</p>
      <h2 id="my-plates-title">{t.open}</h2>
      <p>{t.lead}</p>
    </div>
    <PlatePortion lang={lang} state={state} mode="manage"/>
    <div className="plate-setup-actions">
      <button type="button" className="btn secondary" onClick={onClose}><X aria-hidden="true" size={16}/> {t.close}</button>
    </div>
  </section>;
}
