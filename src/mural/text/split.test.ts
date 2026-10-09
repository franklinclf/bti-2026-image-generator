import { describe, expect, it } from 'vitest';
import { splitName } from './split';

describe('splitName', () => {
  it('minimiza a linha mais longa', () => {
    expect(splitName('FRANKLIN CLAUDIO LOPES DE OLIVEIRA FILHO')).toEqual(['FRANKLIN CLAUDIO LOPES', 'DE OLIVEIRA FILHO']);
    expect(splitName('MARIA PAZ MARCATO')).toEqual(['MARIA PAZ', 'MARCATO']);
  });
  it('uma palavra fica na primeira linha', () => {
    expect(splitName('ANA')).toEqual(['ANA', '']);
  });
  it('ignora espacos extras', () => {
    expect(splitName('  JOAB   URBANO DE ARAUJO ')).toEqual(['JOAB URBANO', 'DE ARAUJO']);
  });
  it('vazio', () => {
    expect(splitName('')).toEqual(['', '']);
  });
});
