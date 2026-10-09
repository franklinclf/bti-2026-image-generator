import { useMural } from '../state';
import { SNIPPET_LABELS, SNIPPET_ORDER } from '../defaults';

type Field = 'titulo' | 'subtitulo' | 'turma';
const FIELDS: [Field, string][] = [
  ['titulo', 'Título'],
  ['subtitulo', 'Subtítulo (antes de "· TURMA")'],
  ['turma', 'Nome da turma'],
];

export default function TextosTab() {
  const { doc, dispatch } = useMural();
  return (
    <div className="mural-stack">
      {FIELDS.map(([f, label]) => (
        <label key={f} className="mural-field">
          <span>{label}</span>
          <input type="text" value={doc[f]} onChange={(e) => dispatch({ type: 'SET_TEXT', field: f, value: e.target.value })} />
        </label>
      ))}
      <h3 className="mural-h">// snippets</h3>
      {SNIPPET_ORDER.map((id) => {
        const s = doc.snippets[id];
        return (
          <div key={id} className="mural-snippet">
            <label className="mural-check">
              <input
                type="checkbox"
                checked={s.on}
                onChange={(e) => dispatch({ type: 'SET_SNIPPET', id, patch: { on: e.target.checked } })}
              />
              {SNIPPET_LABELS[id]}
            </label>
            {id !== 'indices' && (
              <input
                type="text"
                value={s.text}
                disabled={!s.on}
                onChange={(e) => dispatch({ type: 'SET_SNIPPET', id, patch: { text: e.target.value } })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
