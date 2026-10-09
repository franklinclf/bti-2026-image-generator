// Gera todos os arquivos planejados e empacota no zip.
import JSZip from 'jszip';
import type { MuralDoc, ExportOptions } from '../types';
import type { MuralModel } from '../compose';
import { buildCutSvg, buildMontagem, fileViewBox, planFiles, type PlannedFile } from './plan';
import { SAFARI_MAX_PX, inlineImages, isSafari, parseSvg, renderSvgString, svgToPdf, svgToPng } from './render';

export interface Progress { done: number; total: number; current: string }

async function renderFile(
  pf: PlannedFile, model: MuralModel, o: ExportOptions, holes: MuralDoc['holes'], cache: Map<string, string>, warnings: string[],
): Promise<Blob | string> {
  const vb = fileViewBox(pf.file, o.bleedMm);
  const isCut = pf.file === 'corte';
  const svgText = isCut ? buildCutSvg(o.holeMm, holes) : renderSvgString(model, pf.file, o.bleedMm);
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
