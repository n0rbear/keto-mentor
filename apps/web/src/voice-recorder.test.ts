// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VoiceRecorderController, isMicrophoneCapable } from "./voice-recorder";

function setSecureContext(value: boolean) {
  Object.defineProperty(window, "isSecureContext", { value, configurable: true });
}

function fakeTrack() { return { stop: vi.fn() }; }
function fakeStream(trackCount = 1) {
  const tracks = Array.from({ length: trackCount }, fakeTrack);
  return { getTracks: () => tracks, tracks };
}

function setGetUserMedia(impl: (constraints: MediaStreamConstraints) => Promise<any>) {
  Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia: vi.fn(impl) }, configurable: true });
}

class FakeMediaRecorder {
  static isTypeSupported = vi.fn((type: string) => type === "audio/webm;codecs=opus" || type === "audio/webm");
  state: "inactive" | "recording" = "inactive";
  private listeners: Record<string, Array<(event?: any) => void>> = {};
  constructor(public stream: unknown, public options: { mimeType: string }) {}
  addEventListener(name: string, handler: (event?: any) => void) { (this.listeners[name] ??= []).push(handler); }
  start() { this.state = "recording"; }
  stop() {
    this.state = "inactive";
    (this.listeners.stop ?? []).forEach((handler) => handler());
  }
  emitData(data: Blob) { (this.listeners.dataavailable ?? []).forEach((handler) => handler({ data })); }
  emitError(error: unknown) { (this.listeners.error ?? []).forEach((handler) => handler({ error })); }
}

function installFakeRecorder() {
  (window as any).MediaRecorder = FakeMediaRecorder;
  return FakeMediaRecorder;
}

beforeEach(() => {
  setSecureContext(true);
  setGetUserMedia(async () => fakeStream());
  installFakeRecorder();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  delete (window as any).MediaRecorder;
  Reflect.deleteProperty(navigator, "mediaDevices");
});

describe("isMicrophoneCapable", () => {
  it("requires a secure context, getUserMedia, and MediaRecorder", () => {
    expect(isMicrophoneCapable()).toBe(true);
    setSecureContext(false);
    expect(isMicrophoneCapable()).toBe(false);
    setSecureContext(true);
    delete (window as any).MediaRecorder;
    expect(isMicrophoneCapable()).toBe(false);
  });
});

