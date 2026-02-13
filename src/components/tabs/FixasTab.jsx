// src/components/tabs/FixasTab.jsx

import React, { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useVisibility } from '../../context/VisibilityContext';
import { useModal } from '../../context/ModalContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, AlertCircle, Edit2, Trash2, MoreVertical, X, 
  CreditCard, DollarSign, Wallet, CheckCircle2, Circle, Clock,
  Plus 
} from 'lucide-react';

// --- IMPORTS DE UI E MODAL ---
import { Dialog } from '../../components/ui/dialog'; 
import NewFixedExpenseModal from '../modals/NewFixedExpenseModal';

// --- HELPERS ---
function formatCurrencyBRL(value) {
  if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Helper para escolher ícone baseado no método
const getPaymentIcon = (method) => {
  const m = method?.toLowerCase() || '';
  if (m === 'dinheiro') return <Wallet className="w-3.5 h-3.5" />;
  if (m === 'outros') return <DollarSign className="w-3.5 h-3.5" />;
  return <CreditCard className="w-3.5 h-3.5" />;
};

const FixedExpenseItem = ({ item, onEdit, onDelete, onTogglePay, valuesVisible }) => {
  const [showActions, setShowActions] = useState(false);
  
  // Verifica se está pago (garante booleano)
  const isPaid = !!item.paid; 

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        border rounded-2xl p-4 shadow-sm mb-3 transition-all duration-300
        ${isPaid 
          ? 'bg-slate-200/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-75 grayscale-[0.5]' 
          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          
          {/* BOTÃO DE CHECK (TOGGLE) */}
          <button 
            onClick={() => onTogglePay(item)}
            className={`
              p-2 rounded-full transition-all shrink-0 hover:scale-110 active:scale-95
              ${isPaid 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }
            `}
            title={isPaid ? "Marcar como não pago" : "Marcar como pago"}
          >
            {isPaid ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
          </button>

          <div className="flex flex-col min-w-0">
            {/* Título Riscado se Pago */}
            <h3 className={`text-sm font-bold truncate pr-2 transition-all ${
              isPaid 
                ? 'text-slate-500 dark:text-slate-500 line-through decoration-slate-400' 
                : 'text-slate-800 dark:text-slate-100'
            }`}>
              {item.description}
            </h3>
            
            <div className="flex items-center gap-2 mt-1">
              <div className={`flex items-center gap-1 text-xs font-medium capitalize ${isPaid ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                 {getPaymentIcon(item.metodo_pagamento)}
                 {item.metodo_pagamento || 'Não inf.'}
              </div>

              {/* LABEL VISÍVEL DE STATUS */}
              <span className={`
                text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider
                ${isPaid 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
                  : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                }
              `}>
                {isPaid ? 'Pago' : 'Pendente'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-sm font-bold transition-colors ${isPaid ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-900 dark:text-white'}`}>
            {valuesVisible ? formatCurrencyBRL(item.amount) : '••••'}
          </span>
          <button 
            onClick={() => setShowActions(!showActions)}
            className={`p-2 rounded-full transition-colors ${showActions ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
             {showActions ? <X className="w-4 h-4 text-slate-600" /> : <MoreVertical className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-200 dark:border-slate-800/50"
          >
            <button 
              onClick={() => onEdit(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" /> Editar
            </button>
            <button 
              onClick={() => onDelete(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function FixasTab({ onBack, selectedMonth }) {
  // Importamos addDespesa do contexto para poder salvar
  const { transactions, deleteDespesa, toggleFixedExpensePaidStatus, addDespesa } = useFinance();
  const { showModal } = useModal();
  const { valuesVisible } = useVisibility();
  
  // Estado local para controlar a abertura do modal 'Nova'
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Filtrar apenas despesas fixas do mês selecionado
  const fixedExpenses = useMemo(() => {
    return transactions.filter(t => 
      t.type === 'expense' && 
      t.is_fixed && 
      t.date?.startsWith(selectedMonth)
    );
  }, [transactions, selectedMonth]);

  const totalFixas = useMemo(() => {
    return fixedExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [fixedExpenses]);

  const totalPendente = useMemo(() => {
    return fixedExpenses
      .filter(t => !t.paid)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [fixedExpenses]);

  const handleEdit = (item) => {
    // Para edição, ainda usamos o modal global se ele estiver configurado, 
    // ou você pode adaptar para usar o estado local também.
    showModal('novaDespesa', { despesaParaEditar: item });
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Deseja excluir a despesa fixa "${item.description}"?`)) {
      await deleteDespesa(item);
    }
  };

  const handleTogglePay = async (item) => {
    try {
      if (toggleFixedExpensePaidStatus) {
        await toggleFixedExpensePaidStatus(item.id, !item.paid);
      } else {
        console.error("Função toggleFixedExpensePaidStatus não encontrada no contexto!");
        alert("Erro no contexto: função de status indisponível.");
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Não foi possível atualizar o status.");
    }
  };

  // --- FUNÇÃO PARA SALVAR A NOVA DESPESA ---
  const handleSaveNewExpense = async (payload) => {
    try {
      if (!addDespesa) {
        alert("Erro: Função addDespesa não encontrada no FinanceContext.");
        return;
      }

      // Adiciona flags necessárias para identificar como despesa fixa
      const expenseData = {
        ...payload,
        type: 'expense',
        is_fixed: true,
        // Garante que tenha uma data baseada no input 'startDate'
        date: payload.startDate 
      };

      await addDespesa(expenseData);
      
      // Fecha o modal após sucesso
      setIsNewModalOpen(false);

    } catch (error) {
      console.error("Erro ao salvar despesa fixa:", error);
      alert("Ocorreu um erro ao salvar a despesa.");
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative"
      >
        {/* HEADER */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 pb-10 rounded-b-[2.5rem] shadow-xl text-white shrink-0 z-10 relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <button 
                onClick={onBack}
                className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <span className="font-bold text-lg">Despesas Fixas</span>
            </div>

            {/* BOTÃO NOVA FIXA */}
            <button 
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl transition-colors font-bold text-sm text-white"
            >
              <Plus className="w-4 h-4" />
              <span>Nova</span>
            </button>
          </div>

          {/* Display do Total */}
          <div className="flex flex-col items-center relative z-10">
            <span className="text-sm font-medium text-purple-100 uppercase tracking-wider mb-1">Total Mensal</span>
            <h1 className="text-4xl font-bold tracking-tight">
              {valuesVisible ? formatCurrencyBRL(totalFixas) : '••••••'}
            </h1>
            
            {/* Subtotal Pendente */}
            {totalPendente > 0 ? (
               <div className="mt-2 px-3 py-1 bg-amber-500/20 backdrop-blur-md rounded-full border border-amber-500/30 text-xs font-bold text-amber-100 flex items-center gap-1.5 shadow-sm">
                 <Clock className="w-5 h-5" />
                 Falta Pagar: {valuesVisible ? formatCurrencyBRL(totalPendente) : '•••'}
               </div>
            ) : (
              fixedExpenses.length > 0 && (
                <div className="mt-2 px-3 py-1 bg-green-500/20 backdrop-blur-md rounded-full border border-green-500/30 text-xs font-bold text-green-100 flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tudo Pago!
                </div>
              )
            )}
          </div>

          {/* Decorativos de Fundo */}
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-purple-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-indigo-500/30 rounded-full blur-3xl" />
        </div>

        {/* LISTA */}
        <div className="flex-1 overflow-y-auto px-4 -mt-6 pt-8 pb-20 z-0 space-y-2">
          {fixedExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-10 text-slate-400">
              <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">Nenhuma despesa fixa para este mês.</p>
            </div>
          ) : (
            fixedExpenses.map(item => (
              <FixedExpenseItem 
                key={item.id} 
                item={item} 
                onEdit={handleEdit} 
                onDelete={handleDelete}
                onTogglePay={handleTogglePay}
                valuesVisible={valuesVisible}
              />
            ))
          )}
        </div>
      </motion.div>

      {/* CORREÇÃO FINAL: 
         1. Envolvemos o Modal com <Dialog> para criar o contexto do portal.
         2. Passamos onSave={handleSaveNewExpense} para a função funcionar.
      */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <NewFixedExpenseModal 
          onClose={() => setIsNewModalOpen(false)} 
          onSave={handleSaveNewExpense} 
        />
      </Dialog>
    </>
  );
}
