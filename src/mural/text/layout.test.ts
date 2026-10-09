import { beforeAll, describe, expect, it } from 'vitest';
import { getFont, type FontSet } from './fonts';
import { loadFontsNode } from './fonts.node';
import { layoutText } from './layout';
import { DEFAULT_ESTILOS } from '../defaults';

let fonts: FontSet;
beforeAll(() => {
  fonts = loadFontsNode();
});

describe('fontes', () => {
  it('carrega as 10 faces', () => {
    expect(fonts.size).toBe(10);
  });
  it('getFont respeita italico so na Fraunces', () => {
    expect(() => getFont(fonts, DEFAULT_ESTILOS.hexTI)).not.toThrow();
    expect(() => getFont(fonts, { font: 'sora', weight: 600, italic: true })).not.toThrow();
  });
});

describe('layoutText', () => {
  it('gera path e largura plausivel', () => {
    const font = getFont(fonts, DEFAULT_ESTILOS.titulo);
    const laid = layoutText(font, 'TI', 10);
    expect(laid.d.length).toBeGreaterThan(10);
    expect(laid.width).toBeGreaterThan(5);
    expect(laid.width).toBeLessThan(15);
  });
  it('tracking aumenta a largura', () => {
    const font = getFont(fonts, DEFAULT_ESTILOS.snippet);
    const a = layoutText(font, 'abc', 10, 0);
    const b = layoutText(font, 'abc', 10, 0.1);
    expect(b.width - a.width).toBeCloseTo(2, 5); // 2 espacos entre 3 letras x 1 mm
  });
  it('acentos do portugues tem glifo', () => {
    const font = getFont(fonts, DEFAULT_ESTILOS.legenda);
    for (const ch of 'ÇÃÕÉÚÍçãõéúí') expect(font.charToGlyph(ch).index).not.toBe(0);
  });
  it('desenha ✓ mesmo sem glifo na fonte', () => {
    const font = getFont(fonts, DEFAULT_ESTILOS.snippet);
    const laid = layoutText(font, '✓', 10);
    expect(laid.d).toMatch(/Z/);
    expect(laid.width).toBeCloseTo(6.2, 5);
  });
});
