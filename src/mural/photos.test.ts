import { describe, expect, it } from 'vitest';
import { createFormandos } from './defaults';
import { matchPortraits, normalizeName } from './photos';

const formandos = createFormandos();
const idOf = (nome: string) => formandos.find((f) => f.nome === nome)!.id;

describe('normalizeName', () => {
  it('tira extensao, acentos e separadores', () => {
    expect(normalizeName('João_Vitor-de.Oliveira.JPG')).toBe('joao vitor de oliveira');
  });
});

describe('matchPortraits', () => {
  it('nome exato', () => {
    const r = matchPortraits(formandos, ['Maria_Paz-Marcato.jpg']);
    expect(r.matches).toEqual([{ formandoId: idOf('MARIA PAZ MARCATO'), fileIndex: 0 }]);
  });
  it('subconjunto unico de palavras (>= 2)', () => {
    const r = matchPortraits(formandos, ['lucas-barbalho.png', 'joao vitor.jpeg']);
    expect(r.matches).toEqual([
      { formandoId: idOf('LUCAS DA SILVA BARBALHO'), fileIndex: 0 },
      { formandoId: idOf('JOÃO VITOR DE OLIVEIRA SANTOS'), fileIndex: 1 },
    ]);
  });
  it('ambiguo ou uma palavra so fica sem par', () => {
    const r = matchPortraits(formandos, ['gabriel.jpg', 'lucas-de.jpg', 'fulano-de-tal.jpg']);
    expect(r.matches).toEqual([]);
    expect(r.unmatched).toEqual([0, 1, 2]);
  });
  it('nao usa o mesmo formando duas vezes', () => {
    const r = matchPortraits(formandos, ['wisla alves argolo.jpg', 'wisla-argolo.jpg']);
    expect(r.matches).toHaveLength(1);
    expect(r.unmatched).toEqual([1]);
  });
  it('nome exato tem prioridade sobre parcial, independente da ordem', () => {
    const r = matchPortraits(formandos, ['wisla-argolo.jpg', 'wisla alves argolo.jpg']);
    expect(r.matches).toEqual([{ formandoId: idOf('WISLA ALVES ARGOLO'), fileIndex: 1 }]);
    expect(r.unmatched).toEqual([0]);
  });
  it('arquivo com nome vazio nunca casa', () => {
    const r = matchPortraits(formandos, ['.jpg']);
    expect(r.matches).toEqual([]);
    expect(r.unmatched).toEqual([0]);
  });
});
