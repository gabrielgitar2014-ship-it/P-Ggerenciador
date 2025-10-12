// src/components/modals/DespesasCartaoModal.jsx

import React from 'react';
// 1. Importando o hook de paginação e o componente de UI
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../Pagination'; // Ajuste o caminho se necessário

export default function DespesasCartaoModal({ isOpen, onClose, bancoNome, despesas }) {
    // 2. Usando o hook de paginação com os dados recebidos via props
    // A lista 'despesas' (completa) é passada para o hook
    // 'currentData' será a lista fatiada para a página atual
    const { 
        currentPage, 
        totalPages, 
        currentData, 
        handlePageChange 
    } = usePagination(despesas, { itemsPerPage: 5 }); // Mostrando 5 itens por página

    if (!isOpen) return null;

    const formatCurrency = (value) => {
        if (typeof value !== 'number') return 'R$ 0,00';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatarData = (data) => {
        if (!data) return '';
        const date = new Date(data);
        date.setUTCDate(date.getUTCDate() + 1);
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 m-4 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Despesas - {bancoNome}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* A altura mínima garante que o modal não encolha em páginas com poucos itens */}
                <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2 min-h-[300px]">
                    {/* 3. Mapeando 'currentData' (dados da página atual) em vez de 'despesas' (todos os dados) */}
                    {currentData.length > 0 ? (
                        currentData.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                <div>
                                    <p className="font-semibold text-gray-800">{item.description}</p>
                                    <p className="text-sm text-gray-500">
                                        {formatarData(item.date)}
                                        {item.parcelaInfo && (
                                            <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                                                {item.parcelaInfo}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <p className="font-semibold text-red-500">{formatCurrency(item.amount)}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">Nenhuma despesa encontrada para este cartão no mês selecionado.</p>
                    )}
                </div>

                {/* 4. Adicionando o componente de paginação no rodapé do modal */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />

                <div className="mt-6 text-right">
                    <button
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}