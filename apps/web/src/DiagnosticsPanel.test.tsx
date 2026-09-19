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
    // Appears twice by design: once in the chronological list, once in the
    // "Miért álltam meg?" summary (this event is the blocking stop reason).
    expect(screen.getAllByText(/Cheddar sajt, Gouda sajt/).length).toBeGreaterThanOrEqual(1);
  });

  it("still renders the generic ambiguous text when no names are present (defensive — never crashes on a missing param)", () => {
    const events: DiagnosticEvent[] = [
      { stage: "food_identity", status: "attention", code: "ambiguous", blocking: true, itemLabel: "sajt" }
    ];
    render(<DiagnosticsPanel events={events} lang="hu"/>);
    open();
    expect(screen.getAllByText(/Több, hasonlóan jó találat is van/).length).toBeGreaterThanOrEqual(1);
  });

  it("names candidates for a weak preview match in all three languages", () => {
    const events: DiagnosticEvent[] = [
      { stage: "food_identity", status: "attention", code: "preview_match", blocking: true, itemLabel: "sajt", params: { names: "Gouda sajt" } }
    ];
    const { rerender } = render(<DiagnosticsPanel events={events} lang="hu"/>);
    open();
    expect(screen.getAllByText(/Gouda sajt/).length).toBeGreaterThanOrEqual(1);
    cleanup();
    render(<DiagnosticsPanel events={events} lang="de"/>);
    fireEvent.click(screen.getByText("Was ist passiert?"));
    expect(screen.getAllByText(/Gouda sajt/).length).toBeGreaterThanOrEqual(1);
    cleanup();
    render(<DiagnosticsPanel events={events} lang="en"/>);
    fireEvent.click(screen.getByText("What happened?"));
    expect(screen.getAllByText(/Gouda sajt/).length).toBeGreaterThanOrEqual(1);
    void rerender;
  });

  it("never shows a raw internal code for an unrecognized diagnostic code (falls back to an honest generic line)", () => {
    const events: DiagnosticEvent[] = [
      { stage: "food_identity", status: "attention", code: "some_future_unmapped_code", blocking: true, itemLabel: "kolbász" }
    ];
    render(<DiagnosticsPanel events={events} lang="hu"/>);
    open();
    expect(screen.queryByText(/some_future_unmapped_code/)).toBeNull();
    expect(screen.getAllByText(/Ez a lépés ellenőrzést igényel/).length).toBeGreaterThanOrEqual(1);
  });
});

// Human decision trace (2026-09-19) — MANDATORY regression fixture (Task
// 11): matches the REAL live staging response for "túrós muffin"
// (classification.code=ai_understood, food_identity.code=unresolved, plus
// the new decisionTrace-derived web_evidence/ai_estimation events — see
// diagnostics.test.ts's own identical backend-level fixture for the exact
// live shape this was reconstructed from). Proves the panel does NOT
// collapse this into the old flat "Ezt az ételt nem sikerült megbízható
// adathoz kapcsolni." alone.
describe("DiagnosticsPanel: real 'túrós muffin' live case", () => {
  const turosMuffinEvents: DiagnosticEvent[] = [
    { stage: "classification", status: "ok", code: "ai_understood", blocking: false, params: { kind: "single_food" } },
    { stage: "food_identity", status: "blocked", code: "unresolved", blocking: true, itemLabel: "túrós muffin" },
    { stage: "web_evidence", status: "blocked", code: "web_evidence_rate_limited", blocking: true, itemLabel: "túrós muffin" },
    { stage: "ai_estimation", status: "blocked", code: "ai_estimation_internal_rate_limited", blocking: true, itemLabel: "túrós muffin" }
  ];

  it("shows the AI understood the food as one item, then names the SPECIFIC downstream stages that actually ran — never just the flat old message alone", () => {
    render(<DiagnosticsPanel events={turosMuffinEvents} lang="hu"/>);
    open();
    // Classification succeeded — must be visible, distinct from any failure.
    expect(screen.getByText(/egyetlen ételként azonosította/)).toBeTruthy();
    // The two REAL, distinctly-labeled downstream stages, under their OWN
    // headings — never both silently folded into "Ételazonosítás".
    expect(screen.getByText("Webes tápérték-forrás")).toBeTruthy();
    expect(screen.getByText("AI-becslés")).toBeTruthy();
    expect(screen.getAllByText(/ideiglenes keresési keret elfogyott/).length).toBeGreaterThanOrEqual(1);
    // Appears twice: once in the chronological list, once in "Miért álltam
    // meg?" (this is the LAST blocking event, i.e. the real stop reason).
    expect(screen.getAllByText(/ideiglenes becslési keret elfogyott/).length).toBe(2);
    // The two rate-limit sentences must be genuinely DIFFERENT strings (our
    // own web-search budget vs our own AI-estimate budget are separate
    // things) — never the same generic text duplicated.
    const searchBudget = screen.getAllByText(/ideiglenes keresési keret elfogyott/)[0].textContent;
    const estimateBudget = screen.getAllByText(/ideiglenes becslési keret elfogyott/)[0].textContent;
    expect(searchBudget).not.toBe(estimateBudget);
  });

  it("'Miért álltam meg?' names the LAST real blocking stage (AI estimation), not the generic 'unresolved' identity line", () => {
    render(<DiagnosticsPanel events={turosMuffinEvents} lang="hu"/>);
    open();
    expect(screen.getByText("Miért álltam meg?")).toBeTruthy();
    const why = screen.getByText("Miért álltam meg?").closest(".diagnostics-why");
    expect(why?.textContent).toContain("ideiglenes becslési keret elfogyott");
  });

  it("'Mit tehetsz most?' offers 'try again later' + 'enter your own values' for a rate-limit stop — never a generic 'search manually' alone", () => {
    render(<DiagnosticsPanel events={turosMuffinEvents} lang="hu"/>);
    open();
    const next = screen.getByText("Mit tehetsz most?").closest(".diagnostics-next");
    expect(next?.textContent).toContain("Próbáld újra");
    expect(next?.textContent).toContain("Add meg a tápértékeket kézzel");
  });

  it("a genuinely resolved item shows NO 'Miért álltam meg?' / 'Mit tehetsz most?' sections at all (nothing to explain)", () => {
    const events: DiagnosticEvent[] = [
      { stage: "classification", status: "ok", code: "direct_match", blocking: false },
      { stage: "food_identity", status: "ok", code: "trusted_match", blocking: false, itemLabel: "Gouda" }
    ];
    render(<DiagnosticsPanel events={events} lang="hu"/>);
    open();
    expect(screen.queryByText("Miért álltam meg?")).toBeNull();
    expect(screen.queryByText("Mit tehetsz most?")).toBeNull();
  });

  it("distinguishes the provider-side AI rate limit from our own internal one with different wording", () => {
    const events: DiagnosticEvent[] = [
      { stage: "ai_estimation", status: "blocked", code: "ai_estimation_provider_rate_limited", blocking: true }
    ];
    render(<DiagnosticsPanel events={events} lang="hu"/>);
    open();
    expect(screen.getAllByText(/jelenleg túlterhelt/).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/ideiglenes becslési keret elfogyott/)).toBeNull();
  });
});
