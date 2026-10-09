// Gera todos os arquivos planejados e empacota no zip.
import JSZip from 'jszip';
import type { MuralDoc, ExportOptions } from '../types';
import type { MuralModel } from '../compose';
import { CANVAS_LIMITS, buildCutSvg, buildMontagem, fileViewBox, maxDpiFor, planFiles, retryDpis, type PlannedFile } from './plan';
import { CanvasTooLargeError, inlineImages, isSafari, parseSvg, renderSvgString, svgToPdf, svgToPng } from './render';

export interface Progress { done: number; total: number; current: string }

async function renderFile(
  pf: PlannedFile, model: MuralModel, o: ExportOptions, holes: MuralDoc['holes'], cache: Map<string, string>, warnings: string[],
): Promise<Blob | string> {
  const vb = fileViewBox(pf.file, o.bleedMm);
  const isCut = pf.file === 'corte';
  const svgText = isCut ? buildCutSvg(o.holeMm, holes) : renderSvgString(model, pf.file, o.bleedMm);
  if (isCut && pf.format === 'svg') return svgText;
  const el = parseSvg(svgText);
  if (!isCut && pf.format !== 'png') await inlineImages(el, o.dpi, cache, 'vector');
  if (pf.format === 'svg') return new XMLSerializer().serializeToString(el);
  if (pf.format === 'pdf') return svgToPdf(el, vb.w, vb.h);
  const pngDpi = maxDpiFor(vb.w, vb.h, o.dpi, isSafari() ? CANVAS_LIMITS.safari : CANVAS_LIMITS.default);
  if (pngDpi < o.dpi) warnings.push(`${pf.path}: exportado em ${pngDpi} DPI (limite do navegador)`);
  const tries = retryDpis(pngDpi);
  let lastErr: unknown;
  for (let i = 0; i < tries.length; i++) {
    const dpi = tries[i];
    try {
      const copy = el.cloneNode(true) as SVGSVGElement;
      if (!isCut) await inlineImages(copy, dpi, cache, 'raster');
      const blob = await svgToPng(new XMLSerializer().serializeToString(copy), vb.w, vb.h, dpi);
      if (i > 0) warnings.push(`${pf.path}: exportado em ${dpi} DPI (memória do navegador)`);
      return blob;
    } catch (e) {
      if (!(e instanceof CanvasTooLargeError)) throw e;
      lastErr = e;
    }
  }
  throw lastErr;
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
      zip.file(pf.path, await renderFile(pf, model, o, doc.holes, cache, errors));
    } catch (e) {
      errors.push(`${pf.path}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  zip.file('montagem.txt', buildMontagem(o.bleedMm, o.holeMm, doc.holes));
  onProgress({ done: total - 1, total, current: 'compactando…' });
  const blob = await zip.generateAsync({ type: 'blob' });
  onProgress({ done: total, total, current: 'pronto' });
  return { blob, errors };
}
