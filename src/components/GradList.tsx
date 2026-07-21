import { useState, type CSSProperties } from 'react';
import { useApp } from '../state';
import Dropzone from './Dropzone';
import { exportGrads } from '../lib/exporter';
import type { Grad, Variant } from '../types';

// Sidebar esquerda: lista editavel dos formandos.
export default function GradList() {
  const { grads, currentId, updateNome, updateGender, removeGrad, toggleSelect, setSelectAll, setCurrent } = useApp();

  const total = grads.length;
  const selecionados = grads.filter((g) => g.selected).length;
  const allSelected = total > 0 && selecionados === total;

  return (
    <aside className="gradlist">
      {/* cabecalho: contagem + selecionar todos */}
      <div style={header}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={allSelected}
            // Estado indeterminado quando ha selecao parcial.
            ref={(el) => {
              if (el) el.indeterminate = selecionados > 0 && !allSelected;
            }}
            onChange={(e) => setSelectAll(e.target.checked)}
            disabled={total === 0}
          />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Selecionar todos</span>
        </label>
        <span className="mono dim" style={{ fontSize: 11 }}>
          {selecionados}/{total}
        </span>
      </div>

      {/* lista rolavel */}
      <div style={{ flex: '1 1 auto', overflowY: 'auto' }}>
        {total === 0 ? (
          <p className="dim" style={{ padding: '16px', fontSize: 13, lineHeight: 1.5 }}>
            Nenhum formando importado ainda. Use a area abaixo para adicionar as fotos.
          </p>
        ) : (
          <ul style={{ listStyle: 'none' }}>
            {grads.map((g) => (
              <Row
                key={g.id}
                grad={g}
                active={g.id === currentId}
                onSelect={() => setCurrent(g.id)}
                onToggle={() => toggleSelect(g.id)}
                onRename={(nome) => updateNome(g.id, nome)}
                onGender={(gender) => updateGender(g.id, gender)}
                onRemove={() => removeGrad(g.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* dropzone fixo no rodape da sidebar */}
      <div style={{ padding: 12, borderTop: '1px solid var(--line)' }}>
        <Dropzone />
      </div>
    </aside>
  );
}

interface RowProps {
  grad: Grad;
  active: boolean;
  onSelect(): void;
  onToggle(): void;
  onRename(nome: string): void;
  onGender(gender: 'M' | 'F'): void;
  onRemove(): void;
}

function Row({ grad, active, onSelect, onToggle, onRename, onGender, onRemove }: RowProps) {
  // Estado local do download individual (evita cliques concorrentes por linha).
  const [busy, setBusy] = useState<Variant | 'ambos' | null>(null);

  const rowStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '8px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid var(--line)',
    borderLeft: `3px solid ${active ? 'var(--gold-bright)' : 'transparent'}`,
    background: active ? 'rgba(212,175,55,0.07)' : 'transparent',
  };

  // Download individual: 1 formando, peca(s) escolhida(s). Como sera 1 arquivo
  // por peca (com PDF vira 2 => zip; sem PDF e 1 peca => download direto),
  // usamos os padroes do app (escala 3x, com PDF).
  async function download(variants: Variant[], key: Variant | 'ambos') {
    if (busy) return;
    setBusy(key);
    try {
      await exportGrads([grad], { scale: 3, pdf: true, variants });
    } finally {
      setBusy(null);
    }
  }

  return (
    <li style={rowStyle} onClick={onSelect}>
      {/* linha 1: selecao + thumb + nome + remover */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* checkbox de selecao (nao propaga p/ nao trocar o current) */}
        <input
          type="checkbox"
          checked={grad.selected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          title="Selecionar para exportacao"
        />

        {/* thumbnail */}
        <img
          src={grad.url}
          alt={grad.nome}
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            objectFit: 'cover',
            flex: '0 0 auto',
            border: '1px solid var(--line)',
            background: 'var(--navy-800)',
          }}
        />

        {/* nome editavel */}
        <input
          className="input"
          value={grad.nome}
          onChange={(e) => onRename(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="Nome do formando"
          style={{ flex: '1 1 auto', minWidth: 0, padding: '5px 8px', fontSize: 13 }}
        />

        {/* remover */}
        <button
          className="btn btn--ghost"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Remover"
          aria-label={`Remover ${grad.nome}`}
          style={{ flex: '0 0 auto', padding: '4px 8px', fontSize: 13, lineHeight: 1 }}
        >
          &times;
        </button>
      </div>

      {/* linha 2: toggle M/F + downloads individuais */}
      <div
        className="row__controls"
        onClick={(e) => e.stopPropagation()}
      >
        {/* toggle genero: formando (M) / formanda (F) */}
        <div className="gender" role="group" aria-label="Gênero">
          <button
            type="button"
            className={`gender__opt${grad.gender === 'M' ? ' is-active' : ''}`}
            onClick={() => onGender('M')}
            aria-pressed={grad.gender === 'M'}
            title="Formando"
          >
            Formando
          </button>
          <button
            type="button"
            className={`gender__opt${grad.gender === 'F' ? ' is-active' : ''}`}
            onClick={() => onGender('F')}
            aria-pressed={grad.gender === 'F'}
            title="Formanda"
          >
            Formanda
          </button>
        </div>

        {/* downloads individuais */}
        <div className="row__dl" title="Baixar peça deste formando">
          <button
            type="button"
            className="btn btn--ghost row__dl-btn"
            onClick={() => download(['convite'], 'convite')}
            disabled={busy !== null}
            title="Baixar convite"
          >
            {busy === 'convite' ? '…' : 'Convite'}
          </button>
          <button
            type="button"
            className="btn btn--ghost row__dl-btn"
            onClick={() => download(['display'], 'display')}
            disabled={busy !== null}
            title="Baixar display"
          >
            {busy === 'display' ? '…' : 'Display'}
          </button>
          <button
            type="button"
            className="btn btn--ghost row__dl-btn"
            onClick={() => download(['convite', 'display'], 'ambos')}
            disabled={busy !== null}
            title="Baixar convite + display"
          >
            {busy === 'ambos' ? '…' : 'Ambos'}
          </button>
        </div>
      </div>
    </li>
  );
}

const header: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px',
  borderBottom: '1px solid var(--line)',
  background: 'var(--navy-850)',
  position: 'sticky',
  top: 0,
  zIndex: 1,
};
