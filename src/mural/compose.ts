// Monta o modelo do mural: todo texto vira path posicionado (mm) e toda foto
// vira uma celula + retangulo da imagem. Funcao pura: preview e export usam o mesmo modelo.
import type { MuralDoc, Photo, PhotoTransform, SlotStyle, SnippetId, CargoNome } from './types';
import { getFont, type FontSet } from './text/fonts';
import { layoutText } from './text/layout';
import { memoriamIcon } from './text/icons';
import { fitWidth } from './text/fit';
import { HOM, TURMA_FOTO, coverRect, photoCell, type LayerId, type Rect } from './geometry';

export const COLORS = {
  navy: '#0e1a33',
  navy2: '#14244a',
  navy3: '#101d3b',
  hex: '#132245',
  gold: '#c9a227',
  goldStroke: '#d9b85b',
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
    let dx = 0;
    if (doc.memoriam.includes(n.trim())) {
      const icon = memoriamIcon(st.homenagem.sizeMm);
      texts.push({
        key: `hom:prof:${i}:memoriam`, layer: 'homenagens', label: `Professor(a) in memoriam: ${n}`,
        d: icon.d, x: HOM.col2X, y: y2, scaleX: 1, width: icon.width, fill: COLORS.champagne, opacity: 1, overflow: false,
      });
      dx = icon.width + 1;
    }
    put(`hom:prof:${i}`, 'homenagens', n, st.homenagem, HOM.col2X + dx, y2, { maxW: HOM.col2W - dx, label: `Professor(a): ${n}` });
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
