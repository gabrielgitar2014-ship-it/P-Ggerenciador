import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import CartaoPersonalizado from '../CartaoPersonalizado';
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from 'lucide-react';

const BancosTab = ({ onCardClick, selectedMonth, onBack }) => {
  const { bancos, getSaldoPorBanco, loading } = useFinance();

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in-down">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack} 
          className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-slate-700/50 transition-colors"
          aria-label="Voltar para a tela principal"
        >
          <ArrowLeft className="w-6 h-6 dark:text-white" />
        </button>
        <h1 className="text-2xl font-bold dark:text-white">Meus Cartões e Contas</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          [...Array(4)].map((_, index) => (
            <Skeleton key={index} className="w-full h-44 rounded-xl" />
          ))
        ) : bancos.length > 0 ? (
          bancos.map(banco => (
            <CartaoPersonalizado
              key={banco.id}
              banco={banco}
              saldo={getSaldoPorBanco(banco, selectedMonth)}
              isSelected={false}
              onClick={() => onCardClick(banco)}
            />
          ))
        ) : (
          <div className="w-full text-center text-muted-foreground p-8 md:col-span-2">
            <p>Nenhum banco cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BancosTab;
