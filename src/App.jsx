// src/App.jsx
// (Versão 2.0 - Controlando o NovaDespesaModal)

import { useState, useEffect } from 'react';

// Imports dos Contextos
import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider } from './context/FinanceContext';
import { ModalProvider } from './context/ModalContext'; // <-- Ainda precisamos disto para os outros modais
import { VisibilityProvider } from './context/VisibilityContext';

// Imports dos Componentes/Páginas
import Dashboard from './pages/Dashboard';
import MainLayout from './components/MainLayout';
import PwaUpdater from './components/PwaUpdater';
import WelcomeScreen from './components/WelcomeScreen';

// Imports de Autenticação e Chatbot
import { supabase } from './supabaseClient';
import AuthPage from './pages/AuthPages';
import Chatbot from './components/ChatBot';

// --- [INÍCIO DA MUDANÇA] ---
// Imports para o novo modal
import { Dialog } from '@/components/ui/dialog';
import NovaDespesaModal from './components/modals/NovaDespesaModal';
// --- [FIM DA MUDANÇA] ---


const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

function App() {
  // Estados principais do app
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [view, setView] = useState({ name: 'geral', data: null });

  // Estados de Autenticação
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // --- [INÍCIO DA MUDANÇA] ---
  // Estado para o Novo Modal de Despesa
  const [isNovaDespesaOpen, setIsNovaDespesaOpen] = useState(false);
  // --- [FIM DA MUDANÇA] ---

  // Efeito de Autenticação (sem mudanças)
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoadingSession(false);
    };
    fetchSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // Funções de navegação (sem mudanças)
  const handleNavigate = (viewName, viewData = null) => {
    setView({ name: viewName, data: viewData });
  };
  const handleBackToMain = () => {
    setView({ name: 'geral', data: null });
  };
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

  // --- Renderização ---

  if (loadingSession) {
    return <WelcomeScreen />;
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <ThemeProvider>
      <FinanceProvider key={session.user.id}> 
        {/* O ModalProvider ainda controla os outros modais (Renda, Fixo, etc.) */}
        <ModalProvider>
          <VisibilityProvider>
            
            <PwaUpdater />
            
            <MainLayout 
              selectedMonth={selectedMonth} 
              onGoToHome={handleBackToMain}
            >
              <Dashboard
                selectedMonth={selectedMonth}
                onPreviousMonth={handlePreviousMonth}
                onNextMonth={handleNextMonth}
                view={view}
                onNavigate={handleNavigate}
                // --- [INÍCIO DA MUDANÇA] ---
                // Passa a função para ABRIR o modal
                onOpenNovaDespesa={() => setIsNovaDespesaOpen(true)}
                // --- [FIM DA MUDANÇA] ---
              />
            </MainLayout>

            <Chatbot /> 

            {/* --- [INÍCIO DA MUDANÇA] --- */}
            {/* O App.jsx agora renderiza o Dialog do NovaDespesaModal */}
            <Dialog open={isNovaDespesaOpen} onOpenChange={setIsNovaDespesaOpen}>
              <NovaDespesaModal 
                onClose={() => setIsNovaDespesaOpen(false)} 
              />
            </Dialog>
            {/* --- [FIM DA MUDANÇA] --- */}
          
          </VisibilityProvider>
        </ModalProvider>
      </FinanceProvider>
    </ThemeProvider>
  );
}

export default App;
