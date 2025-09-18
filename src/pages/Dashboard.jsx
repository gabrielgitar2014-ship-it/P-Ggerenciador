import { useState, useEffect, useMemo } from "react";
import { useFinance } from "../context/FinanceContext"; 
import Header from "../components/Header";
// O Sidebar foi removido daqui
import WelcomeScreen from "../components/WelcomeScreen"; 
import GeneralTab from "../components/tabs/Generaltab.jsx";
import FixasTab from "../components/tabs/FixasTab.jsx";
import BancosTab from "../components/tabs/BancosTab.jsx";
import CardDetailPage from "./CardDetailPage";
import AllExpensesPage from "./AllExpensesPage";

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function Dashboard({ onLogout, userRole }) {
  const { allParcelas, loading, error, fetchData, clearAllData } = useFinance();
  
  // O estado 'view' agora controla toda a navegação principal
  const [view, setView] = useState({ name: 'geral', data: null });
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showWelcome, setShowWelcome] = useState(true);
  // O estado 'isMenuOpen' foi removido

  useEffect(() => {
    const welcomeTimer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(welcomeTimer);
  }, []); 

  // Função central para navegação que será passada para os componentes filhos
  const handleNavigate = (viewName, viewData = null) => {
    setView({ name: viewName, data: viewData });
  };
  
  const handleBackToMain = () => setView({ name: 'geral', data: null });

  const parcelasDoMesSelecionado = useMemo(() => {
    return (allParcelas || []).filter(p => p.data_parcela?.startsWith(selectedMonth));
  }, [selectedMonth, allParcelas]);
  
  const renderCurrentView = () => {
    switch (view.name) {
      case 'geral':
        return <GeneralTab onNavigate={handleNavigate} selectedMonth={selectedMonth} parcelasDoMes={parcelasDoMesSelecionado} />;
      case 'fixas':
        return <FixasTab onBack={handleBackToMain} selectedMonth={selectedMonth} />;
      case 'bancos':
        return <BancosTab onBack={handleBackToMain} onCardClick={(banco) => handleNavigate('cardDetail', banco)} selectedMonth={selectedMonth} />;
      case 'allExpenses':
        return <AllExpensesPage onBack={handleBackToMain} selectedMonth={selectedMonth} />;
      case 'cardDetail':
        return <CardDetailPage banco={view.data} onBack={() => handleNavigate('bancos')} selectedMonth={selectedMonth} />;
      default:
        return <GeneralTab onNavigate={handleNavigate} selectedMonth={selectedMonth} parcelasDoMes={parcelasDoMesSelecionado} />;
    }
  };

  if (showWelcome) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex min-h-screen bg-transparent"> 
      {/* O Sidebar e o overlay foram completamente removidos daqui */}
      
      <div className="flex-1 flex flex-col">
        <Header
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          // As props 'isMenuOpen' e 'setIsMenuOpen' foram removidas
        />
        
        <main className="container mx-auto p-4 pb-28 flex-1
            bg-white/10 dark:bg-slate-800/10
            backdrop-blur-lg
            rounded-t-2xl md:rounded-none
            border-t border-l border-r border-white/30 dark:border-slate-600/30
            shadow-lg
          ">
          {error && <div className="p-4 bg-red-500 text-white rounded-xl">{error}</div>}
          
          {loading ? (
            <div className="text-center mt-8"><p className="font-semibold text-lg dark:text-gray-200">Carregando dados...</p></div>
          ) : (
            <div className="mt-4">
              {renderCurrentView()}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
