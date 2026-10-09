import { describe, expect, it } from 'vitest';
import {
  HEX_PTS,
  PIECES,
  holeWarnings,
  pointInShape,
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

const defaultHoles = () => ({
  fundo: PIECES.fundo.holes.map((h) => ({ ...h })),
  turma: [],
  homenagens: [],
  formandos: [],
  hexagono: PIECES.hexagono.holes.map((h) => ({ ...h })),
});

describe('pointInShape', () => {
  it('poligono convexo', () => {
    expect(pointInShape(PIECES.fundo.shape, { x: 400, y: 300 })).toBe(true);
    expect(pointInShape(PIECES.fundo.shape, { x: 400, y: 30 })).toBe(false);
    expect(pointInShape(PIECES.fundo.shape, { x: 5, y: 65 })).toBe(false); // chanfro
    expect(pointInShape(PIECES.hexagono.shape, { x: 400, y: 100 })).toBe(true);
  });
  it('retangulo arredondado', () => {
    expect(pointInShape(PIECES.turma.shape, { x: 100, y: 150 })).toBe(true);
    expect(pointInShape(PIECES.turma.shape, { x: 20, y: 150 })).toBe(false);
  });
});

describe('holeWarnings', () => {
  it('furos padrao nao geram avisos', () => {
    expect(holeWarnings(defaultHoles(), 8)).toEqual([]);
  });
  it('furo fora da peca', () => {
    const h = defaultHoles();
    h.fundo = [{ x: 400, y: 30 }];
    expect(holeWarnings(h, 8)).toEqual(['Fundo: furo 1 fora da peça']);
  });
  it('furo perto da borda', () => {
    const h = defaultHoles();
    h.turma = [{ x: 27, y: 150 }];
    expect(holeWarnings(h, 8)).toEqual(['Turma: furo 1 a menos de 3 mm da borda']);
  });
});
