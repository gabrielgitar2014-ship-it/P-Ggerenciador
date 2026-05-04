// ARQUIVO: src/components/Pagination.jsx

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  // Não renderiza nada se houver apenas uma página (ou nenhuma)
  if (totalPages <= 1) {
    return null;
  }

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2 mb-4">
      <span className="text-sm text-gray-700">
        Página <span className="font-bold">{currentPage}</span> de <span className="font-bold">{totalPages}</span>
      </span>
      <div className="flex gap-2">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="flex items-center justify-center p-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Página Anterior"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center p-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Próxima Página"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  );
}