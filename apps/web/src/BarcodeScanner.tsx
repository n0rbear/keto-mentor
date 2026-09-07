import { useEffect, useRef, useState } from "react";
import { CameraOff, X } from "lucide-react";
import { dict, type Lang } from "./i18n";
import { ScannerController, type ScannerErrorKind } from "./barcode-scanner";

type ScanState = "requesting_permission" | "scanning" | ScannerErrorKind;

const ERROR_STATES = new Set<ScanState>(["camera_denied", "camera_unavailable", "scanner_unsupported", "scanner_error"]);

/**
 * Camera input only: decodes a barcode locally in the browser and hands the
 * raw string to onDetected exactly once, then this component is expected to
 * be closed by its caller. No product/nutrition data flows through here —
 * that stays in BarcodeLookup's existing, already-trusted pipeline.
 */
export function BarcodeScanner({ lang, onDetected, onClose }: { lang: Lang; onDetected: (barcode: string) => void; onClose: () => void }) {
  const t = dict[lang].barcodeScanner;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<ScanState>("requesting_permission");
  const [unsupportedNotice, setUnsupportedNotice] = useState(false);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const controller = new ScannerController();
    let cancelled = false;
    let noticeTimer: ReturnType<typeof setTimeout> | null = null;

    controller.start(video, {
      onScanning: () => { if (!cancelled) setState("scanning"); },
      onDetected: (barcode) => { if (cancelled) return; onDetectedRef.current(barcode); },
      onError: (kind) => { if (!cancelled) setState(kind); },
      onUnsupportedCode: () => {
        if (cancelled) return;
        setUnsupportedNotice(true);
        if (noticeTimer) clearTimeout(noticeTimer);
        noticeTimer = setTimeout(() => { if (!cancelled) setUnsupportedNotice(false); }, 2000);
      }
    });

    return () => {
      cancelled = true;
      if (noticeTimer) clearTimeout(noticeTimer);
      controller.stop();
    };
  }, []);

  const errorMessage = state === "camera_denied" ? t.cameraDenied
    : state === "camera_unavailable" ? t.cameraUnavailable
    : state === "scanner_unsupported" ? t.scannerUnsupported
    : state === "scanner_error" ? t.scannerFailed
    : "";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t.scanButton}>
      <div className="modal-panel card scanner-panel">
        <div className="modal-header">
          <h3>{t.scanButton}</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t.cancel}><X size={16}/></button>
        </div>

        {ERROR_STATES.has(state) ? (
          <div className="scanner-error" role="alert">
            <CameraOff size={20}/>
            <p>{errorMessage}</p>
          </div>
        ) : (
          <div className="scanner-viewport">
            <video ref={videoRef} className="scanner-video" aria-label={t.videoLabel} playsInline muted/>
            <div className="scanner-guide" aria-hidden="true"/>
            {state === "requesting_permission" && <p className="status" role="status">{t.requestingPermission}</p>}
            {state === "scanning" && <p className="status" role="status">{t.scanning}</p>}
            {unsupportedNotice && <p className="status error" role="alert">{t.unsupportedCode}</p>}
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
