# Mural de vidro — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Mural" mode to the BTI2026 app that edits the 800 × 600 mm glass wall mural (approved design v5) and exports each glass piece as vector PDF, SVG and PNG for PIX Formaturas.

**Architecture:** A pure `composeMural(doc, fonts)` step lays out every text (converted to outline paths with opentype.js) and photo in millimetres. Dumb React SVG layer components render that model, both for the live preview and for export (`renderToStaticMarkup` → `svg2pdf.js`/canvas). Mural state lives in its own reducer, saved to `localStorage`; the existing convite/display code is untouched except for one extracted photo-adjust component and the top-level mode switch.

**Tech Stack:** React 18, TypeScript 5.6, Vite 5, Vitest 2, opentype.js 1.3, svg2pdf.js 2, jsPDF 2 (existing), JSZip 3 (existing), @fontsource WOFF files (copied to `public/fonts`).

**Spec:** `docs/superpowers/specs/2026-10-09-mural-de-vidro-design.md`

## Global Constraints

- Branch: `feat/mural`. Push after every task (`git push`). Never commit to `main`.
- Unit inside the mural: **1 SVG unit = 1 mm**, `viewBox="0 0 800 600"`.
- The convite/display pieces (`src/components/TemplateCard.tsx`, `src/lib/exporter.ts`, `src/state.tsx`) must behave exactly as before.
- All mural text is drawn as `<path>` (outlines). No `<text>` elements in the mural SVG.
- Fonts: only Fraunces (400, 600, 400 italic, 600 italic), Space Grotesk (400, 600), Sora (400, 600), JetBrains Mono (400, 600), from `public/fonts/*.woff`.
- Horizontal text compression is allowed down to **85%**; below that the text is drawn at 85% and flagged as overflow. Export is never blocked by overflows.
- Default bleed **3 mm** (0–5), default hole **Ø 8 mm**, default PNG **300 DPI** (150 option).
- Zip name: `mural-ti-2026_<AAAA-MM-DD>.zip` (local date). Folders `pdf/`, `svg/`, `png/`; `corte.pdf`, `corte.svg`, `montagem.txt` at the root.
- `localStorage` key: `mural-ti-2026:v1`. Photos are never persisted.
- UI copy is Brazilian Portuguese. Code comments follow the repo style (short, Portuguese, no accents needed).
- `.npmrc` sets `ignore-scripts=true` and `legacy-peer-deps=true`; keep it.
- Test command: `npm test` (= `vitest run`). Build command: `npm run build`. `npm run lint` is already broken in this repo (no eslint config); do not try to fix it.

## File map

| File | Responsibility |
|---|---|
| `scripts/copy-fonts.mjs` | copies the 10 WOFF files + licenses from `node_modules/@fontsource/*` to `public/fonts/` |
| `public/fonts/*` | committed font files used by the mural |
| `src/mural/geometry.ts` | all mm constants, piece outlines, bleed offset, photo cover math |
| `src/mural/types.ts` | mural types |
| `src/mural/defaults.ts` | default content, styles, export options, `createDefaultDoc()` |
| `src/mural/text/split.ts` | `splitName()` |
| `src/mural/text/fonts.ts` | font face registry, `fontKey()`, `getFont()` |
| `src/mural/text/fonts.browser.ts` | `loadFontsBrowser()` (fetch) |
| `src/mural/text/fonts.node.ts` | `loadFontsNode()` (tests only) |
| `src/mural/text/layout.ts` | `layoutText()` → path data + width |
| `src/mural/text/fit.ts` | `fitWidth()` |
| `src/mural/compose.ts` | `composeMural()` → `MuralModel` (texts, photos, overflows) |
| `src/mural/store.ts` | `muralReducer`, `serializeDoc`, `loadDoc` |
| `src/mural/photos.ts` | `normalizeName`, `matchPortraits`, `readImage` |
| `src/mural/state.tsx` | `MuralProvider`, `useMural()` |
| `src/mural/layers/*.tsx`, `laurel.ts` | SVG layers |
| `src/mural/MuralSvg.tsx` | composes layers |
| `src/mural/editor/*.tsx` | editor UI (shell, preview, 5 tabs) |
| `src/mural/mural.css` | editor styles |
| `src/mural/download.ts` | `downloadBlob()` |
| `src/mural/export/plan.ts` | pure export planning: file list, view boxes, `montagem.txt`, cut SVG |
| `src/mural/export/render.ts` | browser rendering: SVG string, image inlining, PDF, PNG |
| `src/mural/export/bundle.ts` | `exportMural()` → zip |
| `src/components/PhotoAdjustControl.tsx` | presentational pan/zoom control extracted from `PhotoAdjust` |
| `src/App.tsx`, `src/index.css` | mode switch |

---

### Task 1: Tooling, fonts and geometry

**Files:**
- Modify: `package.json`, `vite.config.ts`, `tsconfig.json`
- Create: `scripts/copy-fonts.mjs`, `public/fonts/*`, `src/mural/geometry.ts`
- Test: `src/mural/geometry.test.ts`

**Interfaces:**
- Produces: `MURAL_W`, `MURAL_H`, `Pt`, `Rect`, `LayerId`, `LAYER_IDS`, `Shape`, `HEX_BASE`, `HEX_TRANSFORM`, `HEX_PTS`, `Piece`, `PIECES`, `TURMA_FOTO`, `GRID`, `HOM`, `photoCell(i): Rect`, `offsetPolygon(pts, d): Pt[]`, `shapeBBox(shape, bleed?): Rect`, `shapePath(shape, bleed?): string`, `coverRect(cell, img: {w,h}, t: {scale,x,y}): Rect`.

- [ ] **Step 1: Install dependencies**

```bash
cd /Users/franklinoliveira/Documents/BTI2026
npm install opentype.js@^1.3.4 svg2pdf.js@^2.2.4
npm install -D vitest@^2.1.8 @types/opentype.js@^1.3.8 @fontsource/fraunces@^5 @fontsource/space-grotesk@^5 @fontsource/sora@^5 @fontsource/jetbrains-mono@^5
```

Expected: both commands finish without `ERR!`. If the registry is unreachable from the sandbox, stop and report it (the user can run the same commands in their own terminal).

- [ ] **Step 2: Add the test script and Vitest config**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"fonts:copy": "node scripts/copy-fonts.mjs"
```

Replace `vite.config.ts` with:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base: './' garante assets relativos no deploy estatico (Vercel)
export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

In `tsconfig.json`, add after `"include": ["src"]`:

```json
,
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/**/*.node.ts"]
```

(So `tsc -b` does not type-check test-only files that import `node:fs`.)

- [ ] **Step 3: Write the font copy script**

Create `scripts/copy-fonts.mjs`:

```js
// Copia os WOFF estaticos do @fontsource para public/fonts (usados pelo mural).
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const FILES = {
  fraunces: [
    'fraunces-latin-400-normal.woff',
    'fraunces-latin-600-normal.woff',
    'fraunces-latin-400-italic.woff',
    'fraunces-latin-600-italic.woff',
  ],
  'space-grotesk': ['space-grotesk-latin-400-normal.woff', 'space-grotesk-latin-600-normal.woff'],
  sora: ['sora-latin-400-normal.woff', 'sora-latin-600-normal.woff'],
  'jetbrains-mono': ['jetbrains-mono-latin-400-normal.woff', 'jetbrains-mono-latin-600-normal.woff'],
};

const out = 'public/fonts';
mkdirSync(out, { recursive: true });
for (const [pkg, files] of Object.entries(FILES)) {
  for (const f of files) {
    const src = join('node_modules/@fontsource', pkg, 'files', f);
    if (!existsSync(src)) {
      console.error('faltando:', src);
      process.exitCode = 1;
      continue;
    }
    copyFileSync(src, join(out, f));
  }
  const lic = join('node_modules/@fontsource', pkg, 'LICENSE');
  if (existsSync(lic)) copyFileSync(lic, join(out, `${pkg}-OFL.txt`));
}
console.log('fontes copiadas para', out);
```

- [ ] **Step 4: Run it**

Run: `npm run fonts:copy && ls public/fonts`
Expected: `fontes copiadas para public/fonts`, and 10 `.woff` files plus `*-OFL.txt` listed. If a file is "faltando", list `node_modules/@fontsource/<pkg>/files/` and use the matching file name (same family, `latin`, weight, style); update both this script and `FONT_FACES` in Task 3 consistently.

- [ ] **Step 5: Write the failing geometry tests**

Create `src/mural/geometry.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  HEX_PTS,
  PIECES,
  coverRect,
  offsetPolygon,
  photoCell,
  shapeBBox,
  shapePath,
} from './geometry';

const round = (n: number) => Math.round(n * 1000) / 1000;

describe('offsetPolygon', () => {
  it('desloca um quadrado (horario na tela) para fora', () => {
    const sq = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
    expect(offsetPolygon(sq, 1).map((p) => [round(p.x), round(p.y)])).toEqual([
      [-1, -1], [11, -1], [11, 11], [-1, 11],
    ]);
  });

  it('funciona com o poligono no sentido anti-horario', () => {
    const sq = [{ x: 0, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 0 }];
    const out = offsetPolygon(sq, 1);
    expect(round(out[0].x)).toBe(-1);
    expect(round(out[0].y)).toBe(-1);
  });

  it('sangria 0 devolve uma copia', () => {
    const sq = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }];
    const out = offsetPolygon(sq, 0);
    expect(out).toEqual(sq);
    expect(out).not.toBe(sq);
  });
});

describe('pecas', () => {
  it('bbox do fundo com 3 mm de sangria', () => {
    const b = shapeBBox(PIECES.fundo.shape, 3);
    expect([round(b.x), round(b.y), round(b.w), round(b.h)]).toEqual([-3, 57, 806, 546]);
  });

  it('bbox do hexagono', () => {
    const b = shapeBBox(PIECES.hexagono.shape);
    expect(round(b.x)).toBe(329.15);
    expect(round(b.w)).toBe(141.7);
    expect(round(b.y)).toBe(23.175);
    expect(round(b.h)).toBe(163.5);
  });

  it('vertice superior do hexagono no mural', () => {
    expect(round(HEX_PTS[0].x)).toBe(400);
    expect(round(HEX_PTS[0].y)).toBe(23.175);
  });

  it('path do retangulo arredondado comeca no canto + raio, com e sem sangria', () => {
    expect(shapePath(PIECES.turma.shape)).toMatch(/^M29,90 H281 A4,4 0 0 1 285,94/);
    expect(shapePath(PIECES.turma.shape, 3)).toMatch(/^M29,87 /);
  });

  it('path do poligono fecha com Z', () => {
    expect(shapePath(PIECES.fundo.shape)).toMatch(/^M30,60 L770,60 .* Z$/);
  });
});

describe('grade e fotos', () => {
  it('posicao das celulas', () => {
    expect(photoCell(0)).toEqual({ x: 40, y: 332, w: 40, h: 48 });
    expect(photoCell(13)).toEqual({ x: 40, y: 392, w: 40, h: 48 });
    const last = photoCell(51);
    expect(round(last.x)).toBe(720.4);
    expect(last.y).toBe(512);
  });

  it('coverRect cobre a celula mantendo a proporcao', () => {
    const cell = { x: 40, y: 332, w: 40, h: 48 };
    expect(coverRect(cell, { w: 100, h: 100 }, { scale: 1, x: 0, y: 0 })).toEqual({ x: 36, y: 332, w: 48, h: 48 });
    expect(coverRect(cell, { w: 100, h: 100 }, { scale: 1, x: 50, y: 0 }).x).toBe(56);
    expect(coverRect(cell, { w: 100, h: 100 }, { scale: 2, x: 0, y: 0 })).toEqual({ x: 12, y: 308, w: 96, h: 96 });
  });
});
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `npm test -- src/mural/geometry.test.ts`
Expected: FAIL, `Failed to resolve import "./geometry"`.

- [ ] **Step 7: Implement `src/mural/geometry.ts`**

```ts
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
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npm test -- src/mural/geometry.test.ts`
Expected: PASS (all tests in the file).

- [ ] **Step 9: Check the build still passes**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 10: Commit and push**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json scripts/copy-fonts.mjs public/fonts src/mural/geometry.ts src/mural/geometry.test.ts
git commit -m "mural: tooling (vitest, opentype, svg2pdf, fontes) e geometria em mm"
git push
```

---

### Task 2: Types, default content and name splitting

**Files:**
- Create: `src/mural/types.ts`, `src/mural/defaults.ts`, `src/mural/text/split.ts`
- Test: `src/mural/text/split.test.ts`, `src/mural/defaults.test.ts`

**Interfaces:**
- Consumes: `LayerId` from `geometry.ts`.
- Produces: types `FontId`, `SlotKey`, `SlotStyle`, `SnippetId`, `Snippet`, `PhotoTransform`, `Photo`, `MuralFormando`, `CargoNome`, `ExportFileId`, `ExportOptions`, `MuralDoc`; `splitName(nome): [string, string]`; from defaults: `FORMANDOS`, `DEFAULT_SNIPPETS`, `SNIPPET_ORDER`, `SNIPPET_LABELS`, `DEFAULT_ESTILOS`, `SLOT_ORDER`, `SLOT_LABELS`, `DEFAULT_EXPORT`, `createFormandos()`, `createDefaultDoc()`.

- [ ] **Step 1: Write the failing tests**

Create `src/mural/text/split.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { splitName } from './split';

describe('splitName', () => {
  it('minimiza a linha mais longa', () => {
    expect(splitName('FRANKLIN CLAUDIO LOPES DE OLIVEIRA FILHO')).toEqual(['FRANKLIN CLAUDIO LOPES', 'DE OLIVEIRA FILHO']);
    expect(splitName('MARIA PAZ MARCATO')).toEqual(['MARIA PAZ', 'MARCATO']);
  });
  it('uma palavra fica na primeira linha', () => {
    expect(splitName('ANA')).toEqual(['ANA', '']);
  });
  it('ignora espacos extras', () => {
    expect(splitName('  JOAB   URBANO DE ARAUJO ')).toEqual(['JOAB URBANO', 'DE ARAUJO']);
  });
  it('vazio', () => {
    expect(splitName('')).toEqual(['', '']);
  });
});
```

Create `src/mural/defaults.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createDefaultDoc, FORMANDOS, SNIPPET_ORDER } from './defaults';
import { splitName } from './text/split';

