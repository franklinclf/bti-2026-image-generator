import { describe, expect, it } from 'vitest';
import { createDefaultDoc, DEFAULT_EXPORT } from '../defaults';
import { buildCutSvg, buildMontagem, fileLayers, fileViewBox, planFiles, zipName } from './plan';

const holes = () => createDefaultDoc().holes;
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
    const t = buildMontagem(3, 8, holes());
    expect(t).toContain('01 Fundo');
    expect(t).toContain('tamanho (sem sangria): 800.0 × 540.0');
    expect(t).toContain('posição (canto sup. esq.): x 25.0, y 305.0');
    expect(t).toContain('(20.0, 80.0)');
    expect(t).toContain('Ø 8.0 mm');
    expect(t).toContain('Sangria nos arquivos: 3.0 mm');
  });
  it('arquivo de corte tem 5 contornos e 6 furos', () => {
    const svg = buildCutSvg(8, holes());
    expect(svg.split('<path').length - 1).toBe(5);
    expect(svg.split('<circle').length - 1).toBe(6);
    expect(svg).toContain('r="4"');
    expect(svg).toContain('id="CutContour"');
  });
  it('usa o mapa de furos informado', () => {
    const h = holes();
    h.turma = [{ x: 50, y: 120 }];
    expect(buildCutSvg(8, h).split('<circle').length - 1).toBe(7);
    expect(buildMontagem(3, 8, h)).toContain('(50.0, 120.0)');
  });
  it('nome do zip usa a data local', () => {
    expect(zipName(new Date(2026, 9, 9, 23, 30))).toBe('mural-ti-2026_2026-10-09.zip');
  });
});
