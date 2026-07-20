// PhotoAdjust — ajusta o transform da foto do formando atual:
// zoom (scale 1..3), deslocamento x/y (drag num pad + sliders) e reset.
// Deterministico: os valores vao direto para o transform no store, no
// mesmo espaco (1600x1149) usado pela exportacao.
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useApp } from '../state';
import type { PhotoTransform } from '../types';

const DEFAULT: PhotoTransform = { scale: 1, x: 0, y: 0 };
// Limites de deslocamento (px no espaco do card) — margem generosa p/ reposicionar.
const MAX_OFFSET = 500;

export default function PhotoAdjust() {
  const { current, updateTransform } = useApp();
  const padRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [live, setLive] = useState(false); // feedback visual do pad durante drag

  if (!current) return null;
  const { id, transform } = current;
  const { scale, x, y } = transform;

  // Aplica um patch parcial ao transform mantendo o resto.
  const patch = (p: Partial<PhotoTransform>) =>
    updateTransform(id, { ...transform, ...p });

  const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

  // Converte a posicao do ponteiro no pad para x/y (centro do pad = 0,0).
  const fromPointer = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (clientX - r.left) / r.width - 0.5; // -0.5..0.5
    const ny = (clientY - r.top) / r.height - 0.5;
    patch({
      x: clamp(Math.round(nx * 2 * MAX_OFFSET), MAX_OFFSET),
      y: clamp(Math.round(ny * 2 * MAX_OFFSET), MAX_OFFSET),
    });
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

  // Passo do nudge com setas (px no espaco do card).
  const STEP = 12;
  const nudge = (dx: number, dy: number) =>
    patch({
      x: clamp(x + dx, MAX_OFFSET),
      y: clamp(y + dy, MAX_OFFSET),
    });

  // Posicao do knob no pad (0..100%).
  const knobLeft = ((x / MAX_OFFSET) * 0.5 + 0.5) * 100;
  const knobTop = ((y / MAX_OFFSET) * 0.5 + 0.5) * 100;

  const isDefault = scale === DEFAULT.scale && x === DEFAULT.x && y === DEFAULT.y;

  return (
    <div className="adjust">
      <div className="adjust__head">
        <span className="adjust__title mono">
          <span className="adjust__kw">//</span> enquadramento
        </span>
        <button
          className="btn btn--ghost adjust__reset"
          onClick={() => updateTransform(id, { ...DEFAULT })}
          disabled={isDefault}
          title="Voltar ao enquadramento padrão"
        >
          resetar
        </button>
      </div>

      <div className="adjust__body">
        {/* Zoom */}
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

        {/* Pad de posicao (drag) + setas */}
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
              <span
                className="adjust__knob"
                style={{ left: `${knobLeft}%`, top: `${knobTop}%` }}
              />
            </div>
            <div className="adjust__arrows">
              <button className="btn adjust__arrow adjust__arrow--up" onClick={() => nudge(0, -STEP)} title="Cima">↑</button>
              <button className="btn adjust__arrow adjust__arrow--left" onClick={() => nudge(-STEP, 0)} title="Esquerda">←</button>
              <button className="btn adjust__arrow adjust__arrow--center" onClick={() => patch({ x: 0, y: 0 })} title="Centralizar">•</button>
              <button className="btn adjust__arrow adjust__arrow--right" onClick={() => nudge(STEP, 0)} title="Direita">→</button>
              <button className="btn adjust__arrow adjust__arrow--down" onClick={() => nudge(0, STEP)} title="Baixo">↓</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
