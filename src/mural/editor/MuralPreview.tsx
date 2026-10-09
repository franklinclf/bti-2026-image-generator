import { useState } from 'react';
import MuralSvg from '../MuralSvg';
import type { MuralModel } from '../compose';
import { useMural } from '../state';

const ZOOMS = [1, 1.5, 2, 3];

export default function MuralPreview({ model }: { model: MuralModel }) {
  const { doc } = useMural();
  const [zoom, setZoom] = useState(1);
  const [guides, setGuides] = useState(true);
  return (
    <div className="mural-preview">
      <div className="mural-preview__bar">
        <label>
          Zoom{' '}
          <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))}>
            {ZOOMS.map((z) => <option key={z} value={z}>{z * 100}%</option>)}
          </select>
        </label>
        <label className="mural-check">
          <input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} />
          contornos, sangria e furos
        </label>
        {model.overflows.length > 0 && (
          <span className="mural__warn">{model.overflows.length} texto(s) não cabem (em vermelho)</span>
        )}
      </div>
      <div className="mural-preview__scroll">
        <div style={{ width: `${zoom * 100}%` }}>
          <MuralSvg model={model} bleed={guides ? doc.export.bleedMm : 0} guides={guides} holeMm={doc.export.holeMm} highlightOverflow />
        </div>
      </div>
    </div>
  );
}
