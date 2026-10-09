import { describe, expect, it } from 'vitest';
import { fitWidth } from './fit';

describe('fitWidth', () => {
  it('cabe: sem compressao', () => {
    expect(fitWidth(100, 120)).toEqual({ scaleX: 1, overflow: false });
    expect(fitWidth(100)).toEqual({ scaleX: 1, overflow: false });
  });
  it('comprime ate 85%', () => {
    expect(fitWidth(100, 90)).toEqual({ scaleX: 0.9, overflow: false });
    expect(fitWidth(100, 85)).toEqual({ scaleX: 0.85, overflow: false });
  });
  it('alem de 85% marca estouro', () => {
    expect(fitWidth(100, 80)).toEqual({ scaleX: 0.85, overflow: true });
    expect(fitWidth(100, 0)).toEqual({ scaleX: 0.85, overflow: true });
  });
});
