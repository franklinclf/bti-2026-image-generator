// Ajuste horizontal: comprime ate MIN_SCALE_X; alem disso desenha a 85% e marca estouro.
export const MIN_SCALE_X = 0.85;

export function fitWidth(width: number, maxW?: number): { scaleX: number; overflow: boolean } {
  if (maxW === undefined || width <= maxW) return { scaleX: 1, overflow: false };
  const s = maxW / width;
  return s >= MIN_SCALE_X ? { scaleX: s, overflow: false } : { scaleX: MIN_SCALE_X, overflow: true };
}
