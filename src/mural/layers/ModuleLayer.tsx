import { PIECES, shapePath, type LayerId } from '../geometry';
import { COLORS } from '../compose';
import { Photos, Texts, type LayerProps } from './common';

// Turma, homenagens e formandos: vidro retangular com borda dourada.
export default function ModuleLayer({ id, fill, model, bleed, highlightOverflow }: LayerProps & { id: LayerId; fill: string }) {
  const shape = PIECES[id].shape;
  return (
    <g id={`layer-${id}`}>
      <path d={shapePath(shape, bleed)} fill={fill} />
      <path d={shapePath(shape)} fill="none" stroke={COLORS.gold} strokeWidth={1.5} />
      <Photos model={model} layer={id} />
      <Texts model={model} layer={id} highlightOverflow={highlightOverflow} />
    </g>
  );
}
