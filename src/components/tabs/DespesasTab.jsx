// src/components/tabs/DespesasTab.jsx

import { useState, useMemo, useEffect } from "react";
import { useData } from "../../context/DataContext";
import { supabase } from "../../supabaseClient";
import NovaDespesaModal from "../modals/NovaDespesaModal.jsx";
import DespesasDetalhesModal from "../modals/DespesasDetalhesModal.jsx";
import SearchBar from "../SearchBar";
import Pagination from "../Pagination";
import { usePagination } from "../../hooks/usePagination";
import FaturaAnalisadorModal from '../modals/FaturaAnalisadorModal.jsx'; // 1. IMPORTAÇÃO DO NOVO MODAL

export default function DespesasTab({ selectedMonth, setSelectedMonth, expenseIdToOpenDetails, onDetailsModalClose }) {
    const { allParcelas, cardConfigs, fetchData, loading } = useData();

    const [selectedCard, setSelectedCard] = useState('todos');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [despesaParaEditar, setDespesaParaEditar] = useState(null);
    const [parcelaSelecionada, setParcelaSelecionada] = useState(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [showOnlyInstallments, setShowOnlyInstallments] = useState(false);
    const [sortOption, setSortOption] = useState('date-desc');
    const [isFaturaModalOpen, setIsFaturaModalOpen] = useState(false); // 2. NOVO ESTADO PARA O MODAL DE FATURA

    useEffect(() => {
        if (!expenseIdToOpenDetails || !allParcelas.length) {
            return;
        }

        const [type, id] = expenseIdToOpenDetails.split('-');
        
        if (type === 'p') {
            const numericId = parseInt(id, 10);
            const parcelaToOpen = allParcelas.find(p => p.id === numericId);

            if (parcelaToOpen) {
                const parcelaMonth = parcelaToOpen.data_parcela.substring(0, 7);
                
                if (selectedMonth !== parcelaMonth) {
                    setSelectedMonth(parcelaMonth);
                }
                
                handleOpenDetailModal(parcelaToOpen);
            }
        }
    }, [expenseIdToOpenDetails, allParcelas, setSelectedMonth]);

    const parcelasDoMes = useMemo(() => {
        if (!selectedMonth) return [];
        return allParcelas.filter(p => p.data_parcela?.startsWith(selectedMonth));
    }, [selectedMonth, allParcelas]);
    
    const sortedData = useMemo(() => {
        const sortableData = [...parcelasDoMes];
        switch (sortOption) {
            case 'date-asc':
                sortableData.sort((a, b) => new Date(a.despesas?.data_compra || a.data_parcela) - new Date(b.despesas?.data_compra || b.data_parcela));
                break;
            case 'alpha-asc':
                sortableData.sort((a, b) => (a.despesas?.description || '').localeCompare(b.despesas?.description || ''));
                break;
            case 'alpha-desc':
                sortableData.sort((a, b) => (b.despesas?.description || '').localeCompare(a.despesas?.description || ''));
                break;
            case 'date-desc':
            default:
                sortableData.sort((a, b) => new Date(b.despesas?.data_compra || b.data_parcela) - new Date(a.despesas?.data_compra || a.data_parcela));
                break;
        }
        return sortableData;
    }, [parcelasDoMes, sortOption]);

    const cardOptions = useMemo(() => {
        const methods = sortedData.map(p => p.despesas?.metodo_pagamento).filter(Boolean);
        return [...new Set(methods)];
    }, [sortedData]);

    const filteredByCard = useMemo(() => {
        if (selectedCard === 'todos') return sortedData;
        return sortedData.filter(p => p.despesas?.metodo_pagamento === selectedCard);
    }, [sortedData, selectedCard]);

    const finalFilteredData = useMemo(() => {
        if (!showOnlyInstallments) return filteredByCard;
        return filteredByCard.filter(p => p.despesas?.qtd_parcelas > 1);
    }, [filteredByCard, showOnlyInstallments]);
    
    const summary = useMemo(() => {
        const total = finalFilteredData.reduce((acc, p) => acc + p.amount, 0);
        return { total };
    }, [finalFilteredData]);

    const customFilter = (parcela, searchTerm) => {
        if (!searchTerm) return true;
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const normalizedSearchTerm = lowerCaseSearchTerm.replace(',', '.');
        const description = parcela.despesas?.description?.toLowerCase() || '';
        const descriptionMatch = description.includes(lowerCaseSearchTerm);
        const amountAsString = String(parcela.amount);
        const amountMatch = amountAsString.includes(normalizedSearchTerm);
        return descriptionMatch || amountMatch;
    };

    const { currentData, searchTerm, setSearchTerm, currentPage, totalPages, handlePageChange } = usePagination(
        finalFilteredData, { itemsPerPage: 10, filterFn: customFilter }
    );
    
    const formatCurrency = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
    
    const handleOpenDetailModal = (parcela) => {
        const despesas = parcela.despesas;
        if (!despesas) {
            console.error("Dados da despesa original não encontrados.", parcela);
            return; 
        }

        const qtd_parcelas = parseInt(despesas.qtd_parcelas, 10) || 1;
        const mesInicioCobranca = despesas.mes_inicio_cobranca;

        const parcelaInfo = `${parcela.numero_parcela} de ${qtd_parcelas}`;

        let endDate = "N/A";

        if (qtd_parcelas > 1 && mesInicioCobranca) {
            const [ano, mes] = mesInicioCobranca.split('-').map(Number);
            let dataBaseParaCalculo = new Date(Date.UTC(ano, mes - 1, 1));
            
            dataBaseParaCalculo.setUTCMonth(dataBaseParaCalculo.getUTCMonth() + qtd_parcelas);
            
            endDate = dataBaseParaCalculo.toLocaleDateString("pt-BR", { 
                month: "long", 
                year: "numeric", 
                timeZone: "UTC" 
            });
        }

        const transactionDataForModal = {
            id: parcela.id,
            description: despesas.description || 'Despesa sem descrição',
            amount: parcela.amount,
            metodo_pagamento: despesas.metodo_pagamento || 'N/A',
            isParcelada: qtd_parcelas > 1,
            parcelaInfo: parcelaInfo,
            valorTotalCompra: despesas.amount || parcela.amount,
            data_compra: despesas.data_compra,
            endDate: endDate,
            despesas: despesas, 
            originalParcela: parcela
        };
        setParcelaSelecionada(transactionDataForModal);
    };

    const handleOpenEditModal = (transaction) => {
        const originalParcela = transaction.originalParcela || parcelasDoMes.find(p => p.id === transaction.id);
        if (!originalParcela?.despesas) {
            alert("Não é possível editar. Detalhes da despesa original não encontrados.");
            return;
        }
        setParcelaSelecionada(null);
        setDespesaParaEditar(originalParcela.despesas);
        setIsModalOpen(true);
    };

    const handleDeleteSingle = async (transaction) => {
        const despesaId = transaction.originalParcela?.despesas?.id;
        if (!despesaId) {
            alert("Não é possível excluir. ID da despesa original não encontrado.");
            return;
        }
        if (window.confirm(`Excluir "${transaction.description}"? Isso removerá a despesa e TODAS as suas parcelas.`)) {
            const { error: parcelasError } = await supabase.from('parcelas').delete().eq('despesa_id', despesaId);
            if (parcelasError) {
                alert(`Erro ao excluir as parcelas: ${parcelasError.message}`);
                return;
            }
            const { error: despesaError } = await supabase.from('despesas').delete().eq('id', despesaId);
            if (despesaError) {
                alert(`Erro ao excluir a despesa: ${despesaError.message}`);
            } else {
                alert("Despesa excluída com sucesso.");
                fetchData();
                handleCloseAllModals();
            }
        }
    };

    const handleCloseAllModals = () => {
        setIsModalOpen(false);
        setDespesaParaEditar(null);
        setParcelaSelecionada(null);
        if (typeof onDetailsModalClose === 'function') {
            onDetailsModalClose();
        }
    };

    const handleSaveSuccess = (despesaSalva, mesDeDestino) => {
        handleCloseAllModals();
        fetchData();
        if (selectedMonth !== mesDeDestino) {
            setSelectedMonth(mesDeDestino);
        }
    };

    const toggleSelectionMode = () => {
        setSelectionMode(!selectionMode);
        setSelectedItems(new Set());
    };

    const handleSelectItem = (despesaId) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(despesaId)) {
            newSelection.delete(despesaId);
        } else {
            newSelection.add(despesaId);
        }
        setSelectedItems(newSelection);
    };

    const handleDeleteSelected = async () => {
        const idsToDelete = Array.from(selectedItems);
        if (idsToDelete.length === 0) return;
        
        if (window.confirm(`Tem certeza que deseja excluir as ${idsToDelete.length} despesas selecionadas e TODAS as suas parcelas?`)) {
            const { error: parcelasError } = await supabase.from('parcelas').delete().in('despesa_id', idsToDelete);
            if (parcelasError) {
                alert(`Erro ao excluir as parcelas: ${parcelasError.message}`);
                return;
            }
            
            const { error: despesasError } = await supabase.from('despesas').delete().in('id', idsToDelete);
            if (despesasError) {
                alert(`Erro ao excluir despesas: ${despesasError.message}`);
            } else {
                alert("Despesas selecionadas foram excluídas com sucesso.");
                fetchData();
                toggleSelectionMode();
            }
        }
    };
    
    const handleOpenCreateModal = () => { 
        setDespesaParaEditar(null); 
        setIsModalOpen(true); 
    };

    // 3. NOVA FUNÇÃO PARA TRATAR O SUCESSO DO MODAL DE FATURA
    const handleSaveFromFatura = () => {
        fetchData();
        setIsFaturaModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Gerenciador de Despesas</h2>
                <div className="flex items-center gap-2">
                    {selectionMode ? (
                         <button onClick={handleDeleteSelected} className="flex items-center gap-2 bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                            <span className="material-symbols-outlined">delete</span> Excluir ({selectedItems.size})
                         </button>
                    ) : (
                        <>
                            <button onClick={handleOpenCreateModal} className="flex items-center gap-2 bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                                <span className="material-symbols-outlined">add</span> Nova Despesa
                            </button>
                            {/* 4. BOTÃO ATUALIZADO PARA ABRIR O MODAL DE ANÁLISE */}
                            <button onClick={() => setIsFaturaModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-br from-sky-500 to-cyan-500 text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                                <span className="material-symbols-outlined">document_scanner</span> Analisar Fatura
                            </button>
                        </>
                    )}
                    <button onClick={toggleSelectionMode} className="bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors">
                        {selectionMode ? 'Cancelar' : 'Selecionar'}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg shadow-black/5 border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Total Filtrado no Mês</h4>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(summary.total)}</p>
            </div>

            {/* 5. RENDERIZAÇÃO CONDICIONAL DO NOVO MODAL */}
            {isFaturaModalOpen && (
                <FaturaAnalisadorModal 
                    onClose={() => setIsFaturaModalOpen(false)} 
                    onSaveSuccess={handleSaveFromFatura}
                    selectedMonth={selectedMonth}
                />
            )}

            {isModalOpen && <NovaDespesaModal onClose={handleCloseAllModals} onSave={handleSaveSuccess} despesaParaEditar={despesaParaEditar} cardConfigs={cardConfigs} />}
            <DespesasDetalhesModal isOpen={!!parcelaSelecionada} onClose={handleCloseAllModals} parcela={parcelaSelecionada} onDelete={() => handleDeleteSingle(parcelaSelecionada)} onEdit={() => handleOpenEditModal(parcelaSelecionada)} />

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg shadow-black/5 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full p-2 border border-green-300 dark:border-slate-600 rounded-full bg-white dark:bg-slate-700 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500">
                        <option value="date-desc">Ordenar: Mais Recentes</option>
                        <option value="date-asc">Ordenar: Mais Antigas</option>
                        <option value="alpha-asc">Ordenar: Descrição (A-Z)</option>
                        <option value="alpha-desc">Ordenar: Descrição (Z-A)</option>
                    </select>
                    <select value={selectedCard} onChange={(e) => setSelectedCard(e.target.value)} className="w-full p-2 border border-yellow-500 dark:border-slate-600 rounded-full bg-white dark:bg-slate-700 shadow-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500">
                        <option value="todos">Filtrar por Cartão</option>
                        {cardOptions.map(card => <option key={card} value={card}>{card}</option>)}
                    </select>
                    <div className="lg:col-span-3 flex items-center">
                        <input type="checkbox" id="parceladas" checked={showOnlyInstallments} onChange={(e) => setShowOnlyInstallments(e.target.checked)} className="h-4 w-4 rounded border-blue-300 text-purple-600 focus:ring-purple-500" />
                        <label htmlFor="parceladas" className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">Mostrar apenas parceladas</label>
                    </div>
                </div>

                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

                <div className="space-y-3 min-h-[300px] mt-4">
                    {loading && parcelasDoMes.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">A carregar despesas...</div>
                    ) : currentData.length > 0 ? (
                        currentData.map(parcela => {
                            const isSelected = selectedItems.has(parcela.despesas?.id);
                            return (
                                <div key={parcela.id} onClick={() => !selectionMode && handleOpenDetailModal(parcela)} className={`flex items-center p-4 rounded-xl transition-all duration-200 border ${selectionMode ? 'cursor-pointer' : 'cursor-pointer hover:shadow-md hover:border-purple-400 dark:hover:border-purple-500'} ${isSelected ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                                    {selectionMode && (
                                        <div className="mr-4 flex-shrink-0">
                                            <input type="checkbox" checked={isSelected} onChange={() => parcela.despesas && handleSelectItem(parcela.despesas.id)} className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"/>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{parcela.despesas?.description || 'Descrição indisponível'}</p>
                                        
                                        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                                            <span>{parcela.despesas?.metodo_pagamento}</span>

                                            {parcela.despesas?.data_compra && (
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined !text-[1rem] !font-thin">calendar_today</span>
                                                    {new Date(parcela.despesas.data_compra.replace(/-/g, '\/')).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}

                                            {parcela.despesas && parcela.despesas.qtd_parcelas > 1 && (
                                                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">{`${parcela.numero_parcela}/${parcela.despesas.qtd_parcelas}`}</span>
                                            )}
                                        </div>

                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-lg font-semibold text-red-600">{formatCurrency(parcela.amount)}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">Nenhuma despesa encontrada para este mês ou filtro.</div>
                    )}
                </div>
            </div>
        </div>
    );
}