// So para testes (Vitest em Node): le as fontes direto de public/fonts.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'opentype.js';
import { FONT_FACES, faceFile, fontKey, type FontSet } from './fonts';

export function loadFontsNode(): FontSet {
  const set: FontSet = new Map();
  for (const f of FONT_FACES) {
    const buf = readFileSync(join(process.cwd(), 'public/fonts', faceFile(f)));
    set.set(fontKey(f), parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
  }
  return set;
}
