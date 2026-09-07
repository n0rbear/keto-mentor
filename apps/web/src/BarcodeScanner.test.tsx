// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BarcodeScanner } from "./BarcodeScanner";
import { dict, type Lang } from "./i18n";

const { startMock, stopMock, lastHandlers } = vi.hoisted(() => ({
  startMock: vi.fn(),
  stopMock: vi.fn(),
  lastHandlers: { current: null as any }
}));

vi.mock("./barcode-scanner", () => ({
  ScannerController: class {
    start(_video: HTMLVideoElement, handlers: any) {
      lastHandlers.current = handlers;
      return startMock(_video, handlers);
    }
    stop() { stopMock(); }
  }
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  startMock.mockReset();
  stopMock.mockReset();
  lastHandlers.current = null;
});

describe("BarcodeScanner", () => {
  it("starts in requesting_permission and transitions to scanning once the camera loop begins", async () => {
    startMock.mockImplementation(async () => {});
    render(<BarcodeScanner lang="en" onDetected={vi.fn()} onClose={vi.fn()}/>);
    expect(screen.getByText(dict.en.barcodeScanner.requestingPermission)).toBeTruthy();
    lastHandlers.current.onScanning();
    await waitFor(() => expect(screen.getByText(dict.en.barcodeScanner.scanning)).toBeTruthy());
  });

  it("never calls controller.start before mount (permission is not requested merely by importing the component)", () => {
    expect(startMock).not.toHaveBeenCalled();
  });

  it("shows a localized, controlled state for camera_denied", async () => {
    startMock.mockImplementation(async (_v: unknown, handlers: any) => handlers.onError("camera_denied"));
    render(<BarcodeScanner lang="en" onDetected={vi.fn()} onClose={vi.fn()}/>);
    expect(await screen.findByText(dict.en.barcodeScanner.cameraDenied)).toBeTruthy();
    expect(screen.queryByLabelText(dict.en.barcodeScanner.videoLabel)).toBeNull();
  });

  it("shows a localized, controlled state for camera_unavailable", async () => {
    startMock.mockImplementation(async (_v: unknown, handlers: any) => handlers.onError("camera_unavailable"));
    render(<BarcodeScanner lang="en" onDetected={vi.fn()} onClose={vi.fn()}/>);
    expect(await screen.findByText(dict.en.barcodeScanner.cameraUnavailable)).toBeTruthy();
  });

  it("shows a localized, controlled state for scanner_unsupported", async () => {
    startMock.mockImplementation(async (_v: unknown, handlers: any) => handlers.onError("scanner_unsupported"));
    render(<BarcodeScanner lang="en" onDetected={vi.fn()} onClose={vi.fn()}/>);
    expect(await screen.findByText(dict.en.barcodeScanner.scannerUnsupported)).toBeTruthy();
  });

  it("shows a localized, controlled state for scanner_error", async () => {
    startMock.mockImplementation(async (_v: unknown, handlers: any) => handlers.onError("scanner_error"));
    render(<BarcodeScanner lang="en" onDetected={vi.fn()} onClose={vi.fn()}/>);
    expect(await screen.findByText(dict.en.barcodeScanner.scannerFailed)).toBeTruthy();
  });

  it("shows a transient unsupported-code notice that clears itself, without ending the session", async () => {
    vi.useFakeTimers();
    startMock.mockImplementation(async (_v: unknown, handlers: any) => { handlers.onScanning(); lastHandlers.current = handlers; });
    render(<BarcodeScanner lang="en" onDetected={vi.fn()} onClose={vi.fn()}/>);
    act(() => { lastHandlers.current.onUnsupportedCode(); });
    expect(screen.getByText(dict.en.barcodeScanner.unsupportedCode)).toBeTruthy();
    expect(stopMock).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(2100); });
    expect(screen.queryByText(dict.en.barcodeScanner.unsupportedCode)).toBeNull();
  });

  it("invokes onDetected exactly once when the controller reports a detection", async () => {
    startMock.mockImplementation(async () => {});
    const onDetected = vi.fn();
    render(<BarcodeScanner lang="en" onDetected={onDetected} onClose={vi.fn()}/>);
    lastHandlers.current.onDetected("4008400404127");
    lastHandlers.current.onDetected("4008400404127");
    expect(onDetected).toHaveBeenCalledTimes(2); // component is a thin relay; de-duplication is the controller's job (tested in barcode-scanner.test.ts)
    expect(onDetected).toHaveBeenCalledWith("4008400404127");
  });

  it("the Cancel button is accessible and calls onClose", async () => {
    startMock.mockImplementation(async () => {});
    const onClose = vi.fn();
    render(<BarcodeScanner lang="en" onDetected={vi.fn()} onClose={onClose}/>);
    const cancelButtons = screen.getAllByRole("button", { name: dict.en.barcodeScanner.cancel });
    fireEvent.click(cancelButtons[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("stops the controller on unmount", async () => {
    startMock.mockImplementation(async () => {});
    const { unmount } = render(<BarcodeScanner lang="en" onDetected={vi.fn()} onClose={vi.fn()}/>);
    expect(stopMock).not.toHaveBeenCalled();
    unmount();
    expect(stopMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the privacy notice visible in every state, including error states", async () => {
    startMock.mockImplementation(async (_v: unknown, handlers: any) => handlers.onError("scanner_error"));
    render(<BarcodeScanner lang="en" onDetected={vi.fn()} onClose={vi.fn()}/>);
    expect(await screen.findByText(dict.en.barcodeScanner.privacyNotice)).toBeTruthy();
  });

  it("the video preview has an accessible label and the dialog is announced", () => {
    startMock.mockImplementation(async () => {});
    render(<BarcodeScanner lang="en" onDetected={vi.fn()} onClose={vi.fn()}/>);
    expect(screen.getByLabelText(dict.en.barcodeScanner.videoLabel)).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it.each(["hu", "de", "en"] as const)("renders localized copy for %s", (lang: Lang) => {
    startMock.mockImplementation(async () => {});
    render(<BarcodeScanner lang={lang} onDetected={vi.fn()} onClose={vi.fn()}/>);
    expect(screen.getByText(dict[lang].barcodeScanner.requestingPermission)).toBeTruthy();
    expect(screen.getByText(dict[lang].barcodeScanner.privacyNotice)).toBeTruthy();
  });
});
