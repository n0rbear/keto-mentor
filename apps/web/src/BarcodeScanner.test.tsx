// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BarcodeScanner } from "./BarcodeScanner";
import { dict, type Lang } from "./i18n";

const { decodeMock } = vi.hoisted(() => ({ decodeMock: vi.fn() }));
vi.mock("./barcode-scanner", () => ({ decodeBarcodePhoto: decodeMock }));

URL.createObjectURL = vi.fn(() => "blob:photo");
URL.revokeObjectURL = vi.fn();

afterEach(() => { cleanup(); decodeMock.mockReset(); });

const t = dict.en.barcodeScanner;
const photo = new File(["x"], "barcode.jpg", { type: "image/jpeg" });
function choosePhoto() {
  const input = screen.getByLabelText(t.takePhoto) as HTMLInputElement;
  fireEvent.change(input, { target: { files: [photo] } });
}

describe("BarcodeScanner (photo)", () => {
  it("asks for a photo through the rear camera and keeps the gallery as an option", () => {
    render(<BarcodeScanner lang="en" onDetected={vi.fn()} onClose={vi.fn()}/>);
    const camera = screen.getByLabelText(t.takePhoto) as HTMLInputElement;
    expect(camera.type).toBe("file");
    expect(camera.accept).toBe("image/*");
    expect(camera.getAttribute("capture")).toBe("environment");
    expect(screen.getByLabelText(t.fromGallery).getAttribute("capture")).toBeNull();
    expect(screen.getByText(t.photoTip)).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("decodes the photo on the device and hands over the barcode", async () => {
    decodeMock.mockResolvedValue({ status: "found", barcode: "4008400404127" });
    const onDetected = vi.fn();
    render(<BarcodeScanner lang="en" onDetected={onDetected} onClose={vi.fn()}/>);
    choosePhoto();
    expect(screen.getByText(t.decoding)).toBeTruthy();
    await waitFor(() => expect(onDetected).toHaveBeenCalledWith("4008400404127"));
    expect(decodeMock).toHaveBeenCalledWith(photo);
  });

  it.each([
    ["not_found", t.notFound],
    ["unsupported_code", t.unsupportedCode]
  ] as const)("explains %s and offers a new photo", async (status, text) => {
    decodeMock.mockResolvedValue({ status });
    render(<BarcodeScanner lang="en" onDetected={vi.fn()} onClose={vi.fn()}/>);
    choosePhoto();
    expect(await screen.findByText(text)).toBeTruthy();
    expect(screen.getByLabelText(t.retakePhoto)).toBeTruthy();
    expect(screen.getByAltText(t.photoLabel)).toBeTruthy();
  });

  it("shows a controlled error when the image can't be read", async () => {
    decodeMock.mockRejectedValue(new Error("image_unreadable"));
    render(<BarcodeScanner lang="en" onDetected={vi.fn()} onClose={vi.fn()}/>);
    choosePhoto();
    expect((await screen.findByRole("alert")).textContent).toContain(t.scannerFailed);
    expect(screen.getByText(t.privacyNotice)).toBeTruthy();
  });

  it("the Cancel button calls onClose", () => {
    const onClose = vi.fn();
    render(<BarcodeScanner lang="en" onDetected={vi.fn()} onClose={onClose}/>);
    fireEvent.click(screen.getAllByRole("button", { name: t.cancel })[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it.each(["hu", "de", "en"] as const)("renders localized copy for %s", (lang: Lang) => {
    render(<BarcodeScanner lang={lang} onDetected={vi.fn()} onClose={vi.fn()}/>);
    expect(screen.getByText(dict[lang].barcodeScanner.takePhoto)).toBeTruthy();
    expect(screen.getByText(dict[lang].barcodeScanner.privacyNotice)).toBeTruthy();
  });
});
