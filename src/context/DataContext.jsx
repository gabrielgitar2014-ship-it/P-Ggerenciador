// src/context/DataContext.jsx (CORRIGIDO)

import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Defina um valor inicial com a mesma "forma" (shape) dos seus dados.
//    Isso garante que o hook useData() nunca retorne null/undefined.
const initialContextState = {
  transactions: [],
  allParcelas: [],
  loading: true,
  error: null,
  fetchData: () => console.warn("DataProvider not ready yet"),
  setError: () => {},
  cardConfigs: [], // Adicione todas as propriedades que você usa
};

// 2. Passe o valor inicial para o createContext.
const DataContext = createContext(initialContextState);

// O resto do seu DataProvider...
export const DataProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [allParcelas, setAllParcelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cardConfigs, setCardConfigs] = useState([]); // Garanta que todos os estados sejam inicializados

  // Sua função para buscar dados
  const fetchData = async () => {
    setLoading(true);
    // ... sua lógica para buscar os dados do Supabase ...
    // Exemplo:
    // const { data, error } = await supabase.from('transactions').select('*');
    // if (data) setTransactions(data);
    // if (error) setError(error.message);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const value = {
    transactions,
    allParcelas,
    loading,
    error,
    setError,
    fetchData,
    cardConfigs
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// Hook de acesso (sem alterações)
export const useData = () => {
  return useContext(DataContext);
};