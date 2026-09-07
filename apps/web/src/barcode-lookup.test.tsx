// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BarcodeLookup } from "./BarcodeLookup";
import { dict } from "./i18n";

const { lastScannerProps } = vi.hoisted(() => ({ lastScannerProps: { current: null as any } }));
vi.mock("./BarcodeScanner", () => ({
  BarcodeScanner: (props: any) => {
    lastScannerProps.current = props;
    return (
      <div>
        <button type="button" onClick={() => props.onDetected("4008400404127")}>simulate-detect</button>
        <button type="button" onClick={props.onClose}>simulate-close</button>
      </div>
    );
  }
}));

afterEach(() => { cleanup(); vi.restoreAllMocks(); lastScannerProps.current = null; });

const state = { token: "token", setToken: vi.fn() };
const BARCODE = "4008400404127";

function stubFetch(handler: (url: URL, init?: RequestInit) => Response) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    return handler(url, init);
  }));
}

describe("BarcodeLookup", () => {
  it("is collapsed by default and expands on toggle", () => {
    render(<BarcodeLookup lang="en" state={state} onFoodConfirmed={vi.fn()}/>);
    expect(screen.queryByLabelText("Barcode (EAN/UPC)")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Barcode \/ EAN lookup/ }));
    expect(screen.getByLabelText("Barcode (EAN/UPC)")).toBeTruthy();
  });

  it("local hit calls onFoodConfirmed immediately without showing a preview to confirm", async () => {
    const localFood = { id: "local-1", name: "Choco Spread", kcalPer100g: 539, fatPer100g: 30.9, proteinPer100g: 6.3, carbsPer100g: 57.5, fiberPer100g: 3.4 };
    stubFetch((url) => {
      expect(url.pathname).toBe("/foods/resolve-barcode");
      expect(url.searchParams.get("barcode")).toBe(BARCODE);
      return new Response(JSON.stringify({ status: "resolved_local", food: localFood }), { status: 200 });
    });
    const onFoodConfirmed = vi.fn();
    render(<BarcodeLookup lang="en" state={state} onFoodConfirmed={onFoodConfirmed}/>);
    fireEvent.click(screen.getByRole("button", { name: /Barcode \/ EAN lookup/ }));
    fireEvent.change(screen.getByLabelText("Barcode (EAN/UPC)"), { target: { value: BARCODE } });
    fireEvent.click(screen.getByRole("button", { name: "Look up" }));
    await waitFor(() => expect(onFoodConfirmed).toHaveBeenCalledWith(localFood));
    expect(await screen.findByText("Product added to the catalog and selected.")).toBeTruthy();
  });

  it("shows a confirmable preview for a valid external candidate, and confirming calls onFoodConfirmed", async () => {
    const candidate = { source: "open_food_facts", sourceId: BARCODE, name: "Choco Spread", brand: "ChocoCo", kcalPer100g: 539, fatPer100g: 30.9, proteinPer100g: 6.3, carbsPer100g: 57.5, fiberPer100g: 3.4 };
    const confirmedFood = { id: "new-food", name: "Choco Spread", kcalPer100g: 539, fatPer100g: 30.9, proteinPer100g: 6.3, carbsPer100g: 57.5, fiberPer100g: 3.4 };
    stubFetch((url, init) => {
      if (url.pathname === "/foods/resolve-barcode") return new Response(JSON.stringify({ status: "confirmation_required", candidate }), { status: 200 });
      if (url.pathname === "/foods/resolve-external/confirm") {
        const body = JSON.parse(String(init?.body));
        expect(body).toEqual({ source: "open_food_facts", sourceId: BARCODE });
        return new Response(JSON.stringify({ status: "confirmed", food: confirmedFood }), { status: 200 });
      }
      throw new Error(`Unexpected request: ${url.pathname}`);
    });
    const onFoodConfirmed = vi.fn();
    render(<BarcodeLookup lang="en" state={state} onFoodConfirmed={onFoodConfirmed}/>);
    fireEvent.click(screen.getByRole("button", { name: /Barcode \/ EAN lookup/ }));
    fireEvent.change(screen.getByLabelText("Barcode (EAN/UPC)"), { target: { value: BARCODE } });
    fireEvent.click(screen.getByRole("button", { name: "Look up" }));

    expect(await screen.findByText("Choco Spread")).toBeTruthy();
    expect(screen.getByText(/ChocoCo/)).toBeTruthy();
    expect(screen.getByText(/539/)).toBeTruthy();
    expect(screen.getByText("Source:", { exact: false })).toBeTruthy();
    expect(screen.getByText("Open Food Facts", { exact: false })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Add to catalog" }));
    await waitFor(() => expect(onFoodConfirmed).toHaveBeenCalledWith(confirmedFood));
  });

  it("shows an incomplete-data warning and no confirm action when nutrition is missing", async () => {
    stubFetch((url) => {
      if (url.pathname === "/foods/resolve-barcode") return new Response(JSON.stringify({ status: "incomplete", product: { name: "Mystery Product", brand: "Acme", barcode: BARCODE } }), { status: 200 });
      throw new Error("unexpected");
    });
    render(<BarcodeLookup lang="en" state={state} onFoodConfirmed={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button", { name: /Barcode \/ EAN lookup/ }));
    fireEvent.change(screen.getByLabelText("Barcode (EAN/UPC)"), { target: { value: BARCODE } });
    fireEvent.click(screen.getByRole("button", { name: "Look up" }));
    expect(await screen.findByText("Mystery Product")).toBeTruthy();
    expect(screen.getByText(/nutrition data is incomplete/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add to catalog" })).toBeNull();
  });

  it("shows a not-found message for an unknown barcode", async () => {
    stubFetch(() => new Response(JSON.stringify({ status: "not_found" }), { status: 200 }));
    render(<BarcodeLookup lang="en" state={state} onFoodConfirmed={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button", { name: /Barcode \/ EAN lookup/ }));
    fireEvent.change(screen.getByLabelText("Barcode (EAN/UPC)"), { target: { value: BARCODE } });
    fireEvent.click(screen.getByRole("button", { name: "Look up" }));
    expect(await screen.findByText("No product found for this barcode.")).toBeTruthy();
  });

  it("shows a possible-duplicate warning without a confirm action instead of silently matching a different Food", async () => {
    const candidate = { source: "open_food_facts", sourceId: BARCODE, name: "Choco Spread", kcalPer100g: 539, fatPer100g: 30.9, proteinPer100g: 6.3, carbsPer100g: 57.5, fiberPer100g: 3.4 };
    stubFetch(() => new Response(JSON.stringify({ status: "confirmation_required", candidate, reason: "possible_duplicate" }), { status: 200 }));
    render(<BarcodeLookup lang="en" state={state} onFoodConfirmed={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button", { name: /Barcode \/ EAN lookup/ }));
    fireEvent.change(screen.getByLabelText("Barcode (EAN/UPC)"), { target: { value: BARCODE } });
    fireEvent.click(screen.getByRole("button", { name: "Look up" }));
    expect(await screen.findByText("Nothing was added because a possible duplicate needs review.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add to catalog" })).toBeNull();
  });

  it.each([
    ["invalid_barcode_format", "Invalid barcode format"],
    ["invalid_barcode_checksum", "check digit doesn't match"]
  ])("shows a localized error for a rejected barcode: %s", async (code, expectedText) => {
    stubFetch(() => new Response(JSON.stringify({ error: code }), { status: 400 }));
    render(<BarcodeLookup lang="en" state={state} onFoodConfirmed={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button", { name: /Barcode \/ EAN lookup/ }));
    fireEvent.change(screen.getByLabelText("Barcode (EAN/UPC)"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Look up" }));
    expect(await screen.findByText(new RegExp(expectedText))).toBeTruthy();
  });

  it("shows a localized error when the external source is unavailable", async () => {
    stubFetch(() => new Response(JSON.stringify({ status: "external_unavailable" }), { status: 200 }));
    render(<BarcodeLookup lang="en" state={state} onFoodConfirmed={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button", { name: /Barcode \/ EAN lookup/ }));
    fireEvent.change(screen.getByLabelText("Barcode (EAN/UPC)"), { target: { value: BARCODE } });
    fireEvent.click(screen.getByRole("button", { name: "Look up" }));
    expect(await screen.findByText("The product database is currently unavailable. Try again later.")).toBeTruthy();
  });

  it.each(["hu", "de", "en"] as const)("renders the toggle and input label localized: %s", (lang) => {
    render(<BarcodeLookup lang={lang} state={state} onFoodConfirmed={vi.fn()}/>);
    expect(screen.getByText(dict[lang].barcode.toggleLabel)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(dict[lang].barcode.toggleLabel) }));
    expect(screen.getByLabelText(dict[lang].barcode.inputLabel)).toBeTruthy();
    expect(screen.getByPlaceholderText(dict[lang].barcode.placeholder)).toBeTruthy();
  });

  it("pressing Enter in the input triggers the lookup", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ status: "not_found" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<BarcodeLookup lang="en" state={state} onFoodConfirmed={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button", { name: /Barcode \/ EAN lookup/ }));
    fireEvent.change(screen.getByLabelText("Barcode (EAN/UPC)"), { target: { value: BARCODE } });
    fireEvent.keyDown(screen.getByLabelText("Barcode (EAN/UPC)"), { key: "Enter" });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });

  it("camera permission is not requested merely by expanding the barcode panel — only by pressing Scan", () => {
    render(<BarcodeLookup lang="en" state={state} onFoodConfirmed={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button", { name: /Barcode \/ EAN lookup/ }));
    expect(lastScannerProps.current).toBeNull();
    expect(screen.getByLabelText("Barcode (EAN/UPC)")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Scan with camera/ })).toBeTruthy();
  });

  it("Scan with camera opens the scanner, and a detected barcode feeds the same lookup flow as manual entry", async () => {
    const localFood = { id: "local-1", name: "Choco Spread", kcalPer100g: 539, fatPer100g: 30.9, proteinPer100g: 6.3, carbsPer100g: 57.5, fiberPer100g: 3.4 };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      expect(url.pathname).toBe("/foods/resolve-barcode");
      expect(url.searchParams.get("barcode")).toBe(BARCODE);
      return new Response(JSON.stringify({ status: "resolved_local", food: localFood }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const onFoodConfirmed = vi.fn();
    render(<BarcodeLookup lang="en" state={state} onFoodConfirmed={onFoodConfirmed}/>);
    fireEvent.click(screen.getByRole("button", { name: /Barcode \/ EAN lookup/ }));
    fireEvent.click(screen.getByRole("button", { name: /Scan with camera/ }));
    expect(lastScannerProps.current).not.toBeNull();
    fireEvent.click(screen.getByText("simulate-detect"));
    await waitFor(() => expect(onFoodConfirmed).toHaveBeenCalledWith(localFood));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText("Barcode (EAN/UPC)") as HTMLInputElement).value).toBe(BARCODE);
    expect(screen.queryByText("simulate-detect")).toBeNull(); // scanner closed after a detection
  });

  it("cancelling the scanner leaves manual entry fully usable, with no network call", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<BarcodeLookup lang="en" state={state} onFoodConfirmed={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button", { name: /Barcode \/ EAN lookup/ }));
    fireEvent.click(screen.getByRole("button", { name: /Scan with camera/ }));
    fireEvent.click(screen.getByText("simulate-close"));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText("simulate-close")).toBeNull();
    // manual entry still fully works after cancelling a scan
    fireEvent.change(screen.getByLabelText("Barcode (EAN/UPC)"), { target: { value: BARCODE } });
    expect((screen.getByRole("button", { name: "Look up" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it.each(["hu", "de", "en"] as const)("renders the Scan with camera button localized: %s", (lang) => {
    render(<BarcodeLookup lang={lang} state={state} onFoodConfirmed={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(dict[lang].barcode.toggleLabel) }));
    expect(screen.getByText(dict[lang].barcodeScanner.scanButton, { exact: false })).toBeTruthy();
  });
});
