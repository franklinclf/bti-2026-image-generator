// Render do export no navegador: SVG (string), imagens embutidas, PDF vetorial e PNG.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import MuralSvg from '../MuralSvg';
import type { MuralModel } from '../compose';
import type { ExportFileId } from '../types';
import { fileLayers, fileViewBox } from './plan';

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
// raster: reamostra para o dpi do PNG. vector (svg/pdf): resolucao original, limitada a 1200 DPI.
export type ImageMode = 'raster' | 'vector';
const VECTOR_MAX_DPI = 1200;

export async function inlineImages(svg: SVGSVGElement, dpi: number, cache: Map<string, string>, mode: ImageMode): Promise<void> {
  const imgs = Array.from(svg.querySelectorAll('image'));
  await Promise.all(
    imgs.map(async (img) => {
      const href = img.getAttribute('href') ?? img.getAttribute('xlink:href');
      if (!href || href.startsWith('data:')) return;
      const wMm = Number(img.getAttribute('width'));
      const hMm = Number(img.getAttribute('height'));
      const target = Math.ceil((Math.max(wMm, hMm) / 25.4) * (mode === 'vector' ? VECTOR_MAX_DPI : dpi));
      const key = `${href}@${mode}@${target}`;
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

export class CanvasTooLargeError extends Error {
  constructor(w: number, h: number) {
    super(`canvas ${w}×${h} grande demais`);
    this.name = 'CanvasTooLargeError';
  }
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
    // canvas grande demais falha em silencio (transparente); toda peca tem o centro opaco
    if (ctx.getImageData(w >> 1, h >> 1, 1, 1).data[3] === 0) throw new CanvasTooLargeError(w, h);
    return await new Promise<Blob>((resolve, reject) =>
      c.toBlob((b) => (b ? resolve(b) : reject(new CanvasTooLargeError(w, h))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
