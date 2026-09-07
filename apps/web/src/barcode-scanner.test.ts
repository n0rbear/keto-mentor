// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScannerController, detectBackend, isCameraCapable, normalizeScannedValue } from "./barcode-scanner";

const { decodeFromConstraintsMock, readerConstructState } = vi.hoisted(() => ({
  decodeFromConstraintsMock: vi.fn(),
  readerConstructState: { throwOnConstruct: false }
}));

vi.mock("@zxing/browser", () => ({
  BrowserMultiFormatOneDReader: class {
    decodeFromConstraints = decodeFromConstraintsMock;
    constructor(public hints?: unknown, public options?: unknown) {
      if (readerConstructState.throwOnConstruct) throw new Error("failed to initialize decoder");
    }
  }
}));
vi.mock("@zxing/library", () => ({
  DecodeHintType: { POSSIBLE_FORMATS: 2 },
  BarcodeFormat: { EAN_13: 7, EAN_8: 6, UPC_A: 14, UPC_E: 15 }
}));

function setSecureContext(value: boolean) {
  Object.defineProperty(window, "isSecureContext", { value, configurable: true });
}

function fakeTrack() { return { stop: vi.fn() }; }
function fakeStream(trackCount = 2) {
  const tracks = Array.from({ length: trackCount }, fakeTrack);
  return { getTracks: () => tracks, tracks };
}

function setGetUserMedia(impl: (constraints: MediaStreamConstraints) => Promise<any>) {
  Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia: vi.fn(impl) }, configurable: true });
}

function installNativeDetector(supported: string[], detectImpl: () => Promise<Array<{ rawValue: string; format: string }>>) {
  const detectMock = vi.fn(detectImpl);
  class FakeDetector {
    static getSupportedFormats = vi.fn().mockResolvedValue(supported);
    detect = detectMock;
    constructor(public options: unknown) {}
  }
  (window as any).BarcodeDetector = FakeDetector;
  return detectMock;
}

beforeEach(() => {
  setSecureContext(true);
  HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined) as any;
  decodeFromConstraintsMock.mockReset();
  readerConstructState.throwOnConstruct = false;
  // A default capability stub — isCameraCapable() only checks that
  // getUserMedia exists, it doesn't invoke it. Individual tests override
  // this with more specific behavior (denial, delayed resolution, etc.).
  setGetUserMedia(async () => fakeStream());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  delete (window as any).BarcodeDetector;
  Reflect.deleteProperty(navigator, "mediaDevices");
});

describe("normalizeScannedValue", () => {
  it("accepts GTIN-shaped digit strings and preserves leading zeros", () => {
    expect(normalizeScannedValue("012345678905")).toBe("012345678905");
    expect(normalizeScannedValue(" 4008400404127 ")).toBe("4008400404127");
  });
  it("rejects non-numeric, garbage, or wrong-length values", () => {
    expect(normalizeScannedValue("https://example.com/evil")).toBeNull();
    expect(normalizeScannedValue("ABC12345")).toBeNull();
    expect(normalizeScannedValue("123")).toBeNull();
    expect(normalizeScannedValue("")).toBeNull();
    expect(normalizeScannedValue(4008400404127 as unknown as string)).toBeNull();
  });
});

describe("isCameraCapable / detectBackend", () => {
  it("is not capable without a secure context", () => {
    setSecureContext(false);
    setGetUserMedia(async () => fakeStream());
    expect(isCameraCapable()).toBe(false);
  });
  it("detectBackend resolves unsupported without secure context or getUserMedia", async () => {
    setSecureContext(false);
    expect(await detectBackend()).toBe("unsupported");
  });
  it("selects native when BarcodeDetector supports a relevant retail format", async () => {
    setGetUserMedia(async () => fakeStream());
    installNativeDetector(["ean_13", "qr_code"], async () => []);
    expect(await detectBackend()).toBe("native");
  });
  it("respects getSupportedFormats and falls back to zxing when no relevant format is supported", async () => {
    setGetUserMedia(async () => fakeStream());
    installNativeDetector(["qr_code", "code_128"], async () => []);
    expect(await detectBackend()).toBe("zxing");
  });
  it("falls back to zxing when there is no native BarcodeDetector at all", async () => {
    setGetUserMedia(async () => fakeStream());
    expect(await detectBackend()).toBe("zxing");
  });
});

