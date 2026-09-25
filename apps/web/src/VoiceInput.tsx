import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import { dict, type Lang } from "./i18n";
import { VoiceRecorderController, type RecorderErrorKind } from "./voice-recorder";

type VoiceState = "idle" | "requesting_permission" | "recording" | "transcribing" | RecorderErrorKind | "transcription_failed" | "empty_audio";

const ERROR_STATES = new Set<VoiceState>(["mic_denied", "mic_unavailable", "recorder_unsupported", "recorder_error", "transcription_failed", "empty_audio"]);

function transcribeErrorState(error: unknown): VoiceState {
  if (error instanceof ApiError && error.code === "transcription_empty_audio") return "empty_audio";
  return "transcription_failed";
}

/**
 * Microphone input for the existing natural-language meal-input field: only
 * ever produces TEXT, handed to the caller via onTranscribed for the user to
 * inspect/edit — never auto-submitted, never itself calls the meal-
 * interpretation pipeline. Speech failure always leaves the normal text
 * field usable (see the ERROR_STATES branch below, which never blocks the
 * caller's own input).
 */
export function VoiceInput({ lang, state, onTranscribed }: { lang: Lang; state: ApiState; onTranscribed: (text: string) => void }) {
  const t = dict[lang].voice;
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [maxDurationHit, setMaxDurationHit] = useState(false);
  const controllerRef = useRef<VoiceRecorderController | null>(null);

  useEffect(() => () => controllerRef.current?.stop(), []);

  async function transcribe(audio: Blob, mimeType: string) {
    setVoiceState("transcribing");
    try {
      const result = await api<{ text: string; language: string | null }>(
        // The page's CURRENT language, not the profile locale: speech is
        // transcribed in the language the user is looking at (owner request,
        // 2026-09-25 — a Hungarian page must transcribe Hungarian).
        `/meal-input/transcribe?lang=${encodeURIComponent(lang)}`,
        { method: "POST", body: audio, headers: { "Content-Type": mimeType } },
        state
      );
      setVoiceState("idle");
      if (result.text.trim()) onTranscribed(result.text.trim());
      else setVoiceState("transcription_failed");
    } catch (caught) {
      setVoiceState(transcribeErrorState(caught));
    }
  }

  async function start() {
    setMaxDurationHit(false);
    setVoiceState("requesting_permission");
    const controller = new VoiceRecorderController();
    controllerRef.current = controller;
    await controller.start({
      onRecording: () => setVoiceState("recording"),
      onStopped: (audio, mimeType) => { void transcribe(audio, mimeType); },
      onError: (kind) => setVoiceState(kind),
      onMaxDurationReached: () => setMaxDurationHit(true)
    });
  }

  function stopAndTranscribe() {
    controllerRef.current?.stopAndFinalize();
  }

  function cancel() {
    controllerRef.current?.stop();
    setVoiceState("idle");
  }

  const errorMessage = voiceState === "mic_denied" ? t.micDenied
    : voiceState === "mic_unavailable" ? t.micUnavailable
    : voiceState === "recorder_unsupported" ? t.recorderUnsupported
    : voiceState === "recorder_error" ? t.recorderError
    : voiceState === "transcription_failed" ? t.transcriptionFailed
    : voiceState === "empty_audio" ? t.emptyAudio
    : "";

  return (
    <div className="voice-input">
      {voiceState === "idle" && (
        <button type="button" className="btn secondary voice-mic-button" onClick={start}>
          <Mic aria-hidden="true" size={16}/> {t.micButton}
        </button>
      )}
      {(voiceState === "requesting_permission" || voiceState === "recording") && (
        <div className="voice-recording-row">
          <span className="status recording" role="status" aria-live="polite">
            {voiceState === "requesting_permission" ? t.requestingPermission : t.recording}
          </span>
          {voiceState === "recording" && (
            <button type="button" className="btn primary voice-stop-button" onClick={stopAndTranscribe}>
              <Square aria-hidden="true" size={14} fill="currentColor"/> {t.stopButton}
            </button>
          )}
          <button type="button" className="btn secondary" onClick={cancel}>{t.cancel}</button>
        </div>
      )}
      {voiceState === "transcribing" && <span className="status" role="status" aria-live="polite">{t.transcribing}</span>}
      {maxDurationHit && voiceState === "transcribing" && <small className="text-xs text-muted">{t.maxDurationNotice}</small>}
      {ERROR_STATES.has(voiceState) && (
        <div className="status error" role="alert">
          {errorMessage}
          <button type="button" className="btn secondary" onClick={() => setVoiceState("idle")}>{t.cancel}</button>
        </div>
      )}
      {voiceState === "idle" && <small className="text-xs text-muted voice-privacy">{t.privacyNotice}</small>}
    </div>
  );
}
