// Icone "in memoriam": aureola de circuito (aureola + no + duas trilhas como asas).
// Desenhado em unidades de em, baseline em y = 0, y para baixo. Preenchimento nonzero:
// o anel da aureola usa elipse interna no sentido oposto.
import type { Laid } from './layout';

const r2 = (v: number) => Math.round(v * 100) / 100;

function ellipse(cx: number, cy: number, rx: number, ry: number, sweep: 0 | 1, k: number): string {
  const x0 = r2((cx - rx) * k);
  const y = r2(cy * k);
  const a = `${r2(rx * k)},${r2(ry * k)} 0 1,${sweep}`;
  return `M${x0},${y} a${a} ${r2(2 * rx * k)},0 a${a} ${r2(-2 * rx * k)},0 Z`;
}

function poly(pts: [number, number][], k: number): string {
  return 'M' + pts.map(([x, y]) => `${r2(x * k)},${r2(y * k)}`).join(' L') + ' Z';
}

export const MEMORIAM_ADV = 0.75; // avanco em em

export function memoriamIcon(sizeMm: number): Laid {
  const k = sizeMm;
  const left: [number, number][] = [[0.26, -0.40], [0.07, -0.52], [0.03, -0.64], [0.08, -0.64], [0.11, -0.56], [0.27, -0.46]];
  const right = left.map(([x, y]) => [0.7 - x, y] as [number, number]).reverse();
  const d = [
    ellipse(0.35, -0.80, 0.22, 0.07, 0, k), // aureola (externa)
    ellipse(0.35, -0.80, 0.17, 0.035, 1, k), // furo da aureola (sentido oposto)
    ellipse(0.35, -0.38, 0.12, 0.12, 0, k), // no
    poly(left, k),
    poly(right, k),
    ellipse(0.055, -0.66, 0.035, 0.035, 0, k), // pads nas pontas
    ellipse(0.645, -0.66, 0.035, 0.035, 0, k),
  ].join('');
  return { d, width: MEMORIAM_ADV * sizeMm };
}
