import { useState, useEffect, useMemo } from "react";
import { useFinance } from "../context/FinanceContext"; 
import Header from "../components/Header";
import WelcomeScreen from "../components/WelcomeScreen"; 
import GeneralTab from "../components/tabs/Generaltab.jsx";
import FixasTab from "../components/tabs/FixasTab.jsx";
import BancosTab from "../components/tabs/BancosTab.jsx";
import CardDetailPage from "./CardDetailPage";
import AllExpensesPage from "./AllExpensesPage";

// 1. IMPORTAR O COMPONENTE QUE AGORA É UMA PÁGINA
import NovaDespesaModal from "../components/modals/NovaDespesaModal";

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function Dashboard({ onLogout, userRole }) {
  const { allParcelas, loading, error, fetchData, clearAllData } = useFinance();
  
  const [view, setView] = useState({ name: 'geral', data: null });
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const welcomeTimer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(welcomeTimer);
  }, []); 

  const handleNavigate = (viewName, viewData = null) => {
    setView({ name: viewName, data: viewData });
  };
  
  const handleBackToMain = () => setView({ name: 'geral', data: null });

  const parcelasDoMesSelecionado = useMemo(() => {
    return (allParcelas || []).filter(p => p.data_parcela?.startsWith(selectedMonth));
  }, [selectedMonth, allParcelas]);
  
  // 2. ADICIONAR A LÓGICA DE RENDERIZAÇÃO
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
    onNavigate={handleNavigate} // <-- ESTA LINHA É A SOLUÇÃO
    selectedMonth={selectedMonth}  />;
      
      // 👇 NOVOS CASOS ADICIONADOS AQUI 👇
      case 'novaDespesa':
        // Renderiza o componente como uma página, passando a função 'onBack'
        return <NovaDespesaModal onBack={handleBackToMain} />;
      case 'editarDespesa':
        // Renderiza o mesmo componente, mas com os dados da despesa para editar
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
