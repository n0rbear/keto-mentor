import { useState } from "react";
import { Palette as PaletteIcon } from "lucide-react";
import type { Lang } from "./i18n";
import { PALETTES, PALETTE_LABELS, savePalette, storedPalette, type Palette } from "./palette";

export function PalettePicker({ lang, id = "palette-picker" }: { lang: Lang; id?: string }) {
  const t = PALETTE_LABELS[lang];
  const [value, setValue] = useState<Palette>(storedPalette);
  return (
    <label className="palette-picker" htmlFor={id}>
      <PaletteIcon size={15} aria-hidden="true"/>{t.title}
      <select id={id} className="field compact" value={value} onChange={(e) => { const p = e.target.value as Palette; setValue(p); savePalette(p); }}>
        {PALETTES.map((p) => <option key={p} value={p}>{t[p]}</option>)}
      </select>
    </label>
  );
}
