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

  it('so a camada pedida, com tamanho em mm', () => {
    const html = renderToStaticMarkup(
      <MuralSvg model={model} layers={['hexagono']} sizing="mm" viewBox={{ x: 326, y: 20, w: 148, h: 170 }} />,
    );
    expect(html).toContain('id="layer-hexagono"');
    expect(html).not.toContain('id="layer-fundo"');
    expect(html).toContain('width="148mm"');
    expect(html).toContain('viewBox="326 20 148 170"');
  });

  it('guias desenham contornos e furos', () => {
    const html = renderToStaticMarkup(<MuralSvg model={model} guides bleed={3} />);
    expect(html).toContain('id="guides"');
    expect(count(html, 'stroke-dasharray="1.5 1.5"')).toBe(5);
  });
});
