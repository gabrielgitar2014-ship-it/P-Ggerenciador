import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { usePDF } from '@react-pdf/renderer';
import DespesasPDF from '../pdf/DespesasPDF';
import { processarDadosRelatorio } from '../../utils/reportUtils'; 

const DatePresetButtons = ({ onSelect }) => {
    const setPreset = (preset) => {
        const end = new Date();
        const start = new Date();
        
        if (preset === 'this_month') {
            start.setDate(1);
        } else if (preset === 'last_month') {
            end.setDate(0);
            start.setMonth(start.getMonth() - 1, 1);
        } else if (preset === 'last_30_days') {
            start.setDate(start.getDate() - 30);
        }

        const formatDate = (date) => date.toISOString().split('T')[0];
        onSelect(formatDate(start), formatDate(end));
    };

    return (
        <div className="flex space-x-2 mb-4">
            <button onClick={() => setPreset('this_month')} className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-2 rounded-lg transition-colors">Este Mês</button>
            <button onClick={() => setPreset('last_month')} className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-2 rounded-lg transition-colors">Mês Passado</button>
            <button onClick={() => setPreset('last_30_days')} className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-2 rounded-lg transition-colors">Últimos 30 dias</button>
        </div>
    );
};

export default function RelatorioModal({ onClose }) {
    const { allParcelas } = useData();
    const today = new Date().toISOString().split('T')[0];
    
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [metodoPagamento, setMetodoPagamento] = useState('todos');
    const [categoria, setCategoria] = useState('todas');
    
    const [reportData, setReportData] = useState(null);
    const [instance, updateInstance] = usePDF();

    const categories = useMemo(() => {
        if (!Array.isArray(allParcelas)) return ['todas'];
        const cats = allParcelas.map(p => p.despesas?.categoria).filter(Boolean);
        return ['todas', ...new Set(cats)];
    }, [allParcelas]);
    
    const paymentMethods = useMemo(() => {
        if (!Array.isArray(allParcelas)) return ['todos'];
        const methods = allParcelas.map(p => p.despesas?.metodo_pagamento).filter(Boolean);
        return ['todos', ...new Set(methods)];
    }, [allParcelas]);

    const handleGenerateReport = useCallback(() => {
        setReportData(null); 
        updateInstance(null);
        
        const filtros = { startDate, endDate, metodoPagamento, categoria };
        // A função processarDadosRelatorio agora retorna um objeto com a chave 'compras'
        const calculatedData = processarDadosRelatorio(allParcelas, filtros);
        
        if (calculatedData) {
            setReportData(calculatedData);
        }
    }, [startDate, endDate, metodoPagamento, categoria, allParcelas, updateInstance]);
    
    useEffect(() => {
        if (reportData) {
            updateInstance(<DespesasPDF data={reportData} />);
        }
    }, [reportData, updateInstance]);
   
    const handleDownload = () => {
        if (!instance.url) return;
        const link = document.createElement('a');
        link.href = instance.url;
        link.download = `Relatorio_Compras.pdf`;
        link.click();
    };
    
    const isReady = reportData !== null && !instance.loading;
    // --- CORREÇÃO APLICADA AQUI ---
    // Trocamos 'reportData.despesas' por 'reportData.compras'
    const hasResults = isReady && reportData.compras.length > 0;
    const hasNoResults = isReady && reportData.compras.length === 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Gerar Relatório de Compras</h2>
                
                <DatePresetButtons onSelect={(start, end) => { setStartDate(start); setEndDate(end); }} />

                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 py-2 px-3" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label>
                            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 py-2 px-3" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="metodoPagamento" className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
                            <select id="metodoPagamento" value={metodoPagamento} onChange={e => setMetodoPagamento(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 py-2 px-3">
                                {paymentMethods.map(method => (
                                    <option key={method} value={method}>{method === 'todos' ? 'Todos' : method}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                            <select id="categoria" value={categoria} onChange={e => setCategoria(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 py-2 px-3">
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat === 'todas' ? 'Todas' : cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-6 min-h-[60px] flex flex-col justify-center items-center">
                    {hasNoResults && ( <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded text-center animate-fade-in">Nenhuma compra encontrada para os filtros selecionados.</div> )}
                    {instance.error && ( <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-center animate-fade-in">Ocorreu um erro ao gerar o PDF.</div> )}
                    {hasResults && instance.url && ( <div className="text-center animate-fade-in"><p className="text-green-600 font-semibold flex items-center justify-center"><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Relatório pronto para download!</p></div> )}
                </div>

                <div className="flex justify-end mt-4 space-x-3">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                        Cancelar
                    </button>
                    
                    {hasResults && instance.url ? ( 
                        <button onClick={handleDownload} className="font-bold py-2 px-4 rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors animate-fade-in">
                            Baixar PDF
                        </button> 
                    ) : ( 
                        <button onClick={handleGenerateReport} disabled={instance.loading} className={`font-bold py-2 px-4 rounded-lg text-white transition-colors w-36 ${ instance.loading ? 'bg-gray-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700' }`}>
                            {instance.loading ? 'Gerando...' : 'Gerar Relatório'}
                        </button> 
                    )}
                </div>
            </div>
        </div>
    );
}