describe("ScannerController — native backend", () => {
  it("requests the environment camera with no audio only once start() is called", async () => {
    const stream = fakeStream();
    const getUserMedia = vi.fn(async (constraints: MediaStreamConstraints) => {
      expect(constraints).toEqual({ video: { facingMode: { ideal: "environment" } }, audio: false });
      return stream;
    });
    Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia }, configurable: true });
    installNativeDetector(["ean_13"], async () => []);
    expect(getUserMedia).not.toHaveBeenCalled();
    const controller = new ScannerController();
    const video = document.createElement("video");
    await controller.start(video, { onDetected: vi.fn(), onError: vi.fn() });
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    controller.stop();
  });

  it("detects a valid EAN, stops every track, and calls onDetected exactly once", async () => {
    vi.useFakeTimers();
    const stream = fakeStream(2);
    setGetUserMedia(async () => stream);
    installNativeDetector(["ean_13"], async () => [{ rawValue: "4008400404127", format: "ean_13" }]);
    const onDetected = vi.fn();
    const onScanning = vi.fn();
    const controller = new ScannerController();
    const video = document.createElement("video");
    await controller.start(video, { onDetected, onError: vi.fn(), onScanning });
    expect(onScanning).toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1000);
    expect(onDetected).toHaveBeenCalledTimes(1);
    expect(onDetected).toHaveBeenCalledWith("4008400404127");
    for (const track of stream.tracks) expect(track.stop).toHaveBeenCalled();
  });

  it("ignores a detection whose format is not an allowed retail format (hostile QR content)", async () => {
    vi.useFakeTimers();
    const stream = fakeStream();
    setGetUserMedia(async () => stream);
    installNativeDetector(["ean_13"], async () => [{ rawValue: "https://evil.example/pwn", format: "qr_code" }]);
    const onDetected = vi.fn();
    const onUnsupportedCode = vi.fn();
    const controller = new ScannerController();
    const video = document.createElement("video");
    await controller.start(video, { onDetected, onError: vi.fn(), onUnsupportedCode });
    await vi.advanceTimersByTimeAsync(1000);
    expect(onDetected).not.toHaveBeenCalled();
    expect(onUnsupportedCode).toHaveBeenCalled();
    expect(stream.tracks.every((track) => !track.stop.mock.calls.length)).toBe(true);
    controller.stop();
  });

  it("ignores a non-numeric rawValue even on an allowed format", async () => {
    vi.useFakeTimers();
    const stream = fakeStream();
    setGetUserMedia(async () => stream);
    installNativeDetector(["ean_13"], async () => [{ rawValue: "not-a-barcode", format: "ean_13" }]);
    const onDetected = vi.fn();
    const controller = new ScannerController();
    const video = document.createElement("video");
    await controller.start(video, { onDetected, onError: vi.fn() });
    await vi.advanceTimersByTimeAsync(1000);
    expect(onDetected).not.toHaveBeenCalled();
    controller.stop();
  });

  it("never overlaps detect() calls while a previous detection is still pending", async () => {
    vi.useFakeTimers();
    const stream = fakeStream();
    setGetUserMedia(async () => stream);
    let resolveFirst!: (value: unknown[]) => void;
    const detectMock = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockImplementation(async () => []);
    class FakeDetector {
      static getSupportedFormats = vi.fn().mockResolvedValue(["ean_13"]);
      detect = detectMock;
      constructor(public options: unknown) {}
    }
    (window as any).BarcodeDetector = FakeDetector;
    const controller = new ScannerController();
    const video = document.createElement("video");
    await controller.start(video, { onDetected: vi.fn(), onError: vi.fn() });
    await vi.advanceTimersByTimeAsync(300);
    await vi.advanceTimersByTimeAsync(300);
    expect(detectMock).toHaveBeenCalledTimes(1);
    resolveFirst([]);
    await Promise.resolve();
    controller.stop();
  });

  it("classifies getUserMedia rejection as camera_denied for NotAllowedError", async () => {
    setGetUserMedia(async () => { throw Object.assign(new Error("denied"), { name: "NotAllowedError" }); });
    installNativeDetector(["ean_13"], async () => []);
    const onError = vi.fn();
    const controller = new ScannerController();
    await controller.start(document.createElement("video"), { onDetected: vi.fn(), onError });
    expect(onError).toHaveBeenCalledWith("camera_denied");
  });

  it("classifies getUserMedia rejection as camera_unavailable for NotFoundError", async () => {
    setGetUserMedia(async () => { throw Object.assign(new Error("no camera"), { name: "NotFoundError" }); });
    installNativeDetector(["ean_13"], async () => []);
    const onError = vi.fn();
    const controller = new ScannerController();
    await controller.start(document.createElement("video"), { onDetected: vi.fn(), onError });
    expect(onError).toHaveBeenCalledWith("camera_unavailable");
  });

  it("cleans up a partial stream when cancelled while permission is still being requested", async () => {
    const stream = fakeStream();
    let resolvePermission!: (value: unknown) => void;
    let permissionRequested!: () => void;
    const requested = new Promise<void>((resolve) => { permissionRequested = resolve; });
    setGetUserMedia(() => { permissionRequested(); return new Promise((resolve) => { resolvePermission = resolve; }); });
    installNativeDetector(["ean_13"], async () => []);
    const controller = new ScannerController();
    const startPromise = controller.start(document.createElement("video"), { onDetected: vi.fn(), onError: vi.fn() });
    await requested;
    controller.stop(); // cancel before permission resolves
    resolvePermission(stream);
    await startPromise;
    for (const track of stream.tracks) expect(track.stop).toHaveBeenCalled();
  });
});

