// src/tabs/BancosTab.jsx
// (Versão 2.0 - Com Cadastro de Cartão Real e Dinâmico)

import React, { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useVisibility } from '../../context/VisibilityContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Wallet, ChevronRight, PieChart, Plus, X, Check } from 'lucide-react';

// --- HELPERS ---
function formatCurrencyBRL(value) {
  if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Opções de Cores para o Usuário Escolher
const COLOR_OPTIONS = [
  { label: 'Roxo Nubank', value: 'bg-[#820AD1]', gradient: 'bg-gradient-to-br from-[#820AD1] to-[#450570]' },
  { label: 'Laranja Itaú', value: 'bg-[#ec7000]', gradient: 'bg-gradient-to-br from-[#ec7000] to-[#2e2d88]' },
  { label: 'Vermelho Bradesco', value: 'bg-[#cc092f]', gradient: 'bg-gradient-to-br from-[#cc092f] to-[#990020]' },
  { label: 'Preto Black', value: 'bg-slate-900', gradient: 'bg-gradient-to-br from-slate-800 to-black' },
  { label: 'Azul', value: 'bg-blue-600', gradient: 'bg-gradient-to-br from-blue-500 to-blue-700' },
  { label: 'Verde', value: 'bg-emerald-600', gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700' },
];

const BankCard = ({ banco, valor, onClick, index }) => {
  const { valuesVisible } = useVisibility();
  
  // Tenta achar a cor na lista de opções ou usa fallback
  const colorObj = COLOR_OPTIONS.find(c => c.value === banco.cor) || 
                   { gradient: banco.cor.includes('gradient') ? banco.cor : 'bg-gradient-to-br from-slate-700 to-slate-900' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className={`
        relative group cursor-pointer
        rounded-[1.5rem] p-6 h-48 flex flex-col justify-between
        ${colorObj.gradient} text-white shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300
        border border-white/20
      `}
    >
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/5 rounded-t-[1.5rem] pointer-events-none" />
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-lg border border-white/10">
            {banco.nome.charAt(0)}
          </div>
          <span className="font-bold text-lg tracking-wide">{banco.nome}</span>
        </div>
        <CreditCard className="w-6 h-6 opacity-60" />
      </div>
      <div className="relative z-10">
        <span className="text-xs font-medium opacity-80 uppercase tracking-wider">
          Fatura Atual
        </span>
        <div className="flex items-center justify-between mt-1">
          <span className="text-2xl md:text-3xl font-bold">
            {valuesVisible ? formatCurrencyBRL(valor) : '••••'}
          </span>
          <div className="p-1.5 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
             <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>
      <div className="flex justify-between items-end relative z-10 mt-auto pt-2">
         <div className="flex items-center gap-2 text-xs font-mono opacity-60">
           <span>•••• {banco.ultimos_digitos || '0000'}</span>
         </div>
         {banco.diaFechamento && (
           <span className="text-[10px] bg-black/30 px-2 py-1 rounded text-white/80">
             Fecha dia {banco.diaFechamento}
           </span>
         )}
      </div>
    </motion.div>
  );
};

// Modal de Novo Cartão
const NewCardModal = ({ onClose, onSave }) => {
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState(COLOR_OPTIONS[0].value);
  const [diaFechamento, setDiaFechamento] = useState('');
  const [diaVencimento, setDiaVencimento] = useState('');
  const [ultimosDigitos, setUltimosDigitos] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome || !diaFechamento || !diaVencimento) return;
    onSave({ nome, cor, diaFechamento, diaVencimento, ultimosDigitos });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Novo Cartão</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Nome do Banco</label>
            <input 
              value={nome} onChange={e => setNome(e.target.value)}
              className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Ex: Nubank" autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Dia Fechamento</label>
              <input 
                type="number" max="31" min="1"
                value={diaFechamento} onChange={e => setDiaFechamento(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl" placeholder="Dia"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Dia Vencimento</label>
              <input 
                type="number" max="31" min="1"
                value={diaVencimento} onChange={e => setDiaVencimento(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl" placeholder="Dia"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Cor do Cartão</label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCor(c.value)}
                  className={`w-8 h-8 rounded-full ${c.value} ${cor === c.value ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          
           <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Últimos 4 Dígitos</label>
            <input 
              value={ultimosDigitos} onChange={e => setUltimosDigitos(e.target.value)} maxLength={4}
              className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl" placeholder="Ex: 4290"
            />
          </div>

          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 mt-4">
            Salvar Cartão <Check className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

// ===================================================================
// COMPONENTE PRINCIPAL (BancosTab)
// ===================================================================
export default function BancosTab({ selectedMonth, onCardClick, onBack }) {
  const { bancos, getSaldoPorBanco, savePaymentMethod } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cartoes = useMemo(() => {
    // Filtra métodos que são cartões (ignora PIX/Dinheiro)
    return (bancos || []).filter(b => b.nome !== 'PIX' && b.nome !== 'Dinheiro');
  }, [bancos]);

  const { dadosCartoes, totalGeral } = useMemo(() => {
    let sum = 0;
    const dados = cartoes.map(banco => {
      const saldoRaw = getSaldoPorBanco(banco, selectedMonth);
      const valorFatura = Math.abs(saldoRaw);
      sum += valorFatura;
      return { ...banco, valorFatura };
    });
    return { dadosCartoes: dados, totalGeral: sum };
  }, [cartoes, selectedMonth, getSaldoPorBanco]);

  const handleSaveCard = async (cardData) => {
    const result = await savePaymentMethod(cardData);
    if (result.ok) setIsModalOpen(false);
    else alert("Erro ao salvar cartão.");
  };

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 px-1">
         {onBack && (
           <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
             <ChevronRight className="w-5 h-5 rotate-180 text-slate-500" />
           </button>
         )}
         <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Meus Cartões</h1>
      </div>

      {/* Resumo Total */}
      <div className="relative overflow-hidden rounded-[2rem] p-6 shadow-xl bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-700 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/20 rounded-full">
            <PieChart className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            Total de Faturas
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mt-2">
          {formatCurrencyBRL(totalGeral)}
        </h2>
      </div>

      {/* Grid de Cartões */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dadosCartoes.map((item, index) => (
          <BankCard 
            key={item.id}
            index={index}
            banco={item}
            valor={item.valorFatura}
            onClick={() => onCardClick(item)}
          />
        ))}
        
        {/* Botão de Adicionar Cartão */}
        <motion.button
            onClick={() => setIsModalOpen(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-[1.5rem] p-6 h-48 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all gap-2"
        >
            <div className="p-3 bg-slate-200 dark:bg-slate-800 rounded-full">
                <Plus className="w-6 h-6" />
            </div>
            <span className="font-medium text-sm">Adicionar Cartão</span>
        </motion.button>
      </div>

      {/* Modal */}
      {isModalOpen && <NewCardModal onClose={() => setIsModalOpen(false)} onSave={handleSaveCard} />}
    </div>
  );
}