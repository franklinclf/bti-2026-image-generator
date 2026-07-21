// TypographyControls — ajusta a tipografia (tamanho e entrelinha) do formando
// atual, por slot/parte do design. Cada slot resolve default do template +
// override do formando (resolveSlot). Agrupado por peca: Comum / Convite /
// Display. Botoes: resetar tipografia e aplicar a todos.
import { useApp } from '../state';
import { SLOTS, resolveSlot } from '../lib/typeSlots';
import type { SlotDef } from '../lib/typeSlots';
import type { TypeStyles } from '../types';

// Limites da entrelinha (mesmos para todos os slots que a permitem).
const LH_MIN = 0.9;
const LH_MAX = 2.2;
const LH_STEP = 0.02;

// Uma linha de slot: label + input de tamanho (+ entrelinha se lh).
function SlotRow({
  slot,
  typeStyles,
  onSize,
  onLh,
}: {
  slot: SlotDef;
  typeStyles: TypeStyles;
  onSize: (n: number) => void;
  onLh: (n: number) => void;
}) {
  const { fontSize, lineHeight } = resolveSlot(slot.key, typeStyles);
  return (
    <div className="type__row">
      <span className="type__label">{slot.label}</span>
      <div className="type__fields">
        <label className="type__field" title="Tamanho (px)">
          <span className="type__field-tag mono">px</span>
          <input
            className="input type__num"
            type="number"
            min={slot.min}
            max={slot.max}
            step={slot.step}
            value={fontSize}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              if (!Number.isNaN(n)) onSize(n);
            }}
          />
        </label>
        {slot.lh ? (
          <label className="type__field" title="Entrelinha">
            <span className="type__field-tag mono">lh</span>
            <input
              className="input type__num"
              type="number"
              min={LH_MIN}
              max={LH_MAX}
              step={LH_STEP}
              value={lineHeight}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                if (!Number.isNaN(n)) onLh(n);
              }}
            />
          </label>
        ) : (
          <span className="type__field type__field--empty" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

export default function TypographyControls() {
  const { current, updateTypeStyle, resetTypeStyles, applyTypeStylesToAll } =
    useApp();
  if (!current) return null;

  const { id, typeStyles } = current;

  // Grupos por peca (ordem: comum, convite, display).
  const groups: { title: string; slots: SlotDef[] }[] = [
    { title: 'Comum', slots: SLOTS.filter((s) => s.piece === 'ambos') },
    { title: 'Convite', slots: SLOTS.filter((s) => s.piece === 'convite') },
    { title: 'Display', slots: SLOTS.filter((s) => s.piece === 'display') },
  ];

  const onApplyAll = () => {
    if (
      window.confirm(
        'Aplicar a tipografia deste formando a TODOS os formandos? Isso sobrescreve os ajustes individuais.',
      )
    ) {
      applyTypeStylesToAll(id);
    }
  };

  return (
    <div className="type">
      <div className="type__head">
        <span className="type__title mono">
          <span className="type__kw">//</span> tipografia
        </span>
        <div className="type__actions">
          <button
            className="btn btn--ghost type__btn"
            onClick={() => resetTypeStyles(id)}
            title="Voltar a tipografia padrão do template"
          >
            resetar
          </button>
          <button
            className="btn type__btn"
            onClick={onApplyAll}
            title="Copiar esta tipografia para todos os formandos"
          >
            aplicar a todos
          </button>
        </div>
      </div>

      <div className="type__groups">
        {groups.map((g) => (
          <div className="type__group" key={g.title}>
            <div className="type__group-title">{g.title}</div>
            {g.slots.map((slot) => (
              <SlotRow
                key={slot.key}
                slot={slot}
                typeStyles={typeStyles}
                onSize={(n) => updateTypeStyle(id, slot.key, { size: n })}
                onLh={(n) => updateTypeStyle(id, slot.key, { lineHeight: n })}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
