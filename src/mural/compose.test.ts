import { beforeAll, describe, expect, it } from 'vitest';
import { composeMural } from './compose';
import { createDefaultDoc } from './defaults';
import { coverRect, HOM, photoCell } from './geometry';
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

  it('professor in memoriam ganha icone e o nome desloca para a direita', () => {
    const m = composeMural(createDefaultDoc(), fonts);
    const icon = m.texts.find((t) => t.key === 'hom:prof:0:memoriam');
    const nome = m.texts.find((t) => t.key === 'hom:prof:0');
    expect(icon).toBeDefined();
    expect(nome).toBeDefined();
    expect(icon!.x).toBeCloseTo(HOM.col2X, 2);
    expect(nome!.x).toBeCloseTo(HOM.col2X + icon!.width + 1, 2);
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
