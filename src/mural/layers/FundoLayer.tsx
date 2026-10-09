import { PIECES, shapePath } from '../geometry';
import { COLORS } from '../compose';
import { Texts, type LayerProps } from './common';

const NODES: [number, number][] = [[285, 205], [515, 205], [400, 305]];

export default function FundoLayer({ model, bleed, highlightOverflow }: LayerProps) {
  const d = shapePath(PIECES.fundo.shape, bleed);
  return (
    <g id="layer-fundo">
      <path d={d} fill={COLORS.navy} />
      <path d={d} fill="url(#mural-grid-fine)" />
      <path d={d} fill="url(#mural-grid-coarse)" />
      <path
        d="M329.1,145.8 L285,205 M470.9,145.8 L515,205 M400,276 V305"
        fill="none" stroke={COLORS.gold} strokeWidth={1.6} opacity={0.75}
      />
      <g fill={COLORS.champagne}>
        {NODES.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4} />)}
      </g>
      <image href="./brand/ufrn-white.png" x={30} y={578} width={50} height={14} preserveAspectRatio="xMinYMid meet" />
      <image href="./brand/pix.png" x={720} y={578} width={50} height={14} preserveAspectRatio="xMaxYMid meet" />
      <Texts model={model} layer="fundo" highlightOverflow={highlightOverflow} />
    </g>
  );
}
