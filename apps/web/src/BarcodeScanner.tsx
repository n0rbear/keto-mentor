import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Flashlight, ImageIcon, X } from "lucide-react";
import { dict, type Lang } from "./i18n";
import {
  CAMERA_CONSTRAINTS, FRAME_SPECS, cameraAvailable, classifyCameraError, createDecoder, decodeBarcodePhoto, decodeFrames, drawRegion,
  guideToVideoRegion, readConfirmed, setTorch, torchSupported, type CameraErrorKind, type FrameDecoder
} from "./barcode-scanner";

type PhotoState = "idle" | "decoding" | "not_found" | "unsupported_code" | "scanner_error";
type LiveState = "starting" | "scanning" | CameraErrorKind | "off";

// The old full-frame live scanner sometimes took half a minute on iPhone.
// Now only the guide frame is decoded, and after this long the photo route
// (the phone's own camera focuses better) is offered prominently.
const SLOW_HINT_MS = 5000;
const SCAN_EVERY_MS = 250;

/**
 * Barcode reading in two ways, both entirely on the device: the in-app camera
 * view decodes whatever is inside the horizontal guide frame, or the user
 * takes / picks a photo. The raw string goes to onDetected exactly once; the
 * caller then closes this dialog. No image is ever uploaded, and no product
 * data flows through here — that stays in BarcodeLookup.
 */
