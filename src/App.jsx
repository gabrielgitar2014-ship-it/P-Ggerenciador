// src/App.jsx
// (Versão 2.1 - Liquid Glass Background)

import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider } from './context/FinanceContext';
import { ModalProvider } from './context/ModalContext';
import { VisibilityProvider } from './context/VisibilityContext';
import Dashboard from './pages/Dashboard';
import MainLayout from './components/MainLayout';
import PwaUpdater from './components/PwaUpdater';
import WelcomeScreen from './components/WelcomeScreen';
import { supabase } from './supabaseClient';
import AuthPage from './pages/AuthPages';
import Chatbot from './components/Chatbot';
import { Dialog } from '@/components/ui/dialog';
import NovaDespesaModal from './components/modals/NovaDespesaModal';

// --- COMPONENTE DE FUNDO (ESSENCIAL PARA O VIDRO) ---
const LiquidBackground = () => (
  <div className="fixed inset-0 -z-50 h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
    {/* Gradiente Superior Esquerdo */}
    <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[60%] rounded-full bg-blue-300/20 dark:bg-blue-600/10 blur-[120px]" />
    {/* Gradiente Inferior Direito */}
    <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-300/20 dark:bg-purple-600/10 blur-[120px]" />
    {/* Gradiente Central Suave */}
    <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] rounded-full bg-emerald-200/10 dark:bg-emerald-500/5 blur-[100px]" />
  </div>
);

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

function App() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [view, setView] = useState({ name: 'geral', data: null });
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isNovaDespesaOpen, setIsNovaDespesaOpen] = useState(false);

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

  if (loadingSession) return <WelcomeScreen />;
  if (!session) return <AuthPage />;

  return (
    <ThemeProvider>
      {/* O Background fica fora dos providers lógicos, mas dentro do Theme */}
      <LiquidBackground />
      
      <FinanceProvider key={session.user.id}> 
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
                onOpenNovaDespesa={() => setIsNovaDespesaOpen(true)}
              />
            </MainLayout>

            <Chatbot /> 

            <Dialog open={isNovaDespesaOpen} onOpenChange={setIsNovaDespesaOpen}>
              <NovaDespesaModal 
                onClose={() => setIsNovaDespesaOpen(false)} 
              />
            </Dialog>
          
          </VisibilityProvider>
        </ModalProvider>
      </FinanceProvider>
    </ThemeProvider>
  );
}

export default App;