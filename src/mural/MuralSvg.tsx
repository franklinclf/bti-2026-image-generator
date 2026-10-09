import { LAYER_IDS, MURAL_H, MURAL_W, type LayerId, type Rect } from './geometry';
import { COLORS, type MuralModel } from './compose';
import { MuralDefs } from './layers/common';
import FundoLayer from './layers/FundoLayer';
import ModuleLayer from './layers/ModuleLayer';
import HexLayer from './layers/HexLayer';
import Guides from './layers/Guides';

export interface MuralSvgProps {
  model: MuralModel;
  layers?: LayerId[];
  bleed?: number;
  viewBox?: Rect;
  sizing?: 'fluid' | 'mm';
  guides?: boolean;
  holeMm?: number;
  highlightOverflow?: boolean;
}

export default function MuralSvg({
  model, layers = LAYER_IDS, bleed = 0, viewBox, sizing = 'fluid', guides = false, holeMm = 8, highlightOverflow = false,
}: MuralSvgProps) {
  const vb = viewBox ?? { x: 0, y: 0, w: MURAL_W, h: MURAL_H };
  const size = sizing === 'mm' ? { width: `${vb.w}mm`, height: `${vb.h}mm` } : { width: '100%' };
  const p = { model, bleed, highlightOverflow };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} {...size}>
      <MuralDefs />
      {layers.includes('fundo') && <FundoLayer {...p} />}
      {layers.includes('turma') && <ModuleLayer id="turma" fill={COLORS.navy2} {...p} />}
      {layers.includes('homenagens') && <ModuleLayer id="homenagens" fill={COLORS.navy2} {...p} />}
      {layers.includes('formandos') && <ModuleLayer id="formandos" fill={COLORS.navy3} {...p} />}
      {layers.includes('hexagono') && <HexLayer {...p} />}
      {guides && <Guides bleed={bleed} holeMm={holeMm} />}
    </svg>
  );
}
