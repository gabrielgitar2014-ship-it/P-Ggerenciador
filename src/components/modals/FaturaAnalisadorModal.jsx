// src/components/modals/FaturaAnalisadorModal.jsx

import { useState } from 'react';
import { supabase } from '../../supabaseClient';

/**
 * Componente modal para o fluxo completo de análise de faturas:
 * 1. Faz o upload de um arquivo PDF.
 * 2. Invoca uma Edge Function para processar o PDF com OCR.
 * 3. Exibe as despesas extraídas para revisão do usuário.
 * 4. Salva as despesas e suas respectivas parcelas no banco de dados após a confirmação.
 */
export default function FaturaAnalisadorModal({ onClose, onSaveSuccess, selectedMonth }) {
    // --- GERENCIAMENTO DE ESTADO ---
    // Controla qual tela do modal é exibida: 'upload', 'processing', 'review', 'saving'
    const [step, setStep] = useState('upload');
    // Armazena o objeto do arquivo PDF selecionado pelo usuário
    const [file, setFile] = useState(null);
    // Armazena a mensagem de erro a ser exibida na tela
    const [errorMessage, setErrorMessage] = useState('');
    // Armazena a lista de despesas retornada pela Edge Function
    const [extractedExpenses, setExtractedExpenses] = useState([]);

    // --- FUNÇÕES DE MANIPULAÇÃO (HANDLERS) ---

    /**
     * Chamada quando o usuário seleciona um arquivo no input.
     * Valida se é um PDF e atualiza o estado.
     */
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setErrorMessage('');
        } else {
            setFile(null);
            setErrorMessage('Por favor, selecione um arquivo PDF válido.');
        }
    };

    /**
     * Chamada quando o usuário clica em "Analisar Arquivo".
     * Envia o arquivo para a Edge Function e aguarda os resultados.
     */
    const handleProcessRequest = async () => {
        if (!file) {
            setErrorMessage('Nenhum arquivo selecionado.');
            return;
        }

        setStep('processing');
        setErrorMessage('');

        try {
            // Invoca a Edge Function 'processador-fatura'.
            // Apenas o 'body' é necessário. A biblioteca supabase-js define
            // o Content-Type e outros headers automaticamente ao enviar um arquivo.
            const { data, error } = await supabase.functions.invoke('processador-fatura', {
                body: file,
            });

            if (error) throw error;

            if (data && data.length > 0) {
                setExtractedExpenses(data);
                setStep('review');
            } else {
                setErrorMessage('Nenhuma despesa foi encontrada no documento. Verifique o arquivo ou a lógica de parsing na sua Edge Function.');
                setStep('upload');
            }

        } catch (error) {
            setErrorMessage(`Erro ao invocar a função: ${error.message}`);
            setStep('upload');
        }
    };

    /**
     * Chamada quando o usuário clica em "Confirmar e Salvar".
     * Insere as despesas e todas as suas parcelas no banco de dados.
     */
    const handleConfirmAndSave = async () => {
        if (extractedExpenses.length === 0) return;

        setStep('saving');

        try {
            const despesasParaInserir = extractedExpenses.map(despesa => ({
                description: despesa.description,
                amount: despesa.totalAmount,
                data_compra: despesa.data_compra,
                metodo_pagamento: despesa.metodo_pagamento || 'Cartão de Crédito',
                qtd_parcelas: despesa.totalInstallments,
                mes_inicio_cobranca: selectedMonth,
            }));

            const { data: despesasSalvas, error: despesaError } = await supabase
                .from('despesas')
                .insert(despesasParaInserir)
                .select();

            if (despesaError) throw despesaError;

            const parcelasParaInserir = [];
            for (const despesaSalva of despesasSalvas) {
                const valorParcela = despesaSalva.amount / despesaSalva.qtd_parcelas;
                for (let i = 1; i <= despesaSalva.qtd_parcelas; i++) {
                    const dataInicio = new Date(`${despesaSalva.mes_inicio_cobranca}-01T12:00:00Z`);
                    dataInicio.setUTCMonth(dataInicio.getUTCMonth() + (i - 1));
                    const dataParcela = dataInicio.toISOString().slice(0, 10);

                    parcelasParaInserir.push({
                        despesa_id: despesaSalva.id,
                        numero_parcela: i,
                        amount: valorParcela,
                        data_parcela: dataParcela,
                    });
                }
            }
            
            if (parcelasParaInserir.length > 0) {
                const { error: parcelasError } = await supabase.from('parcelas').insert(parcelasParaInserir);
                if (parcelasError) throw new Error(`Despesas salvas, mas erro ao criar parcelas: ${parcelasError.message}`);
            }

            alert(`${despesasSalvas.length} despesas salvas com sucesso!`);
            onSaveSuccess();

        } catch (error) {
            setErrorMessage(error.message);
            setStep('review');
        }
    };

    // Calcula o valor total para exibição na tela de revisão
    const totalFatura = extractedExpenses.reduce((acc, item) => acc + item.totalAmount, 0);

    // --- RENDERIZAÇÃO DO COMPONENTE ---
    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl p-6 m-4 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Analisador de Fatura</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-3xl leading-none">&times;</button>
                </div>
                
                {errorMessage && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{errorMessage}</p>}

                {/* ETAPA 1: TELA DE UPLOAD */}
                {step === 'upload' && (
                    <div>
                        <p className="text-slate-600 dark:text-slate-300 mb-4">Envie o arquivo PDF da sua fatura para extrair as despesas automaticamente.</p>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
                            <input type="file" id="pdf-upload" accept="application/pdf" onChange={handleFileChange} className="w-full h-full" />
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleProcessRequest} disabled={!file} className="py-2 px-6 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-50">
                                Analisar Arquivo
                            </button>
                        </div>
                    </div>
                )}

                {/* TELAS DE LOADING */}
                {step === 'processing' && <div className="text-center py-10"><p className="text-lg font-semibold animate-pulse">Analisando sua fatura...</p></div>}
                {step === 'saving' && <div className="text-center py-10"><p className="text-lg font-semibold animate-pulse">Salvando despesas...</p></div>}

                {/* ETAPA 2: TELA DE REVISÃO */}
                {step === 'review' && (
                    <div className="flex flex-col min-h-0">
                        <h3 className="font-semibold mb-2">Despesas encontradas para sua revisão:</h3>
                        <div className="flex-grow overflow-y-auto border dark:border-slate-700 rounded-lg p-2 space-y-2">
                            {extractedExpenses.map((despesa, index) => (
                                <div key={index} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                                    <span className="truncate pr-4">{despesa.description} {despesa.isInstallment ? `(${despesa.totalInstallments}x)` : ''}</span>
                                    <span className="font-semibold text-red-600">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(despesa.totalAmount)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t dark:border-slate-600">
                             <div className="flex justify-between items-center font-bold text-lg mb-4">
                                <span>Total: {extractedExpenses.length} itens</span>
                                <span>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalFatura)}</span>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => { setFile(null); setStep('upload'); }} className="py-2 px-4 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500">Voltar</button>
                                <button onClick={handleConfirmAndSave} className="py-2 px-4 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700">
                                    Confirmar e Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}