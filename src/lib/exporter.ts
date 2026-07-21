// exporter.ts — renderiza cada TemplateCard num container offscreen (1600x1149),
// captura com html-to-image, junta PNG (e PDF opcional) num JSZip e baixa o .zip.
// 100% client-side. Melhorias:
//  (a) fontes embutidas UMA vez (getFontEmbedCSS) e reusadas em todas as capturas;
//  (b) concorrencia por pool: N workers, cada um com seu host offscreen + createRoot;
//  (c) exporta apenas as variants pedidas (default convite+display), passando gender;
//  (d) se so 1 arquivo for gerado, baixa direto (png/pdf) sem zip; senao, zip.
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { toBlob, getFontEmbedCSS } from 'html-to-image';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import TemplateCard from '../components/TemplateCard';
import type { Grad, Variant } from '../types';

// Dimensoes fixas do card (fonte da verdade do split-diag).
const CARD_W = 1600;
const CARD_H = 1149;
const DEFAULT_VARIANTS: Variant[] = ['convite', 'display'];

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
    }),
  ).then(() => undefined);
}

// Renderiza um TemplateCard no host e captura como PNG blob.
// fontEmbedCSS: CSS de fontes ja embutido UMA vez (reuso => ganho de velocidade).
async function renderCapture(
  root: Root,
  host: HTMLElement,
  variant: Variant,
  nome: string,
  gender: Grad['gender'],
  photoUrl: string | null,
  transform: Grad['transform'],
  pixelRatio: number,
  fontEmbedCSS: string,
): Promise<Blob> {
  root.render(
    createElement(TemplateCard, { variant, nome, gender, photoUrl, transform }),
  );
  // aguarda pintura + fontes + imagem
  await nextFrame();
  await document.fonts.ready;
  await waitImg(host);
  await nextFrame();

  const target = host.firstElementChild as HTMLElement | null;

  // Esconde imagens que falharam ao carregar (evita corromper o canvas).
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
    // reusa o CSS de fontes ja resolvido (nao re-embute a cada captura).
    fontEmbedCSS,
    skipFonts: false,
  });
  if (!blob) throw new Error(`Falha ao capturar o card (${variant}, ${nome}).`);
  return blob;
}

