import { useState } from 'react';
import { AppProvider } from './state';
import Toolbar from './components/Toolbar';
import GradList from './components/GradList';
import Preview from './components/Preview';
import MuralEditor from './mural/editor/MuralEditor';

type Mode = 'pecas' | 'mural';

// Dois modos: convite/display (tela original, intacta) e mural de vidro.
export default function App() {
  const [mode, setMode] = useState<Mode>('pecas');
  return (
    <div className="app-shell">
      <nav className="app-modes">
        <button className={mode === 'pecas' ? 'is-active' : ''} onClick={() => setMode('pecas')}>Convite / Display</button>
        <button className={mode === 'mural' ? 'is-active' : ''} onClick={() => setMode('mural')}>Mural</button>
      </nav>
      <div className="app-shell__body">
        {mode === 'pecas' ? (
          <AppProvider>
            <div className="app">
              <Toolbar />
              <div className="workspace">
                <GradList />
                <Preview />
              </div>
            </div>
          </AppProvider>
        ) : (
          <MuralEditor />
        )}
      </div>
    </div>
  );
}
