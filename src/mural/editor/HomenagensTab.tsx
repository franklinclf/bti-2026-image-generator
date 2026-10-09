import { useMural } from '../state';
import type { CargoNome } from '../types';

function move<T>(list: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function PairList({ title, value, onChange }: { title: string; value: CargoNome[]; onChange: (v: CargoNome[]) => void }) {
  const set = (i: number, patch: Partial<CargoNome>) => onChange(value.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  return (
    <div className="mural-stack">
      <h3 className="mural-h">// {title}</h3>
      {value.map((it, i) => (
        <div key={i} className="mural-pair">
          <input type="text" value={it.cargo} placeholder="cargo" onChange={(e) => set(i, { cargo: e.target.value })} />
          <input type="text" value={it.nome} placeholder="nome" onChange={(e) => set(i, { nome: e.target.value })} />
          <button className="btn btn--ghost" onClick={() => onChange(move(value, i, -1))} title="Subir">↑</button>
          <button className="btn btn--ghost" onClick={() => onChange(move(value, i, 1))} title="Descer">↓</button>
          <button className="btn btn--ghost" onClick={() => onChange(value.filter((_, j) => j !== i))} title="Remover">×</button>
        </div>
      ))}
      <button className="btn btn--ghost" onClick={() => onChange([...value, { cargo: '', nome: '' }])}>+ adicionar</button>
    </div>
  );
}

function LinesList({ title, value, onChange }: { title: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <label className="mural-field">
      <span className="mural-h">// {title} (um por linha)</span>
      <textarea rows={Math.max(4, value.length + 1)} value={value.join('\n')} onChange={(e) => onChange(e.target.value.split('\n'))} />
    </label>
  );
}

export default function HomenagensTab() {
  const { doc, dispatch, model } = useMural();
  const overflows = (model?.overflows ?? []).filter((o) => o.key.startsWith('hom'));
  return (
    <div className="mural-stack">
      {overflows.length > 0 && (
        <div className="mural-overflows">
          Não cabem:
          <ul>{overflows.map((o) => <li key={o.key}>{o.label}</li>)}</ul>
        </div>
      )}
      <PairList title="corpo administrativo" value={doc.administracao} onChange={(v) => dispatch({ type: 'SET_PAIRS', list: 'administracao', value: v })} />
      <PairList title="homenageados da turma" value={doc.homenageados} onChange={(v) => dispatch({ type: 'SET_PAIRS', list: 'homenageados', value: v })} />
      <LinesList title="professores homenageados" value={doc.professores} onChange={(v) => dispatch({ type: 'SET_NAMES', list: 'professores', value: v })} />
      <LinesList title="comissão de formatura" value={doc.comissao} onChange={(v) => dispatch({ type: 'SET_NAMES', list: 'comissao', value: v })} />
    </div>
  );
}
