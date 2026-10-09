// Associacao de retratos aos formandos pelo nome do arquivo.
import type { Photo } from './types';

export function normalizeName(s: string): string {
  return s
    .replace(/\.[^./\\]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export interface MatchResult {
  matches: { formandoId: string; fileIndex: number }[];
  unmatched: number[];
}

// 1) nome normalizado igual; 2) senao, todas as palavras do arquivo (>= 2)
// contidas no nome de exatamente um formando ainda livre.
export function matchPortraits(formandos: { id: string; nome: string }[], fileNames: string[]): MatchResult {
  const norm = formandos.map((f) => {
    const n = normalizeName(f.nome);
    return { id: f.id, n, tokens: new Set(n.split(' ')) };
  });
  const used = new Set<string>();
  const matches: MatchResult['matches'] = [];
  const unmatched: number[] = [];
  fileNames.forEach((fn, i) => {
    const n = normalizeName(fn);
    let hit = norm.find((f) => !used.has(f.id) && f.n === n);
    if (!hit) {
      const toks = n.split(' ').filter(Boolean);
      if (toks.length >= 2) {
        const c = norm.filter((f) => !used.has(f.id) && toks.every((t) => f.tokens.has(t)));
        if (c.length === 1) hit = c[0];
      }
    }
    if (hit) {
      used.add(hit.id);
      matches.push({ formandoId: hit.id, fileIndex: i });
    } else {
      unmatched.push(i);
    }
  });
  return { matches, unmatched };
}

export function readImage(file: File): Promise<Photo> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ url, fileName: file.name, w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error(`não foi possível ler ${file.name}`));
    img.src = url;
  });
}
