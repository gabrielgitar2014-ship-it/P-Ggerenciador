import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider } from './context/FinanceContext';
import { ModalProvider } from './context/ModalContext';
import Dashboard from './pages/Dashboard';
import PwaUpdater from './components/PwaUpdater';

function App() {
  return (
    <ThemeProvider>
      {/* 👇 A ORDEM FOI CORRIGIDA AQUI 👇 */}
      <FinanceProvider>
        <ModalProvider>
          <PwaUpdater />
          <Dashboard />
        </ModalProvider>
      </FinanceProvider>
    </ThemeProvider>
  );
}

export default App;