// src/tabs/GeneralTab.jsx
// (Versão 10.2 - Fixed: Uses ModalContext correctly)

import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useVisibility } from '../../context/VisibilityContext';
import { useModal } from '../../context/ModalContext';
import { 
  ArrowUp, ArrowDown, CreditCard, Plus, Wallet, CircleDollarSign, ChevronRight, TrendingUp 
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- HELPERS ---
function formatCurrencyBRL(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDateBr(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}`;
}

// --- COMPONENTES VISUAIS ---

// 1. Hero Card
const HeroCard = ({ saldo, receitas, despesas }) => {
  const { valuesVisible } = useVisibility();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[2rem] p-6 shadow-2xl text-white"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
      }}
    >
      <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-blue-600/20 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-purple-600/20 rounded-full blur-[50px] pointer-events-none" />
      
      {/* Header Saldo */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider opacity-80">Saldo Disponível</span>
          <h1 className="text-4xl font-bold mt-1 tracking-tight text-white">
            {valuesVisible ? formatCurrencyBRL(saldo) : '••••••••'}
          </h1>
        </div>
        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
          <Wallet className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Card Interno de Investimentos */}
      <div className="bg-slate-800/50 rounded-xl p-3 mb-6 flex items-center gap-3 border border-white/5 backdrop-blur-sm relative z-10">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
           <span className="text-[10px] font-bold text-emerald-400 uppercase">Investimentos</span>
           <div className="text-sm font-semibold text-white">R$ 0,00</div>
        </div>
      </div>

      {/* Resumo Receitas vs Despesas */}
      <div className="flex justify-between items-center relative z-10">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-emerald-400 mb-1">RECEITAS</span>
          <span className="text-lg font-medium text-slate-100">
             {valuesVisible ? formatCurrencyBRL(receitas) : '••••'}
          </span>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-xs font-bold text-rose-400 mb-1">DESPESAS</span>
          <span className="text-lg font-medium text-slate-100">
            {valuesVisible ? formatCurrencyBRL(despesas) : '••••'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// 2. Botões de Ação
const QuickAction = ({ label, icon: Icon, colorClass, bgClass, onClick, delay }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: delay, type: "spring", stiffness: 200 }}
    onClick={onClick}
    className="flex flex-col items-center gap-2 group w-full"
  >
    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-slate-200/50 dark:shadow-none transition-transform active:scale-95 ${bgClass}`}>
      <Icon className={`w-7 h-7 md:w-8 md:h-8 ${colorClass}`} strokeWidth={2} />
    </div>
    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
      {label}
    </span>
  </motion.button>
);

// 3. Item da Lista de Transações
const TransactionItem = ({ transaction }) => {
  const { valuesVisible } = useVisibility();
  const isExpense = transaction.type === 'expense';
  
  const amountColor = isExpense ? 'text-slate-900 dark:text-slate-100' : 'text-emerald-600 dark:text-emerald-400';
  const iconBg = isExpense ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20';
  const iconColor = isExpense ? 'text-rose-500' : 'text-emerald-500';
  const Icon = isExpense ? ArrowDown : ArrowUp;

  return (
    <div className="flex items-center justify-between py-3 px-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.5} />
        </div>
        
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            {transaction.description}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              {formatDateBr(transaction.date)}
            </span>
            {transaction.isParcela && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                {transaction.currentParcel}x
              </span>
            )}
          </div>
        </div>
      </div>
      <span className={`font-bold text-sm ${amountColor}`}>
        {isExpense ? '-' : '+'} {valuesVisible ? formatCurrencyBRL(transaction.amount) : '••••'}
      </span>
    </div>
  );
};


// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================
export default function GeneralTab({ selectedMonth, onNavigate }) {
  // 1. Obtendo a função showModal corretamente do contexto
  const { showModal } = useModal();
  
  // 2. Obtendo funções e dados do contexto financeiro
  const { 
    transactions, 
    allParcelas,
    variableExpenses, 
    saveIncome,
    saveExpense // IMPORTANTE: Precisamos dessa função para salvar a nova despesa
  } = useFinance();

  // --- 1. Lógica de Totais ---
  const { totalRendas, totalDespesas, saldoMes } = useMemo(() => {
    const rendas = (transactions || []).filter(t => t.type === 'income' && t.date?.startsWith(selectedMonth));
    const fixas = (transactions || []).filter(t => t.type === 'expense' && t.is_fixed && t.date?.startsWith(selectedMonth));
    const parcelas = (allParcelas || []).filter(p => p.data_parcela?.startsWith(selectedMonth));

    const totalRendas = rendas.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const totalFixas = fixas.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const totalVariaveis = parcelas.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    
    return { 
      totalRendas, 
      totalDespesas: totalFixas + totalVariaveis, 
      saldoMes: totalRendas - (totalFixas + totalVariaveis) 
    };
  }, [transactions, allParcelas, selectedMonth]);

  // --- 2. Lógica de Transações Recentes ---
  const recentTransactions = useMemo(() => {
    // A. Rendas e Fixas
    const fixedAndIncomes = (transactions || []).filter(t => 
      t.date?.startsWith(selectedMonth)
    ).map(t => ({
      id: t.id,
      type: t.type,
      description: t.description || t.nome || 'Sem descrição',
      date: t.date,
      amount: Number(t.amount),
      isParcela: false
    }));

    // B. Variáveis
    const variableItems = (allParcelas || []).filter(p => 
      p.data_parcela?.startsWith(selectedMonth)
    ).map(p => {
      const parentExpense = variableExpenses.find(v => v.id === p.despesa_id);
      return {
        id: p.id,
        type: 'expense',
        description: parentExpense ? parentExpense.description : 'Despesa Variável',
        date: p.data_parcela,
        amount: Number(p.amount),
        isParcela: true,
        currentParcel: p.numero_parcela
      };
    });

    // C. Unir e Ordenar
    const all = [...fixedAndIncomes, ...variableItems];
    return all.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  }, [transactions, allParcelas, variableExpenses, selectedMonth]);

  // --- FUNÇÕES DE CLIQUE (CORRIGIDAS) ---
  
  const handleAddNewIncome = () => {
    console.log("Abrindo modal de Nova Receita");
    showModal('novaRenda', { onSave: saveIncome });
  };

  const handleAddNewExpense = () => {
    console.log("Abrindo modal de Nova Despesa (Variável) via showModal");
    
    // CORREÇÃO: Chama showModal diretamente com o tipo 'novaDespesa'
    // Passamos o onSave para conectar com o FinanceContext
    showModal('novaDespesa', { 
      onSave: async (expenseData) => {
        console.log("Salvando despesa:", expenseData);
        if (saveExpense) {
          await saveExpense(expenseData);
        } else {
          console.error("ERRO: saveExpense não encontrado no FinanceContext");
        }
      }
    });
  };
  
  return (
    <div className="flex flex-col gap-8 pb-24"> 
      
      {/* SEÇÃO 1: HERO CARD DARK */}
      <HeroCard 
        saldo={saldoMes} 
        receitas={totalRendas} 
        despesas={totalDespesas} 
      />

      {/* SEÇÃO 2: AÇÕES RÁPIDAS */}
      <motion.div className="flex justify-between items-start gap-4 px-2">
        
        <QuickAction 
          label="Nova Receita" 
          icon={ArrowUp} 
          bgClass="bg-green-300 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          colorClass="text-emerald-500"
          onClick={handleAddNewIncome}
          delay={0.1}
        />
        <QuickAction 
          label="Nova Despesa" 
          icon={ArrowDown} 
          bgClass="bg-red-300 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          colorClass="text-rose-500"
          onClick={handleAddNewExpense} // Chama a função corrigida
          delay={0.2}
        />
        <QuickAction 
          label="Bancos" 
          icon={CreditCard} 
          bgClass="bg-purple-600 dark:bg-blue-600 border border-blue-500"
          colorClass="text-white"
          onClick={() => onNavigate('bancos')}
          delay={0.3}
        />
        <QuickAction
          label="Fixas"
          icon={CircleDollarSign}
          bgClass= "bg-yellow-400 dark:bg-yellow-600 border border-yellow-500"
          colorClass= "text-white"
          onClick={() => onNavigate('fixas')}
          delay={0.3}
        />
      </motion.div>

      {/* SEÇÃO 3: LISTA DE EXTRATO */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-white/50 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Extrato
            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-500">
               {selectedMonth}
            </span>
          </h3>
          <button 
            onClick={() => onNavigate('allExpenses')}
            className="text-sm text-slate-500 hover:text-blue-600 flex items-center transition-colors"
          >
            Ver tudo <ChevronRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-1"
          >
            {recentTransactions.map((t, index) => (
              <TransactionItem key={`${t.id}-${index}`} transaction={t} />
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
               <TrendingUp className="text-slate-400 w-6 h-6" />
             </div>
             <h4 className="font-semibold text-slate-700 dark:text-slate-300">Sem movimentações</h4>
             <p className="text-sm text-slate-500 mt-1 max-w-[200px]">
               Suas transações deste mês aparecerão aqui.
             </p>
             <button 
                onClick={handleAddNewExpense} // Chama a função corrigida
                className="mt-4 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
             >
               <Plus className="w-5 h-5" />
             </button>
          </div>
        )}
      </div>
    </div>
  );
}