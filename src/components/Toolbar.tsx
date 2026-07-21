// Toolbar — titulo do app, importacao compacta (Dropzone) e exportacao:
// exportar todos / selecionados, toggle PDF, escala (2x/3x/4x) e barra de
// progresso ligada ao onProgress do exportGrads.
import { useState } from 'react';
import { useApp } from '../state';
import Dropzone from './Dropzone';
import { exportGrads } from '../lib/exporter';
import type { Grad, Variant } from '../types';

// Estado do progresso da exportacao em andamento.
interface Progress {
  done: number;
  total: number;
  label: string;
}

// Peca do lote: ambos os cards, so o convite ou so o display.
type Piece = 'ambos' | 'convite' | 'display';

// Traduz a peca escolhida na lista de variants passada ao exporter.
function piecesToVariants(piece: Piece): Variant[] {
  if (piece === 'convite') return ['convite'];
  if (piece === 'display') return ['display'];
  return ['convite', 'display'];
}

export default function Toolbar() {
  const { grads } = useApp();
  const [pdf, setPdf] = useState(true);
  const [scale, setScale] = useState(3); // 2x/3x/4x — 3x ~ 300 DPI no card
  const [piece, setPiece] = useState<Piece>('ambos'); // peca do lote (default Ambos)
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exporting = progress !== null;
  const selectedCount = grads.filter((g) => g.selected).length;
  const hasGrads = grads.length > 0;

  // Dispara a exportacao de um subconjunto de grads (com a peca escolhida).
  async function run(subset: Grad[]) {
    if (!subset.length || exporting) return;
    const variants = piecesToVariants(piece);
    setError(null);
    setProgress({ done: 0, total: subset.length * variants.length, label: 'preparando…' });
    try {
      await exportGrads(subset, { scale, pdf, variants }, (done, total, label) => {
        setProgress({ done, total, label });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao exportar');
    } finally {
      setProgress(null);
    }
  }

  const pct = progress && progress.total > 0
    ? Math.round((progress.done / progress.total) * 100)
    : 0;

  return (
    <header className="toolbar">
      <div className="toolbar__title">
        Formatura TI
        <small>gerador · 2026.1</small>
      </div>

      <Dropzone compact />

      <div className="toolbar__spacer" />

      {exporting ? (
        <div className="toolbar__group export-progress" role="status" aria-live="polite">
          <div className="progress">
            <div className="progress__bar" style={{ width: `${pct}%` }} />
          </div>
          <span className="mono dim export-progress__label">
            {pct}% · {progress?.label}
          </span>
        </div>
      ) : (
        <div className="toolbar__group">
          {error ? (
            <span className="mono export-error" title={error}>
              erro: {error}
            </span>
          ) : null}

          <label className="toolbar__check" title="Incluir PDF (300 DPI) além do PNG">
            <input
              type="checkbox"
              checked={pdf}
              onChange={(e) => setPdf(e.target.checked)}
            />
            PDF
          </label>

          <select
            className="select"
            value={piece}
            onChange={(e) => setPiece(e.target.value as Piece)}
            title="Peça a exportar no lote"
            aria-label="Peça a exportar"
          >
            <option value="ambos">Ambos</option>
            <option value="convite">Convite</option>
            <option value="display">Display</option>
          </select>

          <select
            className="select"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            title="Escala de exportação (resolução)"
          >
            <option value={2}>2×</option>
            <option value={3}>3×</option>
            <option value={4}>4×</option>
          </select>

          <button
            className="btn"
            onClick={() => run(grads.filter((g) => g.selected))}
            disabled={selectedCount === 0}
            title="Exportar apenas os formandos selecionados"
          >
            Exportar selecionados
            {selectedCount > 0 ? <span className="mono dim"> ({selectedCount})</span> : null}
          </button>

          <button
            className="btn btn--primary"
            onClick={() => run(grads)}
            disabled={!hasGrads}
            title="Exportar todos os formandos"
          >
            Exportar todos
          </button>
        </div>
      )}
    </header>
  );
}
