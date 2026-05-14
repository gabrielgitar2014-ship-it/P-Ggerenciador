import React from 'react';

// Função para formatar a data no padrão DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return 'Data inválida';
  const [year, month, day] = dateString.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
};

// Função para formatar o valor como moeda brasileira
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

export default function SearchResultsTab({ results, searchTerm }) {
  if (!searchTerm) {
    return null; // Não renderiza nada se não houver busca
  }

  if (results.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <span className="material-symbols-outlined text-5xl text-gray-400 mb-4">search_off</span>
        <h3 className="text-xl font-semibold text-gray-700">Nenhum resultado encontrado</h3>
        <p className="text-gray-500 mt-2">Não encontramos nenhuma despesa para o termo "{searchTerm}".</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
        Resultados da Busca por: <span className="text-purple-700">"{searchTerm}"</span>
      </h2>
      <div className="space-y-3">
        {results.map((item) => (
          <div key={item.id_parcela} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{item.descricao}</p>
              <p className="text-sm text-gray-500">
                {formatDate(item.data_parcela)}
                {item.categoria && ` • ${item.categoria}`}
              </p>
            </div>
            <div className="text-right">
              <p className={`font-bold ${item.tipo === 'despesa' ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(item.valor)}
              </p>
              {item.fixa && (
                <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Fixa
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
