import { describe, expect, it } from 'vitest';
import { memoriamIcon } from './icons';

describe('memoriamIcon', () => {
  it('tem largura de 0.75 em e 7 subcaminhos com numeros finitos', () => {
    const icon = memoriamIcon(10);
    expect(icon.width).toBeCloseTo(7.5, 5);
    expect(icon.d.match(/Z/g)).toHaveLength(7);
    const nums = icon.d.match(/-?\d+(\.\d+)?/g) ?? [];
    expect(nums.length).toBeGreaterThan(0);
    expect(nums.every((n) => Number.isFinite(Number(n)))).toBe(true);
    expect(icon.d).not.toMatch(/NaN|Infinity/);
  });
});
