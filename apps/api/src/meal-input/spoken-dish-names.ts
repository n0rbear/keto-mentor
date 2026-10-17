// Owner report (2026-10-17): a German dish said in a Hungarian sentence is
// transcribed the way it sounds ("kaserkrainer", "kézekrájner"), which the
// food search cannot match. A few well-known Austrian/German dish names are
// mapped back to their usual spelling before interpretation. Patterns are
// anchored on whole words and only cover these specific names.
const SPOKEN_VARIANTS: Array<[RegExp, string]> = [
  // Käsekrainer: kásekrainer, kaserkrainer, kaserkréner, kézekrájner, käsekreiner …
  [/\bk[aáäeé][sz][eéö]?r?k?r[aáeé]?[iíj]?[jn]?n?[eéö]r(?=\b|[a-záéíóöőúüű])/giu, "Käsekrainer"],
  // Leberkäse: léberkéze, leberkeze, lébörkéz …
  [/\bl[eé]b[eöé]rk[eéä]s?z?[eé]?\b/giu, "Leberkäse"],
  // Schweinshaxe: svájnszhakszi, schweinshakse, svajnshaxe …
  [/\b(?:sch|s)(?:w|v)[aá]?[ji]n?s?z?h[aá](?:x|ksz?|kß)[eéi]\b/giu, "Schweinshaxe"],
  // Kaiserschmarrn: kájzersmarn, kaiserschmarren …
  [/\bk[aá][ij]?[sz]+[eé]rs(?:ch)?m[aá]rr?e?n\b/giu, "Kaiserschmarrn"]
];

export function normalizeSpokenDishNames(text: string): string {
  return SPOKEN_VARIANTS.reduce((current, [pattern, spelling]) => current.replace(pattern, spelling), text);
}