describe("VoiceRecorderController", () => {
  it("requests the microphone only once start() is called, then reports recording", async () => {
    const getUserMedia = vi.fn(async (constraints: MediaStreamConstraints) => { expect(constraints).toEqual({ audio: true }); return fakeStream(); });
    Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia }, configurable: true });
    const onRecording = vi.fn();
    const controller = new VoiceRecorderController();
    expect(getUserMedia).not.toHaveBeenCalled();
    await controller.start({ onRecording, onStopped: vi.fn(), onError: vi.fn() });
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(onRecording).toHaveBeenCalledTimes(1);
    controller.stop();
  });

  it("reports recorder_unsupported when MediaRecorder does not exist", async () => {
    delete (window as any).MediaRecorder;
    const onError = vi.fn();
    const controller = new VoiceRecorderController();
    await controller.start({ onRecording: vi.fn(), onStopped: vi.fn(), onError });
    expect(onError).toHaveBeenCalledWith("recorder_unsupported");
  });

  it("classifies getUserMedia rejection as mic_denied for NotAllowedError", async () => {
    setGetUserMedia(async () => { throw Object.assign(new Error("denied"), { name: "NotAllowedError" }); });
    const onError = vi.fn();
    const controller = new VoiceRecorderController();
    await controller.start({ onRecording: vi.fn(), onStopped: vi.fn(), onError });
    expect(onError).toHaveBeenCalledWith("mic_denied");
  });

  it("classifies getUserMedia rejection as mic_unavailable for NotFoundError", async () => {
    setGetUserMedia(async () => { throw Object.assign(new Error("no mic"), { name: "NotFoundError" }); });
    const onError = vi.fn();
    const controller = new VoiceRecorderController();
    await controller.start({ onRecording: vi.fn(), onStopped: vi.fn(), onError });
    expect(onError).toHaveBeenCalledWith("mic_unavailable");
  });

  it("stopAndFinalize hands back the recorded audio as a Blob and stops every track", async () => {
    const stream = fakeStream(2);
    setGetUserMedia(async () => stream);
    const onStopped = vi.fn();
    const controller = new VoiceRecorderController();
    let recorder!: FakeMediaRecorder;
    const OriginalCtor = (window as any).MediaRecorder;
    (window as any).MediaRecorder = class extends OriginalCtor { constructor(s: unknown, o: any) { super(s, o); recorder = this as unknown as FakeMediaRecorder; } };
    await controller.start({ onRecording: vi.fn(), onStopped, onError: vi.fn() });
    recorder.emitData(new Blob(["chunk"], { type: "audio/webm" }));
    controller.stopAndFinalize();
    expect(onStopped).toHaveBeenCalledTimes(1);
    const [blob, mimeType] = onStopped.mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(mimeType).toMatch(/^audio\//);
    for (const track of stream.tracks) expect(track.stop).toHaveBeenCalled();
  });

  it("cancel (stop()) never calls onStopped even if the underlying recorder still fires its stop event", async () => {
    const onStopped = vi.fn();
    const controller = new VoiceRecorderController();
    let recorder!: FakeMediaRecorder;
    const OriginalCtor = (window as any).MediaRecorder;
    (window as any).MediaRecorder = class extends OriginalCtor { constructor(s: unknown, o: any) { super(s, o); recorder = this as unknown as FakeMediaRecorder; } };
    await controller.start({ onRecording: vi.fn(), onStopped, onError: vi.fn() });
    recorder.emitData(new Blob(["chunk"], { type: "audio/webm" }));
    controller.stop(); // cancel, not stopAndFinalize
    expect(onStopped).not.toHaveBeenCalled();
  });

  it("does not call onStopped when no audio data was ever captured (empty recording)", async () => {
    const onStopped = vi.fn();
    const controller = new VoiceRecorderController();
    await controller.start({ onRecording: vi.fn(), onStopped, onError: vi.fn() });
    controller.stopAndFinalize();
    expect(onStopped).not.toHaveBeenCalled();
  });

  it("auto-stops and calls onMaxDurationReached after the maximum recording duration", async () => {
    vi.useFakeTimers();
    const onStopped = vi.fn();
    const onMaxDurationReached = vi.fn();
    const controller = new VoiceRecorderController();
    let recorder!: FakeMediaRecorder;
    const OriginalCtor = (window as any).MediaRecorder;
    (window as any).MediaRecorder = class extends OriginalCtor { constructor(s: unknown, o: any) { super(s, o); recorder = this as unknown as FakeMediaRecorder; } };
    await controller.start({ onRecording: vi.fn(), onStopped, onError: vi.fn(), onMaxDurationReached });
    recorder.emitData(new Blob(["chunk"], { type: "audio/webm" }));
    await vi.advanceTimersByTimeAsync(30_000);
    expect(onMaxDurationReached).toHaveBeenCalledTimes(1);
    expect(onStopped).toHaveBeenCalledTimes(1);
  });

  it("a fresh start() call stops any previous session first", async () => {
    const streamA = fakeStream();
    const streamB = fakeStream();
    let call = 0;
    setGetUserMedia(async () => (call++ === 0 ? streamA : streamB));
    const controller = new VoiceRecorderController();
    await controller.start({ onRecording: vi.fn(), onStopped: vi.fn(), onError: vi.fn() });
    await controller.start({ onRecording: vi.fn(), onStopped: vi.fn(), onError: vi.fn() });
    for (const track of streamA.tracks) expect(track.stop).toHaveBeenCalled();
    controller.stop();
  });

  it("stop() is idempotent and safe to call multiple times", async () => {
    const stream = fakeStream();
    setGetUserMedia(async () => stream);
    const controller = new VoiceRecorderController();
    await controller.start({ onRecording: vi.fn(), onStopped: vi.fn(), onError: vi.fn() });
    controller.stop();
    controller.stop();
    for (const track of stream.tracks) expect(track.stop).toHaveBeenCalledTimes(1);
  });

  it("reports recorder_error and releases the mic when the underlying recorder errors mid-session", async () => {
    const stream = fakeStream();
    setGetUserMedia(async () => stream);
    const onError = vi.fn();
    const controller = new VoiceRecorderController();
    let recorder!: FakeMediaRecorder;
    const OriginalCtor = (window as any).MediaRecorder;
    (window as any).MediaRecorder = class extends OriginalCtor { constructor(s: unknown, o: any) { super(s, o); recorder = this as unknown as FakeMediaRecorder; } };
    await controller.start({ onRecording: vi.fn(), onStopped: vi.fn(), onError });
    recorder.emitError(new Error("device disconnected"));
    expect(onError).toHaveBeenCalledWith("recorder_error", expect.anything());
    for (const track of stream.tracks) expect(track.stop).toHaveBeenCalled();
  });
});
