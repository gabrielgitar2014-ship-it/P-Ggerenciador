// src/hooks/useExpensesData.js

import { useState, useEffect, useCallback, useRef } from 'react';

const EXPENSES_CACHE_URL = 'https://wjvqkejtkloolvxrkfyb.supabase.co/storage/v1/object/public/despesas-cache/despesas.json';

// Configurações
const CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  REQUEST_TIMEOUT: 30000, // 30 segundos
};

/**
 * Hook para gerenciar carregamento e cache de dados das despesas
 * @param {Object} options - Opções de configuração
 * @returns {Object} - Estado e funções para gerenciar dados
 */
export const useExpensesData = (options = {}) => {
  const {
    autoLoad = true,
    cacheKey = 'expenses_cache',
    onError = null,
    onSuccess = null
  } = options;

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(null);

  /**
   * Salva dados no cache local
   */
  const saveToCache = useCallback((data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      cacheRef.current = cacheData;
      
      console.log(`Dados salvos no cache: ${data.length} itens`);
    } catch (error) {
      console.warn('Erro ao salvar no cache:', error);
    }
  }, [cacheKey]);

  /**
   * Carrega dados do cache local
   */
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;
      
      // Verifica se o cache ainda é válido
      if (age > CONFIG.CACHE_DURATION) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      cacheRef.current = cacheData;
      console.log(`Dados carregados do cache: ${cacheData.data.length} itens (idade: ${Math.round(age / 1000)}s)`);
      
      return cacheData.data;
    } catch (error) {
      console.warn('Erro ao carregar do cache:', error);
      localStorage.removeItem(cacheKey);
      return null;
    }
  }, [cacheKey]);

  /**
   * Limpa o cache
   */
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(cacheKey);
      cacheRef.current = null;
      console.log('Cache limpo');
    } catch (error) {
      console.warn('Erro ao limpar cache:', error);
    }
  }, [cacheKey]);

  /**
   * Faz requisição HTTP com timeout e retry
   */
  const fetchWithRetry = useCallback(async (url, attempt = 1) => {
    // Cancela requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      console.log(`Tentativa ${attempt} de carregar dados...`);
      
      const timeoutId = setTimeout(() => {
        abortControllerRef.current.abort();
      }, CONFIG.REQUEST_TIMEOUT);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta não é um JSON válido');
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Dados recebidos não são um array válido');
      }

      return data;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Requisição cancelada ou timeout');
      }

      console.warn(`Tentativa ${attempt} falhou:`, error.message);

      // Retry se ainda há tentativas disponíveis
      if (attempt < CONFIG.RETRY_ATTEMPTS) {
        const delay = CONFIG.RETRY_DELAY * attempt; // Backoff exponencial
        console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, attempt + 1);
      }

      throw error;
    }
  }, []);

  /**
   * Carrega dados das despesas
   */
  const loadExpenses = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    try {
      // Tenta carregar do cache primeiro (se não for refresh forçado)
      if (!forceRefresh) {
        const cachedData = loadFromCache();
        if (cachedData) {
          setData(cachedData);
          setLastUpdated(cacheRef.current.timestamp);
          setIsLoading(false);
          
          if (onSuccess) {
            onSuccess(cachedData, 'cache');
          }
          
          return cachedData;
        }
      }

      // Carrega dados da API
      console.log('Carregando dados da API...');
      const freshData = await fetchWithRetry(EXPENSES_CACHE_URL);
      
      // Valida estrutura dos dados
      if (freshData.length === 0) {
        console.warn('API retornou array vazio');
      } else {
        // Valida estrutura básica do primeiro item
        const firstItem = freshData[0];
        const requiredFields = ['metodo_pagamento'];
        const missingFields = requiredFields.filter(field => !(field in firstItem));
        
        if (missingFields.length > 0) {
          console.warn('Campos obrigatórios ausentes:', missingFields);
        }
      }

      // Salva no cache e atualiza estado
      saveToCache(freshData);
      setData(freshData);
      setLastUpdated(Date.now());
      
      console.log(`${freshData.length} despesas carregadas com sucesso`);
      
      if (onSuccess) {
        onSuccess(freshData, 'api');
      }
      
      return freshData;

    } catch (err) {
      console.error('Erro ao carregar despesas:', err);
      
      let errorMessage = 'Erro ao carregar dados das despesas';
      
      if (err.message.includes('timeout') || err.message.includes('cancelada')) {
        errorMessage = 'Timeout na conexão. Verifique sua internet.';
      } else if (err.message.includes('HTTP')) {
        errorMessage = `Erro do servidor: ${err.message}`;
      } else if (err.message.includes('JSON')) {
        errorMessage = 'Dados recebidos estão corrompidos.';
      } else if (err.message.includes('array')) {
        errorMessage = 'Formato de dados inválido recebido.';
      } else {
        errorMessage = `Erro de conexão: ${err.message}`;
      }
      
      setError(errorMessage);
      
      // Tenta carregar do cache como fallback
      const cachedData = loadFromCache();
      if (cachedData) {
        console.log('Usando dados do cache como fallback');
        setData(cachedData);
        setLastUpdated(cacheRef.current.timestamp);
        setError(`${errorMessage} (usando dados em cache)`);
      } else {
        setData([]);
      }
      
      if (onError) {
        onError(err, errorMessage);
      }
      
      throw new Error(errorMessage);

    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [fetchWithRetry, loadFromCache, saveToCache, onSuccess, onError]);

  /**
   * Recarrega dados forçando refresh
   */
  const refresh = useCallback(() => {
    return loadExpenses(true);
  }, [loadExpenses]);

  /**
   * Cancela carregamento em andamento
   */
  const cancelLoading = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      console.log('Carregamento cancelado');
    }
  }, []);

  /**
   * Filtra despesas por método de pagamento
   */
  const getExpensesByPaymentMethod = useCallback((paymentMethod) => {
    if (!paymentMethod || !data.length) {
      return [];
    }
    
    return data.filter(expense => 
      expense.metodo_pagamento === paymentMethod
    );
  }, [data]);

  /**
   * Obtém métodos de pagamento únicos
   */
  const getPaymentMethods = useCallback(() => {
    if (!data.length) return [];
    
    const methods = [...new Set(data.map(expense => expense.metodo_pagamento))];
    return methods.filter(Boolean).sort();
  }, [data]);

  /**
   * Estatísticas dos dados
   */
  const getStatistics = useCallback(() => {
    if (!data.length) return null;

    const paymentMethods = getPaymentMethods();
    const methodCounts = {};
    
    paymentMethods.forEach(method => {
      methodCounts[method] = getExpensesByPaymentMethod(method).length;
    });

    return {
      totalExpenses: data.length,
      paymentMethods: paymentMethods.length,
      methodCounts,
      lastUpdated: lastUpdated ? new Date(lastUpdated).toLocaleString('pt-BR') : null,
      cacheAge: lastUpdated ? Math.round((Date.now() - lastUpdated) / 1000) : null
    };
  }, [data, getPaymentMethods, getExpensesByPaymentMethod, lastUpdated]);

  // Carregamento automático na inicialização
  useEffect(() => {
    if (autoLoad) {
      loadExpenses();
    }

    // Cleanup na desmontagem
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoLoad, loadExpenses]);

  return {
    // Estados
    data,
    isLoading,
    error,
    lastUpdated,
    retryCount,
    
    // Funções principais
    loadExpenses,
    refresh,
    cancelLoading,
    
    // Utilitários
    getExpensesByPaymentMethod,
    getPaymentMethods,
    getStatistics,
    clearCache,
    
    // Status
    hasData: data.length > 0,
    hasError: !!error,
    isEmpty: !isLoading && data.length === 0,
    isStale: lastUpdated && (Date.now() - lastUpdated) > CONFIG.CACHE_DURATION
  };
};

