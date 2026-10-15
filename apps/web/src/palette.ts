// Színvilág (idea d54a6f, 2026-10-16): palettes keeping the turquoise brand,
// remembered per browser and applied on <html data-palette>.
export const PALETTES = ["midnight", "graphite", "ocean", "light"] as const;
export type Palette = (typeof PALETTES)[number];
export const PALETTE_LABELS = {
  hu: { title: "Színvilág", midnight: "Éjfél (alap)", graphite: "Grafit", ocean: "Mélykék", light: "Világos" },
  de: { title: "Farbschema", midnight: "Mitternacht (Standard)", graphite: "Graphit", ocean: "Tiefblau", light: "Hell" },
  en: { title: "Colour theme", midnight: "Midnight (default)", graphite: "Graphite", ocean: "Deep blue", light: "Light" }
} as const;
const THEME_COLOR: Record<Palette, string> = { midnight: "#0a1112", graphite: "#0e0f11", ocean: "#060b1a", light: "#f0f6f6" };

export function storedPalette(): Palette {
  try { const v = localStorage.getItem("km_palette"); return (PALETTES as readonly string[]).includes(v ?? "") ? v as Palette : "midnight"; } catch { return "midnight"; }
}
export function applyPalette(p: Palette) {
  const root = document.documentElement;
  if (p === "midnight") root.removeAttribute("data-palette"); else root.setAttribute("data-palette", p);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[p]);
}
export function savePalette(p: Palette) {
  try { localStorage.setItem("km_palette", p); } catch { /* storage unavailable */ }
  applyPalette(p);
}
