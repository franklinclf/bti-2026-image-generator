// Reducer e persistencia do mural (puro, testavel sem React).
import type {
  CargoNome, ExportOptions, MuralDoc, MuralFormando, Photo, PhotoTransform, SlotKey, SlotStyle, Snippet, SnippetId,
} from './types';
import { createDefaultDoc, DEFAULT_ESTILOS } from './defaults';
import { splitName } from './text/split';

export const STORAGE_KEY = 'mural-ti-2026:v1';

export type MuralAction =
  | { type: 'SET_TEXT'; field: 'titulo' | 'subtitulo' | 'turma'; value: string }
  | { type: 'SET_SNIPPET'; id: SnippetId; patch: Partial<Snippet> }
  | { type: 'SET_PAIRS'; list: 'administracao' | 'homenageados'; value: CargoNome[] }
  | { type: 'SET_NAMES'; list: 'professores' | 'comissao'; value: string[] }
  | { type: 'SET_FORMANDO'; id: string; patch: Partial<Omit<MuralFormando, 'id'>> }
  | { type: 'SORT_FORMANDOS' }
  | { type: 'RESPLIT' }
  | { type: 'ASSIGN_PHOTOS'; photos: { formandoId: string; photo: Photo }[] }
  | { type: 'SET_FOTO_TURMA'; photo?: Photo; transform?: PhotoTransform }
  | { type: 'SET_STYLE'; slot: SlotKey; patch: Partial<SlotStyle> }
  | { type: 'RESET_STYLE'; slot?: SlotKey }
  | { type: 'SET_EXPORT'; patch: Partial<ExportOptions> }
  | { type: 'LOAD'; doc: MuralDoc };

const IDENTITY: PhotoTransform = { scale: 1, x: 0, y: 0 };

function applyFormandoPatch(f: MuralFormando, patch: Partial<Omit<MuralFormando, 'id'>>): MuralFormando {
  const next: MuralFormando = { ...f, ...patch };
  if (patch.linhas) next.linhasManuais = true;
  else if (patch.nome !== undefined && !f.linhasManuais) next.linhas = splitName(patch.nome);
  return next;
}

export function muralReducer(doc: MuralDoc, a: MuralAction): MuralDoc {
  switch (a.type) {
    case 'SET_TEXT':
      return { ...doc, [a.field]: a.value };
    case 'SET_SNIPPET':
      return { ...doc, snippets: { ...doc.snippets, [a.id]: { ...doc.snippets[a.id], ...a.patch } } };
    case 'SET_PAIRS':
      return { ...doc, [a.list]: a.value };
    case 'SET_NAMES':
      return { ...doc, [a.list]: a.value };
    case 'SET_FORMANDO':
      return { ...doc, formandos: doc.formandos.map((f) => (f.id === a.id ? applyFormandoPatch(f, a.patch) : f)) };
    case 'SORT_FORMANDOS':
      return { ...doc, formandos: [...doc.formandos].sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR')) };
    case 'RESPLIT':
      return { ...doc, formandos: doc.formandos.map((f) => ({ ...f, linhas: splitName(f.nome), linhasManuais: false })) };
    case 'ASSIGN_PHOTOS': {
      const m = new Map(a.photos.map((p) => [p.formandoId, p.photo]));
      return {
        ...doc,
        formandos: doc.formandos.map((f) => (m.has(f.id) ? { ...f, photo: m.get(f.id), transform: { ...IDENTITY } } : f)),
      };
    }
    case 'SET_FOTO_TURMA':
      return {
        ...doc,
        fotoTurma: { photo: a.photo ?? doc.fotoTurma.photo, transform: a.transform ?? doc.fotoTurma.transform },
      };
    case 'SET_STYLE':
      return { ...doc, estilos: { ...doc.estilos, [a.slot]: { ...doc.estilos[a.slot], ...a.patch } } };
    case 'RESET_STYLE':
      return {
        ...doc,
        estilos: a.slot ? { ...doc.estilos, [a.slot]: { ...DEFAULT_ESTILOS[a.slot] } } : structuredClone(DEFAULT_ESTILOS),
      };
    case 'SET_EXPORT':
      return { ...doc, export: { ...doc.export, ...a.patch } };
    case 'LOAD':
      return a.doc;
    default:
      return doc;
  }
}

// Fotos (blob URLs) nunca sao salvas.
export function serializeDoc(doc: MuralDoc): string {
  const formandos = doc.formandos.map((f) => {
    const { photo, ...rest } = f;
    void photo;
    return rest;
  });
  return JSON.stringify({ ...doc, formandos, fotoTurma: { transform: doc.fotoTurma.transform } });
}

export function loadDoc(raw: string | null): MuralDoc {
  const base = createDefaultDoc();
  if (!raw) return base;
  try {
    const d = JSON.parse(raw) as Partial<MuralDoc>;
    if (!d || d.version !== 1) return base;
    return {
      ...base,
      ...d,
      version: 1,
      snippets: { ...base.snippets, ...d.snippets },
      estilos: { ...base.estilos, ...d.estilos },
      export: {
        ...base.export,
        ...d.export,
        files: { ...base.export.files, ...d.export?.files },
        formats: { ...base.export.formats, ...d.export?.formats },
      },
      formandos:
        Array.isArray(d.formandos) && d.formandos.length > 0
          ? d.formandos.map((f) => ({ ...f, photo: undefined }))
          : base.formandos,
      fotoTurma: { transform: d.fotoTurma?.transform ?? base.fotoTurma.transform },
    };
  } catch {
    return base;
  }
}
