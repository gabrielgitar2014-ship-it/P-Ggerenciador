// src/components/tabs/FixasTab.jsx

import { useState, useMemo } from "react";
import { useFinance } from "../../context/FinanceContext";
import { useModal } from "../../context/ModalContext";

export default function FixasTab({ selectedMonth }) {
  // Certifique-se de que 'deleteDespesa' está sendo importado do contexto
  const { transactions, fetchData, saveFixedExpense, deleteDespesa } = useFinance();
  const { showModal, hideModal } = useModal();

  const [transactionToEdit, setTransactionToEdit] = useState(null);

  const handleSave = async (expenseData) => {
    try {
      await saveFixedExpense(expenseData);
      fetchData();
      hideModal();
      setTransactionToEdit(null);
    } catch (error) {
      console.error("Falha ao salvar a despesa fixa:", error);
      alert(`Não foi possível salvar a despesa: ${error.message}`);
    }
  };

  const handleOpenEditModal = (transaction) => {
    setTransactionToEdit(transaction);
    showModal('newFixedExpense', { transactionToEdit: transaction, onSave: handleSave });
  };

  const handleOpenNewModal = () => {
    setTransactionToEdit(null);
    showModal('newFixedExpense', { onSave: handleSave });
  };

  // ✅ --- ESTA É A FUNÇÃO CORRETA ---
  // Ela recebe o objeto 'expense' completo e abre um modal de confirmação.
  const handleDelete = (expense) => {
    // Verificação para garantir que a função do contexto existe
    if (!deleteDespesa) {
        console.error("Função deleteDespesa não foi encontrada no contexto!");
        alert("Erro crítico: A função para deletar não está disponível.");
        return;
    }
    
    showModal('confirmation', {
      title: 'Confirmar Exclusão',
      description: `Você tem certeza que deseja excluir a despesa "${expense.description}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Sim, Excluir',
      onConfirm: async () => {
        try {
          // A lógica de exclusão real acontece aqui, dentro do onConfirm.
          await deleteDespesa(expense);
          console.log("Despesa deletada com sucesso!");
          fetchData(); // Atualiza a lista após a exclusão
          hideModal(); // Fecha o modal de confirmação
        } catch(error) {
            console.error("Erro ao deletar despesa:", error);
            alert(`Erro ao tentar excluir: ${error.message}`);
        }
      }
    });
  };

  const handleShowDetails = (expense) => {
    showModal('transactionDetail', {
      transaction: expense,
      onEdit: () => handleOpenEditModal(expense),
      // Aqui, garantimos que a função handleDelete correta (a de cima) seja chamada
      onDelete: () => handleDelete(expense)
    });
  };

  const handleTogglePaidStatus = async (expense) => {
    console.log("Alterando status de pagamento para:", !expense.paid);
    // Lembre-se de implementar a lógica de update no Supabase aqui
    fetchData();
  };

  const monthlyFixedExpenses = useMemo(() => {
    return transactions.filter((t) => t.date?.startsWith(selectedMonth) && t.type === "expense" && t.is_fixed);
  }, [transactions, selectedMonth]);

  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.date && t.date.startsWith(selectedMonth) && t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, selectedMonth]);

  const totalFixedExpenses = monthlyFixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const percentage = totalIncome > 0 ? (totalFixedExpenses / totalIncome) * 100 : 0;
  const barWidth = Math.min(percentage, 100);
  const formatCurrency = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Despesas Fixas</h2>
        <button onClick={handleOpenNewModal} className="flex items-center gap-2 bg-gradient-to-br from-red-500 to-rose-600 text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity shadow-md">
          <span className="material-symbols-outlined">add</span>Nova Despesa Fixa
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg shadow-black/5 border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex justify-between items-center text-lg">
          <span className="text-slate-600 dark:text-slate-300">Total de Despesas Fixas:</span>
          <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(totalFixedExpenses)}</span>
        </div>
        {totalIncome > 0 && (
          <div>
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mb-1">
              <span>Consumo da Renda</span>
              <span>{percentage.toFixed(2)}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
              <div className="bg-gradient-to-r from-red-500 to-rose-500 h-4 rounded-full transition-all duration-500" style={{ width: `${barWidth}%` }}></div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {monthlyFixedExpenses.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-5 rounded-2xl">Nenhuma despesa fixa registrada para este mês.</div>
        ) : (
          monthlyFixedExpenses.map((expense) => (
            <div key={expense.id} className="flex justify-between items-center p-4 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <div onClick={() => handleShowDetails(expense)} className="text-left flex-1 min-w-0 cursor-pointer">
                <p className={`text-slate-700 dark:text-slate-200 truncate ${expense.paid ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>{expense.description}</p>
                <p className="font-semibold text-red-600 dark:text-red-400 block">{formatCurrency(expense.amount)}</p>
              </div>
              <button onClick={() => handleTogglePaidStatus(expense)} className={`ml-4 py-1 px-4 text-sm font-semibold text-white rounded-full transition-colors ${expense.paid ? "bg-gradient-to-br from-green-500 to-emerald-500" : "bg-slate-400 dark:bg-slate-600 hover:bg-slate-500"}`}>
                {expense.paid ? "Pago" : "Pagar"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}