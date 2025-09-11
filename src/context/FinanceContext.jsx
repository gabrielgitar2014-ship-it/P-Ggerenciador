import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useModal } from './ModalContext'; // ✅ IMPORTAÇÃO ADICIONADA
import { supabase } from '../supabaseClient';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  // A chamada a useModal foi removida daqui para evitar erros de contexto
  
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
    if (expenseData.id) {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          description: expenseData.description,
          amount: expenseData.amount,
          date: expenseData.date,
          metodo_pagamento: expenseData.metodo_pagamento,
          due_date: expenseData.due_date,
        })
        .eq('id', expenseData.id)
        .select();

      if (error) {
        console.error("Erro ao atualizar despesa fixa:", error);
        throw error;
      }
      return data;
    } 
    else {
      const { description, amount, bank, dueDate, startDate, recurrence } = expenseData;
      const [year, month] = startDate.split('-').map(Number);
      const transactionsToInsert = [];
      const numInstallments = recurrence.type === 'infinite' ? 120 : recurrence.installments;

      for (let i = 0; i < numInstallments; i++) {
        const transactionDate = new Date(year, month - 1 + i, dueDate);
        const formattedDate = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}-${String(transactionDate.getDate()).padStart(2, '0')}`;
        transactionsToInsert.push({
          description,
          amount,
          metodo_pagamento: bank,
          due_date: parseInt(dueDate, 10),
          date: formattedDate,
          is_fixed: true,
          type: 'expense',
          paid: false,
        });
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert)
        .select();

      if (error) {
        console.error("Erro ao inserir novas despesas fixas:", error);
        throw error;
      }
      return data;
    }
  };

  const deleteDespesa = async (despesaObject) => {
    if (!despesaObject || !despesaObject.id) {
        console.error("Objeto da despesa é inválido ou não tem ID.", despesaObject);
        alert("Erro: Não foi possível deletar o item porque ele é inválido.");
        return;
    }

    if (despesaObject.is_fixed) {
        const { error } = await supabase.from('transactions').delete().eq('id', despesaObject.id);
        if (error) {
            console.error("Erro do Supabase ao deletar despesa fixa:", error);
            alert(`Erro do Supabase: ${error.message}`);
        }
    } else {
      const despesaIdParaExcluir = despesaObject.despesa_id || despesaObject.id;

      if (!despesaIdParaExcluir) {
        console.error("Não foi possível determinar o ID principal da despesa para exclusão.", despesaObject);
        alert("Erro: Não foi possível identificar a despesa principal para excluir.");
        return;
      }
      
      const { error: parcelasError } = await supabase.from('parcelas').delete().eq('despesa_id', despesaIdParaExcluir);
      if (parcelasError) {
        console.error("Erro ao deletar parcelas:", parcelasError);
        alert(`Erro ao deletar parcelas: ${parcelasError.message}`);
        return;
      }

      const { error: despesaError } = await supabase.from('despesas').delete().eq('id', despesaIdParaExcluir);
      if (despesaError) {
        console.error("Erro ao deletar despesa principal:", despesaError);
        alert(`Erro ao deletar despesa: ${despesaError.message}`);
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

    const totalFixo = despesasFixasDoMes.reduce((acc, despesa) => acc - despesa.amount, 0);
    const totalVariavel = parcelasVariaveisDoMes.reduce((acc, parcela) => acc - parcela.amount, 0);

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