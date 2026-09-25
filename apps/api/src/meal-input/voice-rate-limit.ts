// Voice transcription incurs a real external cost per call — a separate,
// deliberately modest budget from ordinary API traffic (mirrors
// catalog/external-food-rate-limit.ts's own reasoning). Keyed by the
// authenticated user id only, never IP, so it cannot be bypassed by
// spoofing headers and never penalizes users sharing a NAT/proxy.
export const VOICE_TRANSCRIBE_RATE_LIMIT = Object.freeze({
  windowMs: 15 * 60 * 1000,
  limit: 20
});

export function voiceTranscribeRateLimitKey(request: { user?: { id: string } }) {
  if (!request.user?.id) throw new Error("Authenticated user required before voice transcription rate limiting");
  return request.user.id;
}
