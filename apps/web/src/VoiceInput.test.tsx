// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { VoiceInput } from "./VoiceInput";

const { lastHandlers, startMock, stopAndFinalizeMock, stopMock } = vi.hoisted(() => ({
  lastHandlers: { current: null as any },
  startMock: vi.fn(async (handlers: any) => { lastHandlers.current = handlers; }),
  stopAndFinalizeMock: vi.fn(),
  stopMock: vi.fn()
}));
vi.mock("./voice-recorder", () => ({
  VoiceRecorderController: class {
    start = startMock;
    stopAndFinalize = stopAndFinalizeMock;
    stop = stopMock;
  }
}));

afterEach(() => { cleanup(); vi.restoreAllMocks(); lastHandlers.current = null; startMock.mockClear(); stopAndFinalizeMock.mockClear(); stopMock.mockClear(); });

const state = { token: "token", setToken: vi.fn() };

function stubFetch(handler: (url: URL, init?: RequestInit) => Response) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    return handler(url, init);
  }));
}

describe("VoiceInput", () => {
  it("shows an idle mic button that starts recording on click, without submitting anything", async () => {
    const onTranscribed = vi.fn();
    render(<VoiceInput lang="en" state={state} onTranscribed={onTranscribed}/>);
    fireEvent.click(screen.getByRole("button", { name: "Say it out loud" }));
    await waitFor(() => expect(startMock).toHaveBeenCalledTimes(1));
    expect(onTranscribed).not.toHaveBeenCalled();
  });

  it("shows the recording indicator once the recorder reports recording, and stopping calls stopAndFinalize", async () => {
    render(<VoiceInput lang="en" state={state} onTranscribed={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button", { name: "Say it out loud" }));
    await waitFor(() => expect(startMock).toHaveBeenCalled());
    lastHandlers.current.onRecording();
    expect(await screen.findByText("Listening… tap to stop")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(stopAndFinalizeMock).toHaveBeenCalledTimes(1);
  });

  it("transcribes the recorded audio and hands the TEXT to onTranscribed — never auto-submitted, only populates the caller's field", async () => {
    stubFetch((url, init) => {
      expect(url.pathname).toBe("/meal-input/transcribe");
      expect(init?.method).toBe("POST");
      expect((init?.headers as any)["Content-Type"]).toBe("audio/webm");
      return new Response(JSON.stringify({ text: "200 grams chicken breast", language: "en" }), { status: 200 });
    });
    const onTranscribed = vi.fn();
    render(<VoiceInput lang="en" state={state} onTranscribed={onTranscribed}/>);
    fireEvent.click(screen.getByRole("button", { name: "Say it out loud" }));
    await waitFor(() => expect(startMock).toHaveBeenCalled());
    lastHandlers.current.onStopped(new Blob(["audio"], { type: "audio/webm" }), "audio/webm");
    await waitFor(() => expect(onTranscribed).toHaveBeenCalledWith("200 grams chicken breast"));
  });

  it("microphone permission denied shows an error but the caller's normal text input remains fully usable", async () => {
    const onTranscribed = vi.fn();
    render(<VoiceInput lang="en" state={state} onTranscribed={onTranscribed}/>);
    fireEvent.click(screen.getByRole("button", { name: "Say it out loud" }));
    await waitFor(() => expect(startMock).toHaveBeenCalled());
    lastHandlers.current.onError("mic_denied");
    expect(await screen.findByText("Microphone access was denied. Type it instead.")).toBeTruthy();
    // Dismissing the error returns to idle — the mic button (and, in the
    // real app, the always-present text field next to it) is usable again.
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Say it out loud" })).toBeTruthy();
    expect(onTranscribed).not.toHaveBeenCalled();
  });

  it("a network/API failure during transcription never blocks the caller — shows an error, never throws, never calls onTranscribed", async () => {
    stubFetch(() => { throw new Error("network down"); });
    const onTranscribed = vi.fn();
    render(<VoiceInput lang="en" state={state} onTranscribed={onTranscribed}/>);
    fireEvent.click(screen.getByRole("button", { name: "Say it out loud" }));
    await waitFor(() => expect(startMock).toHaveBeenCalled());
    lastHandlers.current.onStopped(new Blob(["audio"], { type: "audio/webm" }), "audio/webm");
    expect(await screen.findByText("Recognition failed. Type it instead.")).toBeTruthy();
    expect(onTranscribed).not.toHaveBeenCalled();
  });

  it("an empty transcript is treated as a soft failure, not submitted as blank text", async () => {
    stubFetch(() => new Response(JSON.stringify({ text: "", language: null }), { status: 200 }));
    const onTranscribed = vi.fn();
    render(<VoiceInput lang="en" state={state} onTranscribed={onTranscribed}/>);
    fireEvent.click(screen.getByRole("button", { name: "Say it out loud" }));
    await waitFor(() => expect(startMock).toHaveBeenCalled());
    lastHandlers.current.onStopped(new Blob(["audio"], { type: "audio/webm" }), "audio/webm");
    await waitFor(() => expect(screen.getByText("Recognition failed. Type it instead.")).toBeTruthy());
    expect(onTranscribed).not.toHaveBeenCalled();
  });

  it("cancelling mid-recording calls the recorder's stop(), never transcribes anything", async () => {
    render(<VoiceInput lang="en" state={state} onTranscribed={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button", { name: "Say it out loud" }));
    await waitFor(() => expect(startMock).toHaveBeenCalled());
    lastHandlers.current.onRecording();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(stopMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Say it out loud" })).toBeTruthy();
  });

  it.each([
    ["hu", "Mondd hangosan"],
    ["de", "Sprich es ein"],
    ["en", "Say it out loud"]
  ] as const)("renders the localized mic button label for %s", (lang, label) => {
    render(<VoiceInput lang={lang} state={state} onTranscribed={vi.fn()}/>);
    expect(screen.getByRole("button", { name: label })).toBeTruthy();
  });
});
