import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bug, CheckCircle2, Lightbulb, X } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import { dict, type Lang } from "./i18n";

// In-app bug report (owner request 2026-10-13): the text plus a little
// non-secret context goes to POST /feedback, which writes one searchable
// `user_feedback` log line the developer reads on Render. Never sends
// passwords, tokens or anything beyond the fields below. The panel and the
// thank-you note are portalled to <body>: the sticky header's backdrop-filter
// would otherwise trap position: fixed inside it. After a successful send
// the panel stays open and shows the ticket id until the user closes it: a
// timed toast at the bottom of the page was easy to miss on desktop (owner
// report 6c6ae5, 2026-10-13).

export const FEEDBACK_MAX_LENGTH = 2000;

export type FeedbackClientContext = { view: string; lastInput?: string; operationId?: string };
type BuildInfoData = { environment?: string; branch?: string | null; commit?: string | null };

const cap = (value: string | undefined, max: number) => (value ? value.slice(0, max) : undefined);

async function buildLabel(): Promise<string | undefined> {
  try {
    const info = await api<BuildInfoData>("/build-info", {});
    return cap(`${info.branch ?? "?"}@${info.commit ?? "?"} ${info.environment ?? ""}`.trim(), 80);
  } catch {
    return undefined;
  }
}

// kind "idea" is the "Ötletem van" button (owner request 2026-10-15): same
// panel and endpoint, its own wording; variant "card" is the visible prompt
// at the bottom of the dashboard.
export function FeedbackReport({ lang, state, getContext, kind = "bug", variant = "button" }: { lang: Lang; state: ApiState; getContext: () => FeedbackClientContext; kind?: "bug" | "idea"; variant?: "button" | "card" }) {
  const t = kind === "idea" ? { ...dict[lang].feedback, ...dict[lang].idea } : dict[lang].feedback;
  const Icon = kind === "idea" ? Lightbulb : Bug;
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const doneRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { if (open && !ticket) textareaRef.current?.focus(); }, [open, ticket]);
  useEffect(() => { if (ticket) doneRef.current?.focus(); }, [ticket]);

  function close() {
    setOpen(false);
    setError(null);
    setTicket(null);
  }

  async function send() {
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const client = getContext();
      const context = {
        view: cap(client.view, 40),
        lang,
        build: await buildLabel(),
        clientTime: new Date().toISOString(),
        // An idea is not about the last meal entry, so it never carries it.
        lastInput: kind === "idea" ? undefined : cap(client.lastInput, 500),
        operationId: kind === "idea" ? undefined : cap(client.operationId, 64)
      };
      const result = await api<{ id: string }>("/feedback", { method: "POST", body: JSON.stringify({ kind, message: text.slice(0, FEEDBACK_MAX_LENGTH), context }) }, state);
      setTicket(result.id);
      setMessage("");
    } catch (caught) {
      setError(caught instanceof ApiError && caught.status === 429 ? t.rateLimited : t.failed);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {variant === "card" ? (
        <div className="card idea-card">
          <Icon size={22} aria-hidden="true"/>
          <div><strong>{dict[lang].idea.cardTitle}</strong><p className="text-sm text-muted">{dict[lang].idea.cardText}</p></div>
          <button type="button" className="btn primary" aria-expanded={open} onClick={() => { setTicket(null); setOpen(true); }}>{t.open}</button>
        </div>
      ) : (
        <button type="button" className={`btn ghost ${kind === "idea" ? "idea-button" : ""}`} aria-label={t.open} aria-expanded={open} onClick={() => { setTicket(null); setOpen(true); }}>
          <Icon size={17}/><span>{t.open}</span>
        </button>
      )}
      {open && ticket && createPortal(
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t.title} onKeyDown={(event) => { if (event.key === "Escape") close(); }}>
          <div className="modal-panel card">
            <div className="modal-header">
              <h3>{t.title}</h3>
              <button type="button" className="icon-button" aria-label={t.close} onClick={close}><X size={16}/></button>
            </div>
            <div className="feedback-success" role="status">
              <CheckCircle2 size={22} aria-hidden="true"/>
              <div>
                <p className="feedback-success-title">{t.thanks}</p>
                <p>{t.ticket}: <strong className="feedback-ticket">#{ticket}</strong></p>
              </div>
            </div>
            <div className="modal-actions">
              <button ref={doneRef} type="button" className="btn primary" onClick={close}>{t.close}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {open && !ticket && createPortal(
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t.title} onKeyDown={(event) => { if (event.key === "Escape") close(); }}>
          <form className="modal-panel card" onSubmit={(event) => { event.preventDefault(); void send(); }}>
            <div className="modal-header">
              <h3>{t.title}</h3>
              <button type="button" className="icon-button" aria-label={t.close} onClick={close}><X size={16}/></button>
            </div>
            <label className="modal-field">
              <span className="sr-only">{t.title}</span>
              <textarea ref={textareaRef} className="field feedback-textarea" rows={5} maxLength={FEEDBACK_MAX_LENGTH} placeholder={t.placeholder}
                value={message} onChange={(event) => setMessage(event.target.value)}/>
            </label>
            <div className="feedback-meta">
              <span className="text-xs text-muted">{t.privacy}</span>
              <span className="text-xs text-muted" aria-live="polite">{message.length}/{FEEDBACK_MAX_LENGTH}</span>
            </div>
            {error && <p className="text-xs feedback-error" role="alert">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={close}>{t.cancel}</button>
              <button type="submit" className="btn primary" disabled={sending || !message.trim()}>{sending ? t.sending : t.send}</button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </>
  );
}
