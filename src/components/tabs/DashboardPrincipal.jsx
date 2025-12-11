// src/pages/Dashboard.jsx

import { useState, useMemo } from "react";
import { useFinance } from "../context/FinanceContext";
import GeneralTab from "../components/tabs/Generaltab.jsx";
import FixasTab from "../components/tabs/FixasTab.jsx";
import BancosTab from "../components/tabs/BancosTab.jsx";
import CategoriasPage from "../components/tabs/CategoriasTab.jsx";
import AllExpensesPage from "./AllExpensesPage";
import CardDetailPage from "./CardDetailPage";
import CategoryDetailPage from "./CategoryDetailPage";
import { motion, AnimatePresence } from "framer-motion";

const variants = {
  enter: (direction) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction) => ({ zIndex: 0, x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset, velocity) => Math.abs(offset) * velocity;

export default function Dashboard({ 
  selectedMonth, 
  onPreviousMonth, 
  onNextMonth, 
  onOpenNovaDespesa 
}) {
  
  const { allParcelas, loading, error } = useFinance();
  
  // ESTADO LOCAL PARA NAVEGAÇÃO INTERNA (Substitui o antigo 'view' prop)
  const [activeView, setActiveView] = useState('geral');
  const [viewData, setViewData] = useState(null);
  
  const [[page, direction], setPage] = useState([0, 0]);

  // Função para navegar entre abas/telas internas
  const handleNavigate = (viewName, data = null) => {
    // Se for tentar editar/criar, usamos o handler do App.jsx (se necessário expandir lógica futura)
    // Por enquanto, mantemos as views de conteúdo
    setActiveView(viewName);
    setViewData(data);
  };

  const handleBackToMain = () => handleNavigate('geral', null);

  const parcelasDoMesSelecionado = useMemo(() => {
    return (allParcelas || []).filter(p => p.data_parcela?.startsWith(selectedMonth));
  }, [selectedMonth, allParcelas]);

  const paginate = (newDirection) => {
    if (newDirection > 0) onNextMonth();
    else onPreviousMonth();
    setPage([page + newDirection, newDirection]);
  };

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
      // Removidos os cases de 'novaDespesa' e 'editarDespesa' pois agora são globais no App.jsx
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
      {/* Ajuste de cor no erro: Estilo Glass em vez de sólido */}
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
              key={selectedMonth + activeView} // Adicionado activeView na key para animar transição de abas se desejar
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
              // Adicionada classe 'h-full' para garantir que o container ocupe o espaço
              className="h-full"
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </>
  );
}