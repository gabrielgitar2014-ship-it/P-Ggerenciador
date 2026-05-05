// src/components/RecentActivity.jsx

import { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useVisibility } from '../context/VisibilityContext';
import { ArrowDownCircle } from 'lucide-react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
};

// 1. O componente agora recebe 'selectedMonth' como uma propriedade.
export default function RecentActivity({ selectedMonth }) {
  const { transactions } = useFinance(); 
  const { valuesVisible } = useVisibility();

  const recentExpenses = useMemo(() => {
    // 2. AQUI ESTÁ A CORREÇÃO: Adicionamos um filtro para que a busca
    //    considere apenas as despesas cuja 'data_compra' pertence ao mês selecionado.
    const expensesForMonth = transactions.filter(t => 
      !t.is_fixed && 
      t.type !== 'income' && 
      t.data_compra?.startsWith(selectedMonth) // Filtro de mês crucial
    );

    // 3. Ordenamos essas despesas (já filtradas pelo mês) pela data de criação
    //    para encontrar as mais recentemente adicionadas dentro daquele mês.
    const sortedExpenses = expensesForMonth.sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    // 4. Retornamos as 5 últimas entradas do mês selecionado.
    return sortedExpenses.slice(0, 5);
  }, [transactions, selectedMonth]); // 5. 'selectedMonth' é adicionado como dependência.

  return (
    <div className="bg-white/10 dark:bg-slate-800/20 p-4 rounded-2xl border border-white/20 dark:border-slate-700/50 min-h-[250px]">
      <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Últimas Despesas Registradas</h3>
      <div className="space-y-2">
        {recentExpenses.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-10">
            <p>Nenhuma despesa registrada para este mês.</p>
          </div>
        ) : (
          recentExpenses.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center justify-between p-2 rounded-lg hover:bg-white/20 dark:hover-bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ArrowDownCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <span className="text-sm text-slate-800 dark:text-slate-100 truncate">
                  {item.description}
                </span>
              </div>
              <span className="text-sm font-semibold text-red-600 dark:text-red-400 pl-2">
                {valuesVisible ? formatCurrency(item.amount) : 'R$ ••••'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}