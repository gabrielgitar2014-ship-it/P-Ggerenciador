// src/components/tabs/RendaTab.jsx

import { useFinance } from "../../context/FinanceContext"; 
import { supabase } from "../../supabaseClient";
import { Trash2 } from "lucide-react"; // Adicionado ícone de lixeira para exclusão

export default function RendaTab({ selectedMonth }) {
  const { transactions, syncNow, fetchData } = useFinance(); 
  const refreshData = syncNow || fetchData || (() => {}); 

  // Função mantida e adaptada para uso direto no botão
  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta renda? A ação é permanente.")) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
        console.error("Erro ao excluir renda:", error);
        alert(`Ocorreu um erro ao excluir: ${error.message}`);
      } else {
        refreshData(); // Atualiza a lista via FinanceContext
      }
    }
  };

  // Garante que transactions seja um array para evitar erros
  const safeTransactions = transactions || [];

  const monthlyIncomes = safeTransactions.filter((t) => t.date?.startsWith(selectedMonth) && t.type === "income");
  const totalIncome = monthlyIncomes.reduce((sum, income) => sum + income.amount, 0);
  
  const formatCurrency = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Rendas do Mês</h2>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg shadow-black/5 border border-slate-200 dark:border-slate-700">
          <h4 className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Total de Renda no Mês</h4>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
      </div>

      <div className="space-y-3">
        {monthlyIncomes.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-5 rounded-2xl">
            Nenhuma renda registrada para este mês.
          </div>
        ) : (
          monthlyIncomes.map((income) => (
            <div 
              key={income.id} 
              className="w-full flex justify-between items-center p-4 rounded-xl transition-all duration-200 border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md"
            >
              <div className="flex flex-col">
                <span className="font-medium text-slate-700 dark:text-slate-200">{income.description}</span>
                {income.date && (
                   <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                     {income.date.split('-').reverse().join('/')}
                   </span>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(income.amount)}
                </span>
                <button 
                  onClick={() => handleDelete(income.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  aria-label="Excluir renda"
                  title="Excluir renda"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
