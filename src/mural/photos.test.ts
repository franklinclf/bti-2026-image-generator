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
  it('ignora ruido de nome de arquivo', () => {
    const r = matchPortraits(formandos, ['IMG_2231 - Maria Paz (final).jpg']);
    expect(r.matches).toEqual([{ formandoId: idOf('MARIA PAZ MARCATO'), fileIndex: 0 }]);
  });
  it('ordem das palavras nao importa', () => {
    const r = matchPortraits(formandos, ['MARCATO, Maria Paz.png']);
    expect(r.matches).toEqual([{ formandoId: idOf('MARIA PAZ MARCATO'), fileIndex: 0 }]);
  });
  it('aceita abreviacao (prefixo)', () => {
    const r = matchPortraits(formandos, ['rodr barbalho.jpg']);
    expect(r.matches).toEqual([{ formandoId: idOf('RODRIGO EDUARDO DANTAS BARBALHO'), fileIndex: 0 }]);
  });
  it('tolera um erro de digitacao', () => {
    const r = matchPortraits(formandos, ['wislla argolo.jpg', 'joaremio.jpg']);
    expect(r.matches).toEqual([
      { formandoId: idOf('WISLA ALVES ARGOLO'), fileIndex: 0 },
      { formandoId: idOf('JOAREMIO MARINHO REVOREDO NETO'), fileIndex: 1 },
    ]);
  });
  it('uma palavra so casa se for unica', () => {
    const r = matchPortraits(formandos, ['gabriel.jpg', 'lucas silva.jpg', 'pedro.jpg']);
    expect(r.matches).toEqual([{ formandoId: idOf('LUCAS DA SILVA BARBALHO'), fileIndex: 1 }]);
    expect(r.unmatched).toEqual([0, 2]);
  });
  it('palavra unica nao toma o formando de um nome mais completo', () => {
    const r = matchPortraits(formandos, ['matheus.jpg', 'matheus dias.jpg']);
    expect(r.matches).toEqual([{ formandoId: idOf('MATHEUS DIAS ARAUJO DE MEDEIROS'), fileIndex: 1 }]);
    expect(r.unmatched).toEqual([0]);
  });
  it('arquivo com nome vazio nunca casa', () => {
    const r = matchPortraits(formandos, ['.jpg']);
    expect(r.matches).toEqual([]);
    expect(r.unmatched).toEqual([0]);
  });
});

describe('matchPortraits casos limite', () => {
  const lista = [
    { id: 'a', nome: 'ANA SILVA SOUZA' },
    { id: 'b', nome: 'ANA SILVA LIMA' },
    { id: 'c', nome: 'ANA MARIA' },
  ];
  it('empate na passada 2 fica sem par', () => {
    const r = matchPortraits(lista.slice(0, 2), ['ana silva.jpg']);
    expect(r.matches).toEqual([]);
    expect(r.unmatched).toEqual([0]);
  });
  it('uma palavra do arquivo nao consome duas palavras do nome', () => {
    const r = matchPortraits([lista[2]], ['ana ana.jpg']);
    expect(r.matches).toEqual([]);
    expect(r.unmatched).toEqual([0]);
  });
});
