// src/hooks/useFinanceFetch.js
import { useState, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

export function useFinanceFetch() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    bancos: [],
    transactions: [],
    variableExpenses: [],
    allParcelas: [],
    insights: [],
    categorias: [],
    embeddingQueue: []
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const syncingRef = useRef(false);

  const fetchData = useCallback(async () => {
    console.groupCollapsed('[useFinanceFetch] Fetching Data');
    setLoading(true);
    setError(null);
    try {
      const response = await supabase.rpc('get_all_shared_data');

      if (response.error) throw response.error;
      if (!response.data) throw new Error("RPC retornou vazio.");

      const { despesas, parcelas, transactions, ai_insights, categorias, embedding_queue } = response.data;

      // Bancos Estáticos (Isso poderia vir do banco de dados no futuro)
      const bancosData = [
        { id: 1, nome: 'Nubank', ultimos_digitos: '4293', tipo: 'Crédito' },
        { id: 2, nome: 'Itaú', ultimos_digitos: ['2600', '5598'], tipo: 'Crédito' },
        { id: 3, nome: 'Bradesco', ultimos_digitos: '1687', tipo: 'Crédito' },
        { id: 4, nome: 'PIX', ultimos_digitos: '', tipo: 'Transferência' },
      ];

      setData({
        bancos: bancosData,
        transactions: transactions || [],
        variableExpenses: despesas || [],
        allParcelas: parcelas || [],
        insights: ai_insights || [],
        categorias: categorias || [],
        embeddingQueue: embedding_queue || []
      });

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      // Tenta chamar a Edge Function de cache, se falhar, segue a vida
      try {
        await supabase.functions.invoke('atualizar-cache-despesas', { body: {} });
      } catch (e) { console.warn('Cache refresh failed', e); }
      
      await fetchData();
      setLastSyncedAt(new Date());
    } finally {
      setIsSyncing(false);
      syncingRef.current = false;
    }
  }, [fetchData]);

  return {
    ...data, // Espalha os estados (transactions, etc)
    loading,
    error,
    setError,
    fetchData,
    syncNow,
    isSyncing,
    lastSyncedAt
  };
}