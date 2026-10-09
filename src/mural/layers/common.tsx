import type { LayerId } from '../geometry';
import { COLORS, type MuralModel } from '../compose';

export interface LayerProps { model: MuralModel; bleed: number; highlightOverflow: boolean }

export function MuralDefs() {
  return (
    <defs>
      <pattern id="mural-grid-fine" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M10 0H0V10" fill="none" stroke="#21345e" strokeWidth={0.5} />
      </pattern>
      <pattern id="mural-grid-coarse" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M50 0H0V50" fill="none" stroke="#2c4374" strokeWidth={0.8} />
      </pattern>
    </defs>
  );
}

export function Texts({ model, layer, highlightOverflow }: { model: MuralModel; layer: LayerId; highlightOverflow: boolean }) {
  return (
    <g>
      {model.texts
        .filter((t) => t.layer === layer)
        .map((t) => (
          <path
            key={t.key}
            d={t.d}
            transform={`translate(${t.x} ${t.y})${t.scaleX !== 1 ? ` scale(${t.scaleX} 1)` : ''}`}
            fill={highlightOverflow && t.overflow ? COLORS.overflow : t.fill}
            opacity={t.opacity === 1 ? undefined : t.opacity}
          />
        ))}
    </g>
  );
}

const clipId = (key: string) => `clip-${key.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

export function Photos({ model, layer }: { model: MuralModel; layer: LayerId }) {
  return (
    <g>
      {model.photos
        .filter((p) => p.layer === layer)
        .map((p) => {
          const id = clipId(p.key);
          const { x, y, w, h } = p.cell;
          return (
            <g key={p.key}>
              <clipPath id={id}>
                <rect x={x} y={y} width={w} height={h} />
              </clipPath>
              <rect x={x} y={y} width={w} height={h} fill={COLORS.placeholder} />
              {p.image && (
                <image
                  href={p.image.href}
                  x={p.image.rect.x}
                  y={p.image.rect.y}
                  width={p.image.rect.w}
                  height={p.image.rect.h}
                  preserveAspectRatio="none"
                  clipPath={`url(#${id})`}
                />
              )}
            </g>
          );
        })}
    </g>
  );
}
