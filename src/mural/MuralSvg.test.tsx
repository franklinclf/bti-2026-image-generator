import { beforeAll, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MuralSvg from './MuralSvg';
import { composeMural, type MuralModel } from './compose';
import { createDefaultDoc } from './defaults';
import { loadFontsNode } from './text/fonts.node';

let model: MuralModel;
beforeAll(() => {
  model = composeMural(createDefaultDoc(), loadFontsNode());
});

const count = (s: string, sub: string) => s.split(sub).length - 1;

describe('MuralSvg', () => {
  it('renderiza as 5 camadas, sem <text>', () => {
    const html = renderToStaticMarkup(<MuralSvg model={model} />);
    for (const id of ['fundo', 'turma', 'homenagens', 'formandos', 'hexagono']) {
      expect(html).toContain(`id="layer-${id}"`);
    }
    expect(html).not.toContain('<text');
    expect(count(html, '<clipPath')).toBe(53);
    expect(html).toContain('viewBox="0 0 800 600"');
  });

  it('sem stroke com gradiente (svg2pdf nao suporta)', () => {
    const html = renderToStaticMarkup(<MuralSvg model={model} />);
    expect(html).not.toMatch(/stroke="url\(/);
  });

  it('so a camada pedida, com tamanho em mm', () => {
    const html = renderToStaticMarkup(
      <MuralSvg model={model} layers={['hexagono']} sizing="mm" viewBox={{ x: 326, y: 20, w: 148, h: 170 }} />,
    );
    expect(html).toContain('id="layer-hexagono"');
    expect(html).not.toContain('id="layer-fundo"');
    expect(html).toContain('width="148mm"');
    expect(html).toContain('viewBox="326 20 148 170"');
  });

  it('guias: contornos, sangria e furos independentes', () => {
    const all = renderToStaticMarkup(<MuralSvg model={model} guides={{ outline: true, bleed: true, holes: true }} bleed={3} />);
    expect(all).toContain('id="guides"');
    expect(count(all, 'stroke-dasharray="1.5 1.5"')).toBe(5);
    expect(count(all, 'stroke-dasharray="4 3"')).toBe(5);
    const g = all.slice(all.indexOf('id="guides"'));
    expect(count(g, '<circle')).toBe(6);

    const onlyHoles = renderToStaticMarkup(<MuralSvg model={model} guides={{ outline: false, bleed: false, holes: true }} bleed={3} />);
    expect(onlyHoles).not.toContain('stroke-dasharray="4 3"');
    expect(onlyHoles).not.toContain('stroke-dasharray="1.5 1.5"');
    expect(count(onlyHoles.slice(onlyHoles.indexOf('id="guides"')), '<circle')).toBe(6);

    const noBleed = renderToStaticMarkup(<MuralSvg model={model} guides={{ outline: true, bleed: true, holes: false }} bleed={0} />);
    expect(noBleed).not.toContain('stroke-dasharray="1.5 1.5"');
    expect(noBleed.slice(noBleed.indexOf('id="guides"'))).not.toContain('<circle');
  });

  it('sem guias, nada de <g id="guides">', () => {
    expect(renderToStaticMarkup(<MuralSvg model={model} />)).not.toContain('id="guides"');
  });

  it('os furos das guias seguem o diametro e o mapa informados', () => {
    const holes = createDefaultDoc().holes;
    holes.turma = [{ x: 60, y: 130 }];
    const html = renderToStaticMarkup(
      <MuralSvg model={model} guides={{ outline: false, bleed: false, holes: true }} holeMm={10} holes={holes} />,
    );
    const g = html.slice(html.indexOf('id="guides"'));
    expect(g).toContain('r="5"');
    expect(g).not.toContain('r="4"');
    expect(g).toContain('cx="60"');
  });
});
