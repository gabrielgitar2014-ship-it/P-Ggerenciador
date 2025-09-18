import { useState, useEffect, useMemo } from "react";
import { useFinance } from "../context/FinanceContext"; 
import Header from "../components/Header";
import WelcomeScreen from "../components/WelcomeScreen"; 
import GeneralTab from "../components/tabs/Generaltab.jsx";
import FixasTab from "../components/tabs/FixasTab.jsx";
import BancosTab from "../components/tabs/BancosTab.jsx";
import CardDetailPage from "./CardDetailPage";
import AllExpensesPage from "./AllExpensesPage";
import NovaDespesaModal from "../components/modals/NovaDespesaModal";

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function Dashboard({ onLogout, userRole }) {
  const { allParcelas, loading, error, fetchData, clearAllData } = useFinance();
  
  const [view, setView] = useState({ name: 'geral', data: null });
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  
  // ALTERADO: O estado inicial agora verifica o sessionStorage.
  // Ele só será 'true' se o item 'hasSeenWelcome' NÃO existir.
  const [showWelcome, setShowWelcome] = useState(() => !sessionStorage.getItem('hasSeenWelcome'));

  // ALTERADO: A lógica do useEffect foi aprimorada.
  useEffect(() => {
    // O timer só é ativado se a tela de boas-vindas precisar ser mostrada.
    if (showWelcome) {
      const welcomeTimer = setTimeout(() => {
        setShowWelcome(false);
        // ADICIONADO: Marca no sessionStorage que a tela já foi vista nesta sessão.
        sessionStorage.setItem('hasSeenWelcome', 'true');
      }, 3000);
      return () => clearTimeout(welcomeTimer);
    }
  }, [showWelcome]); // A dependência agora é 'showWelcome' para maior clareza.

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
        return <AllExpensesPage onBack={handleBackToMain} onNavigate={handleNavigate} selectedMonth={selectedMonth} />;
      case 'cardDetail':
        return <CardDetailPage 
          banco={view.data} 
          onBack={() => handleNavigate('bancos')} 
          onNavigate={handleNavigate}
          selectedMonth={selectedMonth} 
        />;
      case 'novaDespesa':
        return <NovaDespesaModal onBack={handleBackToMain} />;
      case 'editarDespesa':
        return <NovaDespesaModal onBack={handleBackToMain} despesaParaEditar={view.data} />;
      default:
        return <GeneralTab onNavigate={handleNavigate} selectedMonth={selectedMonth} parcelasDoMes={parcelasDoMesSelecionado} />;
    }
  };

  if (showWelcome) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex min-h-screen bg-transparent"> 
      <div className="flex-1 flex flex-col">
        <Header
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
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

