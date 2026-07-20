// exporter.ts — renderiza cada TemplateCard num container offscreen (1600x1149),
// captura com html-to-image, junta PNG (e PDF opcional) num JSZip e baixa o .zip.
// 100% client-side; sequencial (um item por vez) com unmount/cleanup entre capturas.
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { toBlob } from 'html-to-image';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import TemplateCard from '../components/TemplateCard';
import type { Grad, Variant } from '../types';

// Dimensoes fixas do card (fonte da verdade do split-diag).
const CARD_W = 1600;
const CARD_H = 1149;
const VARIANTS: Variant[] = ['convite', 'display'];

// Nome de arquivo seguro no padrao Nome_Sobrenome (sem extensao).
function fileBase(nome: string): string {
  const base = nome
    .normalize('NFKD') // separa acentos
    .replace(/[̀-ͯ]/g, '') // remove diacriticos
    .replace(/[^\w\s-]/g, '') // remove pontuacao
    .trim()
    .replace(/\s+/g, '_'); // espacos -> underscore
  return base || 'formando';
}

// Cria o container offscreen (fixo, fora da viewport, tamanho real do card).
function makeOffscreen(): HTMLDivElement {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-99999px';
  host.style.top = '0';
  host.style.width = `${CARD_W}px`;
  host.style.height = `${CARD_H}px`;
  host.style.pointerEvents = 'none';
  host.style.zIndex = '-1';
  document.body.appendChild(host);
  return host;
}

// Espera o proximo (ou proximos) frames pra garantir que o React pintou o DOM.
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

// Espera TODAS as <img> carregarem (complete + naturalWidth), com timeout de seguranca.
function waitImg(node: HTMLElement): Promise<void> {
  const imgs = Array.from(node.querySelectorAll('img'));
  if (imgs.length === 0) return Promise.resolve();
  
  return Promise.all(
    imgs.map((img) => {
      return new Promise<void>((resolve) => {
        if (img.complete && img.naturalWidth > 0) {
          resolve();
          return;
        }
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          img.removeEventListener('load', finish);
          img.removeEventListener('error', finish);
          resolve();
        };
        img.addEventListener('load', finish);
        img.addEventListener('error', finish); // erro tambem resolve (nao trava o lote)
        // fallback: nao esperar pra sempre
        setTimeout(finish, 3000);
      });
    })
  ).then(() => undefined);
}

// Renderiza um TemplateCard no host e captura como PNG blob.
async function renderCapture(
  root: Root,
  host: HTMLElement,
  variant: Variant,
  nome: string,
  photoUrl: string | null,
  transform: Grad['transform'],
  pixelRatio: number,
): Promise<Blob> {
  root.render(
    createElement(TemplateCard, { variant, nome, photoUrl, transform }),
  );
  // aguarda pintura + fontes + imagem
  await nextFrame();
  await document.fonts.ready;
  await waitImg(host);
  await nextFrame();

  const target = host.firstElementChild as HTMLElement | null;
  
  // Hide images that fail to load to prevent canvas corruption
  const imgs = (target ?? host).querySelectorAll('img');
  imgs.forEach((img) => {
    if (!img.complete || img.naturalWidth === 0) {
      (img as HTMLElement).style.display = 'none';
    }
  });

  const blob = await toBlob(target ?? host, {
    pixelRatio,
    width: CARD_W,
    height: CARD_H,
    backgroundColor: '#0b1424',
  });
  if (!blob) throw new Error(`Falha ao capturar o card (${variant}, ${nome}).`);
  return blob;
}

// Executa promessas com limite de concorrência
async function promisePool<T>(
  items: T[],
  fn: (item: T) => Promise<any>,
  concurrency: number,
): Promise<void> {
  const executing: Promise<void>[] = [];
  for (const item of items) {
    const promise = Promise.resolve().then(() => fn(item)).then(() => {
      executing.splice(executing.indexOf(promise), 1);
    });
    executing.push(promise);
    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
}

// Converte um Blob PNG em dataURL (necessario pro jsPDF.addImage).
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error ?? new Error('Falha ao ler blob.'));
    fr.readAsDataURL(blob);
  });
}

// Gera um PDF landscape do card, em mm (1600x1149 px @ 300 DPI).
async function makePdf(pngBlob: Blob): Promise<Blob> {
  const PX_PER_IN = 300;
  const MM_PER_IN = 25.4;
  const wMm = (CARD_W / PX_PER_IN) * MM_PER_IN;
  const hMm = (CARD_H / PX_PER_IN) * MM_PER_IN;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [wMm, hMm],
    compress: true,
  });
  const dataUrl = await blobToDataURL(pngBlob);
  doc.addImage(dataUrl, 'PNG', 0, 0, wMm, hMm);
  return doc.output('blob');
}

// Dispara o download do zip via anchor + objectURL.
function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // libera a URL depois de dar tempo pro navegador iniciar o download
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Exporta os grads: para cada grad e cada variant, renderiza offscreen,
 * captura PNG (e PDF se pedido) e empacota tudo num .zip que e baixado ao fim.
 *
 * @param grads    lista de formandos a exportar (ja filtrada pelo chamador)
 * @param opts     { scale?: pixelRatio (default 3), pdf?: incluir PDF }
 * @param onProgress callback (done, total, label) para barra de progresso
 */
export async function exportGrads(
  grads: Grad[],
  opts: { scale?: number; pdf?: boolean },
  onProgress?: (done: number, total: number, label: string) => void,
): Promise<void> {
  if (!grads.length) return;

  const pixelRatio = opts.scale ?? 3;
  const withPdf = !!opts.pdf;
  const zip = new JSZip();

  // total de passos = grads * variants (o PDF entra no mesmo passo do PNG)
  const total = grads.length * VARIANTS.length;
  let done = 0;

  // Map para armazenar blobs de cada grad+variant
  const blobMap = new Map<string, { png: Blob; pdf?: Blob }>();

  // Processa grads em paralelo (2 por vez pra nao sobrecarregar memoria)
  await promisePool(
    grads,
    async (grad) => {
      const base = fileBase(grad.nome);
      const host = makeOffscreen();
      const root = createRoot(host);

      try {
        for (const variant of VARIANTS) {
          onProgress?.(done, total, `${grad.nome} · ${variant}`);

          const pngBlob = await renderCapture(
            root,
            host,
            variant,
            grad.nome,
            grad.url || null,
            grad.transform,
            pixelRatio,
          );

          let pdfBlob: Blob | undefined;
          if (withPdf) {
            pdfBlob = await makePdf(pngBlob);
          }

          blobMap.set(`${base}_${variant}`, { png: pngBlob, pdf: pdfBlob });
          done += 1;
          onProgress?.(done, total, `${grad.nome} · ${variant}`);

          // limpa o card renderizado entre capturas (libera memoria)
          root.render(null);
          await nextFrame();
        }
      } finally {
        root.unmount();
        host.remove();
      }
    },
    2, // concorrência: 2 grads por vez
  );

  // Agora monta o zip com todos os blobs (já completos)
  for (const [key, { png, pdf }] of blobMap.entries()) {
    zip.file(`${key}.png`, png);
    if (pdf) {
      zip.file(`${key}.pdf`, pdf);
    }
  }

  onProgress?.(done, total, 'Compactando .zip…');
  const zipBlob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (meta) => onProgress?.(done, total, `Compactando ${Math.round(meta.percent)}%`),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(zipBlob, `formatura-ti-2026_${stamp}.zip`);
  onProgress?.(total, total, 'Concluído');
}
