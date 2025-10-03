import { useState, useEffect, useMemo } from "react";
import { useFinance } from "../context/FinanceContext"; 
import Header from "../components/Header";
import WelcomeScreen from "../components/WelcomeScreen"; 
import GeneralTab from "../components/tabs/Generaltab.jsx";
import FixasTab from "../components/tabs/FixasTab.jsx";
import BancosTab from "../components/tabs/BancosTab.jsx";
import CategoriasPage from "../components/tabs/CategoriasTab.jsx";
import AllExpensesPage from "./AllExpensesPage";
import CardDetailPage from "./CardDetailPage";
import CategoryDetailPage from "./CategoryDetailPage"; // 1. IMPORTAR A NOVA PÁGINA
import NovaDespesaModal from "../components/modals/NovaDespesaModal";

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function Dashboard({ onLogout, userRole }) {
  const { allParcelas, loading, error } = useFinance();
  
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
  
  const renderCurrentView = () => {
    switch (view.name) {
      case 'geral':
        return <GeneralTab onNavigate={handleNavigate} selectedMonth={selectedMonth} parcelasDoMes={parcelasDoMesSelecionado} />;
      case 'fixas':
        return <FixasTab onBack={handleBackToMain} selectedMonth={selectedMonth} />;
      case 'bancos':
        return <BancosTab onBack={handleBackToMain} onCardClick={(banco) => handleNavigate('cardDetail', banco)} selectedMonth={selectedMonth} />;
      
      case 'categorias':
        return <CategoriasPage 
                  onBack={handleBackToMain} 
                  onNavigate={handleNavigate} // 2. PASSAR A FUNÇÃO DE NAVEGAÇÃO
               />;

      // 3. ADICIONAR O NOVO CASE PARA A PÁGINA DE DETALHES
      case 'categoryDetail':
        return <CategoryDetailPage
                  categoryName={view.data.categoryName}
                  dateRange={view.data.dateRange}
                  onBack={() => handleNavigate('categorias')} // Volta para a página de categorias
               />;

      case 'allExpenses':
        return <AllExpensesPage onBack={handleBackToMain} onNavigate={handleNavigate} selectedMonth={selectedMonth} />;
      case 'cardDetail':
        return <CardDetailPage 
          banco={view.data} 
          onBack={() => handleNavigate('bancos')} 
          onNavigate={handleNavigate}
          selectedMonth={selectedMonth} />;
      
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
