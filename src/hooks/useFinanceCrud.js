// src/hooks/useFinanceCrud.js
import { useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useBankRules } from './useBankRules';

// Helpers internos
const generateUUID = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const parseYM = (s) => (s ? s.split('-').slice(0, 2).map(Number) : []);
const addMonths = (dateObj, monthsToAdd) => {
  const d = new Date(dateObj);
  d.setMonth(d.getMonth() + monthsToAdd);
  return d;
};

export function useFinanceCrud(fetchData, categorias) {
  const { calculateFirstInstallmentDate } = useBankRules();

  // --- 1. RENDA ---
  const saveIncome = useCallback(async (incomeData) => {
    try {
      const isEdit = !!incomeData.id;
      const payload = { ...incomeData, type: 'income' };
      
      if (isEdit) {
        await supabase.from('transactions').update(payload).eq('id', incomeData.id);
      } else {
        await supabase.from('transactions').insert(payload);
      }
      await wait(500); await fetchData();
      return { ok: true };
    } catch (err) {
      console.error(err);
      return { ok: false, error: err };
    }
  }, [fetchData]);

  // --- 2. DESPESA FIXA (Mantida a lógica original de série) ---
  const saveFixedExpense = useCallback(async (expenseData) => {
    try {
      const isEdit = !!expenseData?.id;
      const series_id = expenseData?.purchase_id || (isEdit ? null : generateUUID());
      
      const amount = Number(String(expenseData?.amount).replace(',', '.'));
      const due = Number(expenseData?.due_date ?? expenseData?.dueDate);
      const start = expenseData?.startDate; // YYYY-MM
      
      // Função auxiliar para gerar linha
      const toRow = (y, m) => ({
        description: (expenseData.description || '').trim(),
        amount,
        metodo_pagamento: expenseData.metodo_pagamento || null,
        due_date: due,
        date: `${y}-${String(m).padStart(2, '0')}-${String(due).padStart(2, '0')}`,
        type: 'expense',
        is_fixed: true,
        categoria_id: expenseData.categoria_id || null,
        purchase_id: series_id,
      });

      if (isEdit) {
        // Edição simples de uma ocorrência
        const row = { 
            ...toRow(0,0), // Dummy call para pegar estrutura
            date: expenseData.date, // Mantém data original na edição única
            purchase_id: expenseData.purchase_id 
        };
        await supabase.from('transactions').update(row).eq('id', expenseData.id);
      } else {
        // Criação (Explosão de Parcelas)
        const [startY, startM] = parseYM(start);
        const recurrenceType = expenseData?.recurrence?.type || 'single';
        const installments = expenseData?.recurrence?.installments ?? 1;
        let rows = [];

        if (recurrenceType === 'fixed' && installments > 1) {
          for (let i = 0; i < installments; i++) {
             // Lógica simples de adicionar meses para fixas
             const idx = startY * 12 + (startM - 1) + i;
             const ny = Math.floor(idx / 12);
             const nm = (idx % 12) + 1;
             rows.push(toRow(ny, nm));
          }
        } else {
          // Single ou Infinite (cria 1 agora, infinite backend lida ou cria 12)
          rows.push(toRow(startY, startM));
        }
        
        await supabase.from('transactions').insert(rows);
      }
      
      await wait(500); await fetchData();
      return { ok: true };
    } catch (err) {
      console.error(err);
      return { ok: false, error: err };
    }
  }, [fetchData]);

  // --- 3. DESPESA VARIÁVEL (COM NOVA LÓGICA DE CARTÃO) ---
  const saveVariableExpense = useCallback(async (expenseData) => {
    console.groupCollapsed('[useFinanceCrud] saveVariableExpense');
    try {
      const isEdit = !!expenseData.id;
      const totalAmount = Number(String(expenseData.amount).replace(',', '.'));
      const qtdParcelas = Number(expenseData.qtd_parcelas || 1);
      
      // A. Salva/Atualiza o Pai (Despesa)
      const despesaRow = {
        description: (expenseData.description || '').trim(),
        amount: totalAmount,
        data_compra: expenseData.data_compra, // Data real da compra
        metodo_pagamento: expenseData.metodo_pagamento,
        categoria_id: expenseData.categoria_id || null,
        is_parcelado: qtdParcelas > 1,
        qtd_parcelas: qtdParcelas
      };

      let despesaId = expenseData.id;

      if (isEdit) {
        await supabase.from('despesas').update(despesaRow).eq('id', despesaId);
        // Limpa parcelas antigas para recriar
        await supabase.from('parcelas').delete().eq('despesa_id', despesaId);
      } else {
        const { data } = await supabase.from('despesas').insert(despesaRow).select().single();
        despesaId = data.id;
      }

      // B. Calcula Datas das Parcelas (LÓGICA NOVA)
      // Usa o hook de regras bancárias para definir quando cai a primeira parcela
      const dataPrimeiraParcela = calculateFirstInstallmentDate(
        expenseData.data_compra, 
        expenseData.metodo_pagamento
      );

      const valorParcela = totalAmount / qtdParcelas;
      let parcelasRows = [];

      for (let i = 0; i < qtdParcelas; i++) {
        // Adiciona meses à data da primeira parcela
        const dataVencimento = addMonths(dataPrimeiraParcela, i);
        
        // Formata YYYY-MM-DD
        const dataStr = dataVencimento.toISOString().split('T')[0];

        parcelasRows.push({
          despesa_id: despesaId,
          numero_parcela: i + 1,
          amount: valorParcela,
          data_parcela: dataStr // Agora isso reflete o VENCIMENTO da fatura
        });
      }

      await supabase.from('parcelas').insert(parcelasRows);

      // C. Fila de IA
      const categoriaTexto = categorias.find(c => c.id === despesaRow.categoria_id)?.nome || 'Outros';
      await supabase.from('embedding_queue').insert({
        source_id: String(despesaId),
        source_table: 'despesas',
        date: despesaRow.data_compra,
        description: despesaRow.description,
        category: categoriaTexto,
        amount: despesaRow.amount
      });

      await wait(500); await fetchData();
      return { ok: true };

    } catch (err) {
      console.error(err);
      return { ok: false, error: err };
    } finally {
      console.groupEnd();
    }
  }, [fetchData, categorias, calculateFirstInstallmentDate]);

  // --- 4. DELEÇÃO ---
  const deleteDespesa = useCallback(async (obj, type = 'single') => {
    try {
      const id = obj.despesa_id || obj.id;
      if (obj.is_fixed) {
         if (type === 'all' && obj.purchase_id) {
            await supabase.from('transactions').delete().eq('purchase_id', obj.purchase_id);
         } else {
            await supabase.from('transactions').delete().eq('id', id);
         }
      } else {
         await supabase.from('parcelas').delete().eq('despesa_id', id);
         await supabase.from('despesas').delete().eq('id', id);
         await supabase.from('financial_embeddings').delete().eq('source_id', String(id));
      }
      await wait(500); await fetchData();
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, [fetchData]);

  // --- 5. TOGGLE PAID ---
  const toggleFixedExpensePaidStatus = useCallback(async (id, status) => {
     await supabase.from('transactions').update({ paid: status }).eq('id', id);
     // O update de estado local idealmente deveria ser feito via refetch ou update otimista no useFinanceFetch
     // Aqui vamos forçar um refetch para simplicidade e garantia
     await wait(200); await fetchData();
  }, [fetchData]);

  return {
    saveIncome,
    saveFixedExpense,
    saveVariableExpense,
    deleteDespesa,
    toggleFixedExpensePaidStatus
  };
}