// Geometria do mural em mm (1 unidade SVG = 1 mm). Fonte: spec 2.2.

export const MURAL_W = 800;
export const MURAL_H = 600;

export interface Pt { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

export type LayerId = 'fundo' | 'turma' | 'homenagens' | 'formandos' | 'hexagono';
export const LAYER_IDS: LayerId[] = ['fundo', 'turma', 'homenagens', 'formandos', 'hexagono'];

export type Shape =
  | { kind: 'poly'; pts: Pt[] }
  | { kind: 'rrect'; rect: Rect; r: number };

// Hexagono desenhado num espaco 300x330 e posicionado no mural por HEX_TRANSFORM.
export const HEX_BASE: Pt[] = [
  { x: 150, y: 15 }, { x: 280, y: 90 }, { x: 280, y: 240 },
  { x: 150, y: 315 }, { x: 20, y: 240 }, { x: 20, y: 90 },
];
export const HEX_TRANSFORM = { tx: 318.25, ty: 15, s: 0.545 };
export const hexToMural = (p: Pt): Pt => ({
  x: HEX_TRANSFORM.tx + p.x * HEX_TRANSFORM.s,
  y: HEX_TRANSFORM.ty + p.y * HEX_TRANSFORM.s,
});
export const HEX_PTS: Pt[] = HEX_BASE.map(hexToMural);

export interface Piece { id: LayerId; num: string; label: string; shape: Shape; holes: Pt[] }

export const PIECES: Record<LayerId, Piece> = {
  fundo: {
    id: 'fundo', num: '01', label: 'Fundo',
    shape: {
      kind: 'poly',
      pts: [
        { x: 30, y: 60 }, { x: 770, y: 60 }, { x: 800, y: 90 }, { x: 800, y: 570 },
        { x: 770, y: 600 }, { x: 30, y: 600 }, { x: 0, y: 570 }, { x: 0, y: 90 },
      ],
    },
    holes: [{ x: 20, y: 80 }, { x: 780, y: 80 }, { x: 20, y: 580 }, { x: 780, y: 580 }],
  },
  turma: {
    id: 'turma', num: '02', label: 'Turma',
    shape: { kind: 'rrect', rect: { x: 25, y: 90, w: 260, h: 190 }, r: 4 }, holes: [],
  },
  homenagens: {
    id: 'homenagens', num: '03', label: 'Homenagens',
    shape: { kind: 'rrect', rect: { x: 515, y: 90, w: 260, h: 190 }, r: 4 }, holes: [],
  },
  formandos: {
    id: 'formandos', num: '04', label: 'Formandos',
    shape: { kind: 'rrect', rect: { x: 25, y: 305, w: 750, h: 270 }, r: 4 }, holes: [],
  },
  hexagono: {
    id: 'hexagono', num: '05', label: 'Hexágono',
    shape: { kind: 'poly', pts: HEX_PTS },
    holes: [{ x: 400, y: 36 }, { x: 400, y: 170 }],
  },
};

export const TURMA_FOTO: Rect = { x: 37, y: 114, w: 236, h: 154 };
export const GRID = { cols: 13, rows: 4, x0: 40, y0: 332, dx: 56.7, dy: 60, w: 40, h: 48 };
export const HOM = { col1X: 527, col2X: 657, col1W: 120, col2W: 106, top: 122, bottom: 268 };

export function photoCell(i: number): Rect {
  const c = i % GRID.cols;
  const r = Math.floor(i / GRID.cols);
  return { x: GRID.x0 + c * GRID.dx, y: GRID.y0 + r * GRID.dy, w: GRID.w, h: GRID.h };
}

interface Line { p: Pt; dir: Pt }

function intersect(a: Line, b: Line): Pt {
  const cross = a.dir.x * b.dir.y - a.dir.y * b.dir.x;
  const t = ((b.p.x - a.p.x) * b.dir.y - (b.p.y - a.p.y) * b.dir.x) / cross;
  return { x: a.p.x + t * a.dir.x, y: a.p.y + t * a.dir.y };
}

// Desloca um poligono CONVEXO d mm para fora (todos os contornos do mural sao convexos).
export function offsetPolygon(pts: Pt[], d: number): Pt[] {
  if (d === 0) return pts.map((p) => ({ ...p }));
  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    area += p.x * q.y - q.x * p.y;
  }
  const s = area > 0 ? 1 : -1; // y para baixo: area > 0 = horario na tela
  const lines: Line[] = pts.map((p, i) => {
    const q = pts[(i + 1) % n];
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const len = Math.hypot(dx, dy);
    const nx = (s * dy) / len;
    const ny = (-s * dx) / len;
    return { p: { x: p.x + nx * d, y: p.y + ny * d }, dir: { x: dx, y: dy } };
  });
  return lines.map((l, i) => intersect(lines[(i - 1 + n) % n], l));
}

