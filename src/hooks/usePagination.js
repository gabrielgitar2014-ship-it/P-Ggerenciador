// ARQUIVO: src/hooks/usePagination.js (VERSÃO CORRIGIDA)

import { useState, useMemo, useEffect } from "react";

export function usePagination(data, options = {}) {
  // O hook espera receber 'itemsPerPage' e a função 'filterFn'
  const { itemsPerPage = 10, filterFn } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // O useMemo é a chave: ele recalcula os dados filtrados quando o termo de busca ou os dados mudam.
  const filteredData = useMemo(() => {
    if (!data) return [];
    
    // Se não houver função de filtro ou termo de busca, retorna todos os dados.
    if (!filterFn || !searchTerm) {
      return data;
    }
    
    // AQUI ESTÁ A CORREÇÃO:
    // O hook agora chama a função 'filterFn' que foi passada pela DespesasTab
    // para cada item da lista, aplicando o seu filtro customizado.
    return data.filter((item) => filterFn(item, searchTerm));

  }, [data, searchTerm, filterFn]); // Depende dos dados, do termo de busca e da função de filtro

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reseta para a primeira página sempre que um novo filtro é aplicado
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, data]);

  return {
    currentPage,
    totalPages,
    currentData,
    searchTerm,
    setSearchTerm,
    handlePageChange,
  };
}