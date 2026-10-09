import { describe, expect, it } from 'vitest';
import { createDefaultDoc, FORMANDOS, SNIPPET_ORDER } from './defaults';
import { splitName } from './text/split';

describe('createDefaultDoc', () => {
  it('tem os 52 formandos com ids estaveis', () => {
    const doc = createDefaultDoc();
    expect(FORMANDOS).toHaveLength(52);
    expect(doc.formandos).toHaveLength(52);
    expect(doc.formandos[0]).toMatchObject({ id: 'f00', nome: 'ARTHUR BOMA SKEETE MYPOTO', linhasManuais: false });
    expect(doc.formandos[51].id).toBe('f51');
    expect(new Set(doc.formandos.map((f) => f.id)).size).toBe(52);
    expect(doc.formandos[8].linhas).toEqual(splitName(doc.formandos[8].nome));
  });

  it('tem o conteudo aprovado', () => {
    const doc = createDefaultDoc();
    expect(doc.turma).toBe('Sprint Sem Fim');
    expect(doc.professores).toHaveLength(16);
    expect(doc.comissao).toHaveLength(5);
    expect(doc.snippets.build.text).toBe('// sprint final · status: done ✓');
    expect(doc.snippets.sprint.text).toBe('while (sprint) aprender();');
    expect(SNIPPET_ORDER).toHaveLength(13);
    expect(doc.export).toMatchObject({ dpi: 300, bleedMm: 3, holeMm: 8 });
  });

  it('cada chamada devolve objetos independentes', () => {
    const a = createDefaultDoc();
    const b = createDefaultDoc();
    a.snippets.git.text = 'x';
    a.estilos.titulo.sizeMm = 99;
    a.professores.push('y');
    expect(b.snippets.git.text).not.toBe('x');
    expect(b.estilos.titulo.sizeMm).not.toBe(99);
    expect(b.professores).toHaveLength(16);
  });
});
