// src/pages/InvoiceDetailPage.jsx
// (Versão Atualizada: Data com Ano Completo)

import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useVisibility } from '../context/VisibilityContext';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, ShoppingBag, Receipt, Calendar, AlertCircle
} from 'lucide-react';

// --- HELPERS ---
function formatCurrencyBRL(value) {
  if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDateDisplay(dateString) {
  if (!dateString) return '';
  // Garante que a data seja exibida corretamente sem problemas de fuso horário simples
  const [year, month, day] = dateString.split('-');
  const date = new Date(year, month - 1, day);
  
  // ALTERADO: Adicionado year: 'numeric' para mostrar o ano (ex: 09 de julho de 2025)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

const getBankTheme = (nomeBanco) => {
  const nome = nomeBanco?.toLowerCase() || '';
  if (nome.includes('nubank')) return { bg: 'bg-[#820AD1]', text: 'text-white', gradient: 'from-[#820AD1] to-[#450570]', iconColor: 'text-[#820AD1]' };
  if (nome.includes('itaú') || nome.includes('itau')) return { bg: 'bg-[#ec7000]', text: 'text-white', gradient: 'from-[#ec7000] to-[#2e2d88]', iconColor: 'text-[#ec7000]' };
  if (nome.includes('bradesco')) return { bg: 'bg-[#cc092f]', text: 'text-white', gradient: 'from-[#cc092f] to-[#990020]', iconColor: 'text-[#cc092f]' };
  return { bg: 'bg-slate-800', text: 'text-slate-200', gradient: 'from-slate-700 to-slate-900', iconColor: 'text-slate-700' };
};

export default function InvoiceDetailPage({ banco, onBack, selectedMonth }) {
  // Agora usamos variableExpenses diretamente, ignorando allParcelas para evitar erros de sync
  const { variableExpenses, transactions, categorias } = useFinance();
  const { valuesVisible } = useVisibility();
  
  const theme = getBankTheme(banco?.nome);

  // --- LÓGICA DA FATURA ---
  const invoiceItems = useMemo(() => {
    if (!banco || !selectedMonth) return { items: [], total: 0 };
    const bankName = banco.nome.toLowerCase();

    // Vamos converter o selectedMonth (YYYY-MM) em números para facilitar a conta
    const [selYear, selMonth] = selectedMonth.split('-').map(Number); // ex: 2026, 1
    const totalSelectedMonths = selYear * 12 + selMonth; // Valor absoluto em meses

    // 1. PROCESSAR DESPESAS VARIÁVEIS (Do CSV)
    const activeInstallments = variableExpenses
      .filter(v => {
        // Filtra pelo banco
        if (v.metodo_pagamento?.toLowerCase() !== bankName) return false;
        
        // Verifica se tem data de início de cobrança (Se não tiver, usa data de compra)
        const startStr = v.mes_inicio_cobranca || v.data_compra?.slice(0, 7);
        if (!startStr) return false;

        const [startYear, startMonth] = startStr.split('-').map(Number);
        const totalStartMonths = startYear * 12 + startMonth;

        // Calcula a diferença em meses
        const diff = totalSelectedMonths - totalStartMonths;
        const qtdParcelas = v.qtd_parcelas || 1;

        // A parcela é válida se a diferença for >= 0 e menor que a quantidade total
        return diff >= 0 && diff < qtdParcelas;
      })
      .map(v => {
        // Recalcular dados da parcela específica
        const startStr = v.mes_inicio_cobranca || v.data_compra?.slice(0, 7);
        const [startYear, startMonth] = startStr.split('-').map(Number);
        const totalStartMonths = startYear * 12 + startMonth;
        
        // Índice da parcela (0-based) e Número (1-based)
        const diff = totalSelectedMonths - totalStartMonths;
        const numeroParcela = diff + 1;
        const qtdParcelas = v.qtd_parcelas || 1;
        
        // Valor da parcela (Total / Qtd)
        const installmentValue = (Number(v.amount) / qtdParcelas);

        // Nome da categoria
        const cat = categorias?.find(c => c.id === v.categoria_id);

        return {
          id: `${v.id}-p${numeroParcela}`, // ID único virtual
          originalId: v.id,
          description: v.description,
          amount: installmentValue,
          displayDate: v.data_compra, // Exibe a data ORIGINAL da compra
          parcelInfo: `${numeroParcela}/${qtdParcelas}`,
          categoryName: cat?.nome || 'Geral'
        };
      });

    // 2. PROCESSAR DESPESAS FIXAS (Transactions)
    // Mantemos a lógica original para fixas: se a data bate com o mês selecionado
    const fixedItems = transactions.filter(t => 
        t.type === 'expense' && t.is_fixed &&
        t.date?.startsWith(selectedMonth) &&
        t.metodo_pagamento?.toLowerCase() === bankName
    ).map(t => ({
        id: t.id,
        originalId: t.id,
        description: t.description,
        amount: Number(t.amount),
        displayDate: t.date,
        parcelInfo: null, // Fixa não tem parcela x/y
        categoryName: 'Fixa'
    }));

    // Juntar e Ordenar por DATA DA COMPRA (Decrescente)
    const all = [...activeInstallments, ...fixedItems];
    all.sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate));

    // Calcular Total
    const total = all.reduce((acc, item) => acc + item.amount, 0);

    return { items: all, total };

  }, [banco, selectedMonth, variableExpenses, transactions, categorias]);

  // Agrupar por Data da Compra para exibição visual
  const groupedItems = useMemo(() => {
    return invoiceItems.items.reduce((acc, item) => {
        const dateKey = item.displayDate;
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
    }, {});
  }, [invoiceItems.items]);

  if (!banco) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col h-full relative bg-slate-100 dark:bg-slate-950"
    >
      {/* HEADER DA FATURA */}
      <div className={`p-6 pb-8 rounded-b-[2rem] shadow-xl bg-gradient-to-br ${theme.gradient} text-white shrink-0`}>
         <div className="flex items-center gap-3 mb-6">
            <button onClick={onBack} className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full transition-colors">
                <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <div className="flex flex-col">
                <span className="text-xs font-medium opacity-80 uppercase tracking-wider">Fatura de {selectedMonth}</span>
                <span className="font-bold text-lg leading-tight">{banco.nome}</span>
            </div>
         </div>

         <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-full">
                    <Receipt className="w-6 h-6 text-white" />
                </div>
                <div>
                    <p className="text-xs text-white/80 font-medium">Total da Fatura</p>
                    <p className="text-2xl font-bold">
                        {valuesVisible ? formatCurrencyBRL(invoiceItems.total) : '••••••'}
                    </p>
                </div>
            </div>
         </div>
      </div>

      {/* LISTA DE ITENS DA FATURA */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
         {invoiceItems.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-10 text-slate-400">
                <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                <p>Nenhum item nesta fatura.</p>
            </div>
         ) : (
            Object.keys(groupedItems).map(date => (
                <div key={date}>
                    <div className="flex items-center gap-2 mb-2 ml-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                           {/* Mostra a data em que a compra foi feita com ano */}
                            Comprou em: {formatDateDisplay(date)}
                        </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        {groupedItems[date].map((item, idx) => (
                            <div key={item.id} className={`flex items-center justify-between p-4 ${idx !== groupedItems[date].length -1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${theme.iconColor}`}>
                                        <ShoppingBag className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                                            {item.description}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          {item.parcelInfo && (
                                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded w-fit">
                                                  {item.parcelInfo}
                                              </span>
                                          )}
                                          <span className="text-[10px] text-slate-400">{item.categoryName}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                    {valuesVisible ? formatCurrencyBRL(item.amount) : '••••'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))
         )}
      </div>
    </motion.div>
  );
}