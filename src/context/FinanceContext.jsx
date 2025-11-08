// src/context/FinanceContext.jsx
// (Versão "Escape Hatch" - v7, com suporte completo a todas as 6 tabelas)
// <<< [CORRIGIDO] Adicionada a função 'saveVariableExpense' e helpers

import React, { createContext, useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../supabaseClient';

// Helper para gerar um ID de série único (simulação de UUID)
const generateUUID = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

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
  // NOVO ESTADO: Adiciona a fila de embeddings
  const [embeddingQueue, setEmbeddingQueue] = useState([]);

  // --- Estado de Sincronização ---
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const syncingRef = useRef(false);

  // --- Função Principal de Busca de Dados (VIA RPC) ---
  const fetchData = useCallback(async () => {
    console.groupCollapsed('[FinanceContext.fetchData] start (MODO ESCAPE HATCH)');
    setLoading(true);
    setError(null);
    try {
      
      console.debug(`[FinanceContext.fetchData] Chamando RPC 'get_all_shared_data'...`);

      const response = await supabase.rpc('get_all_shared_data');

      console.log('[FinanceContext.fetchData] RESPOSTA BRUTA DO RPC:', response.data);

      if (response.error) throw response.error;
      if (!response.data) throw new Error("A função RPC não retornou dados.");

      // ADICIONADO: embedding_queue na desestruturação
      const { despesas, parcelas, transactions, ai_insights: insights, categorias, embedding_queue } = response.data;

      console.debug('[FinanceContext.fetchData] counts:', {
        despesas: despesas?.length || 0,
        parcelas: parcelas?.length || 0,
        transactions: transactions?.length || 0,
        insights: insights?.length || 0, 
        categorias: categorias?.length || 0,
        embedding_queue: embedding_queue?.length || 0, // NOVO: Conta a fila
      });

      // Dados estáticos dos bancos
      const bancosData = [
        { id: 1, nome: 'Nubank', bandeira: 'mastercard', cor: 'bg-purple-800', ultimos_digitos: '4293', tipo: 'Crédito' },
        { id: 2, nome: 'Itaú', bandeira: 'visa', cor: 'bg-blue-950', ultimos_digitos: ['2600', '5598'], tipo: 'Crédito' },
        { id: 3, nome: 'Bradesco', bandeira: 'visa', cor: 'bg-black', ultimos_digitos: '1687', tipo: 'Crédito' },
        { id: 4, nome: 'PIX', bandeira: 'pix', cor: 'bg-emerald-500', ultimos_digitos: '', tipo: 'Transferência' },
      ];

      // Atualiza todos os estados
      setBancos(bancosData);
      setTransactions(transactions || []);
      setVariableExpenses(despesas || []);
      setAllParcelas(parcelas || []);
      setInsights(insights || []); 
      setCategorias(categorias || []); 
      setEmbeddingQueue(embedding_queue || []); // NOVO: Define o estado da fila

      console.log('[FinanceContext.fetchData] OK: estado atualizado.');
    } catch (err) {
      setError(err.message);
      console.error('[FinanceContext.fetchData] ERRO:', err);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  }, []);

  // Hook para buscar dados no carregamento
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Função de Sincronização (Sem mudanças) ---
  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    setError(null);
    try {
      try {
        const { error: fnError } = await supabase.functions.invoke('atualizar-cache-despesas', { body: {} });
        if (fnError) throw fnError;
      } catch (e) {
        console.warn('[FinanceContext.syncNow] Edge Function falhou ou não existe, usando fallback:', e?.message);
        const { error: dbErr } = await supabase.from('despesas').select('id', { count: 'exact', head: true }).limit(1);
        if (dbErr) throw dbErr;
      }
      await fetchData();
      setLastSyncedAt(new Date());
      console.info('[FinanceContext.syncNow] sincronizado com sucesso.');
    } catch (e) {
      console.error('[FinanceContext.syncNow] ERRO:', e);
      setError(e?.message || String(e));
    } finally {
      setIsSyncing(false);
      syncingRef.current = false;
    }
  }, [fetchData]);

  // --- Função Salvar Renda (Sem mudanças) ---
  const saveIncome = async (incomeData) => {
    try {
      const isEdit = !!incomeData.id;
      const dataToSave = { ...incomeData, type: 'income' };
      let result;
      if (isEdit) {
        const { data, error } = await supabase.from('transactions')
          .update(dataToSave).eq('id', incomeData.id).select().single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase.from('transactions')
          .insert(dataToSave).select().single();
        if (error) throw error;
        result = data;
      }
      await fetchData(); 
      return result;
    } catch (err) {
      console.error("Erro ao salvar renda:", err);
      throw err;
    }
  };

  // --- Função Salvar Despesa Fixa (Com Correções de Lógica e Categoria) ---
  const saveFixedExpense = async (expenseData) => {
    console.groupCollapsed('[FinanceContext.saveFixedExpense] start');
    console.log("PAYLOAD RECEBIDO DO FORM (expenseData):", expenseData);
    
    try {
      console.info('[FinanceContext.saveFixedExpense] payload recebido:', expenseData);
      const isEdit = !!expenseData?.id;
      
      // Usa o purchase_id existente ou gera um novo para a série
      const series_id = expenseData?.purchase_id || (isEdit ? null : generateUUID()); 
      
      const amount = Number(
        typeof expenseData?.amount === 'string'
          ? expenseData.amount.replace(',', '.')
          : expenseData?.amount
      );
      
      const metodo_pagamento = expenseData?.metodo_pagamento ?? expenseData?.bank ?? null;
      const due = Number(expenseData?.due_date ?? expenseData?.dueDate);
      const start = expenseData?.startDate;
      const dateFromPayload = expenseData?.date;
      
      const categoria_id = expenseData?.categoria_id || null;
      const parseYM = (s) => (s ? s.split('-').slice(0, 2).map(Number) : []);
      const [startY, startM] = start ? parseYM(start) : (dateFromPayload ? parseYM(dateFromPayload) : []);
      const safeDate = dateFromPayload || (
        startY && startM && due
          ? `${startY}-${String(startM).padStart(2, '0')}-${String(due).padStart(2, '0')}`
          : null
      );
      
      const toRow = (y, m) => {
        const dt = `${y}-${String(m).padStart(2, '0')}-${String(due).padStart(2, '0')}`;
        return {
          description: (expenseData.description || '').trim(),
          amount,
          metodo_pagamento,
          due_date: due,
          date: dt,
          type: 'expense',
          is_fixed: true,
          categoria_id: categoria_id,
          purchase_id: series_id, // ID da série fixa
        };
      };

      const addMonths = (y, m, inc) => {
        const idx = y * 12 + (m - 1) + inc;
        const ny = Math.floor(idx / 12);
        const nm = (idx % 12) + 1;
        return { y: ny, m: nm };
      };

      if (isEdit) {
        const [yEdit, mEdit] = safeDate ? parseYM(safeDate) : [startY, startM];
        // Assegura que a categoria_id e purchase_id sejam incluídas no UPDATE
        const row = { 
          ...toRow(yEdit, mEdit), 
          date: safeDate, 
          categoria_id: categoria_id,
          purchase_id: expenseData.purchase_id
        };
        console.info('[FinanceContext.saveFixedExpense] UPDATE row:');
        console.table(row);
        const { data, error } = await supabase
          .from('transactions').update(row).eq('id', expenseData.id).select('*');
        if (error) throw error;
        
        return { ok: true, data, series_id: expenseData.purchase_id };
      }
      
      // >>> INSERÇÃO DE NOVA DESPESA FIXA <<<
      const recurrenceType = expenseData?.recurrence?.type || 'single';
      const installments = expenseData?.recurrence?.installments ?? 1;
      let rows = [];
      
      if (startY && startM) {
        if (recurrenceType === 'fixed' && Number.isInteger(installments) && installments > 1) {
          for (let i = 0; i < installments; i++) {
            const { y, m } = addMonths(startY, startM, i);
            rows.push(toRow(y, m)); 
          }
        } else if (recurrenceType === 'infinite') {
           rows.push(toRow(startY, startM));
        } else {
          rows = [toRow(startY, startM)];
        }
      } else if (safeDate) {
        const [y, m] = parseYM(safeDate);
        rows = [toRow(y, m)];
      } else {
        throw new Error('Não foi possível calcular a data de inserção.');
      }
      
      if (rows.length === 0) {
           throw new Error('Nenhuma linha de transação foi gerada para inserção.');
      }
      
      console.log("LINHAS GERADAS PARA INSERÇÃO (rows):", rows);
      console.info('[FinanceContext.saveFixedExpense] INSERT linhas:', rows.length);
      console.table(rows);
      
      const { data, error } = await supabase
        .from('transactions').insert(rows).select('*');
      if (error) throw error;
      
      return { ok: true, data, series_id };
    } catch (err) {
      setError(err?.message || String(err));
      console.error('[FinanceContext.saveFixedExpense] FALHA:', err);
      return { ok: false, error: err };
    } finally {
      console.debug('[FinanceContext.saveFixedExpense] refetch após salvar…');
      try {
        await fetchData();
      } catch (refetchErr) {
        console.warn('[FinanceContext.saveFixedExpense] falha no refetch:', refetchErr);
      }
      console.groupEnd();
    }
  };

  // --- FUNÇÃO: ATUALIZAR SÉRIE DE DESPESA FIXA (EDIÇÃO EM MASSA) ---
  const updateFixedExpenseSeries = async (transaction, expenseData, updateType) => {
    const seriesId = transaction.purchase_id;
    if (!seriesId) throw new Error('ID de série não encontrado para atualização em massa.');
    
    const { amount, description, metodo_pagamento, categoria_id } = expenseData;

    let updateQuery = supabase
        .from('transactions')
        .update({ amount, description, metodo_pagamento, categoria_id })
        .eq('purchase_id', seriesId);

    if (updateType === 'future') {
        const dateToFilter = transaction.date;
        updateQuery = updateQuery.gte('date', dateToFilter);
    }
    
    console.log(`[FinanceContext.updateFixedExpenseSeries] Atualizando série ${seriesId}. Tipo: ${updateType}.`);
    const { data, error } = await updateQuery.select('*');

    if (error) throw error;
    await fetchData(); 
    return data;
  };

  // <<< [NOVO] FUNÇÃO PARA SALVAR DESPESA VARIÁVEL (A CAUSA DO BUG) >>>
  // Esta função não existia e é necessária para atualizar o estado após adicionar uma despesa variável.
  const saveVariableExpense = async (expenseData) => {
    console.groupCollapsed('[FinanceContext.saveVariableExpense] start');
    console.log("PAYLOAD RECEBIDO DO FORM (expenseData):", expenseData);

    try {
      // 1. Preparar a despesa principal
      const totalAmount = Number(
        typeof expenseData?.amount === 'string'
          ? expenseData.amount.replace(',', '.')
          : expenseData?.amount
      );
      const qtdParcelas = Number(expenseData.qtd_parcelas || 1);
      const isParcelado = qtdParcelas > 1;

      const despesaRow = {
        description: (expenseData.description || '').trim(),
        amount: totalAmount,
        data_compra: expenseData.data_compra, // ex: '2025-11-07'
        metodo_pagamento: expenseData.metodo_pagamento,
        categoria_id: expenseData.categoria_id || null,
        is_parcelado: isParcelado,
        qtd_parcelas: qtdParcelas
      };

      console.log("[FinanceContext.saveVariableExpense] Inserindo na tabela 'despesas':", despesaRow);

      // 2. Inserir na tabela 'despesas'
      const { data: newDespesa, error: despesaError } = await supabase
        .from('despesas')
        .insert(despesaRow)
        .select()
        .single();

      if (despesaError) throw despesaError;
      if (!newDespesa) throw new Error('Falha ao criar a despesa principal.');

      console.log("[FinanceContext.saveVariableExpense] Despesa principal criada, ID:", newDespesa.id);

      // 3. Preparar as parcelas (conforme sua arquitetura, sempre há pelo menos 1 parcela)
      const valorParcela = totalAmount / qtdParcelas;
      let parcelasRows = [];
      
      // Helper para adicionar meses à data da compra (evita bugs de fuso horário)
      const dataCompra = new Date(expenseData.data_compra + 'T12:00:00Z');

      for (let i = 1; i <= qtdParcelas; i++) {
        const dataParcela = new Date(dataCompra);
        dataParcela.setUTCMonth(dataCompra.getUTCMonth() + (i - 1));
        
        // Formata a data para 'YYYY-MM-DD'
        const dataParcelaStr = dataParcela.toISOString().split('T')[0];

        parcelasRows.push({
          despesa_id: newDespesa.id,
          numero_parcela: i,
          amount: valorParcela, // 'amount' da parcela individual
          data_parcela: dataParcelaStr // 'data_parcela' é a data de vencimento da parcela
        });
      }

      console.log(`[FinanceContext.saveVariableExpense] Inserindo ${parcelasRows.length} parcela(s) na tabela 'parcelas':`);
      console.table(parcelasRows);

      // 4. Inserir na tabela 'parcelas'
      const { error: parcelasError } = await supabase
        .from('parcelas')
        .insert(parcelasRows);
      
      if (parcelasError) throw parcelasError;
      
      console.log("[FinanceContext.saveVariableExpense] OK: Despesa e parcelas salvas.");
      return { ok: true, data: newDespesa };

    } catch (err) {
      setError(err?.message || String(err));
      console.error('[FinanceContext.saveVariableExpense] FALHA:', err);
      return { ok: false, error: err };
    } finally {
      // 5. [A CORREÇÃO] Chamar fetchData() para atualizar a UI
      console.debug('[FinanceContext.saveVariableExpense] refetch após salvar…');
      try {
        await fetchData();
      } catch (refetchErr) {
        console.warn('[FinanceContext.saveVariableExpense] falha no refetch:', refetchErr);
      }
      console.groupEnd();
    }
  };
  // <<< FIM DA NOVA FUNÇÃO >>>

  // --- FUNÇÃO DE DELEÇÃO ATUALIZADA ---
  const deleteDespesa = async (despesaObject, deleteType = 'single') => {
    console.groupCollapsed('[FinanceContext.deleteDespesa] start');
    console.log(`[FinanceContext] Deletando item. Tipo de Deletar: ${deleteType}. Objeto:`, despesaObject);

    if (!despesaObject || !despesaObject.id) {
      console.error('[FinanceContext] ERRO: Objeto da despesa é inválido ou não tem ID.', despesaObject);
      return;
    }

    try {
      if (despesaObject.is_fixed === true) {
        const transactionId = despesaObject.id;
        const seriesId = despesaObject.purchase_id;

        if (deleteType === 'all' && seriesId) {
            console.log(`[FinanceContext] Rota: Deletando SÉRIE fixa com purchase_id: ${seriesId}`);
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('purchase_id', seriesId);
            if (error) throw error;
            console.log('Série de despesas fixas deletada com sucesso.');
        } else {
            console.log(`[FinanceContext] Rota: Deletando PARCELA fixa única com id: ${transactionId}`);
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', transactionId);
            if (error) throw error;
            console.log('Despesa fixa única deletada com sucesso.');
        }

      } else {
        // --- Lógica de exclusão de Despesa Variável (mantida) ---
        const despesaIdParaExcluir = despesaObject.despesa_id || despesaObject.id;
        console.log(`[FinanceContext] Rota: Despesa Variável. ID principal para exclusão: ${despesaIdParaExcluir}`);
        
        if (!despesaIdParaExcluir) {
          console.error('[FinanceContext] ERRO: Não foi possível determinar o ID principal da despesa.', despesaObject);
          alert('Erro: Não foi possível identificar a despesa principal para excluir.');
          console.groupEnd();
          return;
        }

        console.log(`[FinanceContext] Deletando registros da tabela 'parcelas' com despesa_id: ${despesaIdParaExcluir}`);
        const { error: parcelasError } = await supabase.from('parcelas').delete().eq('despesa_id', despesaIdParaExcluir);
        if (parcelasError) {
          console.error('[FinanceContext] ERRO ao deletar parcelas:', parcelasError);
          alert(`Erro ao deletar parcelas: ${parcelasError.message}`);
          console.groupEnd();
          return;
        }

        console.log(`[FinanceContext] Deletando registro da tabela 'despesas' com id: ${despesaIdParaExcluir}`);
        const { error: despesaError } = await supabase.from('despesas').delete().eq('id', despesaIdParaExcluir); 
        if (despesaError) {
          console.error('[FinanceContext] ERRO ao deletar despesa principal:', despesaError);
          alert(`Erro ao deletar despesa: ${despesaError.message}`);
        } else {
          console.log('[FinanceContext] Despesa e parcelas associadas deletadas com sucesso.');
        }
      }
    } catch (err) {
      console.error('[FinanceContext.deleteDespesa] FALHA:', err);
      throw err;
    } finally {
      console.debug('[FinanceContext.deleteDespesa] refetch após delete…');
      try {
        await fetchData();
      } catch (refetchErr) {
        console.warn('[FinanceContext.deleteDespesa] falha no refetch:', refetchErr);
      }
      console.groupEnd();
    }
  };

  // --- Função de Alternar Pagamento (Sem mudanças) ---
  const toggleFixedExpensePaidStatus = async (transactionId, newPaidStatus) => {
    console.log(`[FinanceContext] Atualizando status de pagamento para ${newPaidStatus} no ID: ${transactionId}`);
    try {
      const { data, error } = await supabase
        .from('transactions').update({ paid: newPaidStatus }).eq('id', transactionId).select().single();
      
      if (error) {
        console.error('[FinanceContext] Erro ao atualizar status de pagamento:', error);
        throw error;
      }
      
      console.log('[FinanceContext] Status de pagamento atualizado com sucesso:', data);
      
      // Atualização otimista do estado
      setTransactions(currentTransactions =>
        currentTransactions.map(t =>
          t.id === transactionId ? { ...t, paid: newPaidStatus } : t
        )
      );
      
      return data;

    } catch (err) {
      console.error("Falha ao alterar status de pagamento:", err);
      // Se a atualização otimista falhar, o refetch garante a consistência
      await fetchData();
      throw err;
    }
  };

  // --- Função Saldo por Banco (Sem mudanças) ---
  const getSaldoPorBanco = (banco, selectedMonth) => {
    const despesasFixasDoMes = transactions.filter(
      (t) =>
        t.metodo_pagamento?.toLowerCase() === banco.nome?.toLowerCase() &&
        t.type === 'expense' &&
        t.is_fixed === true &&
        t.date?.startsWith(selectedMonth)
    );
    
    const despesasPrincipaisDoBanco = variableExpenses.filter(
      (d) => d.metodo_pagamento?.toLowerCase() === banco.nome?.toLowerCase()
    );
    
    const idsDespesasVariaveis = despesasPrincipaisDoBanco.map((d) => d.id);
    
    const parcelasVariaveisDoMes = allParcelas.filter(
      (p) => idsDespesasVariaveis.includes(p.despesa_id) && p.data_parcela?.startsWith(selectedMonth)
    );
    
    const totalFixo = despesasFixasDoMes.reduce((acc, despesa) => acc - (Number(despesa.amount) || 0), 0);
    const totalVariavel = parcelasVariaveisDoMes.reduce((acc, parcela) => acc - (Number(parcela.amount) || 0), 0);
    
    return totalFixo + totalVariavel;
  };

  // --- Exportação dos Valores ---
  const value = useMemo(() => ({
    loading,
    error,
    setError,
    fetchData,
    transactions,
    variableExpenses,
    allParcelas,
    bancos,
    insights, 
    categorias, 
    embeddingQueue, // NOVO: Expõe o estado da fila
    getSaldoPorBanco,
    deleteDespesa,
    saveFixedExpense,
    updateFixedExpenseSeries, 
    saveIncome,
    saveVariableExpense, // <<< [NOVO] Adiciona a função ao contexto
    toggleFixedExpensePaidStatus,
    isSyncing,
    lastSyncedAt,
    syncNow,
  }), [
    loading, error, fetchData, transactions, variableExpenses, allParcelas, bancos,
    insights, categorias, embeddingQueue, // NOVO: Adicionado à dependência
    saveFixedExpense, saveIncome, deleteDespesa, getSaldoPorBanco, updateFixedExpenseSeries,
    saveVariableExpense, // <<< [NOVO] Adiciona a função às dependências do useMemo
    isSyncing, lastSyncedAt, syncNow,
  ]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

// --- Hook 'useFinance' ---
export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
};
