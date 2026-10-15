// Transactional e-mail via Resend's HTTP API (owner decision 2026-10-15).
// No SDK: one POST with the API key from the environment. The key never
// appears in logs; neither do recipient addresses.

export type MailMessage = { to: string; subject: string; text: string; html: string };
export type MailResult = { outcome: "sent" | "not_configured" | "failed"; status?: number };
export type Mailer = { send(message: MailMessage): Promise<MailResult> };

export function resendMailer(apiKey: string | undefined, from: string, fetchImpl: typeof fetch = fetch): Mailer {
  return {
    async send(message) {
      if (!apiKey) return { outcome: "not_configured" };
      try {
        const response = await fetchImpl("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
          signal: AbortSignal.timeout(10_000)
        });
        return response.ok ? { outcome: "sent", status: response.status } : { outcome: "failed", status: response.status };
      } catch {
        return { outcome: "failed" };
      }
    }
  };
}
