// Divide um nome em 2 linhas escolhendo a quebra que minimiza a linha mais longa.
export function splitName(nome: string): [string, string] {
  const w = nome.trim().split(/\s+/).filter(Boolean);
  if (w.length <= 1) return [w[0] ?? '', ''];
  let best: [string, string] = [w[0], w.slice(1).join(' ')];
  let bestLen = Infinity;
  for (let i = 1; i < w.length; i++) {
    const a = w.slice(0, i).join(' ');
    const b = w.slice(i).join(' ');
    const m = Math.max(a.length, b.length);
    if (m < bestLen) {
      bestLen = m;
      best = [a, b];
    }
  }
  return best;
}
