import { describe, expect, it } from 'vitest';
import { createDefaultDoc, DEFAULT_ESTILOS } from './defaults';
import { loadDoc, muralReducer, serializeDoc } from './store';

const photo = { url: 'blob:a', fileName: 'a.jpg', w: 10, h: 12 };

describe('muralReducer', () => {
  it('edita snippet sem mexer nos outros', () => {
    const d = muralReducer(createDefaultDoc(), { type: 'SET_SNIPPET', id: 'git', patch: { on: false } });
    expect(d.snippets.git).toEqual({ text: createDefaultDoc().snippets.git.text, on: false });
    expect(d.snippets.return.on).toBe(true);
  });

  it('mudar o nome recalcula as linhas, a menos que tenham sido editadas', () => {
    let d = muralReducer(createDefaultDoc(), { type: 'SET_FORMANDO', id: 'f00', patch: { nome: 'ANA MARIA SOUZA' } });
    expect(d.formandos[0].linhas).toEqual(['ANA MARIA', 'SOUZA']);
    d = muralReducer(d, { type: 'SET_FORMANDO', id: 'f00', patch: { linhas: ['ANA', 'MARIA SOUZA'] } });
    expect(d.formandos[0].linhasManuais).toBe(true);
    d = muralReducer(d, { type: 'SET_FORMANDO', id: 'f00', patch: { nome: 'ANA MARIA SOUZA LIMA' } });
    expect(d.formandos[0].linhas).toEqual(['ANA', 'MARIA SOUZA']);
    d = muralReducer(d, { type: 'RESPLIT' });
    expect(d.formandos[0]).toMatchObject({ linhas: ['ANA MARIA', 'SOUZA LIMA'], linhasManuais: false });
  });

  it('ordena alfabeticamente (pt-BR)', () => {
    let d = createDefaultDoc();
    d = muralReducer(d, { type: 'SET_FORMANDO', id: 'f51', patch: { nome: 'AARAO' } });
    d = muralReducer(d, { type: 'SORT_FORMANDOS' });
    expect(d.formandos[0].id).toBe('f51');
  });

  it('atribui fotos e zera o enquadramento', () => {
    let d = muralReducer(createDefaultDoc(), { type: 'SET_FORMANDO', id: 'f02', patch: { transform: { scale: 2, x: 5, y: 5 } } });
    d = muralReducer(d, { type: 'ASSIGN_PHOTOS', photos: [{ formandoId: 'f02', photo }] });
    expect(d.formandos[2]).toMatchObject({ photo, transform: { scale: 1, x: 0, y: 0 } });
  });

  it('estilos: editar e resetar', () => {
    let d = muralReducer(createDefaultDoc(), { type: 'SET_STYLE', slot: 'titulo', patch: { sizeMm: 30 } });
    expect(d.estilos.titulo.sizeMm).toBe(30);
    d = muralReducer(d, { type: 'RESET_STYLE', slot: 'titulo' });
    expect(d.estilos.titulo).toEqual(DEFAULT_ESTILOS.titulo);
    d = muralReducer(d, { type: 'SET_STYLE', slot: 'legenda', patch: { sizeMm: 9 } });
    d = muralReducer(d, { type: 'RESET_STYLE' });
    expect(d.estilos).toEqual(DEFAULT_ESTILOS);
  });
});

describe('persistencia', () => {
  it('serializa sem fotos e recarrega igual', () => {
    let d = createDefaultDoc();
    d = muralReducer(d, { type: 'ASSIGN_PHOTOS', photos: [{ formandoId: 'f00', photo }] });
    d = muralReducer(d, { type: 'SET_FOTO_TURMA', photo, transform: { scale: 1.2, x: 0, y: 3 } });
    d = muralReducer(d, { type: 'SET_TEXT', field: 'turma', value: 'Outra' });
    const raw = serializeDoc(d);
    expect(raw).not.toContain('blob:a');
    const back = loadDoc(raw);
    expect(back.turma).toBe('Outra');
    expect(back.formandos[0].photo).toBeUndefined();
    expect(back.fotoTurma).toEqual({ transform: { scale: 1.2, x: 0, y: 3 } });
  });

  it('entrada invalida volta ao padrao', () => {
    expect(loadDoc(null)).toEqual(createDefaultDoc());
    expect(loadDoc('{nao json')).toEqual(createDefaultDoc());
    expect(loadDoc(JSON.stringify({ version: 2 }))).toEqual(createDefaultDoc());
  });

  it('completa chaves que faltam com o padrao', () => {
    const back = loadDoc(JSON.stringify({ version: 1, titulo: 'X', snippets: { git: { text: 'g', on: true } } }));
    expect(back.titulo).toBe('X');
    expect(back.snippets.git.text).toBe('g');
    expect(back.snippets.return).toEqual(createDefaultDoc().snippets.return);
    expect(back.formandos).toHaveLength(52);
    expect(back.export.files.corte).toBe(true);
  });
});
