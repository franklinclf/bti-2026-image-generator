// PhotoAdjustControl — controle de enquadramento: zoom (1..3), posicao x/y
// (pad arrastavel + setas) e reset. Apresentacional: valor e onChange vem de fora.
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

export interface Transform { scale: number; x: number; y: number }

const DEFAULT: Transform = { scale: 1, x: 0, y: 0 };

interface Props {
  value: Transform;
  onChange: (t: Transform) => void;
  maxOffset?: number; // limite de |x| e |y|
  step?: number; // passo das setas
}

export default function PhotoAdjustControl({ value, onChange, maxOffset = 500, step = 12 }: Props) {
  const padRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [live, setLive] = useState(false);
  const { scale, x, y } = value;

  const patch = (p: Partial<Transform>) => onChange({ ...value, ...p });
  const clamp = (v: number) => Math.max(-maxOffset, Math.min(maxOffset, v));

  const fromPointer = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (clientX - r.left) / r.width - 0.5;
    const ny = (clientY - r.top) / r.height - 0.5;
    patch({ x: clamp(Math.round(nx * 2 * maxOffset)), y: clamp(Math.round(ny * 2 * maxOffset)) });
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    setLive(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    fromPointer(e.clientX, e.clientY);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    fromPointer(e.clientX, e.clientY);
  };
  const onPointerUp = () => {
    dragging.current = false;
    setLive(false);
  };

  const nudge = (dx: number, dy: number) => patch({ x: clamp(x + dx), y: clamp(y + dy) });

  const knobLeft = ((x / maxOffset) * 0.5 + 0.5) * 100;
  const knobTop = ((y / maxOffset) * 0.5 + 0.5) * 100;
  const isDefault = scale === DEFAULT.scale && x === DEFAULT.x && y === DEFAULT.y;

  return (
    <div className="adjust">
      <div className="adjust__head">
        <span className="adjust__title mono">
          <span className="adjust__kw">//</span> enquadramento
        </span>
        <button
          className="btn btn--ghost adjust__reset"
          onClick={() => onChange({ ...DEFAULT })}
          disabled={isDefault}
          title="Voltar ao enquadramento padrão"
        >
          resetar
        </button>
      </div>

      <div className="adjust__body">
        <div className="adjust__field">
          <label className="adjust__label">
            Zoom <span className="adjust__val mono">{scale.toFixed(2)}×</span>
          </label>
          <input
            className="adjust__slider"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={scale}
            onChange={(e) => patch({ scale: parseFloat(e.target.value) })}
          />
        </div>

        <div className="adjust__field">
          <label className="adjust__label">
            Posição{' '}
            <span className="adjust__val mono">
              x{x} y{y}
            </span>
          </label>
          <div className="adjust__pos">
            <div
              ref={padRef}
              className={`adjust__pad${live ? ' is-live' : ''}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              title="Arraste para reposicionar a foto"
            >
              <span className="adjust__cross-h" />
              <span className="adjust__cross-v" />
              <span className="adjust__knob" style={{ left: `${knobLeft}%`, top: `${knobTop}%` }} />
            </div>
            <div className="adjust__arrows">
              <button className="btn adjust__arrow adjust__arrow--up" onClick={() => nudge(0, -step)} title="Cima">↑</button>
              <button className="btn adjust__arrow adjust__arrow--left" onClick={() => nudge(-step, 0)} title="Esquerda">←</button>
              <button className="btn adjust__arrow adjust__arrow--center" onClick={() => patch({ x: 0, y: 0 })} title="Centralizar">•</button>
              <button className="btn adjust__arrow adjust__arrow--right" onClick={() => nudge(step, 0)} title="Direita">→</button>
              <button className="btn adjust__arrow adjust__arrow--down" onClick={() => nudge(0, step)} title="Baixo">↓</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
