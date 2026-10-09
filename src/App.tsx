import { lazy, Suspense, useState } from 'react';
import { AppProvider } from './state';
import Toolbar from './components/Toolbar';
import GradList from './components/GradList';
import Preview from './components/Preview';
import ErrorBoundary from './components/ErrorBoundary';

const MuralEditor = lazy(() => import('./mural/editor/MuralEditor'));

type Mode = 'pecas' | 'mural';

// Dois modos: convite/display (tela original, intacta) e mural de vidro.
// Os dois ficam montados depois da primeira visita (so um fica visivel), para nao perder trabalho ao alternar.
export default function App() {
  const [mode, setMode] = useState<Mode>('pecas');
  const [muralSeen, setMuralSeen] = useState(false);
  const go = (m: Mode) => {
    if (m === 'mural') setMuralSeen(true);
    setMode(m);
  };
  return (
    <div className="app-shell">
      <nav className="app-modes">
        <button className={mode === 'pecas' ? 'is-active' : ''} onClick={() => go('pecas')}>Convite / Display</button>
        <button className={mode === 'mural' ? 'is-active' : ''} onClick={() => go('mural')}>Mural</button>
      </nav>
      <div className="app-shell__body">
        <div className="app-mode" hidden={mode !== 'pecas'}>
          <AppProvider>
            <div className="app">
              <Toolbar />
              <div className="workspace">
                <GradList />
                <Preview />
              </div>
            </div>
          </AppProvider>
        </div>
        {muralSeen && (
          <div className="app-mode" hidden={mode !== 'mural'}>
            <ErrorBoundary
              fallback={
                <p className="mural__loading">
                  Não foi possível carregar o mural. <button onClick={() => window.location.reload()}>Recarregar</button>
                </p>
              }
            >
              <Suspense fallback={<p className="mural__loading">carregando…</p>}>
                <MuralEditor />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}
