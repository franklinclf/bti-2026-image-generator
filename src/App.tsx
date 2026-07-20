import { AppProvider } from './state';
import Toolbar from './components/Toolbar';
import GradList from './components/GradList';
import Preview from './components/Preview';

// Layout de tela unica: toolbar no topo, workspace (sidebar + preview).
export default function App() {
  return (
    <AppProvider>
      <div className="app">
        <Toolbar />
        <div className="workspace">
          <GradList />
          <Preview />
        </div>
      </div>
    </AppProvider>
  );
}
