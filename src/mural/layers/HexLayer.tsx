import { HEX_BASE, HEX_TRANSFORM, PIECES, shapePath } from '../geometry';
import { COLORS } from '../compose';
import { Texts, type LayerProps } from './common';
import { LAUREL_D, LAUREL_DOTS } from './laurel';

export default function HexLayer({ model, bleed, highlightOverflow }: LayerProps) {
  const { tx, ty, s } = HEX_TRANSFORM;
  return (
    <g id="layer-hexagono">
      <path d={shapePath(PIECES.hexagono.shape, bleed)} fill={COLORS.hex} />
      <g transform={`translate(${tx} ${ty}) scale(${s})`}>
        <polygon
          points={HEX_BASE.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none" stroke={COLORS.goldStroke} strokeWidth={5}
        />
        <path d={LAUREL_D} fill="none" stroke={COLORS.goldStroke} strokeWidth={3.2} strokeLinejoin="round" strokeLinecap="round" />
        <g fill={COLORS.champagne}>
          {LAUREL_DOTS.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4.2} />)}
          {HEX_BASE.map((p) => <circle key={`v${p.x}-${p.y}`} cx={p.x} cy={p.y} r={6} />)}
        </g>
      </g>
      <Texts model={model} layer="hexagono" highlightOverflow={highlightOverflow} />
    </g>
  );
}
