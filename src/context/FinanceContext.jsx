import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bancos, setBancos] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [allParcelas, setAllParcelas] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [despesasRes, parcelasRes, transactionsRes] = await Promise.all([
        supabase.from('despesas').select('*'),
        supabase.from('parcelas').select('*'),
        supabase.from('transactions').select('*')
      ]);

      if (despesasRes.error) throw despesasRes.error;
      if (parcelasRes.error) throw parcelasRes.error;
      if (transactionsRes.error) throw transactionsRes.error;

      const bancosData = [
        { id: 1, nome: 'Nubank', bandeira: 'mastercard', cor: 'bg-purple-800', ultimos_digitos: '4293', tipo: 'Crédito' },
        { id: 2, nome: 'Itaú', bandeira: 'visa', cor: 'bg-blue-950', ultimos_digitos: ['2600', '5598'], tipo: 'Crédito' },
        { id: 3, nome: 'Bradesco', bandeira: 'visa', cor: 'bg-black', ultimos_digitos: '1687', tipo: 'Crédito' },
        { id: 4, nome: 'PIX', bandeira: 'pix', cor: 'bg-emerald-500', ultimos_digitos: '', tipo: 'Transferência' },
      ];
      
      const todasTransacoes = [
        ...(transactionsRes.data || []), 
        ...(despesasRes.data || [])
      ];

      setBancos(bancosData);
      setTransactions(todasTransacoes);
      setAllParcelas(parcelasRes.data || []);

    } catch (err) {
      setError(err.message);
      console.error("Erro ao buscar dados do Supabase:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveFixedExpense = async (expenseData) => {
    // ...código inalterado...
  };

  const deleteDespesa = async (despesaObject) => {
    // ✅ LOGS REINSERIDOS AQUI
    console.log('[FinanceContext] Função deleteDespesa chamada com o objeto:', despesaObject);

    if (!despesaObject || !despesaObject.id) {
        console.error("[FinanceContext] ERRO: Objeto da despesa é inválido ou não tem ID.", despesaObject);
        alert("Erro: Não foi possível deletar o item porque ele é inválido.");
        return;
    }

    if (despesaObject.is_fixed === true) {
        console.log(`[FinanceContext] Rota: Despesa Fixa. Deletando da tabela 'transactions' com id: ${despesaObject.id}`);
        const { error } = await supabase.from('transactions').delete().eq('id', despesaObject.id);
        if (error) {
            console.error("[FinanceContext] ERRO do Supabase ao deletar despesa fixa:", error);
            alert(`Erro do Supabase: ${error.message}`);
        } else {
            console.log('[FinanceContext] Despesa fixa deletada com sucesso.');
        }
    } else {
      const despesaIdParaExcluir = despesaObject.despesa_id || despesaObject.id;
      console.log(`[FinanceContext] Rota: Despesa Variável. ID principal para exclusão: ${despesaIdParaExcluir}`);

      if (!despesaIdParaExcluir) {
        console.error("[FinanceContext] ERRO: Não foi possível determinar o ID principal da despesa.", despesaObject);
        alert("Erro: Não foi possível identificar a despesa principal para excluir.");
        return;
      }
      
      console.log(`[FinanceContext] Deletando registros da tabela 'parcelas' com despesa_id: ${despesaIdParaExcluir}`);
      const { error: parcelasError } = await supabase.from('parcelas').delete().eq('despesa_id', despesaIdParaExcluir);
      if (parcelasError) {
        console.error("[FinanceContext] ERRO ao deletar parcelas:", parcelasError);
        alert(`Erro ao deletar parcelas: ${parcelasError.message}`);
        return;
      }

      console.log(`[FinanceContext] Deletando registro da tabela 'despesas' com id: ${despesaIdParaExcluir}`);
      const { error: despesaError } = await supabase.from('despesas').delete().eq('id', despesaIdParaExcluir);
      if (despesaError) {
        console.error("[FinanceContext] ERRO ao deletar despesa principal:", despesaError);
        alert(`Erro ao deletar despesa: ${despesaError.message}`);
      } else {
        console.log('[FinanceContext] Despesa e parcelas associadas deletadas com sucesso.');
      }
    }
  };

  const getSaldoPorBanco = (banco, selectedMonth) => {
    const despesasFixasDoMes = transactions.filter(t => 
      t.metodo_pagamento?.toLowerCase() === banco.nome?.toLowerCase() &&
      t.type === 'expense' &&
      t.is_fixed === true &&
      t.date?.startsWith(selectedMonth)
    );

    const despesasPrincipaisDoBanco = transactions.filter(t => 
      t.metodo_pagamento?.toLowerCase() === banco.nome?.toLowerCase() &&
      !t.is_fixed 
    );
    const idsDespesasVariaveis = despesasPrincipaisDoBanco.map(d => d.id);

    const parcelasVariaveisDoMes = allParcelas.filter(p => 
      idsDespesasVariaveis.includes(p.despesa_id) &&
      p.data_parcela?.startsWith(selectedMonth)
    );
    
    const totalFixo = despesasFixasDoMes.reduce((acc, despesa) => acc - (Number(despesa.amount) || 0), 0);
    const totalVariavel = parcelasVariaveisDoMes.reduce((acc, parcela) => acc - (Number(parcela.amount) || 0), 0);

    return totalFixo + totalVariavel;
  };
  
  const value = {
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
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (context === undefined) {
      throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
    }
    return context;
};
