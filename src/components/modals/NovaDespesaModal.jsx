import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Check, Calendar, DollarSign, Tag, CreditCard, 
  Layers, AlertCircle, Trash2, HelpCircle, ThumbsUp, ThumbsDown,
  Calculator, CalendarDays // Adicionado CalendarDays para o ícone de data final
} from 'lucide-react';

// --- HELPERS ---

const getTodayLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatCurrencyInput = (value) => {
  if (!value) return '';
  const onlyDigits = String(value).replace(/\D/g, '');
  const number = Number(onlyDigits) / 100;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number);
};

const parseCurrencyToNumber = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return Number(String(value).replace(/\D/g, '')) / 100;
};

const formatMonthYear = (dateObj) => {
  if (!dateObj) return '';
  return dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

// Helper para formatar moeda simples
const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export default function NovaDespesaModal({ isOpen, onClose, despesaParaEditar = null, onBack }) {
  const navigate = useNavigate();

  const { 
    categorias, 
    bancos, 
    saveVariableExpense, 
    saveFixedExpense,
    deleteDespesa 
  } = useFinance();

  // --- ESTADOS ---
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  
  const [date, setDate] = useState(getTodayLocal());
  
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [installments, setInstallments] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Estados de Fatura
  const [predictedMonth, setPredictedMonth] = useState(null);
  const [isPredictionCorrect, setIsPredictionCorrect] = useState(null);
  const [manualDate, setManualDate] = useState('');

  // Novo Estado: Controla se é parcelado (Switch)
  const [isParcelado, setIsParcelado] = useState(false);

  // Estados da Calculadora
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcParcelaValue, setCalcParcelaValue] = useState('');
  const [calcParcelaQtd, setCalcParcelaQtd] = useState(2);

  // --- CONFIGURAÇÃO INICIAL ---
  useEffect(() => {
    if (isOpen) {
      if (despesaParaEditar) {
        const d = despesaParaEditar;
        setDescription(d.description || '');
        
        if (d.amount !== undefined && d.amount !== null) {
          setAmountStr(d.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        } else {
          setAmountStr('');
        }

        const rawDate = d.date || d.data_compra;
        if (rawDate) setDate(rawDate.split('T')[0]);
        
        setCategoryId(d.categoria_id || '');
        setPaymentMethod(d.metodo_pagamento || d.bank || '');
        
        if (d.is_fixed) {
          setIsFixed(true);
          setInstallments(1);
          setIsParcelado(false);
        } else {
          setIsFixed(false);
          const qtd = d.qtd_parcelas || 1;
          setInstallments(qtd);
          setIsParcelado(qtd > 1);
          setIsPredictionCorrect(true);
        }
      } else {
        // Reset para Nova Despesa
        setDescription('');
        setAmountStr('');
        setDate(getTodayLocal());
        setCategoryId('');
        setPaymentMethod('');
        setIsFixed(false);
        setInstallments(1);
        setIsParcelado(false); // Reset do toggle
        setIsPredictionCorrect(null);
        setPredictedMonth(null);
        setManualDate('');
        setError('');
      }
      setShowCalculator(false);
      setCalcParcelaValue('');
      setCalcParcelaQtd(2);
    }
  }, [isOpen, despesaParaEditar]);

  // --- PREDIÇÃO DE FATURA ---
  useEffect(() => {
    if (!isFixed && paymentMethod && date && !despesaParaEditar) {
      const banco = bancos.find(b => b.nome === paymentMethod);
      
      if (banco && banco.diaFechamento && banco.diaVencimento) {
        const dataCompra = new Date(date + 'T12:00:00Z');
        const diaCompra = dataCompra.getUTCDate();
        const mesCompra = dataCompra.getUTCMonth();
        const anoCompra = dataCompra.getUTCFullYear();

        let dataVencimento = new Date(Date.UTC(anoCompra, mesCompra, banco.diaVencimento, 12, 0, 0));

        if (banco.diaVencimento < banco.diaFechamento) {
          dataVencimento.setUTCMonth(dataVencimento.getUTCMonth() + 1);
        }

        if (diaCompra >= banco.diaFechamento) {
          dataVencimento.setUTCMonth(dataVencimento.getUTCMonth() + 1);
        }

        setPredictedMonth(dataVencimento);
        setIsPredictionCorrect(null);
        setManualDate('');
      } else {
        setPredictedMonth(null);
        setIsPredictionCorrect(true);
      }
    } else if (isFixed) {
      setPredictedMonth(null);
    }
  }, [date, paymentMethod, isFixed, bancos, despesaParaEditar]);

  // Efeito para resetar parcelas se desligar o switch
  useEffect(() => {
    if (!isParcelado) {
      setInstallments(1);
    } else if (installments === 1) {
      setInstallments(2); // Começa em 2 se ligar
    }
  }, [isParcelado]);

  // --- HANDLERS ---
  const handleAmountChange = (e) => setAmountStr(formatCurrencyInput(e.target.value));

  const handleClose = () => {
    if (onClose) onClose();
    if (onBack) onBack();
  };

  const handleCalcParcelaChange = (e) => setCalcParcelaValue(formatCurrencyInput(e.target.value));
  
  const handleApplyCalculator = () => {
    const valorParcela = parseCurrencyToNumber(calcParcelaValue);
    const qtd = Number(calcParcelaQtd);
    
    if (valorParcela > 0 && qtd > 0) {
      const total = valorParcela * qtd;
      setAmountStr(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total));
      // Se usou a calculadora, já ativa o modo parcelado
      if (qtd > 1) {
        setIsParcelado(true);
        setInstallments(qtd);
      }
    }
    setShowCalculator(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const valorNumerico = parseCurrencyToNumber(amountStr);
    
    if (!description || valorNumerico <= 0 || !categoryId || !paymentMethod) {
      setError('Preencha todos os campos obrigatórios.');
      setIsSubmitting(false);
      return;
    }

    if (!isFixed && predictedMonth && isPredictionCorrect === null) {
      setError('Por favor, confirme se a fatura prevista está correta.');
      setIsSubmitting(false);
      return;
    }
    
    if (!isFixed && isPredictionCorrect === false && !manualDate) {
      setError('Selecione a data correta da primeira parcela.');
      setIsSubmitting(false);
      return;
    }

    try {
      const safeDay = parseInt(date.split('-')[2], 10);
      const safeDatePayload = date + 'T12:00:00Z';

      const payload = {
        id: despesaParaEditar?.id,
        description,
        amount: valorNumerico,
        categoria_id: Number(categoryId),
        metodo_pagamento: paymentMethod,
        
        data_compra: safeDatePayload,
        date: safeDatePayload,
        
        dueDate: safeDay,
        
        startDate: (isPredictionCorrect === false && manualDate) 
          ? manualDate + 'T12:00:00Z'
          : (predictedMonth ? predictedMonth.toISOString().split('T')[0] + 'T12:00:00Z' : null), 
        
        qtd_parcelas: isFixed ? 1 : Number(installments)
      };

      let result;
      if (isFixed) {
        result = await saveFixedExpense(payload);
      } else {
        result = await saveVariableExpense(payload);
      }

      if (result && result.ok) {
        handleClose(); 
      } else {
        setError(result?.error?.message || 'Erro ao salvar. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!despesaParaEditar) return;
    if (window.confirm("Tem certeza que deseja excluir esta despesa?")) {
      await deleteDespesa(despesaParaEditar);
      handleClose();
    }
  };

  // --- Helpers de Cálculo de Visualização ---
  const getInstallmentInfo = () => {
    if (installments <= 1) return null;
    const total = parseCurrencyToNumber(amountStr);
    if (!total) return null;

    const valParcela = total / installments;

    // Calcula data final baseada na data de início (Cobrança)
    let startDateObj = null;
    if (isPredictionCorrect === false && manualDate) {
      startDateObj = new Date(manualDate + 'T12:00:00Z');
    } else if (predictedMonth) {
      startDateObj = new Date(predictedMonth);
    }
    
    // Se não tiver data de fatura (ex: dinheiro), usa data da compra como base
    if (!startDateObj && date) {
      startDateObj = new Date(date + 'T12:00:00Z');
    }

    if (!startDateObj) return { val: valParcela, endDate: null };

    // Adiciona (parcelas - 1) meses para achar a última
    const endDateObj = new Date(startDateObj);
    endDateObj.setUTCMonth(endDateObj.getUTCMonth() + (installments - 1));

    return { val: valParcela, endDate: endDateObj };
  };

  const installmentInfo = getInstallmentInfo();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh]"
        >
          {/* HEADER */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              {despesaParaEditar ? 'Editar Despesa' : 'Nova Despesa'}
            </h2>
            <button onClick={handleClose} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 transition-colors">
              <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 relative">
            
            {/* CALCULADORA OVERLAY */}
            <AnimatePresence>
              {showCalculator && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-4"
                >
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-blue-600" /> Calculadora
                  </h3>
                  
                  <div className="w-full">
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Valor da Parcela</label>
                    <input
                      type="text"
                      value={calcParcelaValue}
                      onChange={handleCalcParcelaChange}
                      placeholder="R$ 0,00"
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-center text-xl font-bold focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>

                  <div className="w-full">
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Qtd. Parcelas</label>
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                      <input 
                        type="range" min="1" max="24" 
                        value={calcParcelaQtd} 
                        onChange={(e) => setCalcParcelaQtd(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="font-bold text-blue-600 w-8 text-center">{calcParcelaQtd}x</span>
                    </div>
                  </div>

                  <div className="flex w-full gap-3 mt-4">
                    <button 
                      onClick={() => setShowCalculator(false)}
                      className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-bold"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleApplyCalculator}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg"
                    >
                      Aplicar Valor
                    </button>
                  </div>
                  
                  <div className="text-sm text-slate-500 mt-2">
                    Total: <strong className="text-slate-800 dark:text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseCurrencyToNumber(calcParcelaValue) * calcParcelaQtd)}
                    </strong>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* VALOR */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Valor Total</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={amountStr}
                  onChange={handleAmountChange}
                  placeholder="R$ 0,00"
                  className="w-full pl-12 pr-4 py-4 text-3xl font-bold bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-300"
                  autoFocus={!despesaParaEditar}
                />
              </div>

              {!despesaParaEditar && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCalculator(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-slate-700 hover:bg-slate-800 transition-all shadow-sm"
                  >
                    <Calculator className="w-4 h-4" />
                    Calculadora de Parcelas
                  </button>
                </div>
              )}
            </div>

            {/* DESCRIÇÃO */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Supermercado..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* DATA & CATEGORIA & MÉTODO */}
            {/* Reorganizado para ficar em um bloco único antes das perguntas de fatura/parcela */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Categoria</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    value={categoryId} 
                    onChange={(e) => setCategoryId(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-blue-500 appearance-none text-slate-800 dark:text-slate-100"
                  >
                    <option value="" disabled>Selecione...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Método de Pagamento</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-blue-500 appearance-none text-slate-800 dark:text-slate-100"
                  >
                    <option value="" disabled>Selecione...</option>
                    {bancos.map(b => <option key={b.id} value={b.nome}>{b.nome}</option>)}
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              
               <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Data da Compra</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO DINÂMICA: FATURA E PARCELAMENTO */}
            {/* Só exibe se não for despesa fixa e se tiver método selecionado */}
            {!isFixed && paymentMethod && (
              <div className="space-y-4 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                
                {/* 1. PERGUNTA: QUANDO COMEÇA A COBRAR? (Fatura Prevista) */}
                {predictedMonth && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50"
                  >
                    <div className="flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                          Primeira Fatura em: <span className="font-bold text-blue-700 dark:text-blue-100 capitalize">{formatMonthYear(predictedMonth)}</span>
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Calculado pelo fechamento. Confirma?
                        </p>
                        
                        <div className="flex gap-3 mt-3">
                          <button 
                            type="button"
                            onClick={() => { setIsPredictionCorrect(true); setManualDate(''); }}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isPredictionCorrect === true ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                          >
                            <ThumbsUp className="w-3 h-3" /> Sim
                          </button>
                          <button 
                            type="button"
                            onClick={() => setIsPredictionCorrect(false)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isPredictionCorrect === false ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                          >
                            <ThumbsDown className="w-3 h-3" /> Não
                          </button>
                        </div>

                        <AnimatePresence>
                          {isPredictionCorrect === false && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }} 
                              animate={{ height: 'auto', opacity: 1 }} 
                              className="mt-3 overflow-hidden"
                            >
                              <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1 block">
                                Quando será a primeira cobrança?
                              </label>
                              <input
                                type="date"
                                value={manualDate}
                                onChange={(e) => setManualDate(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. PERGUNTA: É PARCELADO? (Switch) */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Parcelar esta compra?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsParcelado(!isParcelado)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${isParcelado ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isParcelado ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* 3. INPUT DE PARCELAS (Condicional) */}
                <AnimatePresence>
                  {isParcelado && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-3"
                    >
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                         <div className="flex items-center gap-4 mb-2">
                           <input 
                              type="range" 
                              min="2" 
                              max="24" 
                              value={installments} 
                              onChange={(e) => setInstallments(Number(e.target.value))} 
                              className="flex-1 accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
                            />
                            <span className="font-bold text-blue-600 dark:text-blue-400 text-lg min-w-[3rem] text-right">
                              {installments}x
                            </span>
                         </div>
                         
                         {/* INFO DO CÁLCULO DAS PARCELAS */}
                         {installmentInfo && (
                            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700 text-sm">
                                <div className="flex flex-col">
                                  <span className="text-xs text-slate-500 uppercase">Valor Parcela</span>
                                  <span className="font-bold text-slate-800 dark:text-white">{formatMoney(installmentInfo.val)}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-xs text-slate-500 uppercase">Termina em</span>
                                  <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-white">
                                    <CalendarDays className="w-3 h-3 text-slate-400" />
                                    {installmentInfo.endDate ? formatMonthYear(installmentInfo.endDate) : '-'}
                                  </div>
                                </div>
                            </div>
                         )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

          </div>

          {/* FOOTER */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col gap-3">
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting} 
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Salvando...' : (despesaParaEditar ? 'Atualizar Despesa' : 'Criar Despesa')}
              {!isSubmitting && <Check className="w-5 h-5" />}
            </button>
            {despesaParaEditar && (
              <button 
                onClick={handleDelete} 
                type="button" 
                className="w-full py-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Excluir Despesa
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}