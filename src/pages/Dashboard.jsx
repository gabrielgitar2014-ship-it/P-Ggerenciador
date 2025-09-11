import { useState, useEffect, useMemo } from "react";
import { useFinance } from "../context/FinanceContext"; 
import Header from "../components/Header";
import Sidebar from "../components/Sidebar"; 
import WelcomeScreen from "../components/WelcomeScreen"; 
import GeneralTab from "../components/tabs/Generaltab.jsx";
import FixasTab from "../components/tabs/FixasTab.jsx";
import BancosTab from "../components/tabs/BancosTab.jsx";
import CardDetailPage from "./CardDetailPage";
import AllExpensesPage from "./AllExpensesPage"; // ✅ 1. IMPORTE A NOVA PÁGINA

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function Dashboard({ onLogout, userRole }) {
  const { allParcelas, loading, error, fetchData, clearAllData } = useFinance();
  
  const [view, setView] = useState({ name: 'tabs', data: null });
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'geral');
  const [showWelcome, setShowWelcome] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const welcomeTimer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(welcomeTimer);
  }, []); 

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (view.name !== 'tabs') {
      setView({ name: 'tabs', data: null });
    }
  }, [activeTab]);

  const handleNavigateToCard = (banco) => setView({ name: 'cardDetail', data: banco });
  const handleBackToTabs = () => setView({ name: 'tabs', data: null });
  // ✅ 2. CRIE A FUNÇÃO PARA NAVEGAR PARA A TELA DE TODAS AS DESPESAS
  const handleNavigateToAllExpenses = () => setView({ name: 'allExpenses', data: null });

  const parcelasDoMesSelecionado = useMemo(() => {
    return (allParcelas || []).filter(p => p.data_parcela?.startsWith(selectedMonth));
  }, [selectedMonth, allParcelas]);
  
  const tabComponents = {
    // ✅ 3. PASSE A NOVA FUNÇÃO COMO PROP PARA A GENERALTAB
    geral: <GeneralTab selectedMonth={selectedMonth} parcelasDoMes={parcelasDoMesSelecionado} onHealthCardClick={handleNavigateToAllExpenses} />,
    fixas: <FixasTab selectedMonth={selectedMonth} />,
    bancos: <BancosTab onCardClick={handleNavigateToCard} selectedMonth={selectedMonth} />,
  };

  const renderCurrentView = () => {
    // ✅ 4. ADICIONE A LÓGICA PARA RENDERIZAR A NOVA PÁGINA
    if (view.name === 'allExpenses') {
      return <AllExpensesPage onBack={handleBackToTabs} selectedMonth={selectedMonth} />;
    }
    if (view.name === 'cardDetail') {
      return <CardDetailPage banco={view.data} onBack={handleBackToTabs} selectedMonth={selectedMonth} />;
    }
    return tabComponents[activeTab];
  };

  if (showWelcome) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSync={fetchData}
        onClearData={clearAllData}
        loading={loading}
        onLogout={onLogout}
        userRole={userRole}
      />
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
      
      <div className="flex-1 flex flex-col">
        <Header
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />
        
        <main className="container mx-auto p-4 pb-28 flex-1">
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