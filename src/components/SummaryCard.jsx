import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

// Função auxiliar para formatação de moeda
const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const SummaryCard = ({ title, value, icon: Icon, colorClass, loading, onClick, actionIcon: ActionIcon, onActionClick }) => {
  
  // Previne que o clique no botão de ação dispare o clique no card inteiro
  const handleActionClick = (e) => {
    e.stopPropagation();
    if (onActionClick) {
      onActionClick();
    }
  };

  const CardContent = () => (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon className={`h-5 w-5 ${colorClass || 'text-muted-foreground'}`} />
      </div>
      <div className="mt-4">
        {loading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <p className={`text-3xl font-bold ${colorClass || 'text-foreground'}`}>{formatCurrency(value)}</p>
        )}
      </div>
    </>
  );

  return (
    <div
      onClick={onClick}
      className={`relative bg-white dark:bg-slate-800/50 p-5 rounded-2xl shadow-sm border border-black/5 transition-all
                  ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : ''}`}
    >
      {ActionIcon && (
        <button 
          onClick={handleActionClick} 
          className="absolute top-15 right-3 w-8 h-8 rounded-full bg-red-700 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <ActionIcon className="h-4 w-4" />
        </button>
      )}
      <CardContent />
    </div>
  );
};

export default SummaryCard;