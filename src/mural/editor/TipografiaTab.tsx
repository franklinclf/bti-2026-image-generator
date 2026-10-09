import { useMural } from '../state';
import { SLOT_LABELS, SLOT_ORDER } from '../defaults';
import { ITALIC_FONTS } from '../text/fonts';
import NumberField from './NumberField';
import type { FontId, SlotStyle } from '../types';

const FONTS: [FontId, string][] = [
  ['fraunces', 'Fraunces'],
  ['space-grotesk', 'Space Grotesk'],
  ['sora', 'Sora'],
  ['jetbrains-mono', 'JetBrains Mono'],
];
const CAP = 0.7; // altura aproximada da caixa alta em relacao ao corpo
const MIN_CAP_MM = 2.5;

export default function TipografiaTab() {
  const { doc, dispatch } = useMural();
  return (
    <div className="mural-stack">
      <p className="mural-hint">
        Tamanho = corpo da fonte em mm. A caixa alta tem ≈ 70% do corpo; abaixo de {MIN_CAP_MM} mm de caixa alta
        (corpo ≈ 3,6 mm) a leitura fica difícil a mais de um passo de distância.
      </p>
      <button className="btn btn--ghost" onClick={() => dispatch({ type: 'RESET_STYLE' })}>Resetar tudo</button>
      {SLOT_ORDER.map((slot) => {
        const s = doc.estilos[slot];
        const set = (patch: Partial<SlotStyle>) => dispatch({ type: 'SET_STYLE', slot, patch });
        const cap = s.sizeMm * CAP;
        return (
          <fieldset key={slot} className="mural-type">
            <legend>{SLOT_LABELS[slot]}</legend>
            <select
              value={s.font}
              onChange={(e) => {
                const font = e.target.value as FontId;
                set({ font, italic: ITALIC_FONTS.includes(font) ? s.italic : false });
              }}
            >
              {FONTS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <select value={s.weight} onChange={(e) => set({ weight: Number(e.target.value) as 400 | 600 })}>
              <option value={400}>Regular</option>
              <option value={600}>Semibold</option>
            </select>
            <label>
              mm
              <NumberField value={s.sizeMm} min={1} max={80} clamp onCommit={(v) => set({ sizeMm: v })} />
            </label>
            <label>
              tracking
              <NumberField value={s.tracking} min={-0.1} max={0.5} clamp onCommit={(v) => set({ tracking: v })} />
            </label>
            <label className="mural-check">
              <input type="checkbox" checked={s.italic} disabled={!ITALIC_FONTS.includes(s.font)}
                onChange={(e) => set({ italic: e.target.checked })} />
              itálico
            </label>
            <span className={`mural-cap${cap < MIN_CAP_MM ? ' is-low' : ''}`}>caixa alta ≈ {cap.toFixed(1)} mm</span>
            <button className="btn btn--ghost" onClick={() => dispatch({ type: 'RESET_STYLE', slot })}>resetar</button>
          </fieldset>
        );
      })}
    </div>
  );
}