export function shapeBBox(s: Shape, bleed = 0): Rect {
  if (s.kind === 'rrect') {
    return { x: s.rect.x - bleed, y: s.rect.y - bleed, w: s.rect.w + 2 * bleed, h: s.rect.h + 2 * bleed };
  }
  const pts = offsetPolygon(s.pts, bleed);
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

// Ponto dentro da peca (poligono convexo: produtos vetoriais de mesmo sinal;
// rrect: trata como retangulo).
export function pointInShape(s: Shape, p: Pt): boolean {
  if (s.kind === 'rrect') {
    const { x, y, w, h } = s.rect;
    return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
  }
  let pos = false;
  let neg = false;
  const n = s.pts.length;
  for (let i = 0; i < n; i++) {
    const a = s.pts[i];
    const b = s.pts[(i + 1) % n];
    const c = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    if (c > 0) pos = true;
    else if (c < 0) neg = true;
  }
  return !(pos && neg);
}

const HOLE_EDGE_MIN = 3;

export interface HoleIssue { piece: LayerId; index: number; message: string }

export function holeIssues(holes: Record<LayerId, Pt[]>, holeMm: number): HoleIssue[] {
  const out: HoleIssue[] = [];
  for (const id of LAYER_IDS) {
    const piece = PIECES[id];
    const b = shapeBBox(piece.shape);
    (holes[id] ?? []).forEach((h, index) => {
      if (!pointInShape(piece.shape, h)) {
        out.push({ piece: id, index, message: `${piece.label}: furo ${index + 1} fora da peça` });
        return;
      }
      const edge = Math.min(h.x - b.x, b.x + b.w - h.x, h.y - b.y, b.y + b.h - h.y);
      if (edge - holeMm / 2 < HOLE_EDGE_MIN) {
        out.push({ piece: id, index, message: `${piece.label}: furo ${index + 1} a menos de ${HOLE_EDGE_MIN} mm da borda` });
      }
    });
  }
  return out;
}

export const holeWarnings = (holes: Record<LayerId, Pt[]>, holeMm: number): string[] =>
  holeIssues(holes, holeMm).map((i) => i.message);

const n2 = (v: number) => String(Math.round(v * 100) / 100);

export function shapePath(s: Shape, bleed = 0): string {
  if (s.kind === 'poly') {
    const p = offsetPolygon(s.pts, bleed);
    return 'M' + p.map((q) => `${n2(q.x)},${n2(q.y)}`).join(' L') + ' Z';
  }
  const { x, y, w, h } = s.rect;
  const X = x - bleed;
  const Y = y - bleed;
  const W = w + 2 * bleed;
  const H = h + 2 * bleed;
  const r = s.r + bleed;
  const a = `A${n2(r)},${n2(r)} 0 0 1`;
  return (
    `M${n2(X + r)},${n2(Y)} H${n2(X + W - r)} ${a} ${n2(X + W)},${n2(Y + r)} ` +
    `V${n2(Y + H - r)} ${a} ${n2(X + W - r)},${n2(Y + H)} H${n2(X + r)} ` +
    `${a} ${n2(X)},${n2(Y + H - r)} V${n2(Y + r)} ${a} ${n2(X + r)},${n2(Y)} Z`
  );
}

// Retangulo da imagem que cobre a celula (object-fit: cover), com zoom e
// deslocamento em % da celula (x, y de -100 a 100).
export function coverRect(
  cell: Rect,
  img: { w: number; h: number },
  t: { scale: number; x: number; y: number },
): Rect {
  const k = Math.max(cell.w / img.w, cell.h / img.h) * t.scale;
  const w = img.w * k;
  const h = img.h * k;
  const cx = cell.x + cell.w / 2 + (t.x / 100) * cell.w;
  const cy = cell.y + cell.h / 2 + (t.y / 100) * cell.h;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}
