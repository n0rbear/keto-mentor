// Voice food-entry recording facade: pure microphone-and-record logic, no
// upload/transcription/UI. Feeds a recorded audio Blob into the existing
// /meal-input/transcribe endpoint via onStopped. This is food entry, not
// dictation — recording auto-stops after a conservative maximum duration.

const MAX_RECORDING_MS = 30_000;
const PREFERRED_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4", "audio/mp4;codecs=mp4a.40.2"];

export type RecorderErrorKind = "mic_denied" | "mic_unavailable" | "recorder_unsupported" | "recorder_error";

export type RecorderHandlers = {
  onRecording: () => void;
  onStopped: (audio: Blob, mimeType: string) => void;
  onError: (kind: RecorderErrorKind, detail?: unknown) => void;
  /** Called once the auto-stop ceiling is hit, just before onStopped fires for that same recording. */
  onMaxDurationReached?: () => void;
};

export function isMicrophoneCapable(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia
    && typeof window !== "undefined" && window.isSecureContext === true
    && typeof MediaRecorder !== "undefined";
}

function preferredMimeType(): string | undefined {
  return PREFERRED_MIME_TYPES.find((type) => { try { return MediaRecorder.isTypeSupported(type); } catch { return false; } });
}

function classifyMicError(error: unknown): RecorderErrorKind {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") return "mic_denied";
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") return "mic_unavailable";
  return "recorder_error";
}

/**
 * Owns exactly one recording session: acquires the microphone, records into
 * a single Blob, and guarantees the mic is released on stop, error, or a
 * fresh start() call. Auto-stops at MAX_RECORDING_MS so a stuck/forgotten
 * recording can never grow unbounded.
 */
export class VoiceRecorderController {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private stopped = true;
  private maxDurationTimer: ReturnType<typeof setTimeout> | null = null;

  async start(handlers: RecorderHandlers): Promise<void> {
    this.stop();
    this.stopped = false;

    if (!isMicrophoneCapable()) { handlers.onError("recorder_unsupported"); return; }
    const mimeType = preferredMimeType();
    if (!mimeType) { handlers.onError("recorder_unsupported"); return; }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      handlers.onError(classifyMicError(error));
      return;
    }
    if (this.stopped) { for (const track of stream.getTracks()) track.stop(); return; }
    this.stream = stream;
    this.chunks = [];

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType });
    } catch (error) {
      this.stop();
      handlers.onError("recorder_error", error);
      return;
    }
    this.recorder = recorder;

    recorder.addEventListener("dataavailable", (event) => { if (event.data.size > 0) this.chunks.push(event.data); });
    recorder.addEventListener("stop", () => {
      // A cancelled (this.stop()) session also calls recorder.stop() to
      // release the mic — this event still fires for that case, but a
      // cancel must never surface audio through onStopped.
      const cancelled = this.stopped;
      const audio = new Blob(this.chunks, { type: mimeType });
      this.releaseStream();
      if (!cancelled && audio.size > 0) handlers.onStopped(audio, mimeType);
    });
    recorder.addEventListener("error", (event) => {
      if (this.stopped) return;
      this.stop();
      handlers.onError("recorder_error", (event as unknown as { error?: unknown }).error);
    });

    recorder.start();
    handlers.onRecording();
    this.maxDurationTimer = setTimeout(() => {
      handlers.onMaxDurationReached?.();
      this.stopRecordingOnly();
    }, MAX_RECORDING_MS);
  }

  private releaseStream() {
    if (this.stream) { for (const track of this.stream.getTracks()) track.stop(); this.stream = null; }
  }

  /** Stops the MediaRecorder (triggering its own "stop" -> onStopped) without discarding a still-in-flight recording. */
  private stopRecordingOnly() {
    if (this.maxDurationTimer != null) { clearTimeout(this.maxDurationTimer); this.maxDurationTimer = null; }
    if (this.recorder && this.recorder.state !== "inactive") this.recorder.stop();
  }

  /** User-initiated stop: finalizes and hands back whatever was recorded so far. */
  stopAndFinalize(): void {
    this.stopRecordingOnly();
  }

  /** Idempotent cancel: discards any in-progress recording, never calls onStopped. Safe from cancel, unmount, or a fresh start(). */
  stop(): void {
    this.stopped = true;
    if (this.maxDurationTimer != null) { clearTimeout(this.maxDurationTimer); this.maxDurationTimer = null; }
    if (this.recorder) {
      try { if (this.recorder.state !== "inactive") this.recorder.stop(); } catch { /* already stopped */ }
      this.recorder = null;
    }
    this.chunks = [];
    this.releaseStream();
  }
}
