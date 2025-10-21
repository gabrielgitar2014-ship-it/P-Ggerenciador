// src/App.jsx

import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider } from './context/FinanceContext';
import { ModalProvider } from './context/ModalContext';
import { VisibilityProvider } from './context/VisibilityContext';
import Dashboard from './pages/Dashboard';
import MainLayout from './components/MainLayout';
import PwaUpdater from './components/PwaUpdater';
import WelcomeScreen from './components/WelcomeScreen';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

function App() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showWelcome, setShowWelcome] = useState(true);

  // <<< INÍCIO DA CORREÇÃO (Lifting State Up) >>>
  
  // 1. O estado da 'view' (navegação) agora mora aqui.
  const [view, setView] = useState({ name: 'geral', data: null });

  // 2. As funções de navegação moram aqui.
  const handleNavigate = (viewName, viewData = null) => {
    setView({ name: viewName, data: viewData });
  };
  
  // 3. A função "Home" mora aqui.
  const handleBackToMain = () => {
    setView({ name: 'geral', data: null });
  };
  
  // <<< FIM DA CORREÇÃO >>>


  useEffect(() => {
    const welcomeTimer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(welcomeTimer);
  }, []);

  const handlePreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 2, 1);
    setSelectedMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month, 1);
    setSelectedMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <ThemeProvider>
      <FinanceProvider>
        <ModalProvider>
          <VisibilityProvider>
            <PwaUpdater />
            {showWelcome ? (
              <WelcomeScreen />
            ) : (
              // 4. Passa a função 'handleBackToMain' para o MainLayout
              <MainLayout 
                selectedMonth={selectedMonth} 
                onGoToHome={handleBackToMain}
              >
                {/* 5. Passa o estado 'view' e a função 'handleNavigate' para o Dashboard */}
                <Dashboard
                  selectedMonth={selectedMonth}
                  onPreviousMonth={handlePreviousMonth}
                  onNextMonth={handleNextMonth}
                  view={view}
                  onNavigate={handleNavigate}
                />
              </MainLayout>
            )}
          </VisibilityProvider>
        </ModalProvider>
      </FinanceProvider>
    </ThemeProvider>
  );
}

export default App;