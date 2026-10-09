import { parse } from 'opentype.js';
import { FONT_FACES, faceFile, fontKey, type FontSet } from './fonts';

// base relativo: o app usa base './' no Vite (deploy estatico).
export async function loadFontsBrowser(base = './fonts/'): Promise<FontSet> {
  const set: FontSet = new Map();
  await Promise.all(
    FONT_FACES.map(async (f) => {
      const res = await fetch(base + faceFile(f));
      if (!res.ok) throw new Error(`falha ao baixar ${faceFile(f)} (${res.status})`);
      set.set(fontKey(f), parse(await res.arrayBuffer()));
    }),
  );
  return set;
}
