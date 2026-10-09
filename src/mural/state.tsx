// Provider do mural: documento (reducer + localStorage), fontes e modelo composto.
import { createContext, useContext, useEffect, useMemo, useReducer, useState, type Dispatch, type ReactNode } from 'react';
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

  // Salva com debounce de 500 ms.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, serializeDoc(doc));
      } catch {
        // storage cheio ou bloqueado: segue sem salvar
      }
    }, 500);
    return () => clearTimeout(t);
  }, [doc]);

  const model = useMemo(() => (fonts ? composeMural(doc, fonts) : null), [doc, fonts]);
  const value = useMemo(() => ({ doc, dispatch, fonts, fontError, model }), [doc, fonts, fontError, model]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMural(): MuralCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useMural fora do MuralProvider');
  return c;
}
