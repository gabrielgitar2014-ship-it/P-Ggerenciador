// src/components/modals/SearchModal.jsx

import React, { useState, useEffect } from "react";
import { useData } from "../../context/DataContext"; // 1. Importar o hook do contexto
import SearchResultsTab from "../tabs/SearchResultsTab";

// 2. Remover a prop 'allData', pois o componente agora busca os dados sozinho
export default function SearchModal({ isOpen, onClose }) {
  const { allParcelas } = useData(); // 3. Usar o contexto para obter os dados

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);

  // Limpa a busca quando o modal é fechado/aberto
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setResults([]);
    }
  }, [isOpen]);

  // Se o modal não estiver aberto, não renderiza nada
  if (!isOpen) return null;

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const searchNumber = parseFloat(term.replace(',', '.'));
    const isNumericSearch = !isNaN(searchNumber) && isFinite(searchNumber);

    // 4. Lógica de filtro local, usando 'allParcelas' do contexto
    const filteredResults = (allParcelas || []).filter(parcela => {
      // Garante que a parcela e a despesa associada existam
      if (!parcela || !parcela.despesas) {
        return false;
      }

      // Verifica a descrição (convertida para minúsculas)
      const descriptionMatch = parcela.despesas.description && parcela.despesas.description.toLowerCase().includes(term);

      // Se for uma busca numérica, verifica também o valor da parcela
      if (isNumericSearch) {
        const amountMatch = parcela.amount === searchNumber;
        return descriptionMatch || amountMatch;
      }

      // Se não for busca numérica, retorna apenas o resultado da descrição
      return descriptionMatch;
    });

    setResults(filteredResults);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl p-6 relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800" aria-label="Fechar modal">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="text-xl font-bold mb-4">Buscar Despesa</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Pesquisar por descrição ou valor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
          <button
            onClick={handleSearch}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Buscar
          </button>
        </div>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          <SearchResultsTab results={results} searchTerm={searchTerm} />
        </div>
      </div>
    </div>
  );
}
