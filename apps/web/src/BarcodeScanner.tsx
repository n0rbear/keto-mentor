import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ImageIcon, X } from "lucide-react";
import { dict, type Lang } from "./i18n";
import { decodeBarcodePhoto } from "./barcode-scanner";

type PhotoState = "idle" | "decoding" | "not_found" | "unsupported_code" | "scanner_error";

/**
 * Barcode from a photo: the user photographs the barcode, it is decoded on
 * the device and the raw string goes to onDetected exactly once; the caller
 * then closes this dialog. The photo itself is never uploaded, and no
 * product data flows through here — that stays in BarcodeLookup.
 */
export function BarcodeScanner({ lang, onDetected, onClose }: { lang: Lang; onDetected: (barcode: string) => void; onClose: () => void }) {
  const t = dict[lang].barcodeScanner;
  const cameraRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<PhotoState>("idle");
  const [preview, setPreview] = useState("");
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    // Phones: open the camera straight away (still inside the tap that opened this dialog).
    if (window.matchMedia?.("(pointer: coarse)").matches) { try { cameraRef.current?.click(); } catch { /* the button below still works */ } }
    return () => { alive.current = false; };
  }, []);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function onPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setState("decoding");
    try {
      const result = await decodeBarcodePhoto(file);
      if (!alive.current) return;
      if (result.status === "found") { onDetected(result.barcode); return; }
      setState(result.status);
    } catch {
      if (alive.current) setState("scanner_error");
    }
  }

  const message = state === "not_found" ? t.notFound
    : state === "unsupported_code" ? t.unsupportedCode
    : state === "scanner_error" ? t.scannerFailed
    : "";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t.scanButton}>
      <div className="modal-panel card scanner-panel">
        <div className="modal-header">
          <h3>{t.scanButton}</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t.cancel}><X size={16}/></button>
        </div>

        {preview && <img className="scanner-photo" src={preview} alt={t.photoLabel}/>}
        {state === "idle" && <p className="text-sm">{t.photoTip}</p>}
        {state === "decoding" && <p className="status" role="status">{t.decoding}</p>}
        {message && <div className="scanner-error" role="alert"><CameraOff size={20}/><p>{message}</p></div>}

        {state !== "decoding" && (
          <div className="scanner-actions">
            <label className="btn primary">
              <Camera size={16}/>{state === "idle" ? t.takePhoto : t.retakePhoto}
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPhoto}/>
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
