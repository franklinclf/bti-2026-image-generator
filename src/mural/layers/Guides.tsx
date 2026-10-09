import { LAYER_IDS, PIECES, shapePath } from '../geometry';

// So na previa: contorno de corte (rosa), sangria (azul) e furos.
export default function Guides({ bleed, holeMm }: { bleed: number; holeMm: number }) {
  return (
    <g id="guides" fill="none" pointerEvents="none">
      {LAYER_IDS.map((id) => {
        const p = PIECES[id];
        return (
          <g key={id}>
            <path d={shapePath(p.shape)} stroke="#ff3ea5" strokeWidth={0.6} strokeDasharray="4 3" />
            {bleed > 0 && <path d={shapePath(p.shape, bleed)} stroke="#38bdf8" strokeWidth={0.4} strokeDasharray="1.5 1.5" />}
            {p.holes.map((h) => <circle key={`${h.x}-${h.y}`} cx={h.x} cy={h.y} r={holeMm / 2} stroke="#cfd4dc" strokeWidth={0.8} />)}
          </g>
        );
      })}
    </g>
  );
}
