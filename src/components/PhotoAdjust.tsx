// PhotoAdjust — enquadramento da foto do formando atual (convite/display).
// O controle em si fica em PhotoAdjustControl (reusado pelo mural).
import { useApp } from '../state';
import PhotoAdjustControl from './PhotoAdjustControl';

export default function PhotoAdjust() {
  const { current, updateTransform } = useApp();
  if (!current) return null;
  return <PhotoAdjustControl value={current.transform} onChange={(t) => updateTransform(current.id, t)} />;
}