describe("ScannerController — zxing fallback", () => {
  it("loads and uses zxing only when native detection is unavailable/inadequate", async () => {
    decodeFromConstraintsMock.mockImplementation(async () => ({ stop: vi.fn() }));
    const controller = new ScannerController();
    await controller.start(document.createElement("video"), { onDetected: vi.fn(), onError: vi.fn() });
    expect(decodeFromConstraintsMock).toHaveBeenCalledTimes(1);
    expect(decodeFromConstraintsMock).toHaveBeenCalledWith(
      { video: { facingMode: { ideal: "environment" } }, audio: false },
      expect.anything(),
      expect.any(Function)
    );
  });

  it("does not invoke the zxing decoder when the native backend is available", async () => {
    const stream = fakeStream();
    setGetUserMedia(async () => stream);
    installNativeDetector(["ean_13"], async () => []);
    const controller = new ScannerController();
    await controller.start(document.createElement("video"), { onDetected: vi.fn(), onError: vi.fn() });
    expect(decodeFromConstraintsMock).not.toHaveBeenCalled();
    controller.stop();
  });

  it("feeds a decoded zxing result into onDetected once and stops its controls", async () => {
    const controlsStop = vi.fn();
    decodeFromConstraintsMock.mockImplementation(async (_constraints: unknown, _video: unknown, callback: any) => {
      callback({ getText: () => "4008400404127" }, undefined, { stop: controlsStop });
      return { stop: controlsStop };
    });
    const onDetected = vi.fn();
    const controller = new ScannerController();
    await controller.start(document.createElement("video"), { onDetected, onError: vi.fn() });
    expect(onDetected).toHaveBeenCalledWith("4008400404127");
    expect(controlsStop).toHaveBeenCalled();
  });

  it("ignores repeated identical detections and non-numeric zxing results (duplicate-frame protection)", async () => {
    const controlsStop = vi.fn();
    decodeFromConstraintsMock.mockImplementation(async (_constraints: unknown, _video: unknown, callback: any) => {
      const controls = { stop: controlsStop };
      callback({ getText: () => "https://evil.example" }, undefined, controls);
      callback({ getText: () => "4008400404127" }, undefined, controls);
      callback({ getText: () => "4008400404127" }, undefined, controls); // same barcode seen again
      return controls;
    });
    const onDetected = vi.fn();
    const onUnsupportedCode = vi.fn();
    const controller = new ScannerController();
    await controller.start(document.createElement("video"), { onDetected, onError: vi.fn(), onUnsupportedCode });
    expect(onDetected).toHaveBeenCalledTimes(1);
    expect(onDetected).toHaveBeenCalledWith("4008400404127");
    expect(onUnsupportedCode).toHaveBeenCalledTimes(1);
  });

  it("stops zxing controls on explicit cancellation", async () => {
    const controlsStop = vi.fn();
    decodeFromConstraintsMock.mockImplementation(async () => ({ stop: controlsStop }));
    const controller = new ScannerController();
    await controller.start(document.createElement("video"), { onDetected: vi.fn(), onError: vi.fn() });
    controller.stop();
    expect(controlsStop).toHaveBeenCalled();
  });

  it("reports scanner_error, not an unhandled rejection, when the zxing decoder fails to initialize", async () => {
    readerConstructState.throwOnConstruct = true;
    const onError = vi.fn();
    const controller = new ScannerController();
    await expect(controller.start(document.createElement("video"), { onDetected: vi.fn(), onError })).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledWith("scanner_error", expect.anything());
  });

  it("reports scanner_error when getUserMedia fails inside decodeFromConstraints", async () => {
    decodeFromConstraintsMock.mockImplementation(async () => { throw Object.assign(new Error("denied"), { name: "NotAllowedError" }); });
    const onError = vi.fn();
    const controller = new ScannerController();
    await controller.start(document.createElement("video"), { onDetected: vi.fn(), onError });
    expect(onError).toHaveBeenCalledWith("camera_denied");
  });
});

describe("ScannerController — cleanup guarantees", () => {
  it("stop() is idempotent and safe to call multiple times", async () => {
    const stream = fakeStream();
    setGetUserMedia(async () => stream);
    installNativeDetector(["ean_13"], async () => []);
    const controller = new ScannerController();
    await controller.start(document.createElement("video"), { onDetected: vi.fn(), onError: vi.fn() });
    controller.stop();
    controller.stop();
    for (const track of stream.tracks) expect(track.stop).toHaveBeenCalledTimes(1);
  });

  it("a fresh start() call stops any previous session first", async () => {
    const streamA = fakeStream();
    const streamB = fakeStream();
    let call = 0;
    setGetUserMedia(async () => (call++ === 0 ? streamA : streamB));
    installNativeDetector(["ean_13"], async () => []);
    const controller = new ScannerController();
    await controller.start(document.createElement("video"), { onDetected: vi.fn(), onError: vi.fn() });
    await controller.start(document.createElement("video"), { onDetected: vi.fn(), onError: vi.fn() });
    for (const track of streamA.tracks) expect(track.stop).toHaveBeenCalled();
    controller.stop();
  });
});
