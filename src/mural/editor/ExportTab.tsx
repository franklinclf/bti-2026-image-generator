import { useState } from 'react';
import { useMural } from '../state';
import type { ExportFileId, ExportOptions } from '../types';
import { FILE_LABELS, FILE_ORDER, planFiles, zipName } from '../export/plan';
import { exportMural, type Progress } from '../export/bundle';
import { downloadBlob } from '../download';

export default function ExportTab() {
  const { doc, dispatch, model } = useMural();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const o = doc.export;
  const set = (patch: Partial<ExportOptions>) => dispatch({ type: 'SET_EXPORT', patch });
  const count = planFiles(o).length;

  const run = async () => {
    if (!model) return;
    setBusy(true);
    setErrors([]);
    try {
      const res = await exportMural(doc, model, setProgress);
      setErrors(res.errors);
      downloadBlob(res.blob, zipName(new Date()));
    } catch (e) {
      setErrors([e instanceof Error ? e.message : String(e)]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mural-stack">
      {model && model.overflows.length > 0 && (
        <div className="mural-overflows">
          {model.overflows.length} texto(s) não cabem (o export continua permitido):
          <ul>{model.overflows.map((x) => <li key={x.key}>{x.label}</li>)}</ul>
        </div>
      )}

      <h3 className="mural-h">// peças</h3>
      <div className="mural-files">
        {FILE_ORDER.map((id: ExportFileId) => (
          <label key={id} className="mural-check">
            <input type="checkbox" checked={o.files[id]} onChange={(e) => set({ files: { ...o.files, [id]: e.target.checked } })} />
            {FILE_LABELS[id]}
          </label>
        ))}
      </div>

      <h3 className="mural-h">// formatos</h3>
      <div className="mural-row">
        {(['pdf', 'svg', 'png'] as const).map((f) => (
          <label key={f} className="mural-check">
            <input type="checkbox" checked={o.formats[f]} onChange={(e) => set({ formats: { ...o.formats, [f]: e.target.checked } })} />
            {f.toUpperCase()}
          </label>
        ))}
        <label className="mural-check">
          PNG
          <select value={o.dpi} onChange={(e) => set({ dpi: Number(e.target.value) as 150 | 300 })}>
            <option value={300}>300 DPI</option>
            <option value={150}>150 DPI</option>
          </select>
        </label>
      </div>

      <h3 className="mural-h">// produção</h3>
      <label className="mural-field">
        <span>Sangria (mm): {o.bleedMm.toFixed(1)}</span>
        <input type="range" min={0} max={5} step={0.5} value={o.bleedMm} onChange={(e) => set({ bleedMm: Number(e.target.value) })} />
      </label>
      <label className="mural-field">
        <span>Diâmetro dos furos (mm)</span>
        <input type="text" inputMode="decimal" value={o.holeMm}
          onChange={(e) => { const v = Number(e.target.value.replace(',', '.')); if (v > 0) set({ holeMm: v }); }} />
      </label>
      <p className="mural-hint">
        PDF e SVG saem com texto em contornos. O zip traz também <code>montagem.txt</code> (posição de cada peça e dos furos).
      </p>

      <button className="btn btn--primary" disabled={busy || !model || count === 0} onClick={run}>
        {busy ? 'Exportando…' : `Exportar ${count} arquivo(s) (.zip)`}
      </button>

      {progress && busy && (
        <div className="mural-stack">
          <div className="mural-progress"><div style={{ width: `${(progress.done / progress.total) * 100}%` }} /></div>
          <span className="mural-hint">{progress.current}</span>
        </div>
      )}

      {errors.length > 0 && (
        <div className="mural-overflows">
          Avisos e erros:
          <ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
