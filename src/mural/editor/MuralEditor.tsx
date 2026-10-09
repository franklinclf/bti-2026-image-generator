import { useState, type ChangeEvent, type Dispatch } from 'react';
import { MuralProvider, useMural } from '../state';
import { loadDoc, serializeDoc, type MuralAction } from '../store';
import type { MuralDoc } from '../types';
import { createDefaultDoc } from '../defaults';
import { downloadBlob } from '../download';
import MuralPreview from './MuralPreview';
import TextosTab from './TextosTab';
import HomenagensTab from './HomenagensTab';
import FormandosTab from './FormandosTab';
import TipografiaTab from './TipografiaTab';
import ExportTab from './ExportTab';
import '../mural.css';

type Tab = 'textos' | 'homenagens' | 'formandos' | 'tipografia' | 'exportar';
const TABS: [Tab, string][] = [
  ['textos', 'Textos'],
  ['homenagens', 'Homenagens'],
  ['formandos', 'Formandos'],
  ['tipografia', 'Tipografia'],
  ['exportar', 'Exportar'],
];

function saveProject(doc: MuralDoc) {
  downloadBlob(new Blob([serializeDoc(doc)], { type: 'application/json' }), 'mural-ti-2026.json');
}

async function openProject(e: ChangeEvent<HTMLInputElement>, dispatch: Dispatch<MuralAction>) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  const text = await file.text();
  try {
    const parsed = JSON.parse(text) as { version?: number };
    if (parsed.version !== 1) throw new Error('versão');
  } catch {
    alert('Arquivo de projeto inválido.');
    return;
  }
  dispatch({ type: 'LOAD', doc: loadDoc(text) });
}

function EditorBody() {
  const { doc, dispatch, model, fontError, composeError } = useMural();
  const [tab, setTab] = useState<Tab>('textos');
  const overflowCount = model?.overflows.length ?? 0;
  return (
    <div className="mural">
      <aside className="mural__side">
        <div className="mural__project">
          <button className="btn btn--ghost" onClick={() => saveProject(doc)}>Salvar projeto</button>
          <label className="btn btn--ghost">
            Abrir projeto
            <input type="file" accept="application/json,.json" hidden onChange={(e) => openProject(e, dispatch)} />
          </label>
        </div>
        <nav className="mural__tabs">
          {TABS.map(([id, label]) => (
            <button key={id} className={`mural__tab${tab === id ? ' is-active' : ''}`} onClick={() => setTab(id)}>
              {label}
              {id === 'exportar' && overflowCount > 0 && <span className="mural__badge">{overflowCount}</span>}
            </button>
          ))}
        </nav>
        <div className="mural__panel">
          {tab === 'textos' && <TextosTab />}
          {tab === 'homenagens' && <HomenagensTab />}
          {tab === 'formandos' && <FormandosTab />}
          {tab === 'tipografia' && <TipografiaTab />}
          {tab === 'exportar' && <ExportTab />}
        </div>
      </aside>
      <main className="mural__main">
        {fontError ? (
          <p className="mural__error">Erro ao carregar as fontes: {fontError}</p>
        ) : composeError ? (
          <div className="mural__error">
            <p>Não foi possível montar o mural: {composeError}</p>
            <button className="btn btn--ghost" onClick={() => dispatch({ type: 'LOAD', doc: createDefaultDoc() })}>
              Restaurar padrão
            </button>
          </div>
        ) : model ? (
          <MuralPreview model={model} />
        ) : (
          <p className="mural__loading">carregando fontes…</p>
        )}
      </main>
    </div>
  );
}

export default function MuralEditor() {
  return (
    <MuralProvider>
      <EditorBody />
    </MuralProvider>
  );
}
