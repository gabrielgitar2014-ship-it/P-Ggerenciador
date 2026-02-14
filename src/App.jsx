// src/App.jsx

import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider } from './context/FinanceContext';
import { ModalProvider } from './context/ModalContext';
import { VisibilityProvider } from './context/VisibilityContext';
import { supabase } from './supabaseClient';

// Componentes
import Dashboard from './pages/Dashboard';
import MainLayout from './components/MainLayout';
import PwaUpdater from './components/PwaUpdater';
import WelcomeScreen from './components/WelcomeScreen';
import AuthPage from './pages/AuthPages';
import Chatbot from './components/ChatBot';
import NovaDespesaModal from './components/modals/NovaDespesaModal';
import LeitorDeFaturaPage from './pages/LeitorDeFaturaPage';

// --- COMPONENTE DE FUNDO ---
const LiquidBackground = () => (
  <div className="fixed inset-0 -z-50 h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
    <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[60%] rounded-full bg-blue-300/20 dark:bg-blue-600/10 blur-[120px]" />
    <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-300/20 dark:bg-purple-600/10 blur-[120px]" />
    <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] rounded-full bg-emerald-200/10 dark:bg-emerald-500/5 blur-[100px]" />
  </div>
);

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// --- WRAPPER PARA A PÁGINA DO LEITOR ---
const LeitorRouteWrapper = ({ setAiData, setIsNovaDespesaOpen }) => {
  const navigate = useNavigate();

  return (
    <LeitorDeFaturaPage 
      onClose={() => navigate(-1)} 
      onFinish={(data) => {
        setAiData(data); 
        setIsNovaDespesaOpen(true); 
        navigate('/'); 
      }}
    />
  );
};

// --- LAYOUT PROTEGIDO (CORRIGIDO PARA O CHATBOT) ---
const ProtectedLayout = ({ 
  session, 
  selectedMonth, 
  handlePreviousMonth, 
  handleNextMonth, 
  setIsNovaDespesaOpen,
  handleBackToMain 
}) => {
  if (!session) return <Navigate to="/login" replace />;

  return (
    <>
      {/* 1. O Layout Principal fica no fundo */}
      <MainLayout selectedMonth={selectedMonth} onGoToHome={handleBackToMain}>
        <Outlet context={{ 
          selectedMonth, 
          handlePreviousMonth, 
          handleNextMonth, 
          openNovaDespesa: () => setIsNovaDespesaOpen(true) 
        }} />
      </MainLayout>

      {/* 2. Chatbot isolado: Fora do MainLayout para garantir sobreposição total */}
      {/* Usamos 'fixed' e z-index altíssimo para ele flutuar sobre Modais e Cards */}
      <div className="fixed bottom-4 right-4 z-[9999] isolate pointer-events-auto">
        <Chatbot />
      </div>

      {/* 3. PWA Updater também flutuante */}
      <PwaUpdater />
    </>
  );
};

function App() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  // Estado para controlar o modal
  const [isNovaDespesaOpen, setIsNovaDespesaOpen] = useState(false);
  // Estado para armazenar dados vindos da IA (LeitorPage)
  const [aiData, setAiData] = useState(null);

  // Referência para controlar o Dashboard (para voltar à Home pelo Header)
  const dashboardRef = useRef(null);

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

  return (
    <ThemeProvider>
      <LiquidBackground />
      <BrowserRouter>
        {session && (
            <FinanceProvider key={session.user.id}>
              <ModalProvider>
                <VisibilityProvider>
                  
                  <Routes>
                    <Route path="/login" element={!session ? <AuthPage /> : <Navigate to="/" replace />} />

                    <Route element={
                      <ProtectedLayout 
                        session={session}
                        selectedMonth={selectedMonth}
                        handlePreviousMonth={handlePreviousMonth}
                        handleNextMonth={handleNextMonth}
                        setIsNovaDespesaOpen={setIsNovaDespesaOpen}
                        handleBackToMain={() => dashboardRef.current?.goToGeneral()}
                      />
                    }>
                      <Route path="/" element={
                        <Dashboard 
                          ref={dashboardRef} 
                          selectedMonth={selectedMonth}
                          onPreviousMonth={handlePreviousMonth}
                          onNextMonth={handleNextMonth}
                          onOpenNovaDespesa={() => setIsNovaDespesaOpen(true)}
                        />
                      } />
                    </Route>

                    {/* ROTA PARA O LEITOR DE FATURA */}
                    <Route path="/leitor-fatura" element={
                       <LeitorRouteWrapper 
                          setAiData={setAiData} 
                          setIsNovaDespesaOpen={setIsNovaDespesaOpen} 
                       />
                    } />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>

                  {/* MODAL GLOBAL */}
                  <NovaDespesaModal 
                    isOpen={isNovaDespesaOpen}
                    onClose={() => {
                      setIsNovaDespesaOpen(false);
                      setAiData(null); 
                    }}
                    externalData={aiData} 
                  />

                </VisibilityProvider>
              </ModalProvider>
            </FinanceProvider>
        )}
        
        {!session && (
             <Routes>
                <Route path="*" element={<AuthPage />} />
             </Routes>
        )}
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