describe('createDefaultDoc', () => {
  it('tem os 52 formandos com ids estaveis', () => {
    const doc = createDefaultDoc();
    expect(FORMANDOS).toHaveLength(52);
    expect(doc.formandos).toHaveLength(52);
    expect(doc.formandos[0]).toMatchObject({ id: 'f00', nome: 'ARTHUR BOMA SKEETE MYPOTO', linhasManuais: false });
    expect(doc.formandos[51].id).toBe('f51');
    expect(new Set(doc.formandos.map((f) => f.id)).size).toBe(52);
    expect(doc.formandos[8].linhas).toEqual(splitName(doc.formandos[8].nome));
  });

  it('tem o conteudo aprovado', () => {
    const doc = createDefaultDoc();
    expect(doc.turma).toBe('Sprint Sem Fim');
    expect(doc.professores).toHaveLength(16);
    expect(doc.comissao).toHaveLength(5);
    expect(doc.snippets.build.text).toBe('// sprint final · status: done ✓');
    expect(doc.snippets.sprint.text).toBe('while (sprint) aprender();');
    expect(SNIPPET_ORDER).toHaveLength(13);
    expect(doc.export).toMatchObject({ dpi: 300, bleedMm: 3, holeMm: 8 });
  });

  it('cada chamada devolve objetos independentes', () => {
    const a = createDefaultDoc();
    const b = createDefaultDoc();
    a.snippets.git.text = 'x';
    a.estilos.titulo.sizeMm = 99;
    a.professores.push('y');
    expect(b.snippets.git.text).not.toBe('x');
    expect(b.estilos.titulo.sizeMm).not.toBe(99);
    expect(b.professores).toHaveLength(16);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- src/mural/text/split.test.ts src/mural/defaults.test.ts`
Expected: FAIL, unresolved imports.

- [ ] **Step 3: Implement `src/mural/text/split.ts`**

```ts
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
```

- [ ] **Step 4: Implement `src/mural/types.ts`**

```ts
import type { LayerId } from './geometry';

export type FontId = 'fraunces' | 'space-grotesk' | 'sora' | 'jetbrains-mono';
export type SlotKey =
  | 'titulo' | 'subtitulo' | 'rotulo' | 'snippet' | 'secao'
  | 'homenagem' | 'legenda' | 'hexTI' | 'hexAno';

// sizeMm = corpo da fonte em mm; tracking em em (0.1 = 10% do corpo).
export interface SlotStyle { font: FontId; weight: 400 | 600; italic: boolean; sizeMm: number; tracking: number }

export type SnippetId =
  | 'coord' | 'build' | 'importTurma' | 'importGratidao' | 'git' | 'return'
  | 'label01' | 'fig01' | 'label02' | 'gratidao' | 'label03' | 'sprint' | 'indices';
export interface Snippet { text: string; on: boolean }

// x, y em % da celula (-100 a 100); scale >= 1.
export interface PhotoTransform { scale: number; x: number; y: number }
export interface Photo { url: string; fileName: string; w: number; h: number }

export interface MuralFormando {
  id: string;
  nome: string;
  linhas: [string, string];
  linhasManuais: boolean;
  photo?: Photo;
  transform: PhotoTransform;
}

export interface CargoNome { cargo: string; nome: string }

export type ExportFileId = 'composicao' | LayerId | 'corte';
export interface ExportOptions {
  files: Record<ExportFileId, boolean>;
  formats: { pdf: boolean; svg: boolean; png: boolean };
  dpi: 150 | 300;
  bleedMm: number;
  holeMm: number;
}

export interface MuralDoc {
  version: 1;
  titulo: string;
  subtitulo: string;
  turma: string;
  snippets: Record<SnippetId, Snippet>;
  administracao: CargoNome[];
  homenageados: CargoNome[];
  professores: string[];
  comissao: string[];
  formandos: MuralFormando[];
  fotoTurma: { photo?: Photo; transform: PhotoTransform };
  estilos: Record<SlotKey, SlotStyle>;
  export: ExportOptions;
}
```

- [ ] **Step 5: Implement `src/mural/defaults.ts`**

```ts
// Conteudo inicial do mural (spec 2.4 e 2.5).
import type {
  CargoNome, ExportOptions, MuralDoc, MuralFormando, SlotKey, SlotStyle, Snippet, SnippetId,
} from './types';
import { splitName } from './text/split';

export const FORMANDOS: string[] = [
  'ARTHUR BOMA SKEETE MYPOTO',
  'BEATRIZ GOUVEIA GADELHA',
  'CIPRIANO JOSE DA SILVA NETO',
  'CRISTIAN DEYVES OLIVEIRA DE BRITO',
  'DAVI KELMER DE MENEZES SILVA',
  'DINORAH DE FARIAS CHAGAS',
  'ERICK MARQUES OLIVEIRA AZEVEDO',
  'FELIPE MARCELO AQUINO DA COSTA',
  'FRANKLIN CLAUDIO LOPES DE OLIVEIRA FILHO',
  'GABRIEL FONTINELI DANTAS',
  'GABRIEL GUILHERME CARVALHO VIANA',
  'GABRIEL RIBEIRO BARBOSA DA SILVA',
  'GILIARDO JULIO DE MEDEIROS JUNIOR',
  'GUSTAVO HENRIQUE ARAUJO DE SALES LEITE',
  'GUSTAVO SOUSA BERNARDES',
  'HEBERT FRANÇA DA SILVA TORRES',
  'IAGO GABRIEL NOBRE DE MACEDO',
  'IGOR BASTOS ALBUQUERQUE',
  'JEREMIAS PINHEIRO DE ARAUJO ANDRADE',
  'JOAB URBANO DE ARAUJO',
  'JOAO MARINHO CALDAS NETO',
  'JOÃO VITOR DE OLIVEIRA SANTOS',
  'JOAREMIO MARINHO REVOREDO NETO',
  'JOHNY LÚCIO TEIXEIRA DA COSTA',
  'JOSÉ JARDEU VICENTE DA SILVA',
  'JUDSON KEVIN RODRIGUES DA SILVA',
  'KAIO EDUARDO ALVES DE LIMA',
  'LUCAS ALVES DE FARIAS TORRES',
  'LUCAS CUNHA DE AZEVEDO',
  'LUCAS DA SILVA BARBALHO',
  'LUCAS PINHEIRO CALDAS',
  'MARCUS VINICIUS ARAUJO PEREIRA',
  'MARIA PAZ MARCATO',
  'MARIANA EMERENCIANO MIRANDA',
  'MARIO LUIZ DA SILVA JÚNIOR',
  'MATHEUS DIAS ARAUJO DE MEDEIROS',
  'MATHEUS EUGENIO DE MOURA',
  'MATHEUS GABRIEL SOUTO DE LIRA FREITAS',
  'PEDRO HENRIQUE BASTOS VIANA',
  'PEDRO MIGUEL VARELA COSTA',
  'PEDRO PAULO LUCAS DE LIRA',
  'RAFAEL MAGNO FREITAS NUNES',
  'RAI DE MEDEIROS CUNHA',
  'RAQUEL DA COSTA FREIRE',
  'RAYANA MAYRA MENDES CARDOSO',
  'ROBSON SANTIAGO DANTAS',
  'RODRIGO EDUARDO DANTAS BARBALHO',
  'VICTOR COSTA MEDEIROS RIBEIRO',
  'VICTOR GABRIEL RIBEIRO MENEZES',
  'VINICIUS DE LIMA DUARTE SAMPAIO',
  'VINICIUS FERNANDES QUEIROZ DE MEDEIROS',
  'WISLA ALVES ARGOLO',
];

const PROFESSORES = [
  'Antonio Igor Silva de Oliveira',
  'Roberta de Souza Coelho',
  'Patrick Cesar Alves Terrematte',
  'Alyson Matheus de Carvalho Souza',
  'Maxwell Gomes da Silva',
  'Gustavo Bezerra Paz Leitão',
  'Eiji Adachi Medeiros Barbosa',
  'Selan Rodrigues dos Santos',
  'Tarciana Cabral de Brito Guerra',
  'Daniel Sabino Amorim de Araujo',
  'Thanos Tsouanas',
  'Umberto Souza da Costa',
  'Wellington Silva de Souza',
  'Silvan Ferreira da Silva Junior',
  'Frederico Araujo da Silva Lopes',
  'Dennys Leite Maia',
];

const COMISSAO = [
  'Franklin Claudio Lopes de Oliveira Filho',
  'Gabriel Ribeiro Barbosa da Silva',
  'Mariana Emerenciano Miranda',
  'Matheus Dias Araujo de Medeiros',
  'Raquel da Costa Freire',
];

const ADMINISTRACAO: CargoNome[] = [
  { cargo: 'Reitor(a)', nome: '[ a confirmar ]' },
  { cargo: 'Vice-reitor(a)', nome: '[ a confirmar ]' },
  { cargo: 'Diretor(a) do IMD', nome: '[ a confirmar ]' },
  { cargo: 'Coord. do BTI', nome: '[ a confirmar ]' },
];

const HOMENAGEADOS: CargoNome[] = [
  { cargo: 'Patronesse', nome: 'Ismenia Blavatsky de Magalhães' },
  { cargo: 'Paraninfa', nome: 'Isabel Dillmann Nunes' },
  { cargo: 'Orador(a)', nome: 'Aluno de C&T' },
  { cargo: 'Juramentista', nome: 'Raquel da Costa Freire' },
];

export const DEFAULT_SNIPPETS: Record<SnippetId, Snippet> = {
  coord: { text: '// 05.79 S · 35.20 W · natal/rn', on: true },
  build: { text: '// sprint final · status: done ✓', on: true },
  importTurma: { text: 'import turma', on: true },
  importGratidao: { text: 'import gratidao', on: true },
  git: { text: '>_ git commit -m "formados" && git push origin futuro', on: true },
  return: { text: 'return gratidao;', on: true },
  label01: { text: '[ 01 ] turma.jpg', on: true },
  fig01: { text: 'fig.01 · 52 pessoas · 1 turma', on: true },
  label02: { text: '[ 02 ] homenagens.json', on: true },
  gratidao: { text: 'const gratidao = Infinity;', on: true },
  label03: { text: '[ 03 ] const formandos = new Array(52);', on: true },
  sprint: { text: 'while (sprint) aprender();', on: true },
  indices: { text: '', on: true },
};

export const SNIPPET_ORDER = Object.keys(DEFAULT_SNIPPETS) as SnippetId[];

export const SNIPPET_LABELS: Record<SnippetId, string> = {
  coord: 'Fundo · canto superior esquerdo',
  build: 'Fundo · canto superior direito',
  importTurma: 'Fundo · import (esquerda)',
  importGratidao: 'Fundo · import (direita)',
  git: 'Fundo · sob o subtítulo',
  return: 'Fundo · rodapé',
  label01: 'Turma · rótulo',
  fig01: 'Turma · legenda da foto',
  label02: 'Homenagens · rótulo',
  gratidao: 'Homenagens · rodapé',
  label03: 'Formandos · rótulo',
  sprint: 'Formandos · canto direito',
  indices: 'Formandos · índices 00–51 nas fotos',
};

export const DEFAULT_ESTILOS: Record<SlotKey, SlotStyle> = {
  titulo: { font: 'fraunces', weight: 400, italic: false, sizeMm: 18, tracking: 0 },
  subtitulo: { font: 'jetbrains-mono', weight: 400, italic: false, sizeMm: 8.5, tracking: 0.18 },
  rotulo: { font: 'jetbrains-mono', weight: 400, italic: false, sizeMm: 8, tracking: 0 },
  snippet: { font: 'jetbrains-mono', weight: 400, italic: false, sizeMm: 6, tracking: 0 },
  secao: { font: 'jetbrains-mono', weight: 400, italic: false, sizeMm: 5.6, tracking: 0 },
  homenagem: { font: 'sora', weight: 600, italic: false, sizeMm: 4.2, tracking: 0 },
  legenda: { font: 'sora', weight: 600, italic: false, sizeMm: 3.3, tracking: 0 },
  hexTI: { font: 'fraunces', weight: 600, italic: true, sizeMm: 42.5, tracking: 0 },
  hexAno: { font: 'jetbrains-mono', weight: 400, italic: false, sizeMm: 8.2, tracking: 0.13 },
};

export const SLOT_ORDER = Object.keys(DEFAULT_ESTILOS) as SlotKey[];

export const SLOT_LABELS: Record<SlotKey, string> = {
  titulo: 'Título',
  subtitulo: 'Subtítulo',
  rotulo: 'Rótulos [ 0n ]',
  snippet: 'Snippets',
  secao: 'Títulos das homenagens',
  homenagem: 'Nomes nas homenagens',
  legenda: 'Nomes sob as fotos',
  hexTI: 'Hexágono · TI',
  hexAno: 'Hexágono · 2026.1',
};

export const DEFAULT_EXPORT: ExportOptions = {
  files: { composicao: true, fundo: true, turma: true, homenagens: true, formandos: true, hexagono: true, corte: true },
  formats: { pdf: true, svg: true, png: true },
  dpi: 300,
  bleedMm: 3,
  holeMm: 8,
};

export function createFormandos(): MuralFormando[] {
  return FORMANDOS.map((nome, i) => ({
    id: `f${String(i).padStart(2, '0')}`,
    nome,
    linhas: splitName(nome),
    linhasManuais: false,
    transform: { scale: 1, x: 0, y: 0 },
  }));
}

export function createDefaultDoc(): MuralDoc {
  return {
    version: 1,
    titulo: 'Tecnologia da Informação',
    subtitulo: 'UFRN · 2026.1',
    turma: 'Sprint Sem Fim',
    snippets: structuredClone(DEFAULT_SNIPPETS),
    administracao: structuredClone(ADMINISTRACAO),
    homenageados: structuredClone(HOMENAGEADOS),
    professores: [...PROFESSORES],
    comissao: [...COMISSAO],
    formandos: createFormandos(),
    fotoTurma: { transform: { scale: 1, x: 0, y: 0 } },
    estilos: structuredClone(DEFAULT_ESTILOS),
    export: structuredClone(DEFAULT_EXPORT),
  };
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test -- src/mural/text/split.test.ts src/mural/defaults.test.ts`
Expected: PASS.

- [ ] **Step 7: Build, commit, push**

```bash
npm run build
git add src/mural/types.ts src/mural/defaults.ts src/mural/defaults.test.ts src/mural/text/split.ts src/mural/text/split.test.ts
git commit -m "mural: tipos, conteudo padrao e quebra de nomes"
git push
```

Expected: build exits 0.

---

### Task 3: Fonts, text layout and fit

**Files:**
- Create: `src/mural/text/fonts.ts`, `src/mural/text/fonts.browser.ts`, `src/mural/text/fonts.node.ts`, `src/mural/text/layout.ts`, `src/mural/text/fit.ts`
- Test: `src/mural/text/layout.test.ts`, `src/mural/text/fit.test.ts`

**Interfaces:**
- Consumes: `FontId`, `SlotStyle` from `types.ts`.
- Produces: `FontSet` (= `Map<string, Font>`), `FONT_FACES`, `ITALIC_FONTS`, `faceFile(face): string`, `fontKey(style): string`, `getFont(set, style): Font`; `loadFontsBrowser(base?): Promise<FontSet>`; `loadFontsNode(): FontSet` (tests only); `Laid { d: string; width: number }`, `layoutText(font, text, sizeMm, trackingEm?): Laid`; `MIN_SCALE_X = 0.85`, `fitWidth(width, maxW?): { scaleX: number; overflow: boolean }`.

- [ ] **Step 1: Write the failing tests**

Create `src/mural/text/fit.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fitWidth } from './fit';

describe('fitWidth', () => {
  it('cabe: sem compressao', () => {
    expect(fitWidth(100, 120)).toEqual({ scaleX: 1, overflow: false });
    expect(fitWidth(100)).toEqual({ scaleX: 1, overflow: false });
  });
  it('comprime ate 85%', () => {
    expect(fitWidth(100, 90)).toEqual({ scaleX: 0.9, overflow: false });
    expect(fitWidth(100, 85)).toEqual({ scaleX: 0.85, overflow: false });
  });
  it('alem de 85% marca estouro', () => {
    expect(fitWidth(100, 80)).toEqual({ scaleX: 0.85, overflow: true });
    expect(fitWidth(100, 0)).toEqual({ scaleX: 0.85, overflow: true });
  });
});
```

Create `src/mural/text/layout.test.ts`:

```ts
import { beforeAll, describe, expect, it } from 'vitest';
import { getFont, type FontSet } from './fonts';
import { loadFontsNode } from './fonts.node';
import { layoutText } from './layout';
import { DEFAULT_ESTILOS } from '../defaults';

let fonts: FontSet;
beforeAll(() => {
  fonts = loadFontsNode();
});

describe('fontes', () => {
  it('carrega as 10 faces', () => {
    expect(fonts.size).toBe(10);
  });
  it('getFont respeita italico so na Fraunces', () => {
    expect(() => getFont(fonts, DEFAULT_ESTILOS.hexTI)).not.toThrow();
    expect(() => getFont(fonts, { font: 'sora', weight: 600, italic: true })).not.toThrow();
  });
});

describe('layoutText', () => {
  it('gera path e largura plausivel', () => {
    const font = getFont(fonts, DEFAULT_ESTILOS.titulo);
    const laid = layoutText(font, 'TI', 10);
    expect(laid.d.length).toBeGreaterThan(10);
    expect(laid.width).toBeGreaterThan(5);
    expect(laid.width).toBeLessThan(15);
  });
  it('tracking aumenta a largura', () => {
    const font = getFont(fonts, DEFAULT_ESTILOS.snippet);
    const a = layoutText(font, 'abc', 10, 0);
    const b = layoutText(font, 'abc', 10, 0.1);
    expect(b.width - a.width).toBeCloseTo(2, 5); // 2 espacos entre 3 letras x 1 mm
  });
  it('acentos do portugues tem glifo', () => {
    const font = getFont(fonts, DEFAULT_ESTILOS.legenda);
    for (const ch of 'ÇÃÕÉÚÍçãõéúí') expect(font.charToGlyph(ch).index).not.toBe(0);
  });
  it('desenha ✓ mesmo sem glifo na fonte', () => {
    const font = getFont(fonts, DEFAULT_ESTILOS.snippet);
    const laid = layoutText(font, '✓', 10);
    expect(laid.d).toMatch(/Z/);
    expect(laid.width).toBeCloseTo(6.2, 5);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- src/mural/text`
Expected: FAIL, unresolved imports `./fit`, `./fonts`, `./fonts.node`, `./layout`.

- [ ] **Step 3: Implement `src/mural/text/fit.ts`**

```ts
// Ajuste horizontal: comprime ate MIN_SCALE_X; alem disso desenha a 85% e marca estouro.
export const MIN_SCALE_X = 0.85;

export function fitWidth(width: number, maxW?: number): { scaleX: number; overflow: boolean } {
  if (maxW === undefined || width <= maxW) return { scaleX: 1, overflow: false };
  const s = maxW / width;
  return s >= MIN_SCALE_X ? { scaleX: s, overflow: false } : { scaleX: MIN_SCALE_X, overflow: true };
}
```

- [ ] **Step 4: Implement `src/mural/text/fonts.ts`**

```ts
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
```

- [ ] **Step 5: Implement the two loaders**

Create `src/mural/text/fonts.browser.ts`:

```ts
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
```

Create `src/mural/text/fonts.node.ts`:

```ts
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
```

- [ ] **Step 6: Implement `src/mural/text/layout.ts`**

```ts
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
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm test -- src/mural/text`
Expected: PASS. If `import { parse } from 'opentype.js'` fails at runtime with "does not provide an export named parse", change the import in both loaders to `import opentype from 'opentype.js'` and call `opentype.parse(...)`, then rerun.

- [ ] **Step 8: Build, commit, push**

```bash
npm run build
git add src/mural/text
git commit -m "mural: fontes, texto em contornos e ajuste de largura"
git push
```

---

### Task 4: Compose the mural model

**Files:**
- Create: `src/mural/compose.ts`
- Test: `src/mural/compose.test.ts`

**Interfaces:**
- Consumes: `MuralDoc`, `SlotStyle`, `SnippetId`, `Photo`, `PhotoTransform` (types); `FontSet`, `getFont` (fonts); `layoutText`; `fitWidth`; `HOM`, `TURMA_FOTO`, `coverRect`, `photoCell`, `LayerId`, `Rect` (geometry).
- Produces: `COLORS`, `HEX_TEXT`, `pad2(i): string`, `TextItem`, `PhotoItem`, `Overflow`, `MuralModel`, `composeMural(doc, fonts): MuralModel`. Text keys used by the editor: `legenda:<formandoId>:<1|2>`, `hom:*`, `snippet:<id>`, `idx:<formandoId>`, `titulo`, `subtitulo`, `hex:ti`, `hex:ano`. Overflow-only keys: `hom:col1`, `hom:col2`.

- [ ] **Step 1: Write the failing tests**

Create `src/mural/compose.test.ts`:

```ts
import { beforeAll, describe, expect, it } from 'vitest';
import { composeMural } from './compose';
import { createDefaultDoc } from './defaults';
import { coverRect, photoCell } from './geometry';
import type { FontSet } from './text/fonts';
import { loadFontsNode } from './text/fonts.node';

let fonts: FontSet;
beforeAll(() => {
  fonts = loadFontsNode();
});

const keys = (m: ReturnType<typeof composeMural>) => m.texts.map((t) => t.key);

describe('composeMural', () => {
  it('o conteudo padrao cabe sem estouros', () => {
    const m = composeMural(createDefaultDoc(), fonts);
    expect(m.overflows).toEqual([]);
  });

  it('tem 52 fotos de formandos + foto da turma', () => {
    const m = composeMural(createDefaultDoc(), fonts);
    expect(m.photos.filter((p) => p.layer === 'formandos')).toHaveLength(52);
    expect(m.photos.filter((p) => p.layer === 'turma')).toHaveLength(1);
    expect(keys(m)).toContain('legenda:f00:1');
    expect(keys(m)).toContain('legenda:f51:2');
    expect(keys(m)).toContain('idx:f51');
    expect(keys(m)).toContain('titulo');
    expect(keys(m)).toContain('hex:ti');
  });

  it('snippet desligado nao aparece', () => {
    const doc = createDefaultDoc();
    doc.snippets.git.on = false;
    doc.snippets.indices.on = false;
    const k = keys(composeMural(doc, fonts));
    expect(k).not.toContain('snippet:git');
    expect(k).not.toContain('idx:f00');
    expect(k).toContain('snippet:return');
  });

  it('nome longo demais marca estouro', () => {
    const doc = createDefaultDoc();
    doc.formandos[0].linhas = ['W'.repeat(40), ''];
    const m = composeMural(doc, fonts);
    expect(m.overflows.map((o) => o.key)).toContain('legenda:f00:1');
    const item = m.texts.find((t) => t.key === 'legenda:f00:1');
    expect(item?.scaleX).toBe(0.85);
  });

  it('lista de professores que nao cabe marca estouro de coluna', () => {
    const doc = createDefaultDoc();
    doc.professores = Array.from({ length: 40 }, (_, i) => `Professor ${i}`);
    expect(composeMural(doc, fonts).overflows.map((o) => o.key)).toContain('hom:col2');
  });

  it('linhas em branco nas listas sao ignoradas', () => {
    const doc = createDefaultDoc();
    doc.comissao = ['Ana', '', '  ', 'Bia'];
    const k = keys(composeMural(doc, fonts)).filter((x) => x.startsWith('hom:comissao:'));
    expect(k).toEqual(['hom:comissao:0', 'hom:comissao:1']);
  });

  it('foto posicionada com coverRect', () => {
    const doc = createDefaultDoc();
    doc.formandos[13].photo = { url: 'blob:x', fileName: 'x.jpg', w: 300, h: 400 };
    doc.formandos[13].transform = { scale: 1.5, x: 10, y: -20 };
    const p = composeMural(doc, fonts).photos.find((x) => x.key === 'formando:f13');
    expect(p?.image?.href).toBe('blob:x');
    expect(p?.image?.rect).toEqual(coverRect(photoCell(13), { w: 300, h: 400 }, { scale: 1.5, x: 10, y: -20 }));
  });

  it('ancora middle centraliza a legenda na celula', () => {
    const m = composeMural(createDefaultDoc(), fonts);
    const t = m.texts.find((x) => x.key === 'legenda:f00:1')!;
    expect(t.x + t.width / 2).toBeCloseTo(60, 5);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- src/mural/compose.test.ts`
Expected: FAIL, unresolved import `./compose`.

- [ ] **Step 3: Implement `src/mural/compose.ts`**

```ts
// Monta o modelo do mural: todo texto vira path posicionado (mm) e toda foto
// vira uma celula + retangulo da imagem. Funcao pura: preview e export usam o mesmo modelo.
import type { MuralDoc, Photo, PhotoTransform, SlotStyle, SnippetId, CargoNome } from './types';
import { getFont, type FontSet } from './text/fonts';
import { layoutText } from './text/layout';
import { fitWidth } from './text/fit';
import { HOM, TURMA_FOTO, coverRect, photoCell, type LayerId, type Rect } from './geometry';

export const COLORS = {
  navy: '#0e1a33',
  navy2: '#14244a',
  navy3: '#101d3b',
  hex: '#132245',
  gold: '#c9a227',
  champagne: '#e8cf8f',
  ink: '#eef2fb',
  inkDim: '#aab6cf',
  placeholder: '#55617d',
  overflow: '#ff4d4f',
};

export const HEX_TEXT = { ti: 'TI', ano: '2026.1' };

export const pad2 = (i: number) => String(i).padStart(2, '0');

export interface TextItem {
  key: string;
  layer: LayerId;
  label: string;
  d: string;
  x: number;
  y: number;
  scaleX: number;
  width: number;
  fill: string;
  opacity: number;
  overflow: boolean;
}
export interface PhotoItem { key: string; layer: LayerId; cell: Rect; image?: { href: string; rect: Rect } }
export interface Overflow { key: string; label: string }
export interface MuralModel { texts: TextItem[]; photos: PhotoItem[]; overflows: Overflow[] }

type Anchor = 'start' | 'middle' | 'end';
interface TextOpts { anchor?: Anchor; maxW?: number; fill?: string; opacity?: number; label?: string }

function photoImage(cell: Rect, photo: Photo | undefined, t: PhotoTransform) {
  return photo ? { href: photo.url, rect: coverRect(cell, photo, t) } : undefined;
}

export function composeMural(doc: MuralDoc, fonts: FontSet): MuralModel {
  const texts: TextItem[] = [];
  const photos: PhotoItem[] = [];
  const overflows: Overflow[] = [];
  const st = doc.estilos;

  const put = (
    key: string, layer: LayerId, str: string, style: SlotStyle, x: number, y: number, o: TextOpts = {},
  ): TextItem | null => {
    if (!str.trim()) return null;
    const laid = layoutText(getFont(fonts, style), str, style.sizeMm, style.tracking);
    const { scaleX, overflow } = fitWidth(laid.width, o.maxW);
    const width = laid.width * scaleX;
    const x0 = o.anchor === 'middle' ? x - width / 2 : o.anchor === 'end' ? x - width : x;
    const item: TextItem = {
      key, layer, label: o.label ?? key, d: laid.d, x: x0, y, scaleX, width,
      fill: o.fill ?? COLORS.ink, opacity: o.opacity ?? 1, overflow,
    };
    texts.push(item);
    if (overflow) overflows.push({ key, label: item.label });
    return item;
  };

  const snip = (id: SnippetId, layer: LayerId, x: number, y: number, o: TextOpts = {}, style: SlotStyle = st.snippet) => {
    const s = doc.snippets[id];
    if (s.on) put(`snippet:${id}`, layer, s.text, style, x, y, { fill: COLORS.champagne, label: `Snippet ${id}`, ...o });
  };

  // ---- fundo
  snip('coord', 'fundo', 34, 76, { opacity: 0.55 });
  snip('build', 'fundo', 766, 76, { anchor: 'end', opacity: 0.55 });
  snip('importTurma', 'fundo', 312, 182, { opacity: 0.75 });
  snip('importGratidao', 'fundo', 488, 182, { anchor: 'end', opacity: 0.75 });
  put('titulo', 'fundo', doc.titulo, st.titulo, 400, 230, { anchor: 'middle', maxW: 220, label: 'Título' });
  put('subtitulo', 'fundo', `${doc.subtitulo} · TURMA ${doc.turma}`.toUpperCase(), st.subtitulo, 400, 248, {
    anchor: 'middle', maxW: 220, fill: COLORS.champagne, label: 'Subtítulo',
  });
  snip('git', 'fundo', 400, 266, { anchor: 'middle', maxW: 225, fill: COLORS.inkDim });
  snip('return', 'fundo', 400, 590, { anchor: 'middle', opacity: 0.7 });

  // ---- turma
  snip('label01', 'turma', 37, 106, {}, st.rotulo);
  photos.push({
    key: 'turma', layer: 'turma', cell: TURMA_FOTO,
    image: photoImage(TURMA_FOTO, doc.fotoTurma.photo, doc.fotoTurma.transform),
  });
  snip('fig01', 'turma', 273, 275, { anchor: 'end', fill: COLORS.ink, opacity: 0.7 });

  // ---- homenagens (2 colunas)
  snip('label02', 'homenagens', 527, 106, {}, st.rotulo);
  const head = (x: number, y: number, title: string, maxW: number) =>
    put(`hom:head:${title}`, 'homenagens', `// ${title}`, st.secao, x, y, {
      fill: COLORS.champagne, maxW, label: `Homenagens: título "${title}"`,
    });

  const x1 = HOM.col1X;
  let y = HOM.top;
  const pairs: [string, CargoNome[]][] = [
    ['corpo administrativo', doc.administracao],
    ['homenageados da turma', doc.homenageados],
  ];
  pairs.forEach(([title, list], gi) => {
    if (gi > 0) y += 5;
    head(x1, y, title, HOM.col1W);
    y += 8;
    list.filter((it) => it.cargo.trim() || it.nome.trim()).forEach((it, i) => {
      const role = put(`hom:${title}:${i}:cargo`, 'homenagens', it.cargo, st.homenagem, x1, y, {
        fill: COLORS.inkDim, maxW: HOM.col1W, label: `${title}: ${it.cargo}`,
      });
      const dx = role ? role.width + 2 : 0;
      put(`hom:${title}:${i}:nome`, 'homenagens', it.nome, st.homenagem, x1 + dx, y, {
        maxW: HOM.col1W - dx, label: `${title}: ${it.nome}`,
      });
      y += 7;
    });
  });
  y += 5;
  head(x1, y, 'comissão de formatura', HOM.col1W);
  y += 8;
  doc.comissao.filter((n) => n.trim()).forEach((n, i) => {
    put(`hom:comissao:${i}`, 'homenagens', n, st.homenagem, x1, y, { maxW: HOM.col1W, label: `Comissão: ${n}` });
    y += 7;
  });
  if (y - 7 > HOM.bottom) {
    overflows.push({ key: 'hom:col1', label: 'Homenagens: a coluna da esquerda não cabe na altura do módulo' });
  }

  let y2 = HOM.top;
  head(HOM.col2X, y2, 'prof. homenageados', HOM.col2W);
  y2 += 8;
  doc.professores.filter((n) => n.trim()).forEach((n, i) => {
    put(`hom:prof:${i}`, 'homenagens', n, st.homenagem, HOM.col2X, y2, { maxW: HOM.col2W, label: `Professor(a): ${n}` });
    y2 += 8.6;
  });
  if (y2 - 8.6 > HOM.bottom) {
    overflows.push({ key: 'hom:col2', label: 'Homenagens: a lista de professores não cabe na altura do módulo' });
  }
  snip('gratidao', 'homenagens', 763, 273, { anchor: 'end', opacity: 0.7 });

  // ---- formandos
  snip('label03', 'formandos', 40, 322, {}, st.rotulo);
  snip('sprint', 'formandos', 760, 322, { anchor: 'end', opacity: 0.7 });
  const idxStyle: SlotStyle = { ...st.snippet, sizeMm: 4.5, tracking: 0 };
  doc.formandos.forEach((f, i) => {
    const cell = photoCell(i);
    photos.push({ key: `formando:${f.id}`, layer: 'formandos', cell, image: photoImage(cell, f.photo, f.transform) });
    if (doc.snippets.indices.on) {
      put(`idx:${f.id}`, 'formandos', pad2(i), idxStyle, cell.x + 1.5, cell.y + 5.5, {
        fill: COLORS.champagne, label: `Índice ${pad2(i)}`,
      });
    }
    f.linhas.forEach((linha, j) =>
      put(`legenda:${f.id}:${j + 1}`, 'formandos', linha, st.legenda, cell.x + cell.w / 2, cell.y + 52 + j * 4.3, {
        anchor: 'middle', maxW: 38, label: `Formando ${pad2(i)} (${f.nome}), linha ${j + 1}`,
      }),
    );
  });

  // ---- hexagono
  put('hex:ti', 'hexagono', HEX_TEXT.ti, st.hexTI, 400, 118.55, { anchor: 'middle', label: 'Hexágono: TI' });
  put('hex:ano', 'hexagono', HEX_TEXT.ano, st.hexAno, 400, 136, {
    anchor: 'middle', fill: COLORS.champagne, label: 'Hexágono: ano',
  });

  return { texts, photos, overflows };
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- src/mural/compose.test.ts`
Expected: PASS. If **only** "o conteudo padrao cabe sem estouros" fails, print the overflows (`console.log(m.overflows)`) and lower the matching default in `DEFAULT_ESTILOS` (e.g. `legenda.sizeMm`) by 0.1 mm at a time until it passes, never below 2.8 mm for `legenda` or 3.6 mm for `homenagem`. If it still fails at those floors, stop and report the overflowing labels instead of changing the layout.

- [ ] **Step 5: Build, commit, push**

```bash
npm run build
git add src/mural/compose.ts src/mural/compose.test.ts src/mural/defaults.ts
git commit -m "mural: composicao do modelo (textos em contornos, fotos, estouros)"
git push
```

---

### Task 5: State, persistence and portrait matching

**Files:**
- Create: `src/mural/store.ts`, `src/mural/photos.ts`, `src/mural/state.tsx`
- Test: `src/mural/store.test.ts`, `src/mural/photos.test.ts`

**Interfaces:**
- Consumes: types, `createDefaultDoc`, `DEFAULT_ESTILOS`, `splitName`, `composeMural`, `MuralModel`, `loadFontsBrowser`, `FontSet`.
- Produces:
  - `STORAGE_KEY`, `MuralAction` (union below), `muralReducer(doc, action): MuralDoc`, `serializeDoc(doc): string`, `loadDoc(raw: string | null): MuralDoc`.
  - `normalizeName(s): string`, `matchPortraits(formandos: {id; nome}[], fileNames: string[]): { matches: { formandoId: string; fileIndex: number }[]; unmatched: number[] }`, `readImage(file: File): Promise<Photo>`.
  - `MuralProvider`, `useMural(): { doc; dispatch; fonts: FontSet | null; fontError: string | null; model: MuralModel | null }`.

- [ ] **Step 1: Write the failing tests**

Create `src/mural/store.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createDefaultDoc, DEFAULT_ESTILOS } from './defaults';
import { loadDoc, muralReducer, serializeDoc } from './store';

const photo = { url: 'blob:a', fileName: 'a.jpg', w: 10, h: 12 };

describe('muralReducer', () => {
  it('edita snippet sem mexer nos outros', () => {
    const d = muralReducer(createDefaultDoc(), { type: 'SET_SNIPPET', id: 'git', patch: { on: false } });
    expect(d.snippets.git).toEqual({ text: createDefaultDoc().snippets.git.text, on: false });
    expect(d.snippets.return.on).toBe(true);
  });

  it('mudar o nome recalcula as linhas, a menos que tenham sido editadas', () => {
    let d = muralReducer(createDefaultDoc(), { type: 'SET_FORMANDO', id: 'f00', patch: { nome: 'ANA MARIA SOUZA' } });
    expect(d.formandos[0].linhas).toEqual(['ANA MARIA', 'SOUZA']);
    d = muralReducer(d, { type: 'SET_FORMANDO', id: 'f00', patch: { linhas: ['ANA', 'MARIA SOUZA'] } });
    expect(d.formandos[0].linhasManuais).toBe(true);
    d = muralReducer(d, { type: 'SET_FORMANDO', id: 'f00', patch: { nome: 'ANA MARIA SOUZA LIMA' } });
    expect(d.formandos[0].linhas).toEqual(['ANA', 'MARIA SOUZA']);
    d = muralReducer(d, { type: 'RESPLIT' });
    expect(d.formandos[0]).toMatchObject({ linhas: ['ANA MARIA', 'SOUZA LIMA'], linhasManuais: false });
  });

  it('ordena alfabeticamente (pt-BR)', () => {
    let d = createDefaultDoc();
    d = muralReducer(d, { type: 'SET_FORMANDO', id: 'f51', patch: { nome: 'AARAO' } });
    d = muralReducer(d, { type: 'SORT_FORMANDOS' });
    expect(d.formandos[0].id).toBe('f51');
  });

  it('atribui fotos e zera o enquadramento', () => {
    let d = muralReducer(createDefaultDoc(), { type: 'SET_FORMANDO', id: 'f02', patch: { transform: { scale: 2, x: 5, y: 5 } } });
    d = muralReducer(d, { type: 'ASSIGN_PHOTOS', photos: [{ formandoId: 'f02', photo }] });
    expect(d.formandos[2]).toMatchObject({ photo, transform: { scale: 1, x: 0, y: 0 } });
  });

  it('estilos: editar e resetar', () => {
    let d = muralReducer(createDefaultDoc(), { type: 'SET_STYLE', slot: 'titulo', patch: { sizeMm: 30 } });
    expect(d.estilos.titulo.sizeMm).toBe(30);
    d = muralReducer(d, { type: 'RESET_STYLE', slot: 'titulo' });
    expect(d.estilos.titulo).toEqual(DEFAULT_ESTILOS.titulo);
    d = muralReducer(d, { type: 'SET_STYLE', slot: 'legenda', patch: { sizeMm: 9 } });
    d = muralReducer(d, { type: 'RESET_STYLE' });
    expect(d.estilos).toEqual(DEFAULT_ESTILOS);
  });
});

describe('persistencia', () => {
  it('serializa sem fotos e recarrega igual', () => {
    let d = createDefaultDoc();
    d = muralReducer(d, { type: 'ASSIGN_PHOTOS', photos: [{ formandoId: 'f00', photo }] });
    d = muralReducer(d, { type: 'SET_FOTO_TURMA', photo, transform: { scale: 1.2, x: 0, y: 3 } });
    d = muralReducer(d, { type: 'SET_TEXT', field: 'turma', value: 'Outra' });
    const raw = serializeDoc(d);
    expect(raw).not.toContain('blob:a');
    const back = loadDoc(raw);
    expect(back.turma).toBe('Outra');
    expect(back.formandos[0].photo).toBeUndefined();
    expect(back.fotoTurma).toEqual({ transform: { scale: 1.2, x: 0, y: 3 } });
  });

  it('entrada invalida volta ao padrao', () => {
    expect(loadDoc(null)).toEqual(createDefaultDoc());
    expect(loadDoc('{nao json')).toEqual(createDefaultDoc());
    expect(loadDoc(JSON.stringify({ version: 2 }))).toEqual(createDefaultDoc());
  });

  it('completa chaves que faltam com o padrao', () => {
    const back = loadDoc(JSON.stringify({ version: 1, titulo: 'X', snippets: { git: { text: 'g', on: true } } }));
    expect(back.titulo).toBe('X');
    expect(back.snippets.git.text).toBe('g');
    expect(back.snippets.return).toEqual(createDefaultDoc().snippets.return);
    expect(back.formandos).toHaveLength(52);
    expect(back.export.files.corte).toBe(true);
  });
});
```

Create `src/mural/photos.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createFormandos } from './defaults';
import { matchPortraits, normalizeName } from './photos';

const formandos = createFormandos();
const idOf = (nome: string) => formandos.find((f) => f.nome === nome)!.id;

describe('normalizeName', () => {
  it('tira extensao, acentos e separadores', () => {
    expect(normalizeName('João_Vitor-de.Oliveira.JPG')).toBe('joao vitor de oliveira');
  });
});

describe('matchPortraits', () => {
  it('nome exato', () => {
    const r = matchPortraits(formandos, ['Maria_Paz-Marcato.jpg']);
    expect(r.matches).toEqual([{ formandoId: idOf('MARIA PAZ MARCATO'), fileIndex: 0 }]);
  });
  it('subconjunto unico de palavras (>= 2)', () => {
    const r = matchPortraits(formandos, ['lucas-barbalho.png', 'joao vitor.jpeg']);
    expect(r.matches).toEqual([
      { formandoId: idOf('LUCAS DA SILVA BARBALHO'), fileIndex: 0 },
      { formandoId: idOf('JOÃO VITOR DE OLIVEIRA SANTOS'), fileIndex: 1 },
    ]);
  });
  it('ambiguo ou uma palavra so fica sem par', () => {
    const r = matchPortraits(formandos, ['gabriel.jpg', 'lucas-silva.jpg', 'fulano-de-tal.jpg']);
    expect(r.matches).toEqual([]);
    expect(r.unmatched).toEqual([0, 1, 2]);
  });
  it('nao usa o mesmo formando duas vezes', () => {
    const r = matchPortraits(formandos, ['wisla alves argolo.jpg', 'wisla-argolo.jpg']);
    expect(r.matches).toHaveLength(1);
    expect(r.unmatched).toEqual([1]);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- src/mural/store.test.ts src/mural/photos.test.ts`
Expected: FAIL, unresolved imports.

- [ ] **Step 3: Implement `src/mural/store.ts`**

```ts
// Reducer e persistencia do mural (puro, testavel sem React).
import type {
  CargoNome, ExportOptions, MuralDoc, MuralFormando, Photo, PhotoTransform, SlotKey, SlotStyle, Snippet, SnippetId,
} from './types';
import { createDefaultDoc, DEFAULT_ESTILOS } from './defaults';
import { splitName } from './text/split';

export const STORAGE_KEY = 'mural-ti-2026:v1';

export type MuralAction =
  | { type: 'SET_TEXT'; field: 'titulo' | 'subtitulo' | 'turma'; value: string }
  | { type: 'SET_SNIPPET'; id: SnippetId; patch: Partial<Snippet> }
  | { type: 'SET_PAIRS'; list: 'administracao' | 'homenageados'; value: CargoNome[] }
  | { type: 'SET_NAMES'; list: 'professores' | 'comissao'; value: string[] }
  | { type: 'SET_FORMANDO'; id: string; patch: Partial<Omit<MuralFormando, 'id'>> }
  | { type: 'SORT_FORMANDOS' }
  | { type: 'RESPLIT' }
  | { type: 'ASSIGN_PHOTOS'; photos: { formandoId: string; photo: Photo }[] }
  | { type: 'SET_FOTO_TURMA'; photo?: Photo; transform?: PhotoTransform }
  | { type: 'SET_STYLE'; slot: SlotKey; patch: Partial<SlotStyle> }
  | { type: 'RESET_STYLE'; slot?: SlotKey }
  | { type: 'SET_EXPORT'; patch: Partial<ExportOptions> }
  | { type: 'LOAD'; doc: MuralDoc };

const IDENTITY: PhotoTransform = { scale: 1, x: 0, y: 0 };

function applyFormandoPatch(f: MuralFormando, patch: Partial<Omit<MuralFormando, 'id'>>): MuralFormando {
  const next: MuralFormando = { ...f, ...patch };
  if (patch.linhas) next.linhasManuais = true;
  else if (patch.nome !== undefined && !f.linhasManuais) next.linhas = splitName(patch.nome);
  return next;
}

export function muralReducer(doc: MuralDoc, a: MuralAction): MuralDoc {
  switch (a.type) {
    case 'SET_TEXT':
      return { ...doc, [a.field]: a.value };
    case 'SET_SNIPPET':
      return { ...doc, snippets: { ...doc.snippets, [a.id]: { ...doc.snippets[a.id], ...a.patch } } };
    case 'SET_PAIRS':
      return { ...doc, [a.list]: a.value };
    case 'SET_NAMES':
      return { ...doc, [a.list]: a.value };
    case 'SET_FORMANDO':
      return { ...doc, formandos: doc.formandos.map((f) => (f.id === a.id ? applyFormandoPatch(f, a.patch) : f)) };
    case 'SORT_FORMANDOS':
      return { ...doc, formandos: [...doc.formandos].sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR')) };
    case 'RESPLIT':
      return { ...doc, formandos: doc.formandos.map((f) => ({ ...f, linhas: splitName(f.nome), linhasManuais: false })) };
    case 'ASSIGN_PHOTOS': {
      const m = new Map(a.photos.map((p) => [p.formandoId, p.photo]));
      return {
        ...doc,
        formandos: doc.formandos.map((f) => (m.has(f.id) ? { ...f, photo: m.get(f.id), transform: { ...IDENTITY } } : f)),
      };
    }
    case 'SET_FOTO_TURMA':
      return {
        ...doc,
        fotoTurma: { photo: a.photo ?? doc.fotoTurma.photo, transform: a.transform ?? doc.fotoTurma.transform },
      };
    case 'SET_STYLE':
      return { ...doc, estilos: { ...doc.estilos, [a.slot]: { ...doc.estilos[a.slot], ...a.patch } } };
    case 'RESET_STYLE':
      return {
        ...doc,
        estilos: a.slot ? { ...doc.estilos, [a.slot]: { ...DEFAULT_ESTILOS[a.slot] } } : structuredClone(DEFAULT_ESTILOS),
      };
    case 'SET_EXPORT':
      return { ...doc, export: { ...doc.export, ...a.patch } };
    case 'LOAD':
      return a.doc;
    default:
      return doc;
  }
}

// Fotos (blob URLs) nunca sao salvas.
export function serializeDoc(doc: MuralDoc): string {
  const formandos = doc.formandos.map((f) => {
    const { photo, ...rest } = f;
    void photo;
    return rest;
  });
  return JSON.stringify({ ...doc, formandos, fotoTurma: { transform: doc.fotoTurma.transform } });
}

export function loadDoc(raw: string | null): MuralDoc {
  const base = createDefaultDoc();
  if (!raw) return base;
  try {
    const d = JSON.parse(raw) as Partial<MuralDoc>;
    if (!d || d.version !== 1) return base;
    return {
      ...base,
      ...d,
      version: 1,
      snippets: { ...base.snippets, ...d.snippets },
      estilos: { ...base.estilos, ...d.estilos },
      export: {
        ...base.export,
        ...d.export,
        files: { ...base.export.files, ...d.export?.files },
        formats: { ...base.export.formats, ...d.export?.formats },
      },
      formandos:
        Array.isArray(d.formandos) && d.formandos.length > 0
          ? d.formandos.map((f) => ({ ...f, photo: undefined }))
          : base.formandos,
      fotoTurma: { transform: d.fotoTurma?.transform ?? base.fotoTurma.transform },
    };
  } catch {
    return base;
  }
}
```

- [ ] **Step 4: Implement `src/mural/photos.ts`**

```ts
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
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- src/mural/store.test.ts src/mural/photos.test.ts`
Expected: PASS.

- [ ] **Step 6: Implement `src/mural/state.tsx`**

```tsx
// Provider do mural: documento (reducer + localStorage), fontes e modelo composto.
import { createContext, useContext, useEffect, useMemo, useReducer, useState, type Dispatch, type ReactNode } from 'react';
import type { MuralDoc } from './types';
import { STORAGE_KEY, loadDoc, muralReducer, serializeDoc, type MuralAction } from './store';
import { composeMural, type MuralModel } from './compose';
import type { FontSet } from './text/fonts';
import { loadFontsBrowser } from './text/fonts.browser';

interface MuralCtx {
  doc: MuralDoc;
  dispatch: Dispatch<MuralAction>;
  fonts: FontSet | null;
  fontError: string | null;
  model: MuralModel | null;
}

const Ctx = createContext<MuralCtx | null>(null);

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function MuralProvider({ children }: { children: ReactNode }) {
  const [doc, dispatch] = useReducer(muralReducer, null, () => loadDoc(readStorage()));
  const [fonts, setFonts] = useState<FontSet | null>(null);
  const [fontError, setFontError] = useState<string | null>(null);

  useEffect(() => {
    loadFontsBrowser().then(setFonts).catch((e) => setFontError(e instanceof Error ? e.message : String(e)));
  }, []);

  // Salva com debounce de 500 ms.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, serializeDoc(doc));
      } catch {
        // storage cheio ou bloqueado: segue sem salvar
      }
    }, 500);
    return () => clearTimeout(t);
  }, [doc]);

  const model = useMemo(() => (fonts ? composeMural(doc, fonts) : null), [doc, fonts]);
  const value = useMemo(() => ({ doc, dispatch, fonts, fontError, model }), [doc, fonts, fontError, model]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMural(): MuralCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useMural fora do MuralProvider');
  return c;
}
```

- [ ] **Step 7: Build, commit, push**

```bash
npm run build
git add src/mural/store.ts src/mural/store.test.ts src/mural/photos.ts src/mural/photos.test.ts src/mural/state.tsx
git commit -m "mural: estado, persistencia local e associacao de retratos"
git push
```

Expected: build exits 0 (the new files are not imported by the app yet; `tsc -b` still type-checks them).

---

### Task 6: SVG layers and `MuralSvg`

**Files:**
- Create: `src/mural/layers/laurel.ts`, `src/mural/layers/common.tsx`, `src/mural/layers/FundoLayer.tsx`, `src/mural/layers/ModuleLayer.tsx`, `src/mural/layers/HexLayer.tsx`, `src/mural/layers/Guides.tsx`, `src/mural/MuralSvg.tsx`
- Test: `src/mural/MuralSvg.test.tsx`

(The spec lists `TurmaLayer`, `HomenagensLayer` and `FormandosLayer`; they differ only in id and fill, so one `ModuleLayer` replaces them.)

**Interfaces:**
- Consumes: `MuralModel`, `COLORS` (compose); geometry exports.
- Produces: `MuralSvg` (default export) with props `MuralSvgProps { model: MuralModel; layers?: LayerId[]; bleed?: number; viewBox?: Rect; sizing?: 'fluid' | 'mm'; guides?: boolean; highlightOverflow?: boolean }`. Layer groups have ids `layer-<LayerId>`.

- [ ] **Step 1: Write the failing test**

Create `src/mural/MuralSvg.test.tsx`:

```tsx
import { beforeAll, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MuralSvg from './MuralSvg';
import { composeMural, type MuralModel } from './compose';
import { createDefaultDoc } from './defaults';
import { loadFontsNode } from './text/fonts.node';

let model: MuralModel;
beforeAll(() => {
  model = composeMural(createDefaultDoc(), loadFontsNode());
});

const count = (s: string, sub: string) => s.split(sub).length - 1;

describe('MuralSvg', () => {
  it('renderiza as 5 camadas, sem <text>', () => {
    const html = renderToStaticMarkup(<MuralSvg model={model} />);
    for (const id of ['fundo', 'turma', 'homenagens', 'formandos', 'hexagono']) {
      expect(html).toContain(`id="layer-${id}"`);
    }
    expect(html).not.toContain('<text');
    expect(count(html, '<clipPath')).toBe(53);
    expect(html).toContain('viewBox="0 0 800 600"');
  });

  it('so a camada pedida, com tamanho em mm', () => {
    const html = renderToStaticMarkup(
      <MuralSvg model={model} layers={['hexagono']} sizing="mm" viewBox={{ x: 326, y: 20, w: 148, h: 170 }} />,
    );
    expect(html).toContain('id="layer-hexagono"');
    expect(html).not.toContain('id="layer-fundo"');
    expect(html).toContain('width="148mm"');
    expect(html).toContain('viewBox="326 20 148 170"');
  });

  it('guias desenham contornos e furos', () => {
    const html = renderToStaticMarkup(<MuralSvg model={model} guides bleed={3} />);
    expect(html).toContain('id="guides"');
    expect(count(html, 'stroke-dasharray="1.5 1.5"')).toBe(5);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/mural/MuralSvg.test.tsx`
Expected: FAIL, unresolved import `./MuralSvg`.

- [ ] **Step 3: Create `src/mural/layers/laurel.ts`**

```ts
// Louros de circuito, no espaco base 300x330 do hexagono (gerado no brainstorming).
export const LAUREL_D =
  'M132.6,268.5 L106.2,259.9 L83.1,244.3 L65.2,223.0 L53.9,197.6 L50.0,170.0 L53.9,142.4 L65.2,117.0 ' +
  'M106.2,259.9 L103.3,251.5 L95.2,247.5 M106.2,259.9 L94.0,264.1 L82.3,258.4 M83.1,244.3 L82.6,235.4 L75.9,229.4 ' +
  'M83.1,244.3 L70.2,245.0 L60.6,236.3 M65.2,223.0 L67.2,214.3 L62.4,206.7 M65.2,223.0 L52.7,220.1 L45.8,209.1 ' +
  'M53.9,197.6 L58.2,189.8 L55.7,181.1 M53.9,197.6 L42.6,191.3 L39.0,178.8 M50.0,170.0 L56.3,163.7 L56.3,154.7 ' +
  'M50.0,170.0 L40.9,160.9 L40.9,147.9 M53.9,142.4 L61.7,138.1 L64.1,129.5 M53.9,142.4 L47.6,131.2 L51.2,118.7 ' +
  'M65.2,117.0 L73.9,115.0 L78.6,107.4 M65.2,117.0 L62.3,104.5 L69.2,93.4 ' +
  'M167.4,268.5 L193.8,259.9 L216.9,244.3 L234.8,223.0 L246.1,197.6 L250.0,170.0 L246.1,142.4 L234.8,117.0 ' +
  'M193.8,259.9 L196.7,251.5 L204.8,247.5 M193.8,259.9 L206.0,264.1 L217.7,258.4 M216.9,244.3 L217.4,235.4 L224.1,229.4 ' +
  'M216.9,244.3 L229.8,245.0 L239.4,236.3 M234.8,223.0 L232.8,214.3 L237.6,206.7 M234.8,223.0 L247.3,220.1 L254.2,209.1 ' +
  'M246.1,197.6 L241.8,189.8 L244.3,181.1 M246.1,197.6 L257.4,191.3 L261.0,178.8 M250.0,170.0 L243.7,163.7 L243.7,154.7 ' +
  'M250.0,170.0 L259.1,160.9 L259.1,147.9 M246.1,142.4 L238.3,138.1 L235.9,129.5 M246.1,142.4 L252.4,131.2 L248.8,118.7 ' +
  'M234.8,117.0 L226.1,115.0 L221.4,107.4 M234.8,117.0 L237.7,104.5 L230.8,93.4';

export const LAUREL_DOTS: [number, number][] = [
  [95.2, 247.5], [82.3, 258.4], [75.9, 229.4], [60.6, 236.3], [62.4, 206.7], [45.8, 209.1], [55.7, 181.1],
  [39.0, 178.8], [56.3, 154.7], [40.9, 147.9], [64.1, 129.5], [51.2, 118.7], [78.6, 107.4], [69.2, 93.4],
  [204.8, 247.5], [217.7, 258.4], [224.1, 229.4], [239.4, 236.3], [237.6, 206.7], [254.2, 209.1], [244.3, 181.1],
  [261.0, 178.8], [243.7, 154.7], [259.1, 147.9], [235.9, 129.5], [248.8, 118.7], [221.4, 107.4], [230.8, 93.4],
];
```

- [ ] **Step 4: Create `src/mural/layers/common.tsx`**

```tsx
import type { LayerId } from '../geometry';
import { COLORS, type MuralModel } from '../compose';

export interface LayerProps { model: MuralModel; bleed: number; highlightOverflow: boolean }

export function MuralDefs() {
  return (
    <defs>
      <pattern id="mural-grid-fine" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M10 0H0V10" fill="none" stroke="#21345e" strokeWidth={0.5} />
      </pattern>
      <pattern id="mural-grid-coarse" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M50 0H0V50" fill="none" stroke="#2c4374" strokeWidth={0.8} />
      </pattern>
      <linearGradient id="mural-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={COLORS.champagne} />
        <stop offset="1" stopColor={COLORS.gold} />
      </linearGradient>
    </defs>
  );
}

export function Texts({ model, layer, highlightOverflow }: { model: MuralModel; layer: LayerId; highlightOverflow: boolean }) {
  return (
    <g>
      {model.texts
        .filter((t) => t.layer === layer)
        .map((t) => (
          <path
            key={t.key}
            d={t.d}
            transform={`translate(${t.x} ${t.y})${t.scaleX !== 1 ? ` scale(${t.scaleX} 1)` : ''}`}
            fill={highlightOverflow && t.overflow ? COLORS.overflow : t.fill}
            opacity={t.opacity === 1 ? undefined : t.opacity}
          />
        ))}
    </g>
  );
}

const clipId = (key: string) => `clip-${key.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

export function Photos({ model, layer }: { model: MuralModel; layer: LayerId }) {
  return (
    <g>
      {model.photos
        .filter((p) => p.layer === layer)
        .map((p) => {
          const id = clipId(p.key);
          const { x, y, w, h } = p.cell;
          return (
            <g key={p.key}>
              <clipPath id={id}>
                <rect x={x} y={y} width={w} height={h} />
              </clipPath>
              <rect x={x} y={y} width={w} height={h} fill={COLORS.placeholder} />
              {p.image && (
                <image
                  href={p.image.href}
                  x={p.image.rect.x}
                  y={p.image.rect.y}
                  width={p.image.rect.w}
                  height={p.image.rect.h}
                  preserveAspectRatio="none"
                  clipPath={`url(#${id})`}
                />
              )}
            </g>
          );
        })}
    </g>
  );
}
```

- [ ] **Step 5: Create the three layer components**

`src/mural/layers/FundoLayer.tsx`:

```tsx
import { PIECES, shapePath } from '../geometry';
import { COLORS } from '../compose';
import { Texts, type LayerProps } from './common';

const NODES: [number, number][] = [[285, 205], [515, 205], [400, 305]];

export default function FundoLayer({ model, bleed, highlightOverflow }: LayerProps) {
  const d = shapePath(PIECES.fundo.shape, bleed);
  return (
    <g id="layer-fundo">
      <path d={d} fill={COLORS.navy} />
      <path d={d} fill="url(#mural-grid-fine)" />
      <path d={d} fill="url(#mural-grid-coarse)" />
      <path
        d="M329.1,145.8 L285,205 M470.9,145.8 L515,205 M400,276 V305"
        fill="none" stroke={COLORS.gold} strokeWidth={1.6} opacity={0.75}
      />
      <g fill={COLORS.champagne}>
        {NODES.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4} />)}
      </g>
      <image href="./brand/ufrn-white.png" x={30} y={578} width={50} height={14} preserveAspectRatio="xMinYMid meet" />
      <image href="./brand/pix.png" x={720} y={578} width={50} height={14} preserveAspectRatio="xMaxYMid meet" />
      <Texts model={model} layer="fundo" highlightOverflow={highlightOverflow} />
    </g>
  );
}
```

`src/mural/layers/ModuleLayer.tsx`:

```tsx
import { PIECES, shapePath, type LayerId } from '../geometry';
import { COLORS } from '../compose';
import { Photos, Texts, type LayerProps } from './common';

// Turma, homenagens e formandos: vidro retangular com borda dourada.
export default function ModuleLayer({ id, fill, model, bleed, highlightOverflow }: LayerProps & { id: LayerId; fill: string }) {
  const shape = PIECES[id].shape;
  return (
    <g id={`layer-${id}`}>
      <path d={shapePath(shape, bleed)} fill={fill} />
      <path d={shapePath(shape)} fill="none" stroke={COLORS.gold} strokeWidth={1.5} />
      <Photos model={model} layer={id} />
      <Texts model={model} layer={id} highlightOverflow={highlightOverflow} />
    </g>
  );
}
```

`src/mural/layers/HexLayer.tsx`:

```tsx
import { HEX_BASE, HEX_TRANSFORM, PIECES, shapePath } from '../geometry';
import { COLORS } from '../compose';
import { Texts, type LayerProps } from './common';
import { LAUREL_D, LAUREL_DOTS } from './laurel';

export default function HexLayer({ model, bleed, highlightOverflow }: LayerProps) {
  const { tx, ty, s } = HEX_TRANSFORM;
  return (
    <g id="layer-hexagono">
      <path d={shapePath(PIECES.hexagono.shape, bleed)} fill={COLORS.hex} />
      <g transform={`translate(${tx} ${ty}) scale(${s})`}>
        <polygon
          points={HEX_BASE.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none" stroke="url(#mural-gold)" strokeWidth={5}
        />
        <path d={LAUREL_D} fill="none" stroke="url(#mural-gold)" strokeWidth={3.2} strokeLinejoin="round" strokeLinecap="round" />
        <g fill={COLORS.champagne}>
          {LAUREL_DOTS.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4.2} />)}
          {HEX_BASE.map((p) => <circle key={`v${p.x}-${p.y}`} cx={p.x} cy={p.y} r={6} />)}
        </g>
      </g>
      <Texts model={model} layer="hexagono" highlightOverflow={highlightOverflow} />
    </g>
  );
}
```

- [ ] **Step 6: Create `src/mural/layers/Guides.tsx` and `src/mural/MuralSvg.tsx`**

`src/mural/layers/Guides.tsx`:

```tsx
import { LAYER_IDS, PIECES, shapePath } from '../geometry';

// So na previa: contorno de corte (rosa), sangria (azul) e furos.
export default function Guides({ bleed }: { bleed: number }) {
  return (
    <g id="guides" fill="none" pointerEvents="none">
      {LAYER_IDS.map((id) => {
        const p = PIECES[id];
        return (
          <g key={id}>
            <path d={shapePath(p.shape)} stroke="#ff3ea5" strokeWidth={0.6} strokeDasharray="4 3" />
            {bleed > 0 && <path d={shapePath(p.shape, bleed)} stroke="#38bdf8" strokeWidth={0.4} strokeDasharray="1.5 1.5" />}
            {p.holes.map((h) => <circle key={`${h.x}-${h.y}`} cx={h.x} cy={h.y} r={4} stroke="#cfd4dc" strokeWidth={0.8} />)}
          </g>
        );
      })}
    </g>
  );
}
```

`src/mural/MuralSvg.tsx`:

```tsx
import { LAYER_IDS, MURAL_H, MURAL_W, type LayerId, type Rect } from './geometry';
import { COLORS, type MuralModel } from './compose';
import { MuralDefs } from './layers/common';
import FundoLayer from './layers/FundoLayer';
import ModuleLayer from './layers/ModuleLayer';
import HexLayer from './layers/HexLayer';
import Guides from './layers/Guides';

export interface MuralSvgProps {
  model: MuralModel;
  layers?: LayerId[];
  bleed?: number;
  viewBox?: Rect;
  sizing?: 'fluid' | 'mm';
  guides?: boolean;
  highlightOverflow?: boolean;
}

export default function MuralSvg({
  model, layers = LAYER_IDS, bleed = 0, viewBox, sizing = 'fluid', guides = false, highlightOverflow = false,
}: MuralSvgProps) {
  const vb = viewBox ?? { x: 0, y: 0, w: MURAL_W, h: MURAL_H };
  const size = sizing === 'mm' ? { width: `${vb.w}mm`, height: `${vb.h}mm` } : { width: '100%' };
  const p = { model, bleed, highlightOverflow };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} {...size}>
      <MuralDefs />
      {layers.includes('fundo') && <FundoLayer {...p} />}
      {layers.includes('turma') && <ModuleLayer id="turma" fill={COLORS.navy2} {...p} />}
      {layers.includes('homenagens') && <ModuleLayer id="homenagens" fill={COLORS.navy2} {...p} />}
      {layers.includes('formandos') && <ModuleLayer id="formandos" fill={COLORS.navy3} {...p} />}
      {layers.includes('hexagono') && <HexLayer {...p} />}
      {guides && <Guides bleed={bleed} />}
    </svg>
  );
}
```

- [ ] **Step 7: Run the test**

Run: `npm test -- src/mural/MuralSvg.test.tsx`
Expected: PASS.

- [ ] **Step 8: Build, commit, push**

```bash
npm run build
git add src/mural/layers src/mural/MuralSvg.tsx src/mural/MuralSvg.test.tsx
git commit -m "mural: camadas SVG e MuralSvg"
git push
```

---

### Task 7: Mode switch, editor shell, preview, Textos and Homenagens tabs

**Files:**
- Modify: `src/App.tsx`, `src/index.css:60-65` (`.app` height) and append shell styles
- Create: `src/mural/download.ts`, `src/mural/mural.css`, `src/mural/editor/MuralEditor.tsx`, `src/mural/editor/MuralPreview.tsx`, `src/mural/editor/TextosTab.tsx`, `src/mural/editor/HomenagensTab.tsx`, and placeholder-free stubs for the other three tabs (filled in Tasks 8 and 9): `FormandosTab.tsx`, `TipografiaTab.tsx`, `ExportTab.tsx`

**Interfaces:**
- Consumes: `useMural`, `MuralProvider`, `MuralSvg`, `serializeDoc`, `loadDoc`, `SNIPPET_ORDER`, `SNIPPET_LABELS`.
- Produces: `MuralEditor` (default export), `downloadBlob(blob, name)`; tab components (default exports) with no props.

- [ ] **Step 1: `src/mural/download.ts`**

```ts
export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

- [ ] **Step 2: Mode switch in `src/App.tsx`**

Replace the file with:

```tsx
import { useState } from 'react';
import { AppProvider } from './state';
import Toolbar from './components/Toolbar';
import GradList from './components/GradList';
import Preview from './components/Preview';
import MuralEditor from './mural/editor/MuralEditor';

type Mode = 'pecas' | 'mural';

// Dois modos: convite/display (tela original, intacta) e mural de vidro.
export default function App() {
  const [mode, setMode] = useState<Mode>('pecas');
  return (
    <div className="app-shell">
      <nav className="app-modes">
        <button className={mode === 'pecas' ? 'is-active' : ''} onClick={() => setMode('pecas')}>Convite / Display</button>
        <button className={mode === 'mural' ? 'is-active' : ''} onClick={() => setMode('mural')}>Mural</button>
      </nav>
      <div className="app-shell__body">
        {mode === 'pecas' ? (
          <AppProvider>
            <div className="app">
              <Toolbar />
              <div className="workspace">
                <GradList />
                <Preview />
              </div>
            </div>
          </AppProvider>
        ) : (
          <MuralEditor />
        )}
      </div>
    </div>
  );
}
```

Note: switching modes unmounts the convite state (photos dropped there are lost), same as a refresh today. That is accepted.

- [ ] **Step 3: Shell CSS in `src/index.css`**

In the `.app` rule (around line 60), change `height: 100vh;` to `height: 100%;`. Then append at the end of the file:

```css
/* ---- modos (convite/display | mural) ---- */
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-modes {
  flex: 0 0 auto;
  display: flex;
  gap: 4px;
  padding: 6px 12px;
  background: var(--navy-950);
  border-bottom: 1px solid var(--line);
}

.app-modes button {
  background: transparent;
  border: 1px solid transparent;
  color: var(--ink-dim);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.app-modes button.is-active {
  color: var(--ink);
  border-color: var(--line-strong);
  background: var(--navy-800);
}

.app-shell__body {
  flex: 1;
  min-height: 0;
}
```

- [ ] **Step 4: `src/mural/mural.css`**

```css
/* Editor do mural. Reusa as variaveis e .btn de index.css. */
.mural {
  display: grid;
  grid-template-columns: 400px 1fr;
  height: 100%;
  min-height: 0;
}

.mural__side {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--line);
  background: var(--navy-900);
}

.mural__project { display: flex; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--line); }
.mural__project label { display: inline-flex; align-items: center; }

.mural__tabs { display: flex; flex-wrap: wrap; gap: 2px; padding: 8px 8px 0; border-bottom: 1px solid var(--line); }
.mural__tab {
  background: transparent; border: none; color: var(--ink-dim); padding: 8px 10px;
  font-size: 13px; cursor: pointer; border-bottom: 2px solid transparent;
}
.mural__tab.is-active { color: var(--gold-champagne); border-bottom-color: var(--gold); }
.mural__badge {
  margin-left: 6px; background: #b42318; color: #fff; border-radius: 999px;
  padding: 0 6px; font-size: 11px;
}

.mural__panel { flex: 1; overflow-y: auto; padding: 14px 12px 40px; }
.mural__main { min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.mural__loading, .mural__error { padding: 24px; color: var(--ink-dim); }
.mural__error { color: #ff8a80; }
.mural__warn { color: #ffb4a8; font-size: 12px; }

.mural-preview { display: flex; flex-direction: column; height: 100%; min-height: 0; }
.mural-preview__bar {
  display: flex; gap: 16px; align-items: center; padding: 8px 14px;
  border-bottom: 1px solid var(--line); font-size: 12px; color: var(--ink-dim);
}
.mural-preview__scroll { flex: 1; overflow: auto; padding: 24px; background: #1a1d24; }
.mural-preview__scroll > div { min-width: 600px; }

.mural-stack { display: flex; flex-direction: column; gap: 10px; }
.mural-row { display: flex; gap: 8px; flex-wrap: wrap; }
.mural-h { font-family: var(--mono); font-size: 12px; color: var(--gold-champagne); margin-top: 10px; font-weight: 500; }
.mural-hint { font-size: 12px; color: var(--ink-dim); line-height: 1.5; }
.mural-field { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--ink-dim); }
.mural-field input, .mural-stack input[type='text'], .mural-stack textarea, .mural-stack select, .mural-type input, .mural-type select {
  background: var(--navy-850); border: 1px solid var(--line-strong); color: var(--ink);
  border-radius: 6px; padding: 6px 8px; font: inherit; font-size: 13px; min-width: 0;
}
.mural-stack textarea { resize: vertical; font-family: var(--sans); line-height: 1.5; }
.mural-check { display: inline-flex; gap: 6px; align-items: center; font-size: 12px; color: var(--ink); }
.mural-snippet { display: flex; flex-direction: column; gap: 4px; }
.mural-snippet input { font-family: var(--mono); font-size: 12px; }

.mural-pair { display: grid; grid-template-columns: 1fr 1.6fr auto auto auto; gap: 4px; }
.mural-pair button { padding: 4px 8px; }
.mural-overflows { border: 1px solid #b42318; border-radius: 8px; padding: 8px 10px; font-size: 12px; color: #ffb4a8; }
.mural-overflows ul { margin: 4px 0 0 16px; }

.mural-drop {
  border: 1px dashed var(--line-strong); border-radius: 8px; padding: 14px;
  font-size: 12px; color: var(--ink-dim); text-align: center;
}
.mural-link { color: var(--gold-champagne); cursor: pointer; text-decoration: underline; }
.mural-orphan { display: grid; grid-template-columns: 40px 1fr 1fr; gap: 6px; align-items: center; font-size: 12px; }
.mural-orphan img { width: 40px; height: 48px; object-fit: cover; border-radius: 4px; }

.mural-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
.mural-item { border: 1px solid var(--line); border-radius: 8px; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.mural-item.has-overflow { border-color: #b42318; }
.mural-item__head { display: grid; grid-template-columns: 22px 32px 1fr auto; gap: 6px; align-items: center; }
.mural-item__idx { font-size: 11px; color: var(--gold-champagne); }
.mural-item__lines { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding-left: 60px; }
.mural-thumb { width: 32px; height: 38px; object-fit: cover; border-radius: 4px; display: block; }
.mural-thumb--empty { background: var(--navy-700); }

.mural-type {
  border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px; color: var(--ink-dim);
}
.mural-type legend { color: var(--ink); padding: 0 4px; font-size: 13px; }
.mural-type label { display: flex; gap: 6px; align-items: center; }
.mural-type input[type='number'] { width: 72px; }
.mural-cap { font-family: var(--mono); font-size: 11px; }
.mural-cap.is-low { color: #ffb4a8; }

.mural-progress { height: 6px; border-radius: 3px; background: var(--navy-700); overflow: hidden; }
.mural-progress > div { height: 100%; background: var(--gold); transition: width 0.2s; }
.mural-files { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; }
```

- [ ] **Step 5: `src/mural/editor/MuralPreview.tsx`**

```tsx
import { useState } from 'react';
import MuralSvg from '../MuralSvg';
import type { MuralModel } from '../compose';
import { useMural } from '../state';

const ZOOMS = [1, 1.5, 2, 3];

export default function MuralPreview({ model }: { model: MuralModel }) {
  const { doc } = useMural();
  const [zoom, setZoom] = useState(1);
  const [guides, setGuides] = useState(true);
  return (
    <div className="mural-preview">
      <div className="mural-preview__bar">
        <label>
          Zoom{' '}
          <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))}>
            {ZOOMS.map((z) => <option key={z} value={z}>{z * 100}%</option>)}
          </select>
        </label>
        <label className="mural-check">
          <input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} />
          contornos, sangria e furos
        </label>
        {model.overflows.length > 0 && (
          <span className="mural__warn">{model.overflows.length} texto(s) não cabem (em vermelho)</span>
        )}
      </div>
      <div className="mural-preview__scroll">
        <div style={{ width: `${zoom * 100}%` }}>
          <MuralSvg model={model} bleed={guides ? doc.export.bleedMm : 0} guides={guides} highlightOverflow />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: `src/mural/editor/TextosTab.tsx`**

```tsx
import { useMural } from '../state';
import { SNIPPET_LABELS, SNIPPET_ORDER } from '../defaults';

type Field = 'titulo' | 'subtitulo' | 'turma';
const FIELDS: [Field, string][] = [
  ['titulo', 'Título'],
  ['subtitulo', 'Subtítulo (antes de "· TURMA")'],
  ['turma', 'Nome da turma'],
];

export default function TextosTab() {
  const { doc, dispatch } = useMural();
  return (
    <div className="mural-stack">
      {FIELDS.map(([f, label]) => (
        <label key={f} className="mural-field">
          <span>{label}</span>
          <input type="text" value={doc[f]} onChange={(e) => dispatch({ type: 'SET_TEXT', field: f, value: e.target.value })} />
        </label>
      ))}
      <h3 className="mural-h">// snippets</h3>
      {SNIPPET_ORDER.map((id) => {
        const s = doc.snippets[id];
        return (
          <div key={id} className="mural-snippet">
            <label className="mural-check">
              <input
                type="checkbox"
                checked={s.on}
                onChange={(e) => dispatch({ type: 'SET_SNIPPET', id, patch: { on: e.target.checked } })}
              />
              {SNIPPET_LABELS[id]}
            </label>
            {id !== 'indices' && (
              <input
                type="text"
                value={s.text}
                disabled={!s.on}
                onChange={(e) => dispatch({ type: 'SET_SNIPPET', id, patch: { text: e.target.value } })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 7: `src/mural/editor/HomenagensTab.tsx`**

```tsx
import { useMural } from '../state';
import type { CargoNome } from '../types';

function move<T>(list: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function PairList({ title, value, onChange }: { title: string; value: CargoNome[]; onChange: (v: CargoNome[]) => void }) {
  const set = (i: number, patch: Partial<CargoNome>) => onChange(value.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  return (
    <div className="mural-stack">
      <h3 className="mural-h">// {title}</h3>
      {value.map((it, i) => (
        <div key={i} className="mural-pair">
          <input type="text" value={it.cargo} placeholder="cargo" onChange={(e) => set(i, { cargo: e.target.value })} />
          <input type="text" value={it.nome} placeholder="nome" onChange={(e) => set(i, { nome: e.target.value })} />
          <button className="btn btn--ghost" onClick={() => onChange(move(value, i, -1))} title="Subir">↑</button>
          <button className="btn btn--ghost" onClick={() => onChange(move(value, i, 1))} title="Descer">↓</button>
          <button className="btn btn--ghost" onClick={() => onChange(value.filter((_, j) => j !== i))} title="Remover">×</button>
        </div>
      ))}
      <button className="btn btn--ghost" onClick={() => onChange([...value, { cargo: '', nome: '' }])}>+ adicionar</button>
    </div>
  );
}

function LinesList({ title, value, onChange }: { title: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <label className="mural-field">
      <span className="mural-h">// {title} (um por linha)</span>
      <textarea rows={Math.max(4, value.length + 1)} value={value.join('\n')} onChange={(e) => onChange(e.target.value.split('\n'))} />
    </label>
  );
}

export default function HomenagensTab() {
  const { doc, dispatch, model } = useMural();
  const overflows = (model?.overflows ?? []).filter((o) => o.key.startsWith('hom'));
  return (
    <div className="mural-stack">
      {overflows.length > 0 && (
        <div className="mural-overflows">
          Não cabem:
          <ul>{overflows.map((o) => <li key={o.key}>{o.label}</li>)}</ul>
        </div>
      )}
      <PairList title="corpo administrativo" value={doc.administracao} onChange={(v) => dispatch({ type: 'SET_PAIRS', list: 'administracao', value: v })} />
      <PairList title="homenageados da turma" value={doc.homenageados} onChange={(v) => dispatch({ type: 'SET_PAIRS', list: 'homenageados', value: v })} />
      <LinesList title="professores homenageados" value={doc.professores} onChange={(v) => dispatch({ type: 'SET_NAMES', list: 'professores', value: v })} />
      <LinesList title="comissão de formatura" value={doc.comissao} onChange={(v) => dispatch({ type: 'SET_NAMES', list: 'comissao', value: v })} />
    </div>
  );
}
```

- [ ] **Step 8: Temporary tab stubs (replaced in Tasks 8 and 9)**

`src/mural/editor/FormandosTab.tsx`, `src/mural/editor/TipografiaTab.tsx`, `src/mural/editor/ExportTab.tsx`, each:

```tsx
export default function FormandosTab() {
  return <p className="mural-hint">Em construção.</p>;
}
```

(use the matching component name in each file: `FormandosTab`, `TipografiaTab`, `ExportTab`).

- [ ] **Step 9: `src/mural/editor/MuralEditor.tsx`**

```tsx
import { useState, type ChangeEvent, type Dispatch } from 'react';
import { MuralProvider, useMural } from '../state';
import { loadDoc, serializeDoc, type MuralAction } from '../store';
import type { MuralDoc } from '../types';
import { downloadBlob } from '../download';
import MuralPreview from './MuralPreview';
import TextosTab from './TextosTab';
import HomenagensTab from './HomenagensTab';
import FormandosTab from './FormandosTab';
import TipografiaTab from './TipografiaTab';
import ExportTab from './ExportTab';
import '../mural.css';

type Tab = 'textos' | 'homenagens' | 'formandos' | 'tipografia' | 'exportar';
const TABS: [Tab, string][] = [
  ['textos', 'Textos'],
  ['homenagens', 'Homenagens'],
  ['formandos', 'Formandos'],
  ['tipografia', 'Tipografia'],
  ['exportar', 'Exportar'],
];

function saveProject(doc: MuralDoc) {
  downloadBlob(new Blob([serializeDoc(doc)], { type: 'application/json' }), 'mural-ti-2026.json');
}

async function openProject(e: ChangeEvent<HTMLInputElement>, dispatch: Dispatch<MuralAction>) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  const text = await file.text();
  try {
    const parsed = JSON.parse(text) as { version?: number };
    if (parsed.version !== 1) throw new Error('versão');
  } catch {
    alert('Arquivo de projeto inválido.');
    return;
  }
  dispatch({ type: 'LOAD', doc: loadDoc(text) });
}

function EditorBody() {
  const { doc, dispatch, model, fontError } = useMural();
  const [tab, setTab] = useState<Tab>('textos');
  const overflowCount = model?.overflows.length ?? 0;
  return (
    <div className="mural">
      <aside className="mural__side">
        <div className="mural__project">
          <button className="btn btn--ghost" onClick={() => saveProject(doc)}>Salvar projeto</button>
          <label className="btn btn--ghost">
            Abrir projeto
            <input type="file" accept="application/json,.json" hidden onChange={(e) => openProject(e, dispatch)} />
          </label>
        </div>
        <nav className="mural__tabs">
          {TABS.map(([id, label]) => (
            <button key={id} className={`mural__tab${tab === id ? ' is-active' : ''}`} onClick={() => setTab(id)}>
              {label}
              {id === 'exportar' && overflowCount > 0 && <span className="mural__badge">{overflowCount}</span>}
            </button>
          ))}
        </nav>
        <div className="mural__panel">
          {tab === 'textos' && <TextosTab />}
          {tab === 'homenagens' && <HomenagensTab />}
          {tab === 'formandos' && <FormandosTab />}
          {tab === 'tipografia' && <TipografiaTab />}
          {tab === 'exportar' && <ExportTab />}
        </div>
      </aside>
      <main className="mural__main">
        {fontError ? (
          <p className="mural__error">Erro ao carregar as fontes: {fontError}</p>
        ) : model ? (
          <MuralPreview model={model} />
        ) : (
          <p className="mural__loading">carregando fontes…</p>
        )}
      </main>
    </div>
  );
}

export default function MuralEditor() {
  return (
    <MuralProvider>
      <EditorBody />
    </MuralProvider>
  );
}
```

- [ ] **Step 10: Verify**

Run: `npm test && npm run build`
Expected: all tests PASS, build exits 0. Then run `npm run dev` and, if a server starts, open the printed URL, click **Mural**, and confirm the preview shows the mural and that editing the title updates it. If the sandbox blocks the dev server (`EPERM`), skip the manual check and say so in the report.

- [ ] **Step 11: Commit and push**

```bash
git add src/App.tsx src/index.css src/mural/download.ts src/mural/mural.css src/mural/editor
git commit -m "mural: modo Mural no app, previa, abas Textos e Homenagens"
git push
```

---

### Task 8: Formandos and Tipografia tabs (with shared photo control)

**Files:**
- Create: `src/components/PhotoAdjustControl.tsx`
- Modify: `src/components/PhotoAdjust.tsx` (becomes a thin wrapper, same behaviour)
- Replace: `src/mural/editor/FormandosTab.tsx`, `src/mural/editor/TipografiaTab.tsx`

**Interfaces:**
- Consumes: `useMural`, `readImage`, `matchPortraits`, `pad2`, `ITALIC_FONTS`, `SLOT_ORDER`, `SLOT_LABELS`, types `Photo`, `FontId`, `SlotStyle`.
- Produces: `PhotoAdjustControl` (default export) with props `{ value: { scale: number; x: number; y: number }; onChange: (t: { scale: number; x: number; y: number }) => void; maxOffset?: number; step?: number }`.

- [ ] **Step 1: Create `src/components/PhotoAdjustControl.tsx`**

Move the body of the current `PhotoAdjust` here, parameterised:

```tsx
// PhotoAdjustControl — controle de enquadramento: zoom (1..3), posicao x/y
// (pad arrastavel + setas) e reset. Apresentacional: valor e onChange vem de fora.
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

export interface Transform { scale: number; x: number; y: number }

const DEFAULT: Transform = { scale: 1, x: 0, y: 0 };

interface Props {
  value: Transform;
  onChange: (t: Transform) => void;
  maxOffset?: number; // limite de |x| e |y|
  step?: number; // passo das setas
}

export default function PhotoAdjustControl({ value, onChange, maxOffset = 500, step = 12 }: Props) {
  const padRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [live, setLive] = useState(false);
  const { scale, x, y } = value;

  const patch = (p: Partial<Transform>) => onChange({ ...value, ...p });
  const clamp = (v: number) => Math.max(-maxOffset, Math.min(maxOffset, v));

  const fromPointer = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (clientX - r.left) / r.width - 0.5;
    const ny = (clientY - r.top) / r.height - 0.5;
    patch({ x: clamp(Math.round(nx * 2 * maxOffset)), y: clamp(Math.round(ny * 2 * maxOffset)) });
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    setLive(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    fromPointer(e.clientX, e.clientY);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    fromPointer(e.clientX, e.clientY);
  };
  const onPointerUp = () => {
    dragging.current = false;
    setLive(false);
  };

  const nudge = (dx: number, dy: number) => patch({ x: clamp(x + dx), y: clamp(y + dy) });

  const knobLeft = ((x / maxOffset) * 0.5 + 0.5) * 100;
  const knobTop = ((y / maxOffset) * 0.5 + 0.5) * 100;
  const isDefault = scale === DEFAULT.scale && x === DEFAULT.x && y === DEFAULT.y;

  return (
    <div className="adjust">
      <div className="adjust__head">
        <span className="adjust__title mono">
          <span className="adjust__kw">//</span> enquadramento
        </span>
        <button
          className="btn btn--ghost adjust__reset"
          onClick={() => onChange({ ...DEFAULT })}
          disabled={isDefault}
          title="Voltar ao enquadramento padrão"
        >
          resetar
        </button>
      </div>

      <div className="adjust__body">
        <div className="adjust__field">
          <label className="adjust__label">
            Zoom <span className="adjust__val mono">{scale.toFixed(2)}×</span>
          </label>
          <input
            className="adjust__slider"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={scale}
            onChange={(e) => patch({ scale: parseFloat(e.target.value) })}
          />
        </div>

        <div className="adjust__field">
          <label className="adjust__label">
            Posição{' '}
            <span className="adjust__val mono">
              x{x} y{y}
            </span>
          </label>
          <div className="adjust__pos">
            <div
              ref={padRef}
              className={`adjust__pad${live ? ' is-live' : ''}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              title="Arraste para reposicionar a foto"
            >
              <span className="adjust__cross-h" />
              <span className="adjust__cross-v" />
              <span className="adjust__knob" style={{ left: `${knobLeft}%`, top: `${knobTop}%` }} />
            </div>
            <div className="adjust__arrows">
              <button className="btn adjust__arrow adjust__arrow--up" onClick={() => nudge(0, -step)} title="Cima">↑</button>
              <button className="btn adjust__arrow adjust__arrow--left" onClick={() => nudge(-step, 0)} title="Esquerda">←</button>
              <button className="btn adjust__arrow adjust__arrow--center" onClick={() => patch({ x: 0, y: 0 })} title="Centralizar">•</button>
              <button className="btn adjust__arrow adjust__arrow--right" onClick={() => nudge(step, 0)} title="Direita">→</button>
              <button className="btn adjust__arrow adjust__arrow--down" onClick={() => nudge(0, step)} title="Baixo">↓</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/components/PhotoAdjust.tsx` with the wrapper**

```tsx
// PhotoAdjust — enquadramento da foto do formando atual (convite/display).
// O controle em si fica em PhotoAdjustControl (reusado pelo mural).
import { useApp } from '../state';
import PhotoAdjustControl from './PhotoAdjustControl';

export default function PhotoAdjust() {
  const { current, updateTransform } = useApp();
  if (!current) return null;
  return <PhotoAdjustControl value={current.transform} onChange={(t) => updateTransform(current.id, t)} />;
}
```

Run: `npm run build` — Expected: exits 0. (`PhotoTransform` in `src/types.ts` has the same `{ scale, x, y }` shape.)

- [ ] **Step 3: Replace `src/mural/editor/FormandosTab.tsx`**

```tsx
import { useState, type DragEvent } from 'react';
import { useMural } from '../state';
import { matchPortraits, readImage } from '../photos';
import { pad2 } from '../compose';
import type { Photo } from '../types';
import PhotoAdjustControl from '../../components/PhotoAdjustControl';

function FotoTurma() {
  const { doc, dispatch } = useMural();
  const ft = doc.fotoTurma;
  return (
    <div className="mural-stack">
      <label className="btn btn--ghost">
        {ft.photo ? `Trocar foto da turma (${ft.photo.fileName})` : 'Escolher foto da turma'}
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) dispatch({ type: 'SET_FOTO_TURMA', photo: await readImage(f), transform: { scale: 1, x: 0, y: 0 } });
          }}
        />
      </label>
      {ft.photo && (
        <PhotoAdjustControl value={ft.transform} onChange={(t) => dispatch({ type: 'SET_FOTO_TURMA', transform: t })} maxOffset={100} step={2} />
      )}
    </div>
  );
}

export default function FormandosTab() {
  const { doc, dispatch, model } = useMural();
  const [open, setOpen] = useState<string | null>(null);
  const [orphans, setOrphans] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);

  const overflowIds = new Set(
    (model?.overflows ?? []).filter((o) => o.key.startsWith('legenda:')).map((o) => o.key.split(':')[1]),
  );

  const onFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    setBusy(true);
    try {
      const photos = await Promise.all(list.map(readImage));
      const { matches, unmatched } = matchPortraits(doc.formandos, list.map((f) => f.name));
      dispatch({ type: 'ASSIGN_PHOTOS', photos: matches.map((m) => ({ formandoId: m.formandoId, photo: photos[m.fileIndex] })) });
      setOrphans((prev) => [...prev, ...unmatched.map((i) => photos[i])]);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onFiles(e.dataTransfer.files);
  };

  return (
    <div className="mural-stack">
      <div className="mural-drop" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
        {busy ? 'lendo retratos…' : 'Solte aqui os retratos (associados pelo nome do arquivo) ou '}
        {!busy && (
          <label className="mural-link">
            escolha arquivos
            <input type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) onFiles(e.target.files); e.target.value = ''; }} />
          </label>
        )}
      </div>

      {orphans.length > 0 && (
        <div className="mural-stack">
          <h3 className="mural-h">// retratos sem formando ({orphans.length})</h3>
          {orphans.map((p) => (
            <div key={p.url} className="mural-orphan">
              <img src={p.url} alt="" />
              <span>{p.fileName}</span>
              <select
                value=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  dispatch({ type: 'ASSIGN_PHOTOS', photos: [{ formandoId: e.target.value, photo: p }] });
                  setOrphans((o) => o.filter((x) => x.url !== p.url));
                }}
              >
                <option value="">atribuir a…</option>
                {doc.formandos.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="mural-row">
        <button className="btn btn--ghost" onClick={() => dispatch({ type: 'SORT_FORMANDOS' })}>Ordenar A–Z</button>
        <button className="btn btn--ghost" onClick={() => dispatch({ type: 'RESPLIT' })}>Recalcular quebras</button>
      </div>

      <h3 className="mural-h">// foto da turma</h3>
      <FotoTurma />

      <h3 className="mural-h">// formandos ({doc.formandos.length})</h3>
      <ol className="mural-list">
        {doc.formandos.map((f, i) => (
          <li key={f.id} className={`mural-item${overflowIds.has(f.id) ? ' has-overflow' : ''}`}>
            <div className="mural-item__head">
              <span className="mono mural-item__idx">{pad2(i)}</span>
              {f.photo ? <img className="mural-thumb" src={f.photo.url} alt="" /> : <span className="mural-thumb mural-thumb--empty" />}
              <input type="text" value={f.nome} onChange={(e) => dispatch({ type: 'SET_FORMANDO', id: f.id, patch: { nome: e.target.value } })} />
              <button className="btn btn--ghost" disabled={!f.photo} onClick={() => setOpen(open === f.id ? null : f.id)}>
                enquadrar
              </button>
            </div>
            <div className="mural-item__lines">
              <input
                type="text"
                value={f.linhas[0]}
                onChange={(e) => dispatch({ type: 'SET_FORMANDO', id: f.id, patch: { linhas: [e.target.value, f.linhas[1]] } })}
              />
              <input
                type="text"
                value={f.linhas[1]}
                onChange={(e) => dispatch({ type: 'SET_FORMANDO', id: f.id, patch: { linhas: [f.linhas[0], e.target.value] } })}
              />
            </div>
            {open === f.id && f.photo && (
              <PhotoAdjustControl
                value={f.transform}
                onChange={(t) => dispatch({ type: 'SET_FORMANDO', id: f.id, patch: { transform: t } })}
                maxOffset={100}
                step={2}
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
```

(The spec mentions dragging orphan portraits onto a student; a per-portrait "atribuir a…" select does the same job with less code.)

- [ ] **Step 4: Replace `src/mural/editor/TipografiaTab.tsx`**

```tsx
import { useMural } from '../state';
import { SLOT_LABELS, SLOT_ORDER } from '../defaults';
import { ITALIC_FONTS } from '../text/fonts';
import type { FontId, SlotStyle } from '../types';

const FONTS: [FontId, string][] = [
  ['fraunces', 'Fraunces'],
  ['space-grotesk', 'Space Grotesk'],
  ['sora', 'Sora'],
  ['jetbrains-mono', 'JetBrains Mono'],
];
const CAP = 0.7; // altura aproximada da caixa alta em relacao ao corpo
const MIN_CAP_MM = 2.5;

export default function TipografiaTab() {
  const { doc, dispatch } = useMural();
  return (
    <div className="mural-stack">
      <p className="mural-hint">
        Tamanho = corpo da fonte em mm. A caixa alta tem ≈ 70% do corpo; abaixo de {MIN_CAP_MM} mm de caixa alta
        (corpo ≈ 3,6 mm) a leitura fica difícil a mais de um passo de distância.
      </p>
      <button className="btn btn--ghost" onClick={() => dispatch({ type: 'RESET_STYLE' })}>Resetar tudo</button>
      {SLOT_ORDER.map((slot) => {
        const s = doc.estilos[slot];
        const set = (patch: Partial<SlotStyle>) => dispatch({ type: 'SET_STYLE', slot, patch });
        const cap = s.sizeMm * CAP;
        return (
          <fieldset key={slot} className="mural-type">
            <legend>{SLOT_LABELS[slot]}</legend>
            <select
              value={s.font}
              onChange={(e) => {
                const font = e.target.value as FontId;
                set({ font, italic: ITALIC_FONTS.includes(font) ? s.italic : false });
              }}
            >
              {FONTS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <select value={s.weight} onChange={(e) => set({ weight: Number(e.target.value) as 400 | 600 })}>
              <option value={400}>Regular</option>
              <option value={600}>Semibold</option>
            </select>
            <label>
              mm
              <input type="number" step={0.1} min={1} max={80} value={s.sizeMm}
                onChange={(e) => set({ sizeMm: Number(e.target.value) || s.sizeMm })} />
            </label>
            <label>
              tracking
              <input type="number" step={0.01} min={-0.1} max={0.5} value={s.tracking}
                onChange={(e) => set({ tracking: Number(e.target.value) || 0 })} />
            </label>
            <label className="mural-check">
              <input type="checkbox" checked={s.italic} disabled={!ITALIC_FONTS.includes(s.font)}
                onChange={(e) => set({ italic: e.target.checked })} />
              itálico
            </label>
            <span className={`mural-cap${cap < MIN_CAP_MM ? ' is-low' : ''}`}>caixa alta ≈ {cap.toFixed(1)} mm</span>
            <button className="btn btn--ghost" onClick={() => dispatch({ type: 'RESET_STYLE', slot })}>resetar</button>
          </fieldset>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npm test && npm run build`
Expected: PASS and exit 0. Manual check (if the dev server can start): in **Convite / Display**, photo adjust still works exactly as before; in **Mural → Formandos**, dropping a file named like a student assigns it, and **Tipografia** size changes update the preview.

- [ ] **Step 6: Commit and push**

```bash
git add src/components/PhotoAdjustControl.tsx src/components/PhotoAdjust.tsx src/mural/editor/FormandosTab.tsx src/mural/editor/TipografiaTab.tsx
git commit -m "mural: abas Formandos e Tipografia; PhotoAdjustControl compartilhado"
git push
```

---

### Task 9: Export (per glass piece) and the Exportar tab

**Files:**
- Create: `src/mural/export/plan.ts`, `src/mural/export/render.ts`, `src/mural/export/bundle.ts`
- Replace: `src/mural/editor/ExportTab.tsx`
- Test: `src/mural/export/plan.test.ts`

**Interfaces:**
- Consumes: geometry exports, `ExportFileId`, `ExportOptions`, `MuralDoc`, `MuralModel`, `MuralSvg`, `downloadBlob`.
- Produces:
  - plan: `Format`, `PlannedFile { file: ExportFileId; format: Format; path: string }`, `FILE_ORDER`, `FILE_LABELS`, `fileBase(file)`, `planFiles(o): PlannedFile[]`, `fileViewBox(file, bleed): Rect`, `fileLayers(file): LayerId[]`, `zipName(date): string`, `buildMontagem(bleed, holeMm): string`, `buildCutSvg(holeMm): string`.
  - render: `renderSvgString(model, file, bleed): string`, `parseSvg(text): SVGSVGElement`, `inlineImages(svg, dpi, cache): Promise<void>`, `svgToPdf(svg, wMm, hMm): Promise<Blob>`, `svgToPng(text, wMm, hMm, dpi): Promise<Blob>`, `SAFARI_MAX_PX`, `isSafari(ua?)`.
  - bundle: `Progress { done: number; total: number; current: string }`, `exportMural(doc, model, onProgress): Promise<{ blob: Blob; errors: string[] }>`.

- [ ] **Step 1: Write the failing tests**

Create `src/mural/export/plan.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_EXPORT } from '../defaults';
import { buildCutSvg, buildMontagem, fileLayers, fileViewBox, planFiles, zipName } from './plan';

const opts = () => structuredClone(DEFAULT_EXPORT);

describe('planFiles', () => {
  it('padrao: 6 arquivos x 3 formatos + corte em pdf e svg', () => {
    const p = planFiles(opts());
    expect(p).toHaveLength(20);
    expect(p.map((f) => f.path)).toEqual(expect.arrayContaining([
      'pdf/00-composicao.pdf', 'svg/01-fundo.svg', 'png/02-turma.png', 'pdf/05-hexagono.pdf', 'corte.pdf', 'corte.svg',
    ]));
    expect(p.some((f) => f.path === 'corte.png')).toBe(false);
  });

  it('respeita pecas e formatos desmarcados', () => {
    const o = opts();
    o.formats = { pdf: false, svg: true, png: false };
    o.files.corte = false;
    o.files.composicao = false;
    expect(planFiles(o).map((f) => f.path)).toEqual([
      'svg/01-fundo.svg', 'svg/02-turma.svg', 'svg/03-homenagens.svg', 'svg/04-formandos.svg', 'svg/05-hexagono.svg',
    ]);
  });
});

describe('view boxes e camadas', () => {
  it('composicao ocupa o mural inteiro sem sangria', () => {
    expect(fileViewBox('composicao', 3)).toEqual({ x: 0, y: 0, w: 800, h: 600 });
    expect(fileLayers('composicao')).toHaveLength(5);
  });
  it('peca usa o proprio bbox com sangria', () => {
    expect(fileViewBox('turma', 3)).toEqual({ x: 22, y: 87, w: 266, h: 196 });
    expect(fileLayers('turma')).toEqual(['turma']);
  });
});

describe('textos de producao', () => {
  it('montagem lista tamanho, posicao e furos', () => {
    const t = buildMontagem(3, 8);
    expect(t).toContain('01 Fundo');
    expect(t).toContain('tamanho (sem sangria): 800.0 × 540.0');
    expect(t).toContain('posição (canto sup. esq.): x 25.0, y 305.0');
    expect(t).toContain('(20.0, 80.0)');
    expect(t).toContain('Ø 8.0 mm');
    expect(t).toContain('Sangria nos arquivos: 3.0 mm');
  });
  it('arquivo de corte tem 5 contornos e 6 furos', () => {
    const svg = buildCutSvg(8);
    expect(svg.split('<path').length - 1).toBe(5);
    expect(svg.split('<circle').length - 1).toBe(6);
    expect(svg).toContain('r="4"');
    expect(svg).toContain('id="CutContour"');
  });
  it('nome do zip usa a data local', () => {
    expect(zipName(new Date(2026, 9, 9, 23, 30))).toBe('mural-ti-2026_2026-10-09.zip');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- src/mural/export/plan.test.ts`
Expected: FAIL, unresolved import `./plan`.

- [ ] **Step 3: Implement `src/mural/export/plan.ts`**

```ts
// Planejamento do export (puro): lista de arquivos, area de cada um e textos de producao.
import { LAYER_IDS, MURAL_H, MURAL_W, PIECES, shapeBBox, shapePath, type LayerId, type Rect } from '../geometry';
import type { ExportFileId, ExportOptions } from '../types';

export type Format = 'pdf' | 'svg' | 'png';
export interface PlannedFile { file: ExportFileId; format: Format; path: string }

export const FILE_ORDER: ExportFileId[] = ['composicao', ...LAYER_IDS, 'corte'];

export const FILE_LABELS: Record<ExportFileId, string> = {
  composicao: '00 · composição (prova)',
  fundo: '01 · fundo',
  turma: '02 · turma',
  homenagens: '03 · homenagens',
  formandos: '04 · formandos',
  hexagono: '05 · hexágono',
  corte: 'corte + furos',
};

export function fileBase(file: ExportFileId): string {
  if (file === 'composicao') return '00-composicao';
  if (file === 'corte') return 'corte';
  return `${PIECES[file].num}-${file}`;
}

export function planFiles(o: ExportOptions): PlannedFile[] {
  const formats = (['pdf', 'svg', 'png'] as Format[]).filter((f) => o.formats[f]);
  const out: PlannedFile[] = [];
  for (const file of FILE_ORDER) {
    if (!o.files[file]) continue;
    for (const format of formats) {
      if (file === 'corte') {
        if (format !== 'png') out.push({ file, format, path: `corte.${format}` });
      } else {
        out.push({ file, format, path: `${format}/${fileBase(file)}.${format}` });
      }
    }
  }
  return out;
}

export function fileViewBox(file: ExportFileId, bleed: number): Rect {
  if (file === 'composicao' || file === 'corte') return { x: 0, y: 0, w: MURAL_W, h: MURAL_H };
  return shapeBBox(PIECES[file].shape, bleed);
}

export function fileLayers(file: ExportFileId): LayerId[] {
  if (file === 'composicao') return [...LAYER_IDS];
  if (file === 'corte') return [];
  return [file];
}

export function zipName(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `mural-ti-2026_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.zip`;
}

export function buildMontagem(bleed: number, holeMm: number): string {
  const f = (n: number) => n.toFixed(1);
  const lines = [
    'MURAL TI 2026.1 · UFRN · montagem',
    'Unidade: mm · origem (0, 0) = canto superior esquerdo da área de 800 × 600',
    `Sangria nos arquivos: ${f(bleed)} mm · furos: Ø ${f(holeMm)} mm`,
    '',
  ];
  for (const id of LAYER_IDS) {
    const p = PIECES[id];
    const b = shapeBBox(p.shape);
    lines.push(`${p.num} ${p.label}`);
    lines.push(`  tamanho (sem sangria): ${f(b.w)} × ${f(b.h)}`);
    lines.push(`  posição (canto sup. esq.): x ${f(b.x)}, y ${f(b.y)}`);
    lines.push(p.holes.length ? `  furos (centro): ${p.holes.map((h) => `(${f(h.x)}, ${f(h.y)})`).join(' ')}` : '  furos: nenhum');
    lines.push('');
  }
  return lines.join('\n');
}

export function buildCutSvg(holeMm: number): string {
  const paths = LAYER_IDS.map((id) => `<path d="${shapePath(PIECES[id].shape)}"/>`).join('');
  const holes = LAYER_IDS.flatMap((id) => PIECES[id].holes)
    .map((h) => `<circle cx="${h.x}" cy="${h.y}" r="${holeMm / 2}"/>`)
    .join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${MURAL_W}mm" height="${MURAL_H}mm" viewBox="0 0 ${MURAL_W} ${MURAL_H}">` +
    `<g id="CutContour" fill="none" stroke="#ec008c" stroke-width="0.25">${paths}${holes}</g></svg>`
  );
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- src/mural/export/plan.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement `src/mural/export/render.ts`** (browser only; verified manually)

```ts
// Render do export no navegador: SVG (string), imagens embutidas, PDF vetorial e PNG.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import MuralSvg from '../MuralSvg';
import type { MuralModel } from '../compose';
import type { ExportFileId } from '../types';
import { fileLayers, fileViewBox } from './plan';

export const SAFARI_MAX_PX = 16_777_216;

export function isSafari(ua: string = navigator.userAgent): boolean {
  return /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
}

export function renderSvgString(model: MuralModel, file: ExportFileId, bleed: number): string {
  const pieceBleed = file === 'composicao' ? 0 : bleed;
  return renderToStaticMarkup(
    createElement(MuralSvg, {
      model,
      layers: fileLayers(file),
      bleed: pieceBleed,
      viewBox: fileViewBox(file, bleed),
      sizing: 'mm',
    }),
  );
}

export function parseSvg(text: string): SVGSVGElement {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const el = doc.documentElement;
  if (el.nodeName !== 'svg') throw new Error('SVG inválido');
  return el as unknown as SVGSVGElement;
}

// Reamostra a imagem para o tamanho de saida e devolve data URL.
async function toDataUrl(href: string, targetPx: number): Promise<string> {
  const blob = await (await fetch(href)).blob();
  const bmp = await createImageBitmap(blob);
  const s = Math.min(1, targetPx / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(bmp.width * s));
  c.height = Math.max(1, Math.round(bmp.height * s));
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('canvas indisponível');
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return blob.type === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.92);
}

// Troca blob:/caminhos por data URLs (necessario para PNG via canvas e para o PDF).
export async function inlineImages(svg: SVGSVGElement, dpi: number, cache: Map<string, string>): Promise<void> {
  const imgs = Array.from(svg.querySelectorAll('image'));
  await Promise.all(
    imgs.map(async (img) => {
      const href = img.getAttribute('href') ?? img.getAttribute('xlink:href');
      if (!href || href.startsWith('data:')) return;
      const wMm = Number(img.getAttribute('width'));
      const hMm = Number(img.getAttribute('height'));
      const target = Math.ceil((Math.max(wMm, hMm) / 25.4) * dpi);
      const key = `${href}@${target}`;
      let data = cache.get(key);
      if (!data) {
        data = await toDataUrl(href, target);
        cache.set(key, data);
      }
      img.setAttribute('href', data);
    }),
  );
}

export async function svgToPdf(svg: SVGSVGElement, wMm: number, hMm: number): Promise<Blob> {
  const pdf = new jsPDF({ unit: 'mm', format: [wMm, hMm], orientation: wMm >= hMm ? 'landscape' : 'portrait', compress: true });
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-99999px;top:0;';
  host.appendChild(svg);
  document.body.appendChild(host);
  try {
    await svg2pdf(svg, pdf, { x: 0, y: 0, width: wMm, height: hMm });
  } finally {
    host.remove();
  }
  return pdf.output('blob');
}

export async function svgToPng(svgText: string, wMm: number, hMm: number, dpi: number): Promise<Blob> {
  const w = Math.round((wMm / 25.4) * dpi);
  const h = Math.round((hMm / 25.4) * dpi);
  const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('canvas indisponível');
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      c.toBlob((b) => (b ? resolve(b) : reject(new Error(`falha ao gerar PNG ${w}×${h}`))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
```

- [ ] **Step 6: Implement `src/mural/export/bundle.ts`**

```ts
// Gera todos os arquivos planejados e empacota no zip.
import JSZip from 'jszip';
import type { MuralDoc, ExportOptions } from '../types';
import type { MuralModel } from '../compose';
import { buildCutSvg, buildMontagem, fileViewBox, planFiles, type PlannedFile } from './plan';
import { SAFARI_MAX_PX, inlineImages, isSafari, parseSvg, renderSvgString, svgToPdf, svgToPng } from './render';

export interface Progress { done: number; total: number; current: string }

async function renderFile(
  pf: PlannedFile, model: MuralModel, o: ExportOptions, cache: Map<string, string>, warnings: string[],
): Promise<Blob | string> {
  const vb = fileViewBox(pf.file, o.bleedMm);
  const isCut = pf.file === 'corte';
  const svgText = isCut ? buildCutSvg(o.holeMm) : renderSvgString(model, pf.file, o.bleedMm);
  if (isCut && pf.format === 'svg') return svgText;
  const el = parseSvg(svgText);
  if (!isCut) await inlineImages(el, o.dpi, cache);
  if (pf.format === 'svg') return new XMLSerializer().serializeToString(el);
  if (pf.format === 'pdf') return svgToPdf(el, vb.w, vb.h);
  let dpi: number = o.dpi;
  const px = ((vb.w / 25.4) * dpi) * ((vb.h / 25.4) * dpi);
  if (isSafari() && px > SAFARI_MAX_PX) {
    dpi = 150;
    warnings.push(`${pf.path}: o Safari limita o tamanho da imagem; exportado em 150 DPI (use o Chrome para 300 DPI)`);
  }
  return svgToPng(new XMLSerializer().serializeToString(el), vb.w, vb.h, dpi);
}

export async function exportMural(
  doc: MuralDoc, model: MuralModel, onProgress: (p: Progress) => void,
): Promise<{ blob: Blob; errors: string[] }> {
  const o = doc.export;
  const plan = planFiles(o);
  const zip = new JSZip();
  const errors: string[] = [];
  const cache = new Map<string, string>();
  const total = plan.length + 1;
  for (let i = 0; i < plan.length; i++) {
    const pf = plan[i];
    onProgress({ done: i, total, current: pf.path });
    try {
      zip.file(pf.path, await renderFile(pf, model, o, cache, errors));
    } catch (e) {
      errors.push(`${pf.path}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  zip.file('montagem.txt', buildMontagem(o.bleedMm, o.holeMm));
  onProgress({ done: total - 1, total, current: 'compactando…' });
  const blob = await zip.generateAsync({ type: 'blob' });
  onProgress({ done: total, total, current: 'pronto' });
  return { blob, errors };
}
```

- [ ] **Step 7: Replace `src/mural/editor/ExportTab.tsx`**

```tsx
import { useState } from 'react';
import { useMural } from '../state';
import type { ExportFileId, ExportOptions } from '../types';
import { FILE_LABELS, FILE_ORDER, planFiles, zipName } from '../export/plan';
import { exportMural, type Progress } from '../export/bundle';
import { downloadBlob } from '../download';

export default function ExportTab() {
  const { doc, dispatch, model } = useMural();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const o = doc.export;
  const set = (patch: Partial<ExportOptions>) => dispatch({ type: 'SET_EXPORT', patch });
  const count = planFiles(o).length;

  const run = async () => {
    if (!model) return;
    setBusy(true);
    setErrors([]);
    try {
      const res = await exportMural(doc, model, setProgress);
      setErrors(res.errors);
      downloadBlob(res.blob, zipName(new Date()));
    } catch (e) {
      setErrors([e instanceof Error ? e.message : String(e)]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mural-stack">
      {model && model.overflows.length > 0 && (
        <div className="mural-overflows">
          {model.overflows.length} texto(s) não cabem (o export continua permitido):
          <ul>{model.overflows.map((x) => <li key={x.key}>{x.label}</li>)}</ul>
        </div>
      )}

      <h3 className="mural-h">// peças</h3>
      <div className="mural-files">
        {FILE_ORDER.map((id: ExportFileId) => (
          <label key={id} className="mural-check">
            <input type="checkbox" checked={o.files[id]} onChange={(e) => set({ files: { ...o.files, [id]: e.target.checked } })} />
            {FILE_LABELS[id]}
          </label>
        ))}
      </div>

      <h3 className="mural-h">// formatos</h3>
      <div className="mural-row">
        {(['pdf', 'svg', 'png'] as const).map((f) => (
          <label key={f} className="mural-check">
            <input type="checkbox" checked={o.formats[f]} onChange={(e) => set({ formats: { ...o.formats, [f]: e.target.checked } })} />
            {f.toUpperCase()}
          </label>
        ))}
        <label className="mural-check">
          PNG
          <select value={o.dpi} onChange={(e) => set({ dpi: Number(e.target.value) as 150 | 300 })}>
            <option value={300}>300 DPI</option>
            <option value={150}>150 DPI</option>
          </select>
        </label>
      </div>

      <h3 className="mural-h">// produção</h3>
      <label className="mural-field">
        <span>Sangria (mm): {o.bleedMm.toFixed(1)}</span>
        <input type="range" min={0} max={5} step={0.5} value={o.bleedMm} onChange={(e) => set({ bleedMm: Number(e.target.value) })} />
      </label>
      <label className="mural-field">
        <span>Diâmetro dos furos (mm)</span>
        <input type="text" inputMode="decimal" value={o.holeMm}
          onChange={(e) => { const v = Number(e.target.value.replace(',', '.')); if (v > 0) set({ holeMm: v }); }} />
      </label>
      <p className="mural-hint">
        PDF e SVG saem com texto em contornos. O zip traz também <code>montagem.txt</code> (posição de cada peça e dos furos).
      </p>

      <button className="btn btn--primary" disabled={busy || !model || count === 0} onClick={run}>
        {busy ? 'Exportando…' : `Exportar ${count} arquivo(s) (.zip)`}
      </button>

      {progress && busy && (
        <div className="mural-stack">
          <div className="mural-progress"><div style={{ width: `${(progress.done / progress.total) * 100}%` }} /></div>
          <span className="mural-hint">{progress.current}</span>
        </div>
      )}

      {errors.length > 0 && (
        <div className="mural-overflows">
          Avisos e erros:
          <ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Verify**

Run: `npm test && npm run build`
Expected: all PASS, build exits 0. If `import { svg2pdf } from 'svg2pdf.js'` fails to type-check, check `node_modules/svg2pdf.js/types.d.ts` for the exported name and use it.

- [ ] **Step 9: Commit and push**

```bash
git add src/mural/export src/mural/editor/ExportTab.tsx
git commit -m "mural: export por peca (PDF vetorial, SVG, PNG), corte e montagem"
git push
```

---

### Task 10: Final verification and handoff

**Files:**
- Modify: `docs/superpowers/specs/2026-10-09-mural-de-vidro-design.md` (status line only)

- [ ] **Step 1: Full test and build**

Run: `npm test && npm run build`
Expected: every test file PASS; build exits 0. Paste the summary lines (test count, build size) into the report.

- [ ] **Step 2: Check the convite/display code is untouched**

Run: `git diff main --stat -- src/components/TemplateCard.tsx src/lib/exporter.ts src/state.tsx src/types.ts src/styles/template.css`
Expected: no output (no changes).

- [ ] **Step 3: Browser check (user-assisted if the sandbox blocks servers)**

Try `npm run dev`. If it starts, in Chrome:
1. Open **Mural**; edit the title, a snippet, a professor and a font size; reload the page and confirm the edits persisted.
2. **Exportar** with only `05 · hexágono` + PDF + SVG checked; open the zip.
3. Run `grep -c "/FontFile" pdf/05-hexagono.pdf` in the unzipped folder. Expected: `0` (no embedded fonts, text is outlines).
4. Open `pdf/05-hexagono.pdf` in Preview and check the laurel, "TI" and "2026.1" are visible and the bleed extends past the gold border.

If the dev server cannot start here, list these 4 checks for the user to run instead and do not claim them as done.

- [ ] **Step 4: Update the spec status, commit, push**

In the spec, change the line `Status: aprovado no brainstorming, aguardando revisão do spec` to `Status: implementado em feat/mural (aguardando teste visual e specs da PIX)`.

```bash
git add docs/superpowers/specs/2026-10-09-mural-de-vidro-design.md
git commit -m "docs: status do spec do mural"
git push
```