// Executa uma fila de tarefas com limite de concorrencia. Cada worker roda em
// serie; N workers rodam em paralelo. Erros de um item nao travam o lote.
async function runPool(
  taskCount: number,
  worker: (workerIndex: number) => Promise<void>,
  concurrency: number,
): Promise<void> {
  const n = Math.max(1, Math.min(concurrency, taskCount || 1));
  const workers: Promise<void>[] = [];
  for (let w = 0; w < n; w++) {
    workers.push(worker(w));
  }
  await Promise.all(workers);
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

// Dispara o download de um blob via anchor + objectURL.
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

// Uma unidade de trabalho: um grad numa dada variant.
interface Job {
  grad: Grad;
  variant: Variant;
  base: string;
}

// Resultado de uma unidade de trabalho.
interface Output {
  name: string; // sem extensao (Nome_variant)
  png: Blob;
  pdf?: Blob;
}

/**
 * Exporta os grads: para cada grad e cada variant pedida, renderiza offscreen,
 * captura PNG (e PDF se pedido). Se o total de ARQUIVOS for exatamente 1, baixa
 * o arquivo direto; senao, empacota tudo num .zip.
 *
 * @param grads      lista de formandos a exportar (ja filtrada pelo chamador)
 * @param opts       { scale?: pixelRatio (default 3), pdf?, variants?, concurrency? }
 * @param onProgress callback (done, total, label) para barra de progresso
 */
export async function exportGrads(
  grads: Grad[],
  opts: {
    scale?: number;
    pdf?: boolean;
    variants?: Variant[];
    concurrency?: number;
  },
  onProgress?: (done: number, total: number, label: string) => void,
): Promise<void> {
  if (!grads.length) return;

  const pixelRatio = opts.scale ?? 3;
  const withPdf = !!opts.pdf;
  const variants =
    opts.variants && opts.variants.length ? opts.variants : DEFAULT_VARIANTS;
  const concurrency = Math.max(1, opts.concurrency ?? 4);
  const filesPerCapture = withPdf ? 2 : 1;

  // Fila de tarefas (grad x variant).
  const jobs: Job[] = [];
  for (const grad of grads) {
    const base = fileBase(grad.nome);
    for (const variant of variants) {
      jobs.push({ grad, variant, base });
    }
  }

  // total de PASSOS = numero de capturas (o PDF entra no mesmo passo do PNG).
  const total = jobs.length;
  // total de ARQUIVOS = capturas * (pdf ? 2 : 1).
  const totalFiles = total * filesPerCapture;
  let done = 0;

  const outputs: Output[] = [];
  let nextJob = 0; // indice compartilhado da fila (consumido pelos workers)

  // Fonte de fontes embutida UMA vez: renderiza um card de amostra offscreen,
  // extrai o CSS de fontes e reusa em todas as capturas (maior ganho).
  const sampleGrad = grads[0];
  const sampleHost = makeOffscreen();
  const sampleRoot = createRoot(sampleHost);
  let fontEmbedCSS = '';
  try {
    sampleRoot.render(
      createElement(TemplateCard, {
        variant: variants[0],
        nome: sampleGrad.nome,
        gender: sampleGrad.gender,
        photoUrl: sampleGrad.url || null,
        transform: sampleGrad.transform,
      }),
    );
    await nextFrame();
    await document.fonts.ready;
    await nextFrame();
    const sampleTarget =
      (sampleHost.firstElementChild as HTMLElement | null) ?? sampleHost;
    try {
      fontEmbedCSS = await getFontEmbedCSS(sampleTarget);
    } catch {
      // se falhar, segue sem CSS pre-embutido (html-to-image resolve sozinho).
      fontEmbedCSS = '';
    }
  } finally {
    sampleRoot.unmount();
    sampleHost.remove();
  }

  // Cada worker tem seu proprio host offscreen + createRoot e consome a fila.
  const worker = async (): Promise<void> => {
    const host = makeOffscreen();
    const root = createRoot(host);
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const idx = nextJob++;
        if (idx >= jobs.length) break;
        const { grad, variant, base } = jobs[idx];

        onProgress?.(done, total, `${grad.nome} · ${variant}`);

        try {
          const pngBlob = await renderCapture(
            root,
            host,
            variant,
            grad.nome,
            grad.gender,
            grad.url || null,
            grad.transform,
            pixelRatio,
            fontEmbedCSS,
          );

          let pdfBlob: Blob | undefined;
          if (withPdf) {
            pdfBlob = await makePdf(pngBlob);
          }

          outputs.push({ name: `${base}_${variant}`, png: pngBlob, pdf: pdfBlob });
        } catch (err) {
          // erro de um item nao trava o lote: registra e segue.
          console.error(`Falha ao exportar ${grad.nome} (${variant}):`, err);
        } finally {
          done += 1;
          onProgress?.(done, total, `${grad.nome} · ${variant}`);
          // limpa o card renderizado entre capturas (libera memoria)
          root.render(null);
          await nextFrame();
        }
      }
    } finally {
      root.unmount();
      host.remove();
    }
  };

  await runPool(jobs.length, worker, concurrency);

  // Nenhum arquivo capturado (todos falharam): nada a baixar.
  const producedFiles = outputs.reduce(
    (acc, o) => acc + 1 + (o.pdf ? 1 : 0),
    0,
  );
  if (producedFiles === 0) {
    onProgress?.(total, total, 'Nada exportado');
    return;
  }

  const stamp = new Date().toISOString().slice(0, 10);

  // DOWNLOAD UNICO: se o total de ARQUIVOS pedidos for exatamente 1, baixa direto.
  if (totalFiles === 1 && producedFiles === 1) {
    const only = outputs[0];
    if (withPdf && only.pdf) {
      onProgress?.(total, total, 'Concluído');
      downloadBlob(only.pdf, `${only.name}.pdf`);
    } else {
      onProgress?.(total, total, 'Concluído');
      downloadBlob(only.png, `${only.name}.png`);
    }
    return;
  }

  // Caso geral: monta o zip com todos os blobs produzidos.
  const zip = new JSZip();
  for (const o of outputs) {
    zip.file(`${o.name}.png`, o.png);
    if (o.pdf) {
      zip.file(`${o.name}.pdf`, o.pdf);
    }
  }

  onProgress?.(done, total, 'Compactando .zip…');
  const zipBlob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (meta) => onProgress?.(done, total, `Compactando ${Math.round(meta.percent)}%`),
  );

  downloadBlob(zipBlob, `formatura-ti-2026_${stamp}.zip`);
  onProgress?.(total, total, 'Concluído');
}
