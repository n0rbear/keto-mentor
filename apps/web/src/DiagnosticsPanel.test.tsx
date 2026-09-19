// @vitest-environment jsdom
// Decision-transparency audit (2026-09-19): a real production case ("sajt"
// -> Cheddar sajt / Gouda sajt) showed the "Mi történt?" panel only ever
// said "several similarly good matches exist", never naming them, even
// though the backend already knew the names (diagnostics.ts now threads
// them through as event.params.names — see diagnostics.test.ts's own
// coverage of that). These tests prove the panel actually renders them.
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DiagnosticsPanel, type DiagnosticEvent } from "./DiagnosticsPanel";

afterEach(cleanup);

function open() {
  fireEvent.click(screen.getByText("Mi történt?"));
}

describe("DiagnosticsPanel", () => {
  it("renders nothing when there are no events", () => {
    const { container } = render(<DiagnosticsPanel events={[]} lang="hu"/>);
    expect(container.firstChild).toBeNull();
  });

  it("names the actual candidates for an ambiguous local match, not just 'several matches'", () => {
    const events: DiagnosticEvent[] = [
      { stage: "food_identity", status: "attention", code: "ambiguous", blocking: true, itemLabel: "sajt", params: { count: 2, names: "Cheddar sajt, Gouda sajt" } }
    ];
    render(<DiagnosticsPanel events={events} lang="hu"/>);
    open();
    expect(screen.getByText(/Cheddar sajt, Gouda sajt/)).toBeTruthy();
  });

  it("still renders the generic ambiguous text when no names are present (defensive — never crashes on a missing param)", () => {
    const events: DiagnosticEvent[] = [
      { stage: "food_identity", status: "attention", code: "ambiguous", blocking: true, itemLabel: "sajt" }
    ];
    render(<DiagnosticsPanel events={events} lang="hu"/>);
    open();
    expect(screen.getByText(/Több, hasonlóan jó találat is van/)).toBeTruthy();
  });

  it("names candidates for a weak preview match in all three languages", () => {
    const events: DiagnosticEvent[] = [
      { stage: "food_identity", status: "attention", code: "preview_match", blocking: true, itemLabel: "sajt", params: { names: "Gouda sajt" } }
    ];
    const { rerender } = render(<DiagnosticsPanel events={events} lang="hu"/>);
    open();
    expect(screen.getByText(/Gouda sajt/)).toBeTruthy();
    cleanup();
    render(<DiagnosticsPanel events={events} lang="de"/>);
    fireEvent.click(screen.getByText("Was ist passiert?"));
    expect(screen.getByText(/Gouda sajt/)).toBeTruthy();
    cleanup();
    render(<DiagnosticsPanel events={events} lang="en"/>);
    fireEvent.click(screen.getByText("What happened?"));
    expect(screen.getByText(/Gouda sajt/)).toBeTruthy();
    void rerender;
  });

  it("never shows a raw internal code for an unrecognized diagnostic code (falls back to an honest generic line)", () => {
    const events: DiagnosticEvent[] = [
      { stage: "food_identity", status: "attention", code: "some_future_unmapped_code", blocking: true, itemLabel: "kolbász" }
    ];
    render(<DiagnosticsPanel events={events} lang="hu"/>);
    open();
    expect(screen.queryByText(/some_future_unmapped_code/)).toBeNull();
    expect(screen.getByText(/Ez a lépés ellenőrzést igényel/)).toBeTruthy();
  });
});
