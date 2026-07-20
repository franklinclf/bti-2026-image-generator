import type { CSSProperties } from 'react';
import { useApp } from '../state';
import Dropzone from './Dropzone';
import type { Grad } from '../types';

// Sidebar esquerda: lista editavel dos formandos.
export default function GradList() {
  const { grads, currentId, updateNome, removeGrad, toggleSelect, setSelectAll, setCurrent } = useApp();

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
  onRemove(): void;
}

function Row({ grad, active, onSelect, onToggle, onRename, onRemove }: RowProps) {
  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid var(--line)',
    borderLeft: `3px solid ${active ? 'var(--gold-bright)' : 'transparent'}`,
    background: active ? 'rgba(212,175,55,0.07)' : 'transparent',
  };

  return (
    <li style={rowStyle} onClick={onSelect}>
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