export function BarcodeScanner({ lang, onDetected, onClose }: { lang: Lang; onDetected: (barcode: string) => void; onClose: () => void }) {
  const t = dict[lang].barcodeScanner;
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const decoderRef = useRef<Promise<FrameDecoder> | null>(null);
  const doneRef = useRef(false);
  const alive = useRef(true);
  const [live, setLive] = useState<LiveState>(() => (cameraAvailable() ? "starting" : "off"));
  const [slow, setSlow] = useState(false);
  const [torch, setTorchState] = useState<boolean | null>(null);
  const [state, setState] = useState<PhotoState>("idle");
  const [preview, setPreview] = useState("");

  const decoder = () => (decoderRef.current ??= createDecoder());
  const finish = (barcode: string) => {
    if (doneRef.current) return;
    doneRef.current = true;
    stopCamera();
    onDetected(barcode);
  };
  function stopCamera() {
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
  }

  /** The guide frame (plus a margin) in video pixels. */
  function guideRegion() {
    const video = videoRef.current, box = boxRef.current?.getBoundingClientRect(), guide = guideRef.current?.getBoundingClientRect();
    if (!video || !box || !guide || !video.videoWidth) return null;
    return guideToVideoRegion({ width: box.width, height: box.height }, { left: guide.left - box.left, top: guide.top - box.top, width: guide.width, height: guide.height }, { width: video.videoWidth, height: video.videoHeight });
  }

  // Live camera: start, then decode the guide region a few times a second.
  useEffect(() => {
    alive.current = true;
    if (!cameraAvailable()) return () => { alive.current = false; };
    let timer: ReturnType<typeof setInterval> | null = null;
    let slowTimer: ReturnType<typeof setTimeout> | null = null;
    let busy = false;
    let tick = 0;
    (async () => {
      let stream: MediaStream;
      try { stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS); }
      catch (error) { if (alive.current) setLive(classifyCameraError(error)); return; }
      if (!alive.current || doneRef.current) { for (const track of stream.getTracks()) track.stop(); return; }
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      video.muted = true;
      try { await video.play(); } catch { /* autoplay races are non-fatal */ }
      const track = stream.getVideoTracks()[0];
      if (torchSupported(track)) setTorchState(false);
      setLive("scanning");
      slowTimer = setTimeout(() => { if (alive.current) setSlow(true); }, SLOW_HINT_MS);
      const decode = await decoder().catch(() => null);
      if (!decode) { setLive("camera_error"); return; }
      timer = setInterval(async () => {
        if (busy || doneRef.current || !alive.current) return;
        const region = guideRegion();
        if (!region) return;
        busy = true;
        try {
          // Every third pass also tries the second binarizer (slightly blurred images).
          const canvas = drawRegion(video, video.videoWidth, video.videoHeight, { maxSide: 1280, ...region });
          if (!canvas) return;
          // Accepted only when a second read at another scale agrees (see readConfirmed).
          const read = await readConfirmed(canvas, decode, ++tick % 3 === 0);
          if (read.code && read.confirmed && alive.current) finish(read.code);
        } finally { busy = false; }
      }, SCAN_EVERY_MS);
    })();
    return () => {
      alive.current = false;
      if (timer) clearInterval(timer);
      if (slowTimer) clearTimeout(slowTimer);
      stopCamera();
    };
    // Once per dialog: the state changes inside must not restart (and so stop) the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  /** Shutter in the live view: the current camera frame, guide region first, then the whole frame. */
  async function snapshot() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const region = guideRegion();
    const w = video.videoWidth, h = video.videoHeight;
    const still = document.createElement("canvas");
    still.width = w; still.height = h;
    still.getContext("2d")?.drawImage(video, 0, 0, w, h);
    setState("decoding");
    try {
      const decode = await decoder();
      const specs = [...(region ? [{ maxSide: 1600, ...region, thorough: true }] : []), ...FRAME_SPECS];
      function* frames() { for (const spec of specs) yield { canvas: drawRegion(still, w, h, spec), thorough: spec.thorough }; }
      const result = await decodeFrames(frames(), decode);
      if (!alive.current) return;
      if (result.status === "found") { finish(result.barcode); return; }
      setState(result.status);
    } catch {
      if (alive.current) setState("scanner_error");
    }
  }

  async function onPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    stopCamera();
    setLive("off");
    setPreview(URL.createObjectURL(file));
    setState("decoding");
    try {
      const result = await decodeBarcodePhoto(file);
      if (!alive.current) return;
      if (result.status === "found") { finish(result.barcode); return; }
      setState(result.status);
    } catch {
      if (alive.current) setState("scanner_error");
    }
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || torch == null) return;
    if (await setTorch(track, !torch)) setTorchState(!torch);
  }

  const cameraMessage = live === "camera_denied" ? t.cameraDenied : live === "camera_unavailable" || live === "camera_error" ? t.cameraUnavailable : "";
  const message = state === "not_found" ? t.notFound : state === "unsupported_code" ? t.unsupportedCode : state === "scanner_error" ? t.scannerFailed : "";
  const showLive = (live === "starting" || live === "scanning") && !preview;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t.scanButton}>
      <div className="modal-panel card scanner-panel">
        <div className="modal-header">
          <h3>{t.scanButton}</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t.cancel}><X size={16}/></button>
        </div>

        {showLive && (
          <div className="scanner-live" ref={boxRef}>
            <video ref={videoRef} className="scanner-video" aria-label={t.videoLabel} playsInline muted/>
            <div className="scanner-guide" ref={guideRef} aria-hidden="true"><span/></div>
            {torch != null && <button type="button" className={`icon-button scanner-torch ${torch ? "is-on" : ""}`} onClick={toggleTorch} aria-pressed={torch} aria-label={torch ? t.torchOff : t.torchOn}><Flashlight size={18}/></button>}
          </div>
        )}
        {showLive && <p className="text-sm" role="status">{live === "starting" ? t.starting : state === "decoding" ? t.decoding : t.liveHint}</p>}
        {showLive && slow && state !== "decoding" && <p className="status scanner-slow" role="status">{t.slowHint}</p>}

        {preview && <img className="scanner-photo" src={preview} alt={t.photoLabel}/>}
        {cameraMessage && !preview && <div className="scanner-error" role="alert"><CameraOff size={20}/><p>{cameraMessage}</p></div>}
        {!showLive && !preview && !cameraMessage && state === "idle" && <p className="text-sm">{t.photoTip}</p>}
        {!showLive && state === "decoding" && <p className="status" role="status">{t.decoding}</p>}
        {message && <div className="scanner-error" role="alert"><CameraOff size={20}/><p>{message}</p></div>}

        {state !== "decoding" && (
          <div className="scanner-actions">
            {showLive && live === "scanning" && <button type="button" className="btn primary" onClick={snapshot}><Camera size={16}/>{t.shutter}</button>}
            <label className={`btn ${showLive && !slow ? "secondary" : "primary"}`}>
              <Camera size={16}/>{showLive ? t.nativeCamera : state === "idle" ? t.takePhoto : t.retakePhoto}
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPhoto}/>
            </label>
            <label className="btn secondary">
              <ImageIcon size={16}/>{t.fromGallery}
              <input type="file" accept="image/*" className="sr-only" onChange={onPhoto}/>
            </label>
          </div>
        )}

        <p className="scanner-privacy text-xs text-muted">{t.privacyNotice}</p>

        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose}>{t.cancel}</button>
        </div>
      </div>
    </div>
  );
}
