// Converte texto em path SVG (contornos), na origem, baseline em y = 0.
import type { Font, Glyph } from 'opentype.js';

export interface Laid { d: string; width: number }

// Simbolos que as fontes (subset latin) nao tem: poligono em unidades de em, y para baixo.
const SYMBOLS: Record<string, { pts: [number, number][]; adv: number }> = {
  '✓': {
    pts: [[0.06, -0.36], [0.12, -0.42], [0.25, -0.27], [0.52, -0.64], [0.58, -0.58], [0.25, -0.15]],
    adv: 0.62,
  },
};

const r2 = (v: number) => Math.round(v * 100) / 100;

export function layoutText(font: Font, text: string, sizeMm: number, trackingEm = 0): Laid {
  const k = sizeMm / font.unitsPerEm;
  const chars = Array.from(text);
  const parts: string[] = [];
  let x = 0;
  let prev: Glyph | null = null;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const g = font.charToGlyph(ch);
    const sym = SYMBOLS[ch];
    if (g.index === 0 && sym) {
      parts.push('M' + sym.pts.map(([px, py]) => `${r2(x + px * sizeMm)},${r2(py * sizeMm)}`).join('L') + 'Z');
      x += sym.adv * sizeMm;
      prev = null;
    } else if (g.index === 0) {
      x += 0.5 * sizeMm; // glifo ausente: so avanca
      prev = null;
    } else {
      if (prev) x += font.getKerningValue(prev, g) * k;
      parts.push(g.getPath(x, 0, sizeMm).toPathData(2));
      x += (g.advanceWidth ?? 0) * k;
      prev = g;
    }
    if (i < chars.length - 1) x += trackingEm * sizeMm;
  }
  return { d: parts.join(''), width: x };
}
