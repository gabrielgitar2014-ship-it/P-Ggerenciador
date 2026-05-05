// src/components/modals/BancoDetalhesModal.jsx

import React from 'react';

const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function BancoDetalhesModal({ isOpen, onClose, bancoNome, valorTotalParcelado }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in-down">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
                <div className="flex justify-end">
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 -mt-4">{bancoNome}</h2>
                <p className="text-sm text-gray-500 mt-2">Saldo Devedor Futuro</p>
                
                <div className="my-6">
                    <p className="text-4xl font-bold text-blue-600">
                        {formatCurrency(valorTotalParcelado)}
                    </p>
                </div>
                
                <p className="text-xs text-gray-400">
                    Este é o valor somado de todas as parcelas futuras (a partir de hoje) neste cartão.
                </p>
            </div>
        </div>
    );
}