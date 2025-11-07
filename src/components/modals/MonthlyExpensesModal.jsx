// ARQUIVO: src/components/modals/MonthlyExpensesModal.jsx

import { useMemo } from "react";
import { usePagination } from "../../hooks/usePagination";
import SearchBar from "../SearchBar";
import Pagination from "../Pagination";

// Funções movidas para fora para melhor performance
const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const formatDate = (dateString) => {
  if (!dateString) return "Data inválida";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

export default function MonthlyExpensesModal({
  isOpen,
  onClose,
  transactions,
  onTransactionClick,
  selectedMonth,
}) {
  
  const monthlyTransactions = useMemo(() => {
    if (!selectedMonth || !transactions) return [];
    return transactions.filter(t => t.date && t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // --- 1. CALCULAR O VALOR TOTAL ---
  // Usamos useMemo para que o cálculo só seja refeito se a lista de transações mudar.
  const totalAmount = useMemo(() => {
    return monthlyTransactions.reduce((acc, transaction) => acc + (transaction.amount || 0), 0);
  }, [monthlyTransactions]);

  const {
    currentData,
    searchTerm,
    setSearchTerm,
    currentPage,
    totalPages,
    handlePageChange
  } = usePagination(monthlyTransactions, { itemsPerPage: 8, filterKey: "description" });


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          {/* --- 2. EXIBIR O TÍTULO E O TOTAL --- */}
          <div>
            <h2 className="text-2xl font-bold">Despesas do Mês</h2>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalAmount)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mb-4">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>

        <div className="max-h-[55vh] overflow-y-auto pr-2">
          {currentData.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Nenhuma despesa encontrada para este mês.</p>
          ) : (
            <ul className="space-y-1">
              {currentData.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => onTransactionClick(t)}
                    className="w-full flex justify-between items-center text-left p-2 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-semibold">{t.description}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(t.date)}
                      </p>
                    </div>
                    <span className="font-bold text-red-600">
                      {formatCurrency(t.amount)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="mt-4 border-t pt-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </div>
    </div>
  );
}