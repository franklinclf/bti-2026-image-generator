import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  type ReactNode,
} from 'react';
import type { Grad, PhotoTransform } from './types';
import { parseNameFromFile } from './lib/parseName';

// Transform inicial neutro (foto centralizada, sem zoom extra).
const DEFAULT_TRANSFORM: PhotoTransform = { scale: 1, x: 0, y: 0 };

interface State {
  grads: Grad[];
  currentId: string | null;
}

type Action =
  | { type: 'ADD'; grads: Grad[] }
  | { type: 'REMOVE'; id: string }
  | { type: 'NOME'; id: string; nome: string }
  | { type: 'TRANSFORM'; id: string; transform: PhotoTransform }
  | { type: 'TOGGLE'; id: string }
  | { type: 'SELECT_ALL'; value: boolean }
  | { type: 'CURRENT'; id: string | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD': {
      const grads = [...state.grads, ...action.grads];
      // Se nada estava selecionado como current, seleciona o primeiro novo.
      const currentId = state.currentId ?? action.grads[0]?.id ?? null;
      return { grads, currentId };
    }
    case 'REMOVE': {
      const grads = state.grads.filter((g) => g.id !== action.id);
      let currentId = state.currentId;
      if (currentId === action.id) {
        currentId = grads[0]?.id ?? null;
      }
      // Libera a URL do objeto removido.
      const removed = state.grads.find((g) => g.id === action.id);
      if (removed) URL.revokeObjectURL(removed.url);
      return { grads, currentId };
    }
    case 'NOME':
      return {
        ...state,
        grads: state.grads.map((g) =>
          g.id === action.id ? { ...g, nome: action.nome } : g,
        ),
      };
    case 'TRANSFORM':
      return {
        ...state,
        grads: state.grads.map((g) =>
          g.id === action.id ? { ...g, transform: action.transform } : g,
        ),
      };
    case 'TOGGLE':
      return {
        ...state,
        grads: state.grads.map((g) =>
          g.id === action.id ? { ...g, selected: !g.selected } : g,
        ),
      };
    case 'SELECT_ALL':
      return {
        ...state,
        grads: state.grads.map((g) => ({ ...g, selected: action.value })),
      };
    case 'CURRENT':
      return { ...state, currentId: action.id };
    default:
      return state;
  }
}

// API exposta pelo store.
interface AppApi {
  grads: Grad[];
  currentId: string | null;
  current: Grad | null;
  addFiles(files: FileList | File[]): void;
  removeGrad(id: string): void;
  updateNome(id: string, nome: string): void;
  updateTransform(id: string, t: PhotoTransform): void;
  toggleSelect(id: string): void;
  setSelectAll(v: boolean): void;
  setCurrent(id: string | null): void;
}

const AppContext = createContext<AppApi | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    grads: [],
    currentId: null,
  });

  const api = useMemo<AppApi>(() => {
    return {
      grads: state.grads,
      currentId: state.currentId,
      current: state.grads.find((g) => g.id === state.currentId) ?? null,
      addFiles(files) {
        const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
        const novos: Grad[] = arr.map((file) => ({
          id: crypto.randomUUID(),
          nome: parseNameFromFile(file.name),
          fileName: file.name,
          url: URL.createObjectURL(file),
          transform: { ...DEFAULT_TRANSFORM },
          selected: true,
        }));
        if (novos.length) dispatch({ type: 'ADD', grads: novos });
      },
      removeGrad(id) {
        dispatch({ type: 'REMOVE', id });
      },
      updateNome(id, nome) {
        dispatch({ type: 'NOME', id, nome });
      },
      updateTransform(id, t) {
        dispatch({ type: 'TRANSFORM', id, transform: t });
      },
      toggleSelect(id) {
        dispatch({ type: 'TOGGLE', id });
      },
      setSelectAll(v) {
        dispatch({ type: 'SELECT_ALL', value: v });
      },
      setCurrent(id) {
        dispatch({ type: 'CURRENT', id });
      },
    };
  }, [state]);

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}

export function useApp(): AppApi {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp precisa estar dentro de <AppProvider>');
  return ctx;
}
