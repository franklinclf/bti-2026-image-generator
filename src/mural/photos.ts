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

const STOPWORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
const NOISE = new Set([
  'img', 'dsc', 'dscn', 'pxl', 'foto', 'photo', 'retrato', 'final', 'edit',
  'editada', 'editado', 'copia', 'copy', 'formando', 'formanda',
]);

function tokensOf(s: string): string[] {
  return normalizeName(s)
    .split(' ')
    .filter((t) => t && !STOPWORDS.has(t) && !NOISE.has(t) && !/\d/.test(t));
}

function levenshtein(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

// Peso do casamento entre palavra do arquivo (t) e do nome (n); 0 = nao casa.
function tokenWeight(t: string, n: string): number {
  if (t === n) return 3;
  if (t.length >= 3 && n.startsWith(t)) return 2;
  if (t.length >= 5 && n.length >= 5 && levenshtein(t, n) === 1) return 1;
  return 0;
}

// Pontuacao do arquivo contra um nome (null se alguma palavra nao casa).
// Cada palavra do nome so e usada uma vez (guloso, na ordem do arquivo).
function scoreAgainst(fileTokens: string[], nameTokens: string[]): number | null {
  const taken = new Set<number>();
  let total = 0;
  for (const t of fileTokens) {
    let best = 0;
    let bestIdx = -1;
    nameTokens.forEach((n, k) => {
      if (taken.has(k)) return;
      const w = tokenWeight(t, n);
      if (w > best) {
        best = w;
        bestIdx = k;
      }
    });
    if (bestIdx < 0) return null;
    taken.add(bestIdx);
    total += best;
  }
  return total;
}

// Passadas: 1) nome normalizado igual; 2) >= 2 palavras do arquivo, melhor
// pontuacao unica; 3) uma palavra (>= 4 letras) que case com um unico formando livre.
export function matchPortraits(formandos: { id: string; nome: string }[], fileNames: string[]): MatchResult {
  const norm = formandos.map((f) => ({ id: f.id, n: normalizeName(f.nome), tokens: tokensOf(f.nome) }));
  const used = new Set<string>();
  const byFile = new Map<number, string>();
  const names = fileNames.map(normalizeName);
  const toks = fileNames.map(tokensOf);

  const assign = (i: number, id: string) => {
    used.add(id);
    byFile.set(i, id);
  };

  names.forEach((n, i) => {
    if (!n || !toks[i].length) return;
    const hit = norm.find((f) => !used.has(f.id) && f.n === n);
    if (hit) assign(i, hit.id);
  });

  toks.forEach((t, i) => {
    if (byFile.has(i) || t.length < 2) return;
    let best = 0;
    let bestIds: string[] = [];
    for (const f of norm) {
      if (used.has(f.id)) continue;
      const s = scoreAgainst(t, f.tokens);
      if (s === null) continue;
      if (s > best) {
        best = s;
        bestIds = [f.id];
      } else if (s === best) bestIds.push(f.id);
    }
    if (bestIds.length === 1) assign(i, bestIds[0]);
  });

  toks.forEach((t, i) => {
    if (byFile.has(i) || t.length !== 1 || t[0].length < 4) return;
    const c = norm.filter((f) => !used.has(f.id) && scoreAgainst(t, f.tokens) !== null);
    if (c.length === 1) assign(i, c[0].id);
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
