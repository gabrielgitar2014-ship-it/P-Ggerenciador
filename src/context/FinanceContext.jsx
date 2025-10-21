// FinanceContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../supabaseClient';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bancos, setBancos] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [allParcelas, setAllParcelas] = useState([]);

  // --- NOVO: estado de sincronização ---
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const syncingRef = useRef(false);

  const fetchData = useCallback(async () => {
    console.groupCollapsed('[FinanceContext.fetchData] start');
    setLoading(true);
    setError(null);
    try {
      console.debug('[FinanceContext.fetchData] solicitando tabelas: despesas, parcelas, transactions…');
      const [despesasRes, parcelasRes, transactionsRes] = await Promise.all([
        supabase.from('despesas').select('*'),
        supabase.from('parcelas').select('*'),
        supabase.from('transactions').select('*'),
      ]);

      if (despesasRes.error) throw despesasRes.error;
      if (parcelasRes.error) throw parcelasRes.error;
      if (transactionsRes.error) throw transactionsRes.error;

      console.debug('[FinanceContext.fetchData] counts:', {
        despesas: despesasRes.data?.length || 0,
        parcelas: parcelasRes.data?.length || 0,
        transactions: transactionsRes.data?.length || 0,
      });

      const bancosData = [
        { id: 1, nome: 'Nubank', bandeira: 'mastercard', cor: 'bg-purple-800', ultimos_digitos: '4293', tipo: 'Crédito' },
        { id: 2, nome: 'Itaú', bandeira: 'visa', cor: 'bg-blue-950', ultimos_digitos: ['2600', '5598'], tipo: 'Crédito' },
        { id: 3, nome: 'Bradesco', bandeira: 'visa', cor: 'bg-black', ultimos_digitos: '1687', tipo: 'Crédito' },
        { id: 4, nome: 'PIX', bandeira: 'pix', cor: 'bg-emerald-500', ultimos_digitos: '', tipo: 'Transferência' },
      ];

      // Juntando dados da tabela 'transactions' (fixas, rendas, pix) e 'despesas' (parceladas)
      const todasTransacoes = [
        ...(transactionsRes.data || []),
        ...(despesasRes.data || []),
      ];

      setBancos(bancosData);
      setTransactions(todasTransacoes);
      setAllParcelas(parcelasRes.data || []);
      console.log('[FinanceContext.fetchData] OK: estado atualizado.');
    } catch (err) {
      setError(err.message);
      console.error('[FinanceContext.fetchData] ERRO:', err);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- NOVO: função de sincronização ---
  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    setError(null);
    try {
      // 1) Tenta Edge Function (altere o nome se o seu for outro)
      try {
        const { error: fnError } = await supabase.functions.invoke('atualizar-cache-despesas', { body: {} });
        if (fnError) throw fnError;
      } catch (e) {
        console.warn('[FinanceContext.syncNow] Edge Function falhou ou não existe, usando fallback:', e?.message);
        // 2) Fallback: ping simples no banco
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

  const saveIncome = async (incomeData) => {
    try {
      const isEdit = !!incomeData.id;
      let result;

      if (isEdit) {
        const { data, error } = await supabase.from('transactions')
          .update(incomeData)
          .eq('id', incomeData.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase.from('transactions')
          .insert({ ...incomeData, type: 'income' })
          .select()
          .single();
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

  const saveFixedExpense = async (expenseData) => {
    console.groupCollapsed('[FinanceContext.saveFixedExpense] start');
    try {
      console.info('[FinanceContext.saveFixedExpense] payload recebido:', expenseData);

      const isEdit = !!expenseData?.id;

      const amount = Number(
        typeof expenseData?.amount === 'string'
          ? expenseData.amount.replace(',', '.')
          : expenseData?.amount
      );
      const metodo_pagamento = expenseData?.metodo_pagamento ?? expenseData?.bank ?? null;
      const due = Number(expenseData?.due_date ?? expenseData?.dueDate);
      const start = expenseData?.startDate;
      const dateFromPayload = expenseData?.date;

      const parseYM = (s) => (s ? s.split('-').slice(0, 2).map(Number) : []);
      const [startY, startM] = start ? parseYM(start) : (dateFromPayload ? parseYM(dateFromPayload) : []);
      const safeDate = dateFromPayload || (
        startY && startM && due
          ? `${startY}-${String(startM).padStart(2, '0')}-${String(due).padStart(2, '0')}`
          : null
      );

      const issues = [];
      if (!expenseData?.description) issues.push('description vazio');
      if (!metodo_pagamento) issues.push('metodo_pagamento vazio');
      if (!Number.isFinite(amount) || amount <= 0) issues.push('amount inválido');
      if (!Number.isInteger(due) || due < 1 || due > 31) issues.push('due_date inválido (1..31)');
      if (!safeDate) issues.push('data calculada vazia');

      if (issues.length) {
        console.warn('[FinanceContext.saveFixedExpense] possíveis problemas de validação:', issues);
      }

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
        const row = {
          ...toRow(yEdit, mEdit),
          date: safeDate,
        };

        console.info('[FinanceContext.saveFixedExpense] UPDATE row:');
        console.table(row);

        const { data, error } = await supabase
          .from('transactions')
          .update(row)
          .eq('id', expenseData.id)
          .select('*');

        if (error) {
          console.error('[FinanceContext.saveFixedExpense] ERRO update Supabase:', error);
          throw error;
        }
        console.log('[FinanceContext.saveFixedExpense] UPDATE OK, linhas:', data?.length || 0);

        window.dispatchEvent(new CustomEvent('fixed-expense:saved', {
          detail: { mode: 'edit', count: data?.length || 0, data },
        }));

        return { ok: true, data };
      }

      const recurrenceType = expenseData?.recurrence?.type || 'single';
      const installments = expenseData?.recurrence?.installments ?? 1;

      let rows = [];
      if (startY && startM) {
        if (recurrenceType === 'fixed' && Number.isInteger(installments) && installments > 1) {
          for (let i = 0; i < installments; i++) {
            const { y, m } = addMonths(startY, startM, i);
            rows.push(toRow(y, m));
          }
        } else {
          rows = [toRow(startY, startM)];
        }
      } else if (safeDate) {
        const [y, m] = parseYM(safeDate);
        rows = [toRow(y, m)];
      } else {
        throw new Error('Não foi possível calcular a data de inserção.');
      }

      console.info('[FinanceContext.saveFixedExpense] INSERT linhas:', rows.length);
      console.table(rows);

      const { data, error } = await supabase
        .from('transactions')
        .insert(rows)
        .select('*');

      if (error) {
        console.error('[FinanceContext.saveFixedExpense] ERRO insert Supabase:', error);
        throw error;
      }
      console.log('[FinanceContext.saveFixedExpense] INSERT OK, linhas:', data?.length || 0);

      window.dispatchEvent(new CustomEvent('fixed-expense:saved', {
        detail: { mode: 'create', count: data?.length || 0, data },
      }));

      return { ok: true, data };
    } catch (err) {
      setError(err?.message || String(err));
      console.error('[FinanceContext.saveFixedExpense] FALHA:', err);
      return { ok: false, error: err };
    } finally {
      console.debug('[FinanceContext.saveFixedExpense] refetch após salvar…');
      try {
        await fetchData();
        console.debug('[FinanceContext.saveFixedExpense] refetch concluído.');
      } catch (refetchErr) {
        console.warn('[FinanceContext.saveFixedExpense] falha no refetch:', refetchErr);
      }
      console.groupEnd();
    }
  };

  const toggleFixedExpensePaidStatus = async (transactionId, newPaidStatus) => {
    console.log(`[FinanceContext] Atualizando status de pagamento para ${newPaidStatus} no ID: ${transactionId}`);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({ paid: newPaidStatus })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) {
        console.error('[FinanceContext] Erro ao atualizar status de pagamento:', error);
        throw error;
      }
      
      console.log('[FinanceContext] Status de pagamento atualizado com sucesso:', data);
      
      setTransactions(currentTransactions =>
        currentTransactions.map(t =>
          t.id === transactionId ? { ...t, paid: newPaidStatus } : t
        )
      );

      return data;

    } catch (err) {
      console.error("Falha ao alterar status de pagamento:", err);
      await fetchData(); 
      throw err;
    }
  };

  const deleteDespesa = async (despesaObject) => {
    console.groupCollapsed('[FinanceContext.deleteDespesa] start');
    console.log('[FinanceContext] Função deleteDespesa chamada com o objeto:', despesaObject);

    if (!despesaObject || !despesaObject.id) {
      console.error('[FinanceContext] ERRO: Objeto da despesa é inválido ou não tem ID.', despesaObject);
      alert('Erro: Não foi possível deletar o item porque ele é inválido.');
      console.groupEnd();
      return;
    }

    try {
      // Itens da tabela 'transactions' (Fixas e PIX/Avulsas)
      if (despesaObject.is_fixed === true || (despesaObject.is_fixed === false && despesaObject.is_parcelado === false)) {
        console.log(`[FinanceContext] Rota: Despesa Fixa ou Avulsa. Deletando da tabela 'transactions' com id: ${despesaObject.id}`);
        const { error } = await supabase.from('transactions').delete().eq('id', despesaObject.id);
        if (error) {
          console.error('[FinanceContext] ERRO do Supabase ao deletar despesa (transactions):', error);
          alert(`Erro do Supabase: ${error.message}`);
        } else {
          console.log('[FinanceContext] Despesa (transactions) deletada com sucesso.');
        }
      } 
      // Itens da tabela 'despesas' (Parceladas)
      else {
        const despesaIdParaExcluir = despesaObject.despesa_id || despesaObject.id;
        console.log(`[FinanceContext] Rota: Despesa Variável Parcelada. ID principal para exclusão: ${despesaIdParaExcluir}`);

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
    } finally {
      console.debug('[FinanceContext.deleteDespesa] refetch após delete…');
      try {
        await fetchData();
        console.debug('[FinanceContext.deleteDespesa] refetch concluído.');
      } catch (refetchErr) {
        console.warn('[FinanceContext.deleteDespesa] falha no refetch:', refetchErr);
      }
      console.groupEnd();
    }
  };

  
  const getSaldoPorBanco = (banco, selectedMonth) => {
    const bancoNomeLowerCase = banco.nome?.toLowerCase();

    // 1. Filtrando despesas fixas (da tabela 'transactions')
    const despesasFixasDoMes = transactions.filter(
      (t) =>
        t.metodo_pagamento?.toLowerCase() === bancoNomeLowerCase &&
        t.type === 'expense' &&
        t.is_fixed === true &&
        t.date?.startsWith(selectedMonth)
    );

    // 2. Filtrando despesas principais (PIX da 'transactions' E Pais de Parcelas da 'despesas')
    const despesasPrincipaisDoBanco = transactions.filter(
      (t) => 
        t.metodo_pagamento?.toLowerCase() === bancoNomeLowerCase && 
        !t.is_fixed 
    );

    // 3. Filtrando Despesas Variáveis AVULSAS (Ex: PIX)
    const despesasVariaveisUnicas = despesasPrincipaisDoBanco.filter(d => {
        if (d.is_parcelado === false) { 
            if (d.mes_inicio_cobranca) {
                return d.mes_inicio_cobranca.startsWith(selectedMonth);
            }
            return d.date?.startsWith(selectedMonth);
        }
        return false;
    });

    // 4. Filtrando PARCELAS (da tabela 'parcelas')
    
    // <<< INÍCIO DA CORREÇÃO DE LÓGICA (Evita Duplicação) >>>
    // Pega os IDs APENAS das despesas que são de fato parceladas
    const idsDespesasVariaveis = despesasPrincipaisDoBanco
        .filter(d => d.is_parcelado === true) // Só pega pais que são parcelados
        .map(d => d.id);
    // <<< FIM DA CORREÇÃO DE LÓGICA >>>
        
    const parcelasVariaveisDoMes = allParcelas.filter(
      (p) => idsDespesasVariaveis.includes(p.despesa_id) && p.data_parcela?.startsWith(selectedMonth)
    );

    // 5. Somando todos os tipos de despesa (Sem duplicar)
    const totalFixo = despesasFixasDoMes.reduce((acc, despesa) => acc - (Number(despesa.amount) || 0), 0);
    const totalVariavelAvulsa = despesasVariaveisUnicas.reduce((acc, despesa) => acc - (Number(despesa.amount) || 0), 0);
    const totalVariavelParcelada = parcelasVariaveisDoMes.reduce((acc, parcela) => acc - (Number(parcela.amount) || 0), 0);
    
    return totalFixo + totalVariavelAvulsa + totalVariavelParcelada;
  };
  

  const value = useMemo(() => ({
    loading,
    error,
    setError,
    fetchData,
    transactions,
    allParcelas,
    bancos,
    getSaldoPorBanco,
    deleteDespesa,
    saveFixedExpense,
    saveIncome,
    toggleFixedExpensePaidStatus,

    // --- NOVO: expõe sincronização ---
    isSyncing,
    lastSyncedAt,
    syncNow,
  }), [
    loading, error, fetchData, transactions, allParcelas, bancos,
    saveFixedExpense, saveIncome, deleteDespesa, getSaldoPorBanco,
    isSyncing, lastSyncedAt, syncNow,
    toggleFixedExpensePaidStatus 
  ]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
};