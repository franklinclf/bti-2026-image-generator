import { useMemo, useState } from 'react';
import MuralSvg from '../MuralSvg';
import type { MuralModel } from '../compose';
import { useMural } from '../state';
import { holeIssues } from '../geometry';

const ZOOMS = [1, 1.5, 2, 3];

export default function MuralPreview({ model }: { model: MuralModel }) {
  const { doc, dispatch } = useMural();
  const [zoom, setZoom] = useState(1);
  const [outline, setOutline] = useState(true);
  const [bleed, setBleed] = useState(true);
  const [holes, setHoles] = useState(true);
  const badHoles = useMemo(
    () => new Set(holeIssues(doc.holes, doc.export.holeMm).map((i) => `${i.piece}:${i.index}`)),
    [doc.holes, doc.export.holeMm],
  );
  const anyGuide = outline || bleed || holes;
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
          <input type="checkbox" checked={outline} onChange={(e) => setOutline(e.target.checked)} />
          contornos
        </label>
        <label className="mural-check">
          <input type="checkbox" checked={bleed} onChange={(e) => setBleed(e.target.checked)} />
          sangria
        </label>
        <label className="mural-check">
          <input type="checkbox" checked={holes} onChange={(e) => setHoles(e.target.checked)} />
          furos
        </label>
        {model.overflows.length > 0 && (
          <span className="mural__warn">{model.overflows.length} texto(s) não cabem (em vermelho)</span>
        )}
      </div>
      <div className="mural-preview__scroll">
        <div style={{ width: `${zoom * 100}%`, touchAction: holes ? 'none' : undefined }}>
          <MuralSvg
            model={model}
            bleed={bleed ? doc.export.bleedMm : 0}
            guides={anyGuide ? { outline, bleed, holes } : undefined}
            holes={doc.holes}
            holeMm={doc.export.holeMm}
            badHoles={badHoles}
            onHoleDrag={(piece, index, p) => {
              const cur = doc.holes[piece][index];
              if (cur && cur.x === p.x && cur.y === p.y) return;
              dispatch({ type: 'SET_HOLES', piece, value: doc.holes[piece].map((h, i) => (i === index ? p : h)) });
            }}
            highlightOverflow
          />
        </div>
      </div>
    </div>
  );
}
