import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bug, X } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import { dict, type Lang } from "./i18n";

// In-app bug report (owner request 2026-10-13): the text plus a little
// non-secret context goes to POST /feedback, which writes one searchable
// `user_feedback` log line the developer reads on Render. Never sends
// passwords, tokens or anything beyond the fields below. The panel and the
// thank-you note are portalled to <body>: the sticky header's backdrop-filter
// would otherwise trap position: fixed inside it.

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

export function FeedbackReport({ lang, state, getContext }: { lang: Lang; state: ApiState; getContext: () => FeedbackClientContext }) {
  const t = dict[lang].feedback;
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (open) textareaRef.current?.focus(); }, [open]);
  useEffect(() => {
    if (!ticket) return;
    const timer = window.setTimeout(() => setTicket(null), 10000);
    return () => window.clearTimeout(timer);
  }, [ticket]);

  function close() {
    setOpen(false);
    setError(null);
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
        lastInput: cap(client.lastInput, 500),
        operationId: cap(client.operationId, 64)
      };
      const result = await api<{ id: string }>("/feedback", { method: "POST", body: JSON.stringify({ message: text.slice(0, FEEDBACK_MAX_LENGTH), context }) }, state);
      setTicket(result.id);
      setMessage("");
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiError && caught.status === 429 ? t.rateLimited : t.failed);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button type="button" className="btn ghost" aria-label={t.open} aria-expanded={open} onClick={() => { setTicket(null); setOpen(true); }}>
        <Bug size={17}/><span>{t.open}</span>
      </button>
      {ticket && createPortal(
        <div className="feedback-toast card" role="status">
          <span>{t.thanks} {t.ticket}: #{ticket}</span>
          <button type="button" className="icon-button" aria-label={t.close} onClick={() => setTicket(null)}><X size={14}/></button>
        </div>,
        document.body
      )}
      {open && createPortal(
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
