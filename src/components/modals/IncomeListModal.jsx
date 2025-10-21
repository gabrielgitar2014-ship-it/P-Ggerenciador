// src/components/modals/IncomeListModal.jsx

import React from 'react';
import { supabase } from '../../supabaseClient';

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export default function IncomeListModal({ isOpen, onClose, incomes, onEdit, onSave, onRefresh, onAddNew }) {

  if (!isOpen) return null;

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta renda? Esta ação é permanente.")) {
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
        alert("Renda excluída com sucesso.");
        onRefresh();
      } catch (err) {
        console.error("Erro ao excluir renda:", err);
        alert(`Ocorreu um erro ao excluir: ${err.message}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-transparent z-40 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Rendas do Mês</h2>
          <button onClick={onAddNew} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full">
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
        
        {incomes.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            Nenhuma renda encontrada para este mês.
          </div>
        ) : (
          <div className="space-y-4">
            {incomes.map((income) => (
              <div key={income.id} className="flex justify-between items-center bg-gray-100 dark:bg-slate-700 p-4 rounded-xl">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">{income.description}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(income.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(income.amount)}</span>
                  <button onClick={() => onEdit(income)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-full transition-colors">
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button onClick={() => handleDelete(income.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full transition-colors">
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg dark:bg-slate-700 dark:text-white">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}