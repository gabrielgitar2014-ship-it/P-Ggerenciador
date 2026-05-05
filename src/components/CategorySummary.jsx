// src/components/CategorySummary.jsx

import { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useVisibility } from '../context/VisibilityContext';
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
};

const CategoryRow = ({ label, value, loading }) => {
  const { valuesVisible } = useVisibility();

  if (loading) {
    return (
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-2/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-700 dark:text-slate-200">{label}</span>
      <span className="font-semibold text-slate-800 dark:text-slate-100">
        {valuesVisible ? formatCurrency(value) : 'R$ ••••'}
      </span>
    </div>
  );
};

export default function CategorySummary({ selectedMonth }) {
  const { transactions, allParcelas, loading } = useFinance();
  
  const CATEGORIES_TO_SHOW = ['Alimentação', 'Outros', 'Transporte', 'Lazer & Assinaturas'];

  const categoryTotals = useMemo(() => {
    const totals = Object.fromEntries(CATEGORIES_TO_SHOW.map(cat => [cat, 0]));

    if (loading || !transactions || !allParcelas) {
      return totals;
    }

    // 1. Separa as despesas variáveis (da tabela 'despesas') e as fixas.
    const variableExpenses = transactions.filter(t => !t.is_fixed && t.type !== 'income');
    const fixedExpenses = transactions.filter(t => t.is_fixed === true);

    // 2. Cria o mapa de categorias APENAS com as despesas variáveis.
    const categoryMap = new Map(variableExpenses.map(d => [d.id, d.category]));

    // 3. Soma os gastos das PARCELAS do mês.
    const parcelasDoMes = allParcelas.filter(p => p.data_parcela?.startsWith(selectedMonth));
    parcelasDoMes.forEach(parcela => {
      const category = categoryMap.get(parcela.despesa_id);
      if (category && totals.hasOwnProperty(category)) {
        totals[category] += parcela.amount;
      }
    });

    // 4. Soma os gastos das DESPESAS FIXAS do mês.
    const fixedExpensesForMonth = fixedExpenses.filter(t => t.date?.startsWith(selectedMonth));
    fixedExpensesForMonth.forEach(expense => {
      const category = expense.category;
      if (category && totals.hasOwnProperty(category)) {
        totals[category] += expense.amount;
      }
    });

    // 5. Soma os gastos das DESPESAS VARIÁVEIS DE PAGAMENTO ÚNICO do mês.
    const singlePaymentExpenses = variableExpenses.filter(t => !t.is_parcelado && t.data_compra?.startsWith(selectedMonth));
    singlePaymentExpenses.forEach(expense => {
        const category = expense.category;
        if(category && totals.hasOwnProperty(category)) {
            totals[category] += expense.amount;
        }
    });

    return totals;
  }, [transactions, allParcelas, selectedMonth, loading]);

  return (
    <div className="bg-white/10 dark:bg-slate-800/20 p-4 rounded-2xl border border-white/20 dark:border-slate-700/50 min-h-[150px]">
      <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Gastos por Categoria</h3>
      <div className="space-y-3">
        {CATEGORIES_TO_SHOW.map(categoryName => (
          <CategoryRow
            key={categoryName}
            label={categoryName}
            value={categoryTotals[categoryName]}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}