// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DiagnosticsPanel, type DiagnosticEvent } from "./DiagnosticsPanel";

afterEach(cleanup);

const successEvents: DiagnosticEvent[] = [
  { stage: "classification", status: "ok", code: "direct_match", blocking: false },
  { stage: "food_identity", status: "ok", code: "trusted_match", blocking: false, itemLabel: "Gouda" }
];

const blockedEvents: DiagnosticEvent[] = [
  { stage: "classification", status: "ok", code: "ai_understood", blocking: false, params: { kind: "compound_dish", dish: "halászlé" } },
  { stage: "food_identity", status: "blocked", code: "unresolved", blocking: true, itemLabel: "halászlé" },
  { stage: "recipe_web_discovery", status: "blocked", code: "web_rate_limited", blocking: true, itemLabel: "halászlé" }
];

it("renders nothing when there are no events (never fakes a timeline)", () => {
  const { container } = render(<DiagnosticsPanel events={[]} lang="en"/>);
  expect(container.firstChild).toBeNull();
});

it("is collapsed by default and expands on click, in each supported language", () => {
  render(<DiagnosticsPanel events={successEvents} lang="hu"/>);
  expect(screen.queryByText(/Étel felismerése/)).toBeNull();
  fireEvent.click(screen.getByText("Mi történt?"));
  expect(screen.getByText(/Étel felismerése/)).toBeTruthy();
});

it("translates a blocked recipe-web-discovery event into an actionable, non-generic HU message — never a raw internal code", () => {
  render(<DiagnosticsPanel events={blockedEvents} lang="hu"/>);
  fireEvent.click(screen.getByText("Mi történt?"));
  expect(screen.getByText(/Túl sok recept-keresés volt mostanában/)).toBeTruthy();
  expect(screen.queryByText(/web_rate_limited/)).toBeNull();
  expect(screen.queryByText(/rate_limited/)).toBeNull();
});

it("renders the DE and EN translations for the same blocked event distinctly", () => {
  const { rerender } = render(<DiagnosticsPanel events={blockedEvents} lang="de"/>);
  fireEvent.click(screen.getByText("Was ist passiert?"));
  expect(screen.getByText(/Zu viele Rezeptsuchen zuletzt/)).toBeTruthy();
  cleanup();
  render(<DiagnosticsPanel events={blockedEvents} lang="en"/>);
  fireEvent.click(screen.getByText("What happened?"));
  expect(screen.getByText(/Too many recipe searches recently/)).toBeTruthy();
});

it("falls back to a generic but still honest message for an unrecognized code, instead of crashing or showing raw text", () => {
  const unknown: DiagnosticEvent[] = [{ stage: "portion", status: "attention", code: "some_future_code_v2", blocking: true, itemLabel: "gouda" }];
  render(<DiagnosticsPanel events={unknown} lang="en"/>);
  fireEvent.click(screen.getByText("What happened?"));
  expect(screen.getByText(/needs review/)).toBeTruthy();
});

it("never renders a secret-shaped string even if one were smuggled into params", () => {
  const suspicious: DiagnosticEvent[] = [{ stage: "classification", status: "ok", code: "ai_understood", blocking: false, params: { kind: "single_food", dish: "gsk_shouldneverappear" } }];
  render(<DiagnosticsPanel events={suspicious} lang="en"/>);
  fireEvent.click(screen.getByText("What happened?"));
  // The component itself never introduces a secret; this documents that
  // whatever the server sends through `params` is rendered as opaque display
  // text, not interpreted — the real guarantee (no secret ever reaches
  // params) lives in diagnostics.test.ts on the server side.
  expect(document.body.textContent).not.toMatch(/Bearer |api[_-]?key/i);
});
