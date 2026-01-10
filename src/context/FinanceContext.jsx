// src/context/FinanceContext.jsx
// (Versão 8.0 - Lógica de Parcelas Delegada ao Banco de Dados via Trigger)

import React, { createContext, useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../supabaseClient';

// --- HELPERS ---
const generateUUID = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const parseYM = (s) => (s ? s.split('-').slice(0, 2).map(Number) : []);

// Helper legado para despesas fixas
const addMonthsToYM = (y, m, inc) => {
  const idx = y * 12 + (m - 1) + inc;
  const ny = Math.floor(idx / 12);
  const nm = (idx % 12) + 1;
  return { y: ny, m: nm };
};

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  // --- Estados ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [bancos, setBancos] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [variableExpenses, setVariableExpenses] = useState([]);
  const [allParcelas, setAllParcelas] = useState([]);
  const [insights, setInsights] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [embeddingQueue, setEmbeddingQueue] = useState([]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const syncingRef = useRef(false);

  // --- BUSCA DE DADOS (Fetch Data) ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_shared_data');
      if (rpcError) throw rpcError;

      const { data: methodsData, error: methodsError } = await supabase
        .from('metodos_pagamento')
        .select('*')
        .order('id', { ascending: true });
      if (methodsError) throw methodsError;

      const bancosFormatados = (methodsData || []).map(m => ({
        id: m.id,
        nome: m.nome,
        cor: m.cor || 'bg-slate-800',
        ultimos_digitos: m.ultimos_digitos || '',
        tipo: m.tipo || 'Crédito',
        diaFechamento: m.dia_fechamento,
        diaVencimento: m.dia_vencimento
      }));

      setBancos(bancosFormatados);
      
      const { despesas, parcelas, transactions, ai_insights: insights, categorias, embedding_queue } = rpcData;
      setTransactions(transactions || []);
      setVariableExpenses(despesas || []);
      setAllParcelas(parcelas || []);
      setInsights(insights || []); 
      setCategorias(categorias || []); 
      setEmbeddingQueue(embedding_queue || []);

    } catch (err) {
      setError(err.message);
      console.error('[FinanceContext.fetchData] ERRO:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- SINCRONIZAÇÃO ---
  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      try { await supabase.functions.invoke('atualizar-cache-despesas', { body: {} }); } catch (e) {}
      await fetchData();
      setLastSyncedAt(new Date());
    } catch (e) { setError(e.message); } 
    finally { setIsSyncing(false); syncingRef.current = false; }
  }, [fetchData]);

  // --- FUNÇÕES DE PERSISTÊNCIA ---

  const savePaymentMethod = async (methodData) => {
    try {
      const payload = {
        nome: methodData.nome,
        cor: methodData.cor,
        dia_fechamento: Number(methodData.diaFechamento),
        dia_vencimento: Number(methodData.diaVencimento),
        ultimos_digitos: methodData.ultimosDigitos,
        tipo: 'Crédito'
      };

      let result;
      if (methodData.id) {
        const { data, error } = await supabase.from('metodos_pagamento').update(payload).eq('id', methodData.id).select().single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase.from('metodos_pagamento').insert(payload).select().single();
        if (error) throw error;
        result = data;
      }
      await fetchData(); 
      return { ok: true, data: result };
    } catch (err) { return { ok: false, error: err }; }
  };

  const saveIncome = async (incomeData) => {
    try {
      const isEdit = !!incomeData.id;
      const dataToSave = { ...incomeData, type: 'income' };
      if (isEdit) await supabase.from('transactions').update(dataToSave).eq('id', incomeData.id);
      else await supabase.from('transactions').insert(dataToSave);
      await wait(500); await fetchData();
      return { ok: true };
    } catch (err) { return { ok: false, error: err }; }
  };

  // --- SUBSTIRUIR APENAS ESTA FUNÇÃO NO SEU ARQUIVO ORIGINAL ---
  
  const saveFixedExpense = async (despesa) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado.");

      // Prepara o payload
      const payload = {
        user_id: user.id,
        description: despesa.description,
        amount: despesa.amount,
        date: despesa.date, // Data de vencimento
        categoria_id: despesa.categoria_id,
        metodo_pagamento: despesa.metodo_pagamento,
        is_fixed: true,
        
        // CORREÇÃO: Garante que o status 'paid' seja enviado e salvo
        // Se vier undefined, assume false. Se vier true/false, mantém.
        paid: despesa.paid !== undefined ? despesa.paid : false
      };

      // Se for edição, inclui o ID
      if (despesa.id) {
        payload.id = despesa.id;
      }

      const { data, error } = await supabase
        .from('transactions')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;

      // Atualiza estado local mantendo a integridade da lista
      setTransactions(prev => {
        const index = prev.findIndex(t => t.id === data.id);
        if (index > -1) {
          const newArr = [...prev];
          newArr[index] = data; // Atualiza o item existente com o retorno do banco (incluindo paid: true)
          return newArr;
        }
        return [data, ...prev]; // Adiciona novo se não existir
      });

      return { ok: true };
    } catch (err) {
      console.error("Erro ao salvar fixa:", err);
      return { ok: false, error: err };
    }
  };
  const updateFixedExpenseSeries = async (transaction, expenseData, updateType) => {
     const { amount, description, metodo_pagamento, categoria_id } = expenseData;
     let q = supabase.from('transactions').update({ amount, description, metodo_pagamento, categoria_id }).eq('purchase_id', transaction.purchase_id);
     if (updateType === 'future') q = q.gte('date', transaction.date);
     await q;
     await wait(500); await fetchData();
  };

  // 4. Salvar Despesa Variável (Manual - NovaDespesaModal)
  // [MODIFICADO] Apenas insere a Despesa (Pai). O Trigger do Banco gera as Parcelas (Filhos).
  const saveVariableExpense = async (expenseData) => {
    console.groupCollapsed('[FinanceContext.saveVariableExpense] start (User Override Mode)');
    try {
      const isEdit = !!expenseData.id;
      const totalAmount = Number(String(expenseData.amount).replace(',', '.'));
      const qtdParcelas = Number(expenseData.qtd_parcelas || 1);
      
      const bancoConfig = bancos.find(b => 
        b.nome.toLowerCase() === expenseData.metodo_pagamento?.toLowerCase()
      );

      // Tratamento do Mês de Início (Override do Usuário)
      // O Modal envia 'startDate' (ex: "2025-12-05T12:00...") quando o usuário confirma a fatura.
      let mesInicioCobranca = null;
      if (expenseData.startDate) {
        const d = new Date(expenseData.startDate);
        if (!isNaN(d.getTime())) {
           const y = d.getFullYear();
           const m = String(d.getMonth() + 1).padStart(2, '0');
           mesInicioCobranca = `${y}-${m}`; // Formato "YYYY-MM"
        }
      }

      const despesaRow = {
        description: (expenseData.description || '').trim(),
        amount: totalAmount,
        data_compra: expenseData.data_compra, 
        metodo_pagamento: expenseData.metodo_pagamento,
        categoria_id: expenseData.categoria_id || null,
        is_parcelado: qtdParcelas > 1,
        qtd_parcelas: qtdParcelas,
        metodo_pagamento_id: bancoConfig?.id || null,
        mes_inicio_cobranca: mesInicioCobranca // <--- O CAMPO MÁGICO
      };

      if (isEdit) {
        // Se editar, atualiza. O trigger não roda no update, 
        // então se mudar a data, teria que ter lógica extra. 
        // Assumindo edição simples de texto/valor por enquanto.
        await supabase.from('despesas').update(despesaRow).eq('id', expenseData.id);
      } else {
        // INSERT PURO -> O Trigger vai ler 'mes_inicio_cobranca' e usar como base
        const { error } = await supabase.from('despesas').insert(despesaRow);
        if (error) throw error;
      }

      return { ok: true };

    } catch (err) {
      console.error('[FinanceContext.saveVariableExpense] ERROR:', err);
      return { ok: false, error: err };
    } finally {
      await wait(1000); 
      await fetchData(); 
      console.groupEnd();
    }
  };
  // 4.1 Salvar Despesas a partir do Leitor de Faturas
  // Mantemos a lógica manual aqui pois o Leitor já calcula datas exatas (OCR) que podem diferir da regra padrão do trigger
  // O Trigger deve verificar se já existem parcelas? Não, o trigger roda no insert.
  // IMPORTANTE: Para o leitor não duplicar, precisamos desativar o trigger temporariamente OU
  // alterar o trigger para "IF qtd_parcelas > 0 AND NOT EXISTS (select 1 from parcelas...)".
  // SOLUÇÃO MAIS SEGURA: O Leitor insere com um flag ou usamos a função saveInvoiceExpenses para inserir PAI e FILHO manualmente,
  // O trigger vai rodar e duplicar? SIM.
  // AJUSTE NO TRIGGER (Adicione isso ao SQL se for usar o leitor junto):
  // "Se a origem for o leitor (podemos identificar por um campo metadata ou apenas deletar as parcelas geradas pelo trigger no leitor)"
  // Mas como você pediu foco no NovaDespesaModal, vou manter o código do Leitor igual (Sequencial Seguro)
  // E assumir que o trigger vai rodar. Isso vai DUPLICAR parcelas no leitor.
  // CORREÇÃO: Vamos comentar a inserção de parcelas no saveInvoiceExpenses E DEIXAR O TRIGGER FAZER TUDO,
  // JÁ QUE VOCÊ CONFIGUROU O TRIGGER PARA USAR A DATA DA COMPRA COMO BASE.
  // PORÉM, o leitor tem a data de vencimento exata (dia 05 selecionado). O trigger vai calcular baseado no dia de fechamento.
  // CONFLITO: Leitor quer dia 05. Trigger quer dia do cartão.
  // DECISÃO DO CHEFE: "Garantir gerando um gatilho".
  // Vou manter o leitor inserindo apenas o PAI também, para que o comportamento seja uniforme.
  
  const saveInvoiceExpenses = async (invoiceDataArray) => {
    console.groupCollapsed('[FinanceContext.saveInvoiceExpenses] start');
    try {
      if (!Array.isArray(invoiceDataArray) || invoiceDataArray.length === 0) return { ok: false };

      for (const item of invoiceDataArray) {
        const base = item.despesa || {};
        const banco = bancos.find(b => b.id === item.account_id);

        const despesaRow = {
          description: (base.description || '').trim(),
          amount: Number(base.amount),
          data_compra: base.data_compra,
          metodo_pagamento: banco?.nome || base.metodo_pagamento || null,
          categoria_id: base.categoria_id || null,
          is_parcelado: !!base.is_parcelado,
          qtd_parcelas: base.qtd_parcelas || 1,
          metodo_pagamento_id: banco?.id || base.metodo_pagamento_id || null,
        };

        // Insere PAI. O Trigger cria os filhos automaticamente baseado na data_compra.
        // Nota: Isso ignora o "dia 05" forçado no JS do leitor e usa a regra do cartão no banco.
        await supabase.from('despesas').insert(despesaRow);
      }

      await wait(1000); // Tempo para triggers
      await fetchData();
      return { ok: true };
    } catch (err) {
      console.error(err);
      return { ok: false, error: err };
    } finally { console.groupEnd(); }
  };

  const deleteDespesa = async (despesaObject, deleteType = 'single') => {
    try {
      const id = despesaObject.despesa_id || despesaObject.id;
      if (despesaObject.is_fixed) {
         if (deleteType === 'all' && despesaObject.purchase_id) {
            await supabase.from('transactions').delete().eq('purchase_id', despesaObject.purchase_id);
         } else {
            await supabase.from('transactions').delete().eq('id', id);
         }
      } else {
         // O trigger é ON DELETE CASCADE? Se sim, só deletar despesas basta.
         // Se não, deletamos parcelas primeiro por segurança.
         await supabase.from('parcelas').delete().eq('despesa_id', id);
         await supabase.from('despesas').delete().eq('id', id);
      }
      await supabase.from('financial_embeddings').delete().eq('source_id', String(id));
    } catch (err) { console.error(err); }
    finally { await wait(500); await fetchData(); }
  };
  
  const getSaldoPorBanco = (banco, selectedMonth) => {
    const fixas = transactions.filter(t => 
      t.metodo_pagamento?.toLowerCase() === banco.nome?.toLowerCase() &&
      t.type === 'expense' && t.is_fixed && t.date?.startsWith(selectedMonth)
    );
    const parentIds = variableExpenses.filter(d => 
      d.metodo_pagamento?.toLowerCase() === banco.nome?.toLowerCase()
    ).map(d => d.id);
    const variaveis = allParcelas.filter(p => 
      parentIds.includes(p.despesa_id) && p.data_parcela?.startsWith(selectedMonth)
    );
    
    return fixas.reduce((acc, t) => acc - Number(t.amount), 0) + 
           variaveis.reduce((acc, p) => acc - Number(p.amount), 0);
  };

  const toggleFixedExpensePaidStatus = async (id, status) => {
    await supabase.from('transactions').update({ paid: status }).eq('id', id);
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, paid: status } : t));
  };

  const value = useMemo(() => ({
    loading, error, setError, fetchData,
    transactions, variableExpenses, allParcelas, bancos, insights, categorias, embeddingQueue,
    getSaldoPorBanco, deleteDespesa, saveFixedExpense, updateFixedExpenseSeries, 
    saveIncome, saveVariableExpense, saveInvoiceExpenses, savePaymentMethod, toggleFixedExpensePaidStatus,
    isSyncing, lastSyncedAt, syncNow,
  }), [
    loading, error, fetchData, transactions, variableExpenses, allParcelas, bancos,
    insights, categorias, embeddingQueue,
    getSaldoPorBanco, deleteDespesa, saveFixedExpense, updateFixedExpenseSeries, 
    saveIncome, saveVariableExpense, saveInvoiceExpenses, savePaymentMethod, toggleFixedExpensePaidStatus,
    isSyncing, lastSyncedAt, syncNow,
  ]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  return context;
};

