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

// Duas passadas: 1) nome normalizado igual; 2) para os que sobraram, todas as
// palavras do arquivo (>= 2) contidas no nome de exatamente um formando livre.
export function matchPortraits(formandos: { id: string; nome: string }[], fileNames: string[]): MatchResult {
  const norm = formandos.map((f) => {
    const n = normalizeName(f.nome);
    return { id: f.id, n, tokens: new Set(n.split(' ')) };
  });
  const used = new Set<string>();
  const byFile = new Map<number, string>();
  const names = fileNames.map(normalizeName);

  names.forEach((n, i) => {
    if (!n) return;
    const hit = norm.find((f) => !used.has(f.id) && f.n === n);
    if (hit) {
      used.add(hit.id);
      byFile.set(i, hit.id);
    }
  });

  names.forEach((n, i) => {
    if (!n || byFile.has(i)) return;
    const toks = n.split(' ');
    if (toks.length < 2) return;
    const c = norm.filter((f) => !used.has(f.id) && toks.every((t) => f.tokens.has(t)));
    if (c.length === 1) {
      used.add(c[0].id);
      byFile.set(i, c[0].id);
    }
  });

  const matches: MatchResult['matches'] = [];
  const unmatched: number[] = [];
  names.forEach((_, i) => {
    const id = byFile.get(i);
    if (id) matches.push({ formandoId: id, fileIndex: i });
    else unmatched.push(i);
  });
  return { matches, unmatched };
}

export function readImage(file: File): Promise<Photo> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ url, fileName: file.name, w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`não foi possível ler ${file.name}`));
    };
    img.src = url;
  });
}
