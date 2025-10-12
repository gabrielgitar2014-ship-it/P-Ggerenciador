// src/App.jsx

import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider } from './context/FinanceContext';
import { ModalProvider } from './context/ModalContext';
import { VisibilityProvider } from './context/VisibilityContext';
import Dashboard from './pages/Dashboard';
import MainLayout from './components/MainLayout';
import PwaUpdater from './components/PwaUpdater';
import WelcomeScreen from './components/WelcomeScreen'; // 1. IMPORTAR A TELA DE BOAS-VINDAS

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

function App() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  // 2. ADICIONAR O ESTADO PARA CONTROLAR A TELA DE BOAS-VINDAS
  const [showWelcome, setShowWelcome] = useState(true);

  // 3. LÓGICA DO TIMER MOVIDA PARA CÁ
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
            {/* 4. LÓGICA DE RENDERIZAÇÃO CONDICIONAL */}
            {showWelcome ? (
              <WelcomeScreen />
            ) : (
              <MainLayout selectedMonth={selectedMonth}>
                <Dashboard
                  selectedMonth={selectedMonth}
                  onPreviousMonth={handlePreviousMonth}
                  onNextMonth={handleNextMonth}
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
