// src/components/tabs/RendaTab.jsx

import { useState } from "react";
import { useData } from "../../context/DataContext";
import { supabase } from "../../supabaseClient";
import NewIncomeModal from "../modals/NewIncomeModal";
import TransactionDetailModal from "../modals/TransactionDetailModal";

export default function RendaTab({ selectedMonth }) {
  const { transactions, fetchData } = useData();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [detailModalTransaction, setDetailModalTransaction] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // ... (todas as funções 'handle' permanecem as mesmas) ...
  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta renda? A ação é permanente.")) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
        console.error("Erro ao excluir renda:", error);
        alert(`Ocorreu um erro ao excluir: ${error.message}`);
      } else {
        fetchData(); 
        setDetailModalTransaction(null);
      }
    }
  };

  const handleEdit = (transaction) => {
    setDetailModalTransaction(null); 
    setEditingTransaction(transaction);
    setIsNewModalOpen(true);
  };

  const handleSave = async (transactionData) => {
    const { id, ...dataToSave } = transactionData;
    let error;

    if (editingTransaction) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update(dataToSave)
        .eq('id', editingTransaction.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('transactions')
        .insert([dataToSave]);
      error = insertError;
    }

    if (error) {
      console.error("Erro ao salvar renda:", error);
      alert(`Ocorreu um erro ao salvar: ${error.message}`);
    } else {
      fetchData(); 
      setIsNewModalOpen(false);
      setEditingTransaction(null);
    }
  };

  const openNewModal = () => {
    setEditingTransaction(null);
    setIsNewModalOpen(true);
  };


  const monthlyIncomes = transactions.filter((t) => t.date?.startsWith(selectedMonth) && t.type === "income");
  const totalIncome = monthlyIncomes.reduce((sum, income) => sum + income.amount, 0);
  
  const formatCurrency = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  return (
    <>
      <NewIncomeModal isOpen={isNewModalOpen} onClose={() => { setIsNewModalOpen(false); setEditingTransaction(null); }} onSave={handleSave} incomeToEdit={editingTransaction} selectedMonth={selectedMonth} />
      <TransactionDetailModal isOpen={!!detailModalTransaction} onClose={() => setDetailModalTransaction(null)} transaction={detailModalTransaction} onDelete={() => handleDelete(detailModalTransaction.id)} onEdit={() => handleEdit(detailModalTransaction)} />
      
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Rendas do Mês</h2>
            <button onClick={openNewModal} className="flex items-center gap-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity shadow-md">
                <span className="material-symbols-outlined">add</span>Nova Renda
            </button>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg shadow-black/5 border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Total de Renda no Mês</h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="space-y-3">
          {monthlyIncomes.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-5 rounded-2xl">Nenhuma renda registrada para este mês.</div>
          ) : (
            monthlyIncomes.map((income) => (
              <button key={income.id} onClick={() => setDetailModalTransaction(income)} className="w-full text-left flex justify-between items-center p-4 rounded-xl transition-all duration-200 border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-purple-400 dark:hover:border-purple-500">
                <span className="font-medium text-slate-700 dark:text-slate-200">{income.description}</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(income.amount)}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}