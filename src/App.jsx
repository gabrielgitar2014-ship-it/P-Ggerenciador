// src/App.jsx

import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider } from './context/FinanceContext';
import { ModalProvider } from './context/ModalContext';
import { VisibilityProvider } from './context/VisibilityContext';
import Dashboard from './pages/Dashboard';
import MainLayout from './components/MainLayout';
import PwaUpdater from './components/PwaUpdater';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

function App() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  // LÓGICA DE NAVEGAÇÃO DE MÊS - AGORA CENTRALIZADA AQUI
  const handlePreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 2, 1); // month - 2 para voltar um mês
    setSelectedMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month, 1); // month (sem subtrair) para avançar um mês
    setSelectedMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <ThemeProvider>
      <FinanceProvider>
        <ModalProvider>
          <VisibilityProvider>
            <PwaUpdater />
            <MainLayout 
              selectedMonth={selectedMonth} 
              // Não passamos mais o setSelectedMonth para o MainLayout/Header
            >
              <Dashboard 
                selectedMonth={selectedMonth} 
                onPreviousMonth={handlePreviousMonth} // Passando a função para o Dashboard
                onNextMonth={handleNextMonth}     // Passando a função para o Dashboard
              />
            </MainLayout>
          </VisibilityProvider>
        </ModalProvider>
      </FinanceProvider>
    </ThemeProvider>
  );
}

export default App;