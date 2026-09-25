import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PortionPhoto } from "./PortionPhoto";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const state = { token: "token", setToken: vi.fn() };

function stubFetch(handler: (url: URL, init?: RequestInit) => Response) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => handler(new URL(String(input)), init)));
}

describe("PortionPhoto", () => {
  it("first home photo: coin + remember plate, then the estimate fills the amount", async () => {
    const seen: URL[] = [];
    stubFetch((url) => {
      seen.push(url);
      if (url.pathname === "/me/plates") return new Response(JSON.stringify({ plates: [] }), { status: 200 });
      return new Response(JSON.stringify({ status: "estimated", grams: 420, confidence: 0.6, notes: "", savedPlate: { id: "p1", name: "Mély tányér", diameterMm: 262 } }), { status: 200 });
    });
    const onEstimate = vi.fn();
    render(<PortionPhoto lang="hu" state={state} dish="húsos káposzta" onEstimate={onEstimate}/>);
    fireEvent.click(screen.getByText("Adag becslése fotóból"));
    await waitFor(() => expect((screen.getByLabelText("Otthon, új saját tányér (érmével, megjegyzem)", { exact: false }) as HTMLInputElement).checked).toBe(true));
    fireEvent.change(screen.getByLabelText("A tányér neve (pl. mély tányér)"), { target: { value: "Mély tányér" } });
    fireEvent.change(screen.getByLabelText("Fotó készítése"), { target: { files: [new File(["img"], "plate.jpg", { type: "image/jpeg" })] } });
    fireEvent.click(await screen.findByText("Ezt használom"));
    expect(onEstimate).toHaveBeenCalledWith(420);
    const upload = seen.find((u) => u.pathname === "/meal-input/portion-photo")!;
    expect(Object.fromEntries(upload.searchParams)).toMatchObject({ dish: "húsos káposzta", reference: "coin", coin: "huf100", savePlate: "1", plateName: "Mély tányér" });
  });

  it("a saved home plate is the default and needs no coin", async () => {
    const seen: URL[] = [];
    stubFetch((url) => {
      seen.push(url);
      if (url.pathname === "/me/plates") return new Response(JSON.stringify({ plates: [{ id: "p1", name: "Mély tányér", diameterMm: 262 }] }), { status: 200 });
      return new Response(JSON.stringify({ status: "estimated", grams: 350, confidence: 0.5, notes: "" }), { status: 200 });
    });
    render(<PortionPhoto lang="en" state={state} dish="goulash" onEstimate={vi.fn()}/>);
    fireEvent.click(screen.getByText("Estimate portion from a photo"));
    await screen.findByText(/At home: Mély tányér/);
    expect(screen.queryByText("Coin next to the plate")).toBeNull();
    fireEvent.change(screen.getByLabelText("Take photo"), { target: { files: [new File(["img"], "p.jpg", { type: "image/jpeg" })] } });
    await screen.findByText("Use this");
    const upload = seen.find((u) => u.pathname === "/meal-input/portion-photo")!;
    expect(Object.fromEntries(upload.searchParams)).toEqual({ dish: "goulash", reference: "plate", plateId: "p1" });
  });

  it("restaurant photo: coin, never saved; a missing coin asks to retry", async () => {
    let upload: URL | undefined;
    stubFetch((url) => {
      if (url.pathname === "/me/plates") return new Response(JSON.stringify({ plates: [] }), { status: 200 });
      upload = url;
      return new Response(JSON.stringify({ status: "reference_not_found", notes: "" }), { status: 200 });
    });
    render(<PortionPhoto lang="en" state={state} dish="pizza" onEstimate={vi.fn()}/>);
    fireEvent.click(screen.getByText("Estimate portion from a photo"));
    fireEvent.click(await screen.findByLabelText("Restaurant / as a guest (with a coin)", { exact: false }));
    fireEvent.change(screen.getByLabelText("Take photo"), { target: { files: [new File(["img"], "p.jpg", { type: "image/jpeg" })] } });
    expect(await screen.findByText("Couldn't see the coin or the plate rim. Please try again.")).toBeTruthy();
    expect(upload!.searchParams.get("savePlate")).toBeNull();
  });
});
