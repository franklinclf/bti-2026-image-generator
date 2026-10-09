// Registro das faces de fonte do mural (arquivos em public/fonts).
import type { Font } from 'opentype.js';
import type { FontId, SlotStyle } from '../types';

export type FontSet = Map<string, Font>;

export interface FontFace { font: FontId; weight: 400 | 600; italic: boolean }

export const FONT_FACES: FontFace[] = [
  { font: 'fraunces', weight: 400, italic: false },
  { font: 'fraunces', weight: 600, italic: false },
  { font: 'fraunces', weight: 400, italic: true },
  { font: 'fraunces', weight: 600, italic: true },
  { font: 'space-grotesk', weight: 400, italic: false },
  { font: 'space-grotesk', weight: 600, italic: false },
  { font: 'sora', weight: 400, italic: false },
  { font: 'sora', weight: 600, italic: false },
  { font: 'jetbrains-mono', weight: 400, italic: false },
  { font: 'jetbrains-mono', weight: 600, italic: false },
];

export const ITALIC_FONTS: FontId[] = ['fraunces'];

export function faceFile(f: FontFace): string {
  return `${f.font}-latin-${f.weight}-${f.italic ? 'italic' : 'normal'}.woff`;
}

export function fontKey(s: Pick<SlotStyle, 'font' | 'weight' | 'italic'>): string {
  const italic = s.italic && ITALIC_FONTS.includes(s.font);
  return `${s.font}-${s.weight}-${italic ? 'italic' : 'normal'}`;
}

export function getFont(set: FontSet, s: Pick<SlotStyle, 'font' | 'weight' | 'italic'>): Font {
  const f = set.get(fontKey(s));
  if (!f) throw new Error(`fonte nao carregada: ${fontKey(s)}`);
  return f;
}
