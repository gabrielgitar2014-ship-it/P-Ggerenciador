// src/context/FinanceContext.jsx
// (Versão Final Consolidada - Lógica de Cartão Real + Integração DB + Edição Completa)

import React, { createContext, useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../supabaseClient';

// --- HELPERS ---
const generateUUID = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const parseYM = (s) => (s ? s.split('-').slice(0, 2).map(Number) : []);

// Helper para adicionar meses corretamente a uma data
const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

// Helper legado para adicionar meses a partir de (ano, mes) - usado nas despesas fixas
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
  
  const [bancos, setBancos] = useState([]); // Carregado do DB
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
    console.groupCollapsed('[FinanceContext.fetchData] start');
    setLoading(true);
    setError(null);
    try {
      // 1. Busca Dados Agregados (RPC)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_shared_data');
      if (rpcError) throw rpcError;

      // 2. Busca Métodos de Pagamento (Tabela Real)
      const { data: methodsData, error: methodsError } = await supabase
        .from('metodos_pagamento')
        .select('*')
        .order('id', { ascending: true });
        
      if (methodsError) throw methodsError;

      // Formata os bancos para o frontend
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
      
      // Atualiza estados com dados do RPC
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
      console.groupEnd();
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- SINCRONIZAÇÃO (Sync) ---
  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      try {
        await supabase.functions.invoke('atualizar-cache-despesas', { body: {} });
      } catch (e) { console.warn('Fallback sync: Edge function error', e); }
      await fetchData();
      setLastSyncedAt(new Date());
    } catch (e) { setError(e.message); } 
    finally { setIsSyncing(false); syncingRef.current = false; }
  }, [fetchData]);

  // --- FUNÇÕES DE PERSISTÊNCIA ---

  // 1. Salvar Método de Pagamento (Criar ou Editar Cartão)
  const savePaymentMethod = async (methodData) => {
    console.log("Salvando método:", methodData);
    try {
      const payload = {
        nome: methodData.nome,
        cor: methodData.cor,
        dia_fechamento: Number(methodData.diaFechamento),
        dia_vencimento: Number(methodData.diaVencimento),
        ultimos_digitos: methodData.ultimosDigitos,
        tipo: 'Crédito' // Default
      };

      let result;
      // UPDATE se tiver ID
      if (methodData.id) {
        const { data, error } = await supabase
          .from('metodos_pagamento')
          .update(payload)
          .eq('id', methodData.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } 
      // INSERT se não tiver ID
      else {
        const { data, error } = await supabase
          .from('metodos_pagamento')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }
      
      await fetchData(); 
      return { ok: true, data: result };
    } catch (err) {
      console.error("Erro ao salvar cartão:", err);
      return { ok: false, error: err };
    }
  };

  // 2. Salvar Renda
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

  // 3. Salvar Despesa Fixa (Com Recorrência)
  const saveFixedExpense = async (expenseData) => {
    try {
      const isEdit = !!expenseData?.id;
      const series_id = expenseData?.purchase_id || (isEdit ? null : generateUUID());
      const amount = Number(String(expenseData?.amount).replace(',', '.'));
      const metodo = expenseData?.metodo_pagamento ?? expenseData?.bank ?? null;
      const due = Number(expenseData?.due_date ?? expenseData?.dueDate);
      const start = expenseData?.startDate; 
      const datePayload = expenseData?.date;

      const [startY, startM] = start ? parseYM(start) : (datePayload ? parseYM(datePayload) : []);
      const safeDate = datePayload || (startY ? `${startY}-${String(startM).padStart(2,'0')}-${String(due).padStart(2,'0')}` : null);

      const toRow = (y, m) => ({
        description: (expenseData.description || '').trim(),
        amount, metodo_pagamento: metodo, due_date: due,
        date: `${y}-${String(m).padStart(2,'0')}-${String(due).padStart(2,'0')}`,
        type: 'expense', is_fixed: true, categoria_id: expenseData.categoria_id, purchase_id: series_id
      });

      if (isEdit) {
        const [y, m] = safeDate ? parseYM(safeDate) : [startY, startM];
        await supabase.from('transactions').update({ ...toRow(y,m), date: safeDate }).eq('id', expenseData.id);
      } else {
        const installments = expenseData?.recurrence?.installments ?? 1;
        const type = expenseData?.recurrence?.type || 'single';
        let rows = [];
        if (startY) {
          if (type === 'fixed' && installments > 1) {
            for (let i=0; i<installments; i++) {
              const { y, m } = addMonthsToYM(startY, startM, i);
              rows.push(toRow(y, m));
            }
          } else {
            rows.push(toRow(startY, startM));
          }
        }
        if (rows.length) await supabase.from('transactions').insert(rows);
      }
      await wait(500); await fetchData();
      return { ok: true };
    } catch (err) { return { ok: false, error: err }; }
  };

  const updateFixedExpenseSeries = async (transaction, expenseData, updateType) => {
     const { amount, description, metodo_pagamento, categoria_id } = expenseData;
     let q = supabase.from('transactions').update({ amount, description, metodo_pagamento, categoria_id }).eq('purchase_id', transaction.purchase_id);
     if (updateType === 'future') q = q.gte('date', transaction.date);
     await q;
     await wait(500); await fetchData();
  };

  // 4. Salvar Despesa Variável (Manual - NovaDespesaModal)
  // [CORRIGIDO: BLINDAGEM CONTRA DATAS INVÁLIDAS E INSERÇÃO DE PARCELAS]
  const saveVariableExpense = async (expenseData) => {
    console.groupCollapsed('[FinanceContext.saveVariableExpense] start');
    try {
      const isEdit = !!expenseData.id;
      const totalAmount = Number(String(expenseData.amount).replace(',', '.'));
      const qtdParcelas = Number(expenseData.qtd_parcelas || 1);
      
      // A. Configurações do Banco
      const bancoConfig = bancos.find(b => 
        b.nome.toLowerCase() === expenseData.metodo_pagamento?.toLowerCase()
      );

      // Datas Base
      // Forçamos o meio-dia para evitar problemas de fuso horário
      const dataCompraParts = expenseData.data_compra.split('-'); // YYYY-MM-DD
      const dataCompra = new Date(
        Number(dataCompraParts[0]), 
        Number(dataCompraParts[1]) - 1, 
        Number(dataCompraParts[2]), 
        12, 0, 0
      );
      
      const diaCompra = dataCompra.getDate();

      // Configuração de Datas (Default: 32 = sem fechamento, diaVencimento = diaCompra)
      const diaFechamento = bancoConfig?.diaFechamento || 32; 
      const diaVencimento = bancoConfig?.diaVencimento || diaCompra; 
      
      // B. Calcular Mês/Ano da Primeira Parcela
      // Não usamos setDate direto para evitar bugs de virada de mês em dias 31
      let mesReferencia = dataCompra.getMonth();
      let anoReferencia = dataCompra.getFullYear();

      if (diaFechamento !== 32) {
        // Lógica de Cartão: Se comprou após fechamento, pula 2 meses (mês atual + próximo)
        // Se antes, pula 1 mês (mês seguinte)
        if (diaCompra >= diaFechamento) {
          mesReferencia += 2;
        } else {
          mesReferencia += 1;
        }
      } else {
        // Sem fechamento (ex: Boleto/PIX agendado), vence no mês seguinte
        mesReferencia += 1;
      }

      // Ajuste de virada de ano (ex: Mês 13 vira Mês 1 do ano seguinte)
      // dataBaseVencimento serve apenas para pegar o Mês/Ano inicial correto
      const dataBaseVencimento = new Date(anoReferencia, mesReferencia, 1, 12, 0, 0);
      
      // C. Persistência (Pai)
      const despesaRow = {
        description: (expenseData.description || '').trim(),
        amount: totalAmount,
        data_compra: expenseData.data_compra,
        metodo_pagamento: expenseData.metodo_pagamento,
        categoria_id: expenseData.categoria_id || null,
        is_parcelado: qtdParcelas > 1,
        qtd_parcelas: qtdParcelas,
        // Garante que campos opcionais não vão como undefined
        metodo_pagamento_id: bancoConfig?.id || null
      };

      let despesaId;

      if (isEdit) {
        despesaId = expenseData.id;
        await supabase.from('despesas').update(despesaRow).eq('id', despesaId);
        // Limpa parcelas antigas para recriar com a lógica nova
        await supabase.from('parcelas').delete().eq('despesa_id', despesaId);
      } else {
        const { data, error } = await supabase.from('despesas').insert(despesaRow).select().single();
        if (error) throw error;
        despesaId = data.id;
      }

      // D. Gerar Parcelas (Filhos) com "Clamping" de Data (Trava dia 30/31)
      const valorParcela = totalAmount / qtdParcelas;
      let parcelasRows = [];

      // O dia base para todas as parcelas é o dia de vencimento do cartão
      const diaAlvo = diaVencimento; 
      
      // Base inicial (Ano/Mês da primeira parcela calculada acima)
      let currentYear = dataBaseVencimento.getFullYear();
      let currentMonth = dataBaseVencimento.getMonth();

      for (let i = 0; i < qtdParcelas; i++) {
        // Calcula o mês alvo desta parcela específica
        // O Date do JS resolve automaticamente viradas de ano quando somamos no construtor
        
        // Descobre quantos dias tem no mês alvo
        const diasNoMes = new Date(currentYear, currentMonth + i + 1, 0).getDate();
        
        // Trava de segurança: Se o dia de vencimento for 31 e o mês tiver 30, usa 30.
        const diaSeguro = Math.min(diaAlvo, diasNoMes);
        
        const dataParcela = new Date(currentYear, currentMonth + i, diaSeguro, 12, 0, 0);
        
        const yStr = dataParcela.getFullYear();
        const mStr = String(dataParcela.getMonth() + 1).padStart(2, '0');
        const dStr = String(dataParcela.getDate()).padStart(2, '0');

        parcelasRows.push({
          despesa_id: despesaId,
          numero_parcela: i + 1,
          amount: valorParcela,
          data_parcela: `${yStr}-${mStr}-${dStr}`, // Data VENCIMENTO válida
          paga: false
        });
      }

      const { error: insertError } = await supabase.from('parcelas').insert(parcelasRows);
      if (insertError) throw insertError;

      // E. Atualizar IA
      const categoriaTexto = categorias.find(c => c.id === despesaRow.categoria_id)?.nome || 'Outros';
      await supabase.from('embedding_queue').insert({
        source_id: String(despesaId), source_table: 'despesas',
        date: despesaRow.data_compra, description: despesaRow.description,
        category: categoriaTexto, amount: despesaRow.amount
      });

      return { ok: true };

    } catch (err) {
      console.error('[FinanceContext.saveVariableExpense] ERROR:', err);
      return { ok: false, error: err };
    } finally {
      await wait(500); await fetchData(); console.groupEnd();
    }
  };

  // 4.1 Salvar Despesas a partir do Leitor de Faturas (Batch Sequencial Seguro)
  // [CORRIGIDO: VÍNCULO PAI-FILHO GARANTIDO]
  const saveInvoiceExpenses = async (invoiceDataArray) => {
    console.groupCollapsed('[FinanceContext.saveInvoiceExpenses] start');
    
    // Variável para acumular resultados e erros
    const results = [];
    const errors = [];

    try {
      if (!Array.isArray(invoiceDataArray) || invoiceDataArray.length === 0) {
        return { ok: false, error: new Error('Nenhuma despesa para salvar.') };
      }

      // LOOP SEQUENCIAL: Garante que o ID do Pai seja vinculado corretamente aos Filhos
      for (const item of invoiceDataArray) {
        try {
          const base = item.despesa || {};
          const banco = bancos.find(b => b.id === item.account_id);

          // 1. Monta o Objeto da Despesa (Pai)
          const despesaRow = {
            description: (base.description || '').trim(),
            amount: Number(base.amount),
            data_compra: base.data_compra,
            metodo_pagamento: banco?.nome || base.metodo_pagamento || null,
            categoria_id: base.categoria_id || null,
            is_parcelado: !!base.is_parcelado,
            qtd_parcelas: base.qtd_parcelas || 1,
            
            // Campos auxiliares
            inicia_proximo_mes: base.inicia_proximo_mes || false,
            mes_inicio_cobranca: base.mes_inicio_cobranca || null,
            metodo_pagamento_id: banco?.id || base.metodo_pagamento_id || null,
          };

          // 2. Insere a Despesa e recupera o ID imediatamente
          const { data: insertedDespesa, error: despError } = await supabase
            .from('despesas')
            .insert(despesaRow)
            .select()
            .single();

          if (despError) throw despError;
          if (!insertedDespesa) throw new Error("Falha ao recuperar ID da despesa inserida.");

          const despesaId = insertedDespesa.id;

          // 3. Monta as Parcelas (Filhos) vinculando ao ID recuperado
          const parcelasOriginais = item.parcelas || [];
          if (parcelasOriginais.length > 0) {
            const parcelasRows = parcelasOriginais.map(p => ({
              despesa_id: despesaId, // VÍNCULO GARANTIDO
              numero_parcela: p.numero_parcela,
              amount: Number(p.amount),
              data_parcela: p.data_parcela,
              paga: p.paga ?? false,
            }));

            const { error: parcError } = await supabase
              .from('parcelas')
              .insert(parcelasRows);

            if (parcError) throw parcError;
          }

          // 4. Enfileira para IA (Embeddings)
          const categoriaTexto = categorias.find(c => c.id === despesaRow.categoria_id)?.nome || 'Outros';
          await supabase.from('embedding_queue').insert({
            source_id: String(despesaId),
            source_table: 'despesas',
            date: despesaRow.data_compra,
            description: despesaRow.description,
            category: categoriaTexto,
            amount: despesaRow.amount,
          });

          results.push(insertedDespesa);

        } catch (innerErr) {
          console.error(`Erro ao salvar item individual: ${item.despesa?.description}`, innerErr);
          errors.push(innerErr);
          // Continua o loop para tentar salvar os próximos
        }
      }

      await wait(500);
      await fetchData();

      if (errors.length > 0 && results.length === 0) {
        return { ok: false, error: errors[0] };
      }

      return { ok: true, data: results };

    } catch (err) {
      console.error('[FinanceContext.saveInvoiceExpenses] CRITICAL ERROR:', err);
      return { ok: false, error: err };
    } finally {
      console.groupEnd();
    }
  };

  // 5. Deletar Despesa
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
         await supabase.from('parcelas').delete().eq('despesa_id', id);
         await supabase.from('despesas').delete().eq('id', id);
      }
      await supabase.from('financial_embeddings').delete().eq('source_id', String(id));
    } catch (err) { console.error(err); }
    finally { await wait(500); await fetchData(); }
  };
  
  // 6. Calcular Saldo do Banco (Fatura)
  const getSaldoPorBanco = (banco, selectedMonth) => {
    // Filtra pelo que VENCE no mês selecionado
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

  // --- Export ---
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
