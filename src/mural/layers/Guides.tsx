import type { PointerEvent } from 'react';
import { LAYER_IDS, MURAL_H, MURAL_W, PIECES, shapePath, type LayerId, type Pt } from '../geometry';

export interface GuideFlags { outline: boolean; bleed: boolean; holes: boolean }

interface Props {
  flags: GuideFlags;
  bleed: number;
  holeMm: number;
  holes: Record<LayerId, Pt[]>;
  // furos com aviso (desenhados em vermelho), chave "peca:indice"
  badHoles?: Set<string>;
  // se informado, os furos podem ser arrastados (so na previa)
  onHoleDrag?: (piece: LayerId, index: number, p: Pt) => void;
}

const snap = (v: number, max: number) => Math.min(max, Math.max(0, Math.round(v * 2) / 2));

// So na previa: contorno de corte (rosa), sangria (azul) e furos.
export default function Guides({ flags, bleed, holeMm, holes, badHoles, onHoleDrag }: Props) {
  const drag = (piece: LayerId, index: number) => (e: PointerEvent<SVGCircleElement>) => {
    if (e.buttons === 0 || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const svg = e.currentTarget.ownerSVGElement;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const q = pt.matrixTransform(m.inverse());
    onHoleDrag?.(piece, index, { x: snap(q.x, MURAL_W), y: snap(q.y, MURAL_H) });
  };
  return (
    <g id="guides" fill="none" pointerEvents="none">
      {LAYER_IDS.map((id) => {
        const p = PIECES[id];
        return (
          <g key={id}>
            {flags.outline && <path d={shapePath(p.shape)} stroke="#ff3ea5" strokeWidth={0.6} strokeDasharray="4 3" />}
            {flags.bleed && bleed > 0 && (
              <path d={shapePath(p.shape, bleed)} stroke="#38bdf8" strokeWidth={0.4} strokeDasharray="1.5 1.5" />
            )}
            {flags.holes && (holes[id] ?? []).map((h, i) => (
              <g key={i}>
                <circle cx={h.x} cy={h.y} r={holeMm / 2} stroke={badHoles?.has(`${id}:${i}`) ? '#ff4d4d' : '#cfd4dc'} strokeWidth={0.8} />
                {onHoleDrag && (
                  <circle
                    cx={h.x} cy={h.y} r={holeMm / 2 + 3} fill="transparent" stroke="none"
                    pointerEvents="all" style={{ cursor: 'grab', touchAction: 'none' }}
                    onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault(); }}
                    onPointerMove={drag(id, i)}
                  />
                )}
              </g>
            ))}
          </g>
        );
      })}
    </g>
  );
}
