import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider } from './context/FinanceContext';
import { ModalProvider } from './context/ModalContext';
import { VisibilityProvider } from './context/VisibilityContext'; // Importar
import Dashboard from './pages/Dashboard';
import PwaUpdater from './components/PwaUpdater';

function App() {
  return (
    <ThemeProvider>
      <FinanceProvider>
        <ModalProvider>
          {/* Envolver a aplicação com o novo provedor */}
          <VisibilityProvider>
            <PwaUpdater />
            <Dashboard />
          </VisibilityProvider>
        </ModalProvider>
      </FinanceProvider>
    </ThemeProvider>
  );
}

export default App;
