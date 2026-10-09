// Provider do mural: documento (reducer + localStorage), fontes e modelo composto.
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type Dispatch, type ReactNode } from 'react';
import type { MuralDoc } from './types';
import { STORAGE_KEY, loadDoc, muralReducer, serializeDoc, type MuralAction } from './store';
import { composeMural, type MuralModel } from './compose';
import type { FontSet } from './text/fonts';
import { loadFontsBrowser } from './text/fonts.browser';

interface MuralCtx {
  doc: MuralDoc;
  dispatch: Dispatch<MuralAction>;
  fonts: FontSet | null;
  fontError: string | null;
  model: MuralModel | null;
  composeError: string | null;
}

const Ctx = createContext<MuralCtx | null>(null);

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function MuralProvider({ children }: { children: ReactNode }) {
  const [doc, dispatch] = useReducer(muralReducer, null, () => loadDoc(readStorage()));
  const [fonts, setFonts] = useState<FontSet | null>(null);
  const [fontError, setFontError] = useState<string | null>(null);

  useEffect(() => {
    loadFontsBrowser().then(setFonts).catch((e) => setFontError(e instanceof Error ? e.message : String(e)));
  }, []);

  // Salva com debounce de 500 ms; ao desmontar ou fechar a aba grava na hora o que estiver pendente.
  const latest = useRef(doc);
  const dirty = useRef(false);
  useEffect(() => {
    latest.current = doc;
    dirty.current = true;
    const t = setTimeout(flush, 500);
    return () => clearTimeout(t);
  }, [doc]);
  useEffect(() => {
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);

  function flush() {
    if (!dirty.current) return;
    dirty.current = false;
    try {
      localStorage.setItem(STORAGE_KEY, serializeDoc(latest.current));
    } catch {
      // storage cheio ou bloqueado: segue sem salvar
    }
  }

  const { model, composeError } = useMemo(() => {
    if (!fonts) return { model: null, composeError: null };
    try {
      return { model: composeMural(doc, fonts), composeError: null };
    } catch (e) {
      return { model: null, composeError: e instanceof Error ? e.message : String(e) };
    }
  }, [doc, fonts]);
  const value = useMemo(
    () => ({ doc, dispatch, fonts, fontError, model, composeError }),
    [doc, fonts, fontError, model, composeError],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMural(): MuralCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useMural fora do MuralProvider');
  return c;
}
