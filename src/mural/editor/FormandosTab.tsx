import { useState, type DragEvent } from 'react';
import { useMural } from '../state';
import { matchPortraits, readImage } from '../photos';
import { pad2 } from '../compose';
import type { Photo } from '../types';
import PhotoAdjustControl from '../../components/PhotoAdjustControl';

function FotoTurma() {
  const { doc, dispatch } = useMural();
  const ft = doc.fotoTurma;
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div className="mural-stack">
      <label className="btn btn--ghost">
        {ft.photo ? `Trocar foto da turma (${ft.photo.fileName})` : 'Escolher foto da turma'}
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            try {
              const photo = await readImage(f);
              setErro(null);
              dispatch({ type: 'SET_FOTO_TURMA', photo, transform: { scale: 1, x: 0, y: 0 } });
            } catch (err) {
              setErro(err instanceof Error ? err.message : String(err));
            }
          }}
        />
      </label>
      {erro && <p className="mural__error">{erro}</p>}
      {ft.photo && (
        <PhotoAdjustControl value={ft.transform} onChange={(t) => dispatch({ type: 'SET_FOTO_TURMA', transform: t })} maxOffset={100} step={2} />
      )}
    </div>
  );
}

export default function FormandosTab() {
  const { doc, dispatch, model } = useMural();
  const [open, setOpen] = useState<string | null>(null);
  const [orphans, setOrphans] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);

  const overflowIds = new Set(
    (model?.overflows ?? []).filter((o) => o.key.startsWith('legenda:')).map((o) => o.key.split(':')[1]),
  );

  const onFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    setBusy(true);
    try {
      const results = await Promise.allSettled(list.map(readImage));
      // so os arquivos lidos entram na associacao; os indices continuam relativos a esta lista
      const files: File[] = [];
      const photos: Photo[] = [];
      const errs: string[] = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          files.push(list[i]);
          photos.push(r.value);
        } else {
          errs.push(`não foi possível ler ${list[i].name}`);
        }
      });
      setFailed(errs);
      if (!photos.length) return;
      const { matches, unmatched } = matchPortraits(doc.formandos, files.map((f) => f.name));
      dispatch({ type: 'ASSIGN_PHOTOS', photos: matches.map((m) => ({ formandoId: m.formandoId, photo: photos[m.fileIndex] })) });
      setOrphans((prev) => [...prev, ...unmatched.map((i) => photos[i])]);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onFiles(e.dataTransfer.files);
  };

  return (
    <div className="mural-stack">
      <div className="mural-drop" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
        {busy ? 'lendo retratos…' : 'Solte aqui os retratos (associados pelo nome do arquivo) ou '}
        {!busy && (
          <label className="mural-link">
            escolha arquivos
            <input type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) onFiles(e.target.files); e.target.value = ''; }} />
          </label>
        )}
      </div>

      {failed.length > 0 && (
        <div className="mural-overflows">
          <button className="btn btn--ghost" onClick={() => setFailed([])}>dispensar</button>
          <ul>{failed.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      )}

      {orphans.length > 0 && (
        <div className="mural-stack">
          <h3 className="mural-h">// retratos sem formando ({orphans.length})</h3>
          {orphans.map((p) => (
            <div key={p.url} className="mural-orphan">
              <img src={p.url} alt="" />
              <span>{p.fileName}</span>
              <select
                value=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  dispatch({ type: 'ASSIGN_PHOTOS', photos: [{ formandoId: e.target.value, photo: p }] });
                  setOrphans((o) => o.filter((x) => x.url !== p.url));
                }}
              >
                <option value="">atribuir a…</option>
                {doc.formandos.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="mural-row">
        <button className="btn btn--ghost" onClick={() => dispatch({ type: 'SORT_FORMANDOS' })}>Ordenar A–Z</button>
        <button className="btn btn--ghost" onClick={() => dispatch({ type: 'RESPLIT' })}>Recalcular quebras</button>
      </div>

      <h3 className="mural-h">// foto da turma</h3>
      <FotoTurma />

      <h3 className="mural-h">// formandos ({doc.formandos.length})</h3>
      <ol className="mural-list">
        {doc.formandos.map((f, i) => (
          <li key={f.id} className={`mural-item${overflowIds.has(f.id) ? ' has-overflow' : ''}`}>
            <div className="mural-item__head">
              <span className="mono mural-item__idx">{pad2(i)}</span>
              {f.photo ? <img className="mural-thumb" src={f.photo.url} alt="" /> : <span className="mural-thumb mural-thumb--empty" />}
              <input type="text" value={f.nome} onChange={(e) => dispatch({ type: 'SET_FORMANDO', id: f.id, patch: { nome: e.target.value } })} />
              <button className="btn btn--ghost" disabled={!f.photo} onClick={() => setOpen(open === f.id ? null : f.id)}>
                enquadrar
              </button>
            </div>
            <div className="mural-item__lines">
              <input
                type="text"
                value={f.linhas[0]}
                onChange={(e) => dispatch({ type: 'SET_FORMANDO', id: f.id, patch: { linhas: [e.target.value, f.linhas[1]] } })}
              />
              <input
                type="text"
                value={f.linhas[1]}
                onChange={(e) => dispatch({ type: 'SET_FORMANDO', id: f.id, patch: { linhas: [f.linhas[0], e.target.value] } })}
              />
            </div>
            {open === f.id && f.photo && (
              <PhotoAdjustControl
                value={f.transform}
                onChange={(t) => dispatch({ type: 'SET_FORMANDO', id: f.id, patch: { transform: t } })}
                maxOffset={100}
                step={2}
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
