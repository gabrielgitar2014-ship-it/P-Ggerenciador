// src/pages/CardDetailPage.jsx
// (Versão 7.0 - Apenas Compras + Botão para Fatura)

import React, { useMemo, useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useVisibility } from '../context/VisibilityContext';
import { useModal } from '../context/ModalContext'; 
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Calendar, ShoppingBag, 
  Search, AlertCircle, MoreVertical, Edit2, Trash2, X, Receipt
} from 'lucide-react';

// --- HELPERS ---
function formatCurrencyBRL(value) {
  if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDateDisplay(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T12:00:00');
  const today = new Date();
  
  const isSameDay = (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  if (isSameDay(date, today)) return 'Hoje';
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Ontem';
  
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

const getBankTheme = (nomeBanco) => {
  const nome = nomeBanco?.toLowerCase() || '';
  if (nome.includes('nubank')) return { 
    bg: 'bg-[#820AD1]', text: 'text-white', 
    gradient: 'from-[#820AD1] to-[#450570]', 
    paginationBtn: 'hover:bg-purple-100 text-purple-700',
    iconColor: 'text-[#820AD1]',
  };
  if (nome.includes('itaú') || nome.includes('itau')) return { 
    bg: 'bg-[#ec7000]', text: 'text-white', 
    gradient: 'from-[#ec7000] to-[#2e2d88]',
    paginationBtn: 'hover:bg-orange-100 text-orange-700',
    iconColor: 'text-[#ec7000]',
  };
  if (nome.includes('bradesco')) return { 
    bg: 'bg-[#cc092f]', text: 'text-white', 
    gradient: 'from-[#cc092f] to-[#990020]',
    paginationBtn: 'hover:bg-red-100 text-red-700',
    iconColor: 'text-[#cc092f]',
  };
  return { 
    bg: 'bg-slate-800', text: 'text-slate-200', 
    gradient: 'from-slate-700 to-slate-900',
    paginationBtn: 'hover:bg-slate-200 text-slate-700',
    iconColor: 'text-slate-700',
  };
};

const SearchBar = ({ value, onChange }) => (
  <div className="relative mb-4">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Search className="h-5 w-5 text-slate-400" />
    </div>
    <input
      type="text"
      className="block w-full pl-10 pr-3 py-3 border-none rounded-2xl leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
      placeholder="Buscar compra..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const TransactionItem = ({ item, theme, onEdit, onDelete }) => {
  const { valuesVisible } = useVisibility();
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 overflow-hidden"
    >
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2.5 bg-slate-100 dark:bg-slate-700/50 rounded-xl ${theme.iconColor} dark:text-slate-400`}>
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
              {item.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
               {item.isParcelado && (
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-medium">
                     Em {item.qtd_parcelas}x
                  </span>
                )}
              <span className="truncate">{item.categoriaNome || 'Geral'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {valuesVisible ? formatCurrencyBRL(item.amount) : '••••'}
          </span>
          <button onClick={() => setShowActions(!showActions)} className={`p-1.5 rounded-full transition-colors ${showActions ? 'bg-slate-200 dark:bg-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
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
            className="flex items-center gap-2 pb-3 justify-end"
          >
            <button onClick={() => onEdit(item)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors">
              <Edit2 className="w-3.5 h-3.5" /> Editar
            </button>
            <button onClick={() => onDelete(item)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function CardDetailPage({ banco, onBack, selectedMonth, onNavigate }) {
  const { transactions, variableExpenses, categorias, deleteDespesa } = useFinance();
  const { valuesVisible } = useVisibility();
  const { showModal } = useModal(); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const theme = getBankTheme(banco?.nome);

  useEffect(() => { setPage(1); }, [selectedMonth, banco]);

  const processedItems = useMemo(() => {
    if (!banco) return { items: [], total: 0 };
    const bankName = banco.nome.toLowerCase();

    // FILTRO: Apenas itens COMPRADOS no mês (data_compra)
    const purchases = variableExpenses.filter(v => 
      v.metodo_pagamento?.toLowerCase() === bankName &&
      v.data_compra?.startsWith(selectedMonth)
    ).map(v => {
      const cat = categorias.find(c => c.id === v.categoria_id);
      return {
        id: v.id,
        type: 'variable',
        originalObject: v,
        description: v.description,
        amount: Number(v.amount),
        date: v.data_compra,
        isParcelado: v.is_parcelado,
        qtd_parcelas: v.qtd_parcelas,
        categoriaNome: cat?.nome
      };
    });

    const fixed = transactions.filter(t => 
      t.type === 'expense' && t.is_fixed && 
      t.date?.startsWith(selectedMonth) &&
      t.metodo_pagamento?.toLowerCase() === bankName
    ).map(t => ({
      id: t.id,
      type: 'fixed',
      originalObject: t,
      description: t.description,
      amount: Number(t.amount),
      date: t.date,
      isParcelado: false,
      categoriaNome: 'Fixa'
    }));

    let items = [...purchases, ...fixed];
    items.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      items = items.filter(i => 
        i.description.toLowerCase().includes(lower) || 
        (i.categoriaNome && i.categoriaNome.toLowerCase().includes(lower)) ||
        String(i.amount).includes(lower) ||
        i.amount.toFixed(2).replace('.', ',').includes(lower)
      );
    }

    const total = items.reduce((acc, i) => acc + i.amount, 0);
    return { items, total };
  }, [banco, selectedMonth, transactions, variableExpenses, categorias, searchTerm]);

  const { paginatedItems, totalPages } = useMemo(() => {
    const totalPagesCalc = Math.ceil(processedItems.items.length / ITEMS_PER_PAGE);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return { 
      paginatedItems: processedItems.items.slice(startIndex, startIndex + ITEMS_PER_PAGE), 
      totalPages: totalPagesCalc 
    };
  }, [processedItems.items, page]);

  const groupedTransactions = useMemo(() => {
    return paginatedItems.reduce((acc, item) => {
      const dateKey = item.date; 
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {});
  }, [paginatedItems]);

  const handleEdit = (item) => showModal('novaDespesa', { despesaParaEditar: item.originalObject });
  const handleDelete = async (item) => {
    if (window.confirm(`Excluir "${item.description}"?`)) {
      await deleteDespesa(item.originalObject);
    }
  };
  
  // NAVEGAÇÃO PARA A NOVA PÁGINA DE FATURA
  const handleOpenInvoice = () => {
    if (onNavigate) {
      onNavigate('invoiceDetail', banco); // Passa o banco selecionado
    }
  };

  if (!banco) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-950"
    >
      <div className={`
        relative overflow-hidden rounded-b-[2.5rem] p-6 pb-6 shadow-2xl
        bg-gradient-to-br ${theme.gradient} text-white z-20 shrink-0
      `}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <span className="font-semibold text-lg tracking-wide">{banco.nome}</span>
        </div>

        <div className="flex flex-col items-center justify-center mb-6">
           <span className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">Compras de {selectedMonth}</span>
           <h1 className="text-4xl font-bold tracking-tight">
             {valuesVisible ? formatCurrencyBRL(processedItems.total) : '••••••••'}
           </h1>
        </div>

        {/* BOTÃO PARA ABRIR A FATURA (NOVA PÁGINA) */}
        <div className="flex justify-center">
             <button
                onClick={handleOpenInvoice}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl font-bold text-sm transition-all shadow-lg border border-white/10 active:scale-95"
            >
                <Receipt className="w-5 h-5" />
                Visualizar Fatura deste Mês
            </button>
        </div>

        <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 -mt-4 pt-8 pb-32 z-10">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />

        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-10 text-slate-400">
            <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
            <p>{searchTerm ? 'Nenhuma despesa encontrada.' : 'Nenhuma compra realizada neste mês.'}</p>
          </div>
        ) : (
          Object.keys(groupedTransactions).map((date) => (
            <div key={date} className="mb-6">
              <div className="flex items-center gap-2 mb-2 pl-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{formatDateDisplay(date)}</h3>
              </div>
              <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm px-4">
                {groupedTransactions[date].map(item => (
                  <TransactionItem 
                    key={item.id} 
                    item={item} 
                    theme={theme}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-30 flex items-center justify-between">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`p-3 rounded-xl transition-all ${page === 1 ? 'opacity-30' : theme.paginationBtn}`}>
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Página {page} de {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={`p-3 rounded-xl transition-all ${page === totalPages ? 'opacity-30' : theme.paginationBtn}`}>
              <ChevronRight className="w-6 h-6" />
            </button>
        </div>
      )}
    </motion.div>
  );
}