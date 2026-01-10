// src/pages/Dashboard.jsx

import { useState, useMemo, forwardRef, useImperativeHandle } from "react";
import { useFinance } from "../context/FinanceContext";
import { motion, AnimatePresence } from "framer-motion";

// --- IMPORTAÇÃO DAS ABAS E PÁGINAS ---
import GeneralTab from "../components/tabs/Generaltab.jsx";
import FixasTab from "../components/tabs/FixasTab.jsx";
import BancosTab from "../components/tabs/BancosTab.jsx";
import CategoriasPage from "../components/tabs/CategoriasTab.jsx";

import AllExpensesPage from "./AllExpensesPage";
import CardDetailPage from "./CardDetailPage";
import CategoryDetailPage from "./CategoryDetailPage";
import InvoiceDetailPage from "./InvoiceDetailPage"; // <--- NOVO IMPORT

// --- CONFIGURAÇÃO DE ANIMAÇÕES ---
const variants = {
  enter: (direction) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction) => ({ zIndex: 0, x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset, velocity) => Math.abs(offset) * velocity;

// --- COMPONENTE DASHBOARD ---
const Dashboard = forwardRef(({ 
  selectedMonth, 
  onPreviousMonth, 
  onNextMonth, 
  onOpenNovaDespesa 
}, ref) => {
  
  const { allParcelas, loading, error } = useFinance();
  
  // ESTADO LOCAL PARA NAVEGAÇÃO INTERNA
  const [activeView, setActiveView] = useState('geral');
  const [viewData, setViewData] = useState(null);
  
  const [[page, direction], setPage] = useState([0, 0]);

  // Função para navegar entre abas/telas internas
  const handleNavigate = (viewName, data = null) => {
    setActiveView(viewName);
    setViewData(data);
  };

  const handleBackToMain = () => handleNavigate('geral', null);

  // --- EXPOR CONTROLE PARA O PAI (HEADER) ---
  useImperativeHandle(ref, () => ({
    goToGeneral: () => {
      handleNavigate('geral', null);
    }
  }));

  const parcelasDoMesSelecionado = useMemo(() => {
    return (allParcelas || []).filter(p => p.data_parcela?.startsWith(selectedMonth));
  }, [selectedMonth, allParcelas]);

  const paginate = (newDirection) => {
    if (newDirection > 0) onNextMonth();
    else onPreviousMonth();
    setPage([page + newDirection, newDirection]);
  };

  // --- RENDERIZAÇÃO DAS TELAS ---
  const renderCurrentView = () => {
    switch (activeView) {
      case 'geral': 
        return <GeneralTab 
                  onNavigate={handleNavigate} 
                  onOpenNovaDespesa={onOpenNovaDespesa} 
                  selectedMonth={selectedMonth} 
                  parcelasDoMes={parcelasDoMesSelecionado} 
               />;
      case 'fixas': 
        return <FixasTab 
                  onBack={handleBackToMain} 
                  selectedMonth={selectedMonth} 
               />;
      case 'bancos': 
        return <BancosTab 
                  onBack={handleBackToMain} 
                  onCardClick={(banco) => handleNavigate('cardDetail', banco)} 
                  selectedMonth={selectedMonth} 
               />;
      case 'categorias': 
        return <CategoriasPage 
                  onBack={handleBackToMain} 
                  onNavigate={handleNavigate} 
               />;
      case 'categoryDetail': 
        return <CategoryDetailPage 
                  categoryName={viewData?.categoryName} 
                  dateRange={viewData?.dateRange} 
                  onBack={() => handleNavigate('categorias', null)} 
               />;
      case 'allExpenses': 
        return <AllExpensesPage 
                  onBack={handleBackToMain} 
                  onNavigate={handleNavigate} 
                  selectedMonth={selectedMonth} 
               />;
      case 'cardDetail': 
        return <CardDetailPage 
                  banco={viewData} 
                  onBack={() => handleNavigate('bancos', null)} 
                  onNavigate={handleNavigate} 
                  selectedMonth={selectedMonth} 
               />;
      
      // --- NOVA TELA DE FATURA ---
      case 'invoiceDetail':
        return <InvoiceDetailPage
                  banco={viewData} // 'viewData' contém o objeto do banco
                  selectedMonth={selectedMonth}
                  onBack={() => handleNavigate('cardDetail', viewData)} // Volta para o detalhe do cartão
               />;

      default: 
        return <GeneralTab 
                  onNavigate={handleNavigate} 
                  onOpenNovaDespesa={onOpenNovaDespesa} 
                  selectedMonth={selectedMonth} 
                  parcelasDoMes={parcelasDoMesSelecionado} 
               />;
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-center shadow-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center mt-8">
           <p className="font-semibold text-lg text-slate-600 dark:text-slate-300 animate-pulse">
             Carregando dados...
           </p>
        </div>
      ) : (
        <div className="mt-4 relative overflow-hidden h-full"> 
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={selectedMonth + activeView} 
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold) paginate(1);
                else if (swipe > swipeConfidenceThreshold) paginate(-1);
              }}
              className="h-full"
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </>
  );
});

export default Dashboard;