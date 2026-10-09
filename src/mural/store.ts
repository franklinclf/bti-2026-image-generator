// Reducer e persistencia do mural (puro, testavel sem React).
import type {
  CargoNome, ExportOptions, FontId, MuralDoc, MuralFormando, Photo, PhotoTransform, SlotKey, SlotStyle, Snippet, SnippetId,
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

const MAX_FORMANDOS = 52;
const FONT_IDS: FontId[] = ['fraunces', 'space-grotesk', 'sora', 'jetbrains-mono'];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';

function cleanStyle(raw: unknown, def: SlotStyle): SlotStyle {
  const s = { ...def, ...(isObj(raw) ? raw : {}) } as SlotStyle;
  const ok =
    FONT_IDS.includes(s.font) && (s.weight === 400 || s.weight === 600) && typeof s.italic === 'boolean' &&
    isNum(s.sizeMm) && s.sizeMm > 0 && isNum(s.tracking);
  return ok ? s : { ...def };
}

function cleanSnippet(raw: unknown, def: Snippet): Snippet {
  if (!isObj(raw)) return { ...def };
  return { text: isStr(raw.text) ? raw.text : def.text, on: typeof raw.on === 'boolean' ? raw.on : def.on };
}

function cleanTransform(raw: unknown): PhotoTransform {
  if (isObj(raw) && isNum(raw.scale) && isNum(raw.x) && isNum(raw.y)) return { scale: raw.scale, x: raw.x, y: raw.y };
  return { ...IDENTITY };
}

function cleanFormandos(raw: unknown, fallback: MuralFormando[]): MuralFormando[] {
  if (!Array.isArray(raw)) return fallback;
  const valid = raw.filter((f): f is Record<string, unknown> => isObj(f) && isStr(f.nome)).slice(0, MAX_FORMANDOS);
  if (valid.length === 0) return fallback;
  const used = new Set<string>();
  for (const f of valid) if (isStr(f.id) && !used.has(f.id)) used.add(f.id);
  const seen = new Set<string>();
  let next = 0;
  return valid.map((f) => {
    let id = isStr(f.id) && !seen.has(f.id) ? f.id : '';
    if (!id) {
      do id = `f${String(next++).padStart(2, '0')}`;
      while (used.has(id) || seen.has(id));
    }
    seen.add(id);
    const nome = f.nome as string;
    const l = f.linhas;
    const okLinhas = Array.isArray(l) && l.length === 2 && isStr(l[0]) && isStr(l[1]);
    return {
      id,
      nome,
      linhas: okLinhas ? [l[0] as string, l[1] as string] : splitName(nome),
      linhasManuais: okLinhas && f.linhasManuais === true,
      transform: cleanTransform(f.transform),
    };
  });
}

function cleanPairs(raw: unknown, fallback: CargoNome[]): CargoNome[] {
  if (!Array.isArray(raw)) return fallback;
  return raw.filter(isObj).filter((p) => isStr(p.cargo) && isStr(p.nome)).map((p) => ({ cargo: p.cargo as string, nome: p.nome as string }));
}

function cleanNames(raw: unknown, fallback: string[]): string[] {
  return Array.isArray(raw) ? raw.filter(isStr) : fallback;
}

// Aceita projeto parcial ou malformado: o que nao for valido volta ao padrao.
export function loadDoc(raw: string | null): MuralDoc {
  const base = createDefaultDoc();
  if (!raw) return base;
  try {
    const d = JSON.parse(raw) as Partial<MuralDoc>;
    if (!isObj(d) || d.version !== 1) return base;
    const snip: Record<string, unknown> = isObj(d.snippets) ? d.snippets : {};
    const est: Record<string, unknown> = isObj(d.estilos) ? d.estilos : {};
    const exp: Partial<ExportOptions> = isObj(d.export) ? d.export : {};
    return {
      ...base,
      ...d,
      version: 1,
      titulo: isStr(d.titulo) ? d.titulo : base.titulo,
      subtitulo: isStr(d.subtitulo) ? d.subtitulo : base.subtitulo,
      turma: isStr(d.turma) ? d.turma : base.turma,
      snippets: Object.fromEntries(
        (Object.keys(base.snippets) as SnippetId[]).map((k) => [k, cleanSnippet(snip[k], base.snippets[k])]),
      ) as Record<SnippetId, Snippet>,
      estilos: Object.fromEntries(
        (Object.keys(base.estilos) as SlotKey[]).map((k) => [k, cleanStyle(est[k], base.estilos[k])]),
      ) as Record<SlotKey, SlotStyle>,
      administracao: cleanPairs(d.administracao, base.administracao),
      homenageados: cleanPairs(d.homenageados, base.homenageados),
      professores: cleanNames(d.professores, base.professores),
      comissao: cleanNames(d.comissao, base.comissao),
      export: {
        ...base.export,
        ...exp,
        files: { ...base.export.files, ...(isObj(exp.files) ? exp.files : {}) },
        formats: { ...base.export.formats, ...(isObj(exp.formats) ? exp.formats : {}) },
      },
      formandos: cleanFormandos(d.formandos, base.formandos),
      fotoTurma: { transform: isObj(d.fotoTurma) ? cleanTransform(d.fotoTurma.transform) : base.fotoTurma.transform },
    };
  } catch {
    return base;
  }
}
