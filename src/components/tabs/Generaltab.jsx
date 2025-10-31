// src/components/tabs/Generaltab.jsx

import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useModal } from '../../context/ModalContext';
import { useVisibility } from '../../context/VisibilityContext';
import SummaryCard from '../SummaryCard'; 
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown, Pin, Landmark, PieChart } from 'lucide-react';
import RecentActivity from '../RecentActivity';
import CategorySummary from '../CategorySummary';

const NavigationIcon = ({ icon: Icon, label, onClick }) => (
  <div className="flex flex-col items-center gap-2">
    <button 
      onClick={onClick} 
      className="w-16 h-16 bg-white/10 dark:bg-slate-800/20 rounded-full shadow-lg border border-white/20 dark:border-slate-700/50 
                 flex items-center justify-center 
                 hover:bg-white/20 dark:hover:bg-slate-700/50 
                 transition-all duration-200 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
      aria-label={label}
    >
      <Icon className="w-7 h-7 text-purple-800 dark:text-purple-400" />
    </button>
    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</p>
  </div>
);

const getFinancialHealth = (income, expense) => {
  if (income === 0 && expense > 0) return { status: "Crítico", style: "bg-gradient-to-br from-slate-800 to-black", message: "Você tem despesas mas nenhuma renda registrada para este mês." };
  if (income === 0) return { status: "Indefinido", style: "bg-slate-500", message: "Nenhuma renda registrada para este mês." };
  const percentage = (expense / income) * 100;
  if (percentage <= 65) return { status: "Saudável", style: "bg-gradient-to-br from-green-500 to-emerald-600", message: "Seus gastos estão sob controle. Ótimo trabalho!" };
  if (percentage <= 75) return { status: "Cuidado", style: "bg-gradient-to-br from-orange-500 to-amber-600", message: "Seus gastos estão aumentando. Fique atento!" };
  if (percentage <= 95) return { status: "Ruim", style: "bg-gradient-to-br from-red-500 to-rose-600", message: "Gastos elevados. É hora de revisar o orçamento." };
  return { status: "Crítico", style: "bg-gradient-to-br from-slate-800 to-black", message: "Alerta! Seus gastos superaram sua renda." };
};

export default function GeneralTab({ selectedMonth, parcelasDoMes, onNavigate }) {
  const { transactions, loading, saveIncome } = useFinance();
  const { showModal } = useModal();
  const { valuesVisible } = useVisibility();

  const formatCurrency = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  const financialSummary = useMemo(() => {
    if (!transactions) return { income: 0, totalExpense: 0, balance: 0 };

    // --- INÍCIO DA CORREÇÃO DE LÓGICA ---

    // 1. Cálculo da Renda (tabela 'transactions')
    const income = transactions
      .filter(t => t.type === 'income' && t.date?.startsWith(selectedMonth))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // 2. Cálculo de Despesas Fixas (tabela 'transactions')
    const despesasFixasDoMes = transactions.filter(
      (t) =>
        t.type === 'expense' &&
        t.is_fixed === true &&
        t.date?.startsWith(selectedMonth)
    );

    // 3. Despesas Variáveis (Parceladas e Avulsas/PIX da tabela 'parcelas')
    // A prop 'parcelasDoMes' já contém todas as parcelas corretas para o mês,
    // (incluindo as de 1x, conforme sua regra de negócio).

    // 4. Combina todas as despesas (Fixas + Parcelas)
    const allExpenses = [
      ...despesasFixasDoMes,
      ...(parcelasDoMes || [])
    ];

    // 5. Soma o total
    const totalExpense = allExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // 6. Calcula o saldo
    const balance = income - totalExpense;
    
    // --- FIM DA CORREÇÃO DE LÓGICA ---
    
    return { income, totalExpense, balance };
  }, [selectedMonth, transactions, parcelasDoMes]);
  
  const monthlyIncomes = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(t => t.type === 'income' && t.date.startsWith(selectedMonth));
  }, [selectedMonth, transactions]);

  const health = getFinancialHealth(financialSummary.income, financialSummary.totalExpense);
  
  const handleEditIncome = (income) => showModal('novaRenda', { 
    incomeToEdit: income, 
    onSave: saveIncome 
  });
  
  const handleAddNewIncome = () => showModal('novaRenda', { 
    onSave: saveIncome 
  });
  
  return (
    <div className="space-y-6 animate-fade-in-down">
      
      <div className="text-center">
        <p className="text-lg text-slate-700 dark:text-slate-200">Olá, seu saldo é</p>
        <p className={`text-4xl font-bold ${financialSummary.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-500'}`}>
          {loading ? <Skeleton className="h-10 w-48 mx-auto" /> : (valuesVisible ? formatCurrency(financialSummary.balance) : 'R$ ••••')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <SummaryCard 
              size="small"
              title="Renda do Mês" 
              value={financialSummary.income} 
              icon={ArrowUp} 
              colorClass="text-green-500" 
              loading={loading}
              onClick={() => showModal('listaRendas', { 
                  incomes: monthlyIncomes, 
                  onEdit: handleEditIncome,
                  onAddNew: handleAddNewIncome
              })} 
              isClickable={true} // <-- CORREÇÃO: Adicionado para garantir que o modal de renda abra.
            />
            <SummaryCard 
              size="small"
              title="Despesas do Mês" 
              value={financialSummary.totalExpense} 
              icon={ArrowDown} 
              colorClass="text-red-500" 
              loading={loading} 
              onClick={() => onNavigate('novaDespesa')} 
              isClickable={true} 
            />
          </div>
          <RecentActivity selectedMonth={selectedMonth} />
        </div>

        <div className="space-y-6">
          {loading ? (
            <Skeleton className="h-full rounded-2xl" />
          ) : (
            <div 
              onClick={() => onNavigate('allExpenses')} 
              className={`p-5 rounded-2xl shadow-lg text-white ${health.style} cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.99] min-h-[100px] flex flex-col justify-center`}
            >
              <h3 className="font-bold text-lg">{health.status}</h3>
              <p className="text-sm opacity-90">{health.message}</p>
            </div>
          )}
          <CategorySummary selectedMonth={selectedMonth} />
        </div>
      </div>
      
      <div className="pt-4">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Explorar Seções</h3>
        <div className="flex justify-center items-center gap-6 sm:gap-8 py-4">
          <NavigationIcon 
            icon={Pin}
            label="Fixas"
            onClick={() => onNavigate('fixas')}
          />
          <NavigationIcon 
            icon={Landmark}
            label="Bancos"
            onClick={() => onNavigate('bancos')}
          />
          <NavigationIcon 
            icon={PieChart}
            label="Categorias"
            onClick={() => onNavigate('categorias')}
          />
        </div>
      </div>
    </div>
  );
}
