import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider } from './context/FinanceContext';
import { ModalProvider } from './context/ModalContext';
import { VisibilityProvider } from './context/VisibilityContext';
import { supabase } from './supabaseClient';
// O Dialog foi removido pois causava conflito com o modal customizado
// import { Dialog } from '@/components/ui/dialog'; 

// Componentes
import Dashboard from './pages/Dashboard';
import MainLayout from './components/MainLayout';
import PwaUpdater from './components/PwaUpdater';
import WelcomeScreen from './components/WelcomeScreen';
import AuthPage from './pages/AuthPages';
import Chatbot from './components/Chatbot';
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
// Necessário para usar o hook useNavigate dentro do Router
const LeitorRouteWrapper = ({ setAiData, setIsNovaDespesaOpen }) => {
  const navigate = useNavigate();

  return (
    <LeitorDeFaturaPage 
      onClose={() => navigate(-1)} // Volta para a página anterior
      onFinish={(data) => {
        setAiData(data); // Salva os dados no estado do App
        setIsNovaDespesaOpen(true); // Reabre o modal
        navigate('/'); // Volta para a dashboard
      }}
    />
  );
};

// --- LAYOUT PROTEGIDO ---
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
    <MainLayout selectedMonth={selectedMonth} onGoToHome={handleBackToMain}>
      <Outlet context={{ 
        selectedMonth, 
        handlePreviousMonth, 
        handleNextMonth, 
        openNovaDespesa: () => setIsNovaDespesaOpen(true) 
      }} />
      <Chatbot />
      <PwaUpdater />
    </MainLayout>
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
                        handleBackToMain={() => {}}
                      />
                    }>
                      <Route path="/" element={
                        <Dashboard 
                          selectedMonth={selectedMonth}
                          onPreviousMonth={handlePreviousMonth}
                          onNextMonth={handleNextMonth}
                          onOpenNovaDespesa={() => setIsNovaDespesaOpen(true)}
                        />
                      } />
                    </Route>

                    {/* ROTA PARA O LEITOR DE FATURA (FORA DO MAIN LAYOUT PARA FULLSCREEN) */}
                    <Route path="/leitor-fatura" element={
                       <LeitorRouteWrapper 
                          setAiData={setAiData} 
                          setIsNovaDespesaOpen={setIsNovaDespesaOpen} 
                       />
                    } />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>

                  {/* MODAL GLOBAL CORRIGIDO */}
                  {/* Removemos o wrapper <Dialog> para evitar conflito de sobreposição. */}
                  {/* Agora passamos isOpen e controlamos o fechamento diretamente aqui. */}
                  <NovaDespesaModal 
                    isOpen={isNovaDespesaOpen}
                    onClose={() => {
                      setIsNovaDespesaOpen(false);
                      setAiData(null); // Limpa os dados da IA ao fechar
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