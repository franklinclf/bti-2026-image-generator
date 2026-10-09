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
