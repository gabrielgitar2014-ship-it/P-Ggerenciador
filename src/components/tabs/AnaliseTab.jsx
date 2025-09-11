// src/components/AnaliseTab_enhanced.jsx
// Versão aprimorada do componente principal com todas as melhorias

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { METODOS_DE_PAGAMENTO } from '../../constants/paymentMethods';
import ResultadoAnaliseEnhanced from '../ResultadoAnalise';
import ConfigurationPanel from '../ConfigurationPanel';
import { reconcileExpensesEnhanced, updateMatchingConfig } from '../../utils/reconciliationEngine';
import { parseCsv } from '../../utils/statementParser';
import { extractTextFromFile } from '../../utils/fileReader';

const EXPENSES_CACHE_URL = 'https://wjvqkejtkloolvxrkfyb.supabase.co/storage/v1/object/public/despesas-cache/despesas.json';

// Constantes para validação
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['text/csv', 'application/csv'];
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 segundo

// Configuração padrão
const DEFAULT_CONFIG = {
  VALUE_TOLERANCE: 0.02,
  DATE_TOLERANCE_DAYS: 3,
  MIN_MATCH_SCORE: 60,
  DESCRIPTION_WEIGHT: 0.3,
  VALUE_WEIGHT: 0.4,
  DATE_WEIGHT: 0.3
};

export default function AnaliseTabEnhanced() {
  const [resultado, setResultado] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [error, setError] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [appExpenses, setAppExpenses] = useState([]);
  const [progress, setProgress] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [matchingConfig, setMatchingConfig] = useState(DEFAULT_CONFIG);
  const [analysisStats, setAnalysisStats] = useState(null);

  /**
   * Função para fazer retry de operações que podem falhar
   */
  const withRetry = useCallback(async (operation, attempts = RETRY_ATTEMPTS) => {
    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        console.warn(`Tentativa ${i + 1} falhou:`, error.message);
        
        if (i === attempts - 1) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
      }
    }
  }, []);

  /**
   * Carrega dados das despesas do Supabase com retry automático
   */
  const loadExpenses = useCallback(async () => {
    setIsLoadingExpenses(true);
    setError(null);
    
    try {
      const data = await withRetry(async () => {
        const response = await fetch(EXPENSES_CACHE_URL, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Resposta não é um JSON válido');
        }
        
        return await response.json();
      });
      
      if (!Array.isArray(data)) {
        throw new Error('Dados recebidos não são um array válido');
      }
      
      setAppExpenses(data);
      console.log(`${data.length} despesas carregadas com sucesso`);
      
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
      setError(`Erro ao carregar dados das despesas: ${error.message}`);
      setAppExpenses([]);
    } finally {
      setIsLoadingExpenses(false);
    }
  }, [withRetry]);

  /**
   * Carrega dados na inicialização do componente
   */
  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  /**
   * Valida arquivo selecionado
   */
  const validateFile = useCallback((file) => {
    if (!file) {
      return { valid: false, error: 'Nenhum arquivo selecionado' };
    }

    const isValidType = ALLOWED_FILE_TYPES.includes(file.type) || 
                       file.name.toLowerCase().endsWith('.csv');
    
    if (!isValidType) {
      return { 
        valid: false, 
        error: 'Por favor, selecione um arquivo CSV válido (.csv)' 
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(1);
      return { 
        valid: false, 
        error: `Arquivo muito grande. Tamanho máximo: ${sizeMB}MB` 
      };
    }

    if (file.size === 0) {
      return { 
        valid: false, 
        error: 'Arquivo está vazio' 
      };
    }

    return { valid: true };
  }, []);

  /**
   * Gera preview do arquivo CSV
   */
  const generateFilePreview = useCallback(async (file) => {
    try {
      const text = await extractTextFromFile(file);
      const lines = text.split('\n').slice(0, 5);
      
      return {
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        lineCount: text.split('\n').length,
        preview: lines.join('\n'),
        encoding: 'UTF-8' // Simplificado para o exemplo
      };
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
      throw new Error('Não foi possível ler o arquivo');
    }
  }, []);

  /**
   * Manipula seleção de arquivo
   */
  const handleFileSelect = useCallback(async (event) => {
    const selectedFile = event.target.files[0];
    setError(null);
    setFilePreview(null);
    
    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    
    try {
      const preview = await generateFilePreview(selectedFile);
      setFilePreview(preview);
    } catch (error) {
      setError(error.message);
      setFile(null);
    }
  }, [validateFile, generateFilePreview]);

  /**
   * Filtra despesas por método de pagamento
   */
  const filteredExpenses = useMemo(() => {
    if (!selectedPaymentMethod || !appExpenses.length) {
      return [];
    }
    
    return appExpenses.filter(expense => 
      expense.metodo_pagamento === selectedPaymentMethod
    );
  }, [appExpenses, selectedPaymentMethod]);

  /**
   * Executa análise de conciliação
   */
  const handleAnalyze = useCallback(async () => {
    if (!file || !selectedPaymentMethod) {
      setError('Por favor, selecione um arquivo CSV e um método de pagamento');
      return;
    }

    if (filteredExpenses.length === 0) {
      setError('Nenhuma despesa encontrada para o método de pagamento selecionado');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      // Atualiza configuração do motor de conciliação
      updateMatchingConfig(matchingConfig);
      
      // Progresso: Lendo arquivo
      setProgress(20);
      const csvText = await extractTextFromFile(file);
      
      // Progresso: Analisando CSV
      setProgress(40);
      const invoiceItems = parseCsv(csvText);
      
      if (!invoiceItems || invoiceItems.length === 0) {
        throw new Error('Nenhuma transação válida encontrada no arquivo CSV');
      }
      
      // Progresso: Executando conciliação
      setProgress(60);
      const startTime = performance.now();
      const result = reconcileExpensesEnhanced(invoiceItems, filteredExpenses);
      const endTime = performance.now();
      
      // Adiciona estatísticas de performance
      const stats = {
        processingTime: Math.round(endTime - startTime),
        csvItems: invoiceItems.length,
        appExpenses: filteredExpenses.length,
        matchingConfig: { ...matchingConfig }
      };
      
      setAnalysisStats(stats);
      setProgress(100);
      setResultado(result);
      
      console.log('Análise concluída:', {
        ...result.summary,
        processingTime: `${stats.processingTime}ms`
      });
      
    } catch (error) {
      console.error('Erro na análise:', error);
      setError(`Erro durante a análise: ${error.message}`);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [file, selectedPaymentMethod, filteredExpenses, matchingConfig]);

  /**
   * Manipula mudança de configuração
   */
  const handleConfigChange = useCallback((newConfig) => {
    setMatchingConfig(newConfig);
    console.log('Configuração atualizada:', newConfig);
  }, []);

  /**
   * Volta para nova análise
   */
  const handleNewAnalysis = useCallback(() => {
    setResultado(null);
    setFile(null);
    setFilePreview(null);
    setError(null);
    setAnalysisStats(null);
    setSelectedPaymentMethod('');
    
    // Reset do input file
    const fileInput = document.getElementById('csvFile');
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  // Se há resultado, mostra a tela de resultados
  if (resultado) {
    return (
      <ResultadoAnaliseEnhanced 
        resultado={resultado} 
        onVoltar={handleNewAnalysis}
        analysisStats={analysisStats}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header com configurações */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conciliação de Faturas</h1>
          <p className="text-gray-600 mt-1">Sistema aprimorado com matching inteligente</p>
        </div>
        <button
          onClick={() => setShowConfig(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
          <span>Configurações</span>
        </button>
      </div>

      {/* Status das despesas */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <span className="material-symbols-outlined text-blue-600">
            {isLoadingExpenses ? 'sync' : 'check_circle'}
          </span>
          <div className="flex-1">
            <h3 className="font-medium text-blue-900">
              Status dos Dados das Despesas
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              {isLoadingExpenses 
                ? 'Carregando dados do Supabase...' 
                : `${appExpenses.length} despesas carregadas com sucesso`
              }
            </p>
          </div>
          {!isLoadingExpenses && (
            <button
              onClick={loadExpenses}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Recarregar
            </button>
          )}
        </div>
      </div>

      {/* Seleção do método de pagamento */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Método de Pagamento da Fatura
        </label>
        <select
          value={selectedPaymentMethod}
          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
          disabled={isLoadingExpenses}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        >
          <option value="">Selecione o método de pagamento</option>
          {METODOS_DE_PAGAMENTO.map(metodo => (
            <option key={metodo.value} value={metodo.value}>
              {metodo.label}
            </option>
          ))}
        </select>
        
        {selectedPaymentMethod && (
          <div className="text-sm text-gray-600">
            {filteredExpenses.length} despesa(s) encontrada(s) para este método de pagamento
          </div>
        )}
      </div>

      {/* Upload de arquivo */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Arquivo CSV da Fatura
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            id="csvFile"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label
            htmlFor="csvFile"
            className="cursor-pointer flex flex-col items-center space-y-2"
          >
            <span className="material-symbols-outlined text-4xl text-gray-400">
              upload_file
            </span>
            <span className="text-sm text-gray-600">
              Clique para selecionar um arquivo CSV ou arraste aqui
            </span>
            <span className="text-xs text-gray-500">
              Máximo: 5MB • Formatos: .csv
            </span>
          </label>
        </div>
      </div>

      {/* Preview do arquivo */}
      {filePreview && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <span className="material-symbols-outlined mr-2">preview</span>
            Preview do Arquivo
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
            <div>
              <span className="text-gray-600">Nome:</span>
              <span className="ml-2 font-medium">{filePreview.fileName}</span>
            </div>
            <div>
              <span className="text-gray-600">Tamanho:</span>
              <span className="ml-2 font-medium">{filePreview.fileSize}</span>
            </div>
            <div>
              <span className="text-gray-600">Linhas:</span>
              <span className="ml-2 font-medium">{filePreview.lineCount}</span>
            </div>
            <div>
              <span className="text-gray-600">Encoding:</span>
              <span className="ml-2 font-medium">{filePreview.encoding}</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded border text-xs font-mono overflow-x-auto">
            <pre>{filePreview.preview}</pre>
          </div>
        </div>
      )}

      {/* Configuração atual */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Configuração Atual</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Tolerância Valor:</span>
            <div className="font-medium">R$ {matchingConfig.VALUE_TOLERANCE.toFixed(2)}</div>
          </div>
          <div>
            <span className="text-gray-600">Tolerância Data:</span>
            <div className="font-medium">{matchingConfig.DATE_TOLERANCE_DAYS} dias</div>
          </div>
          <div>
            <span className="text-gray-600">Score Mínimo:</span>
            <div className="font-medium">{matchingConfig.MIN_MATCH_SCORE}%</div>
          </div>
          <div>
            <span className="text-gray-600">Pesos:</span>
            <div className="font-medium text-xs">
              V:{Math.round(matchingConfig.VALUE_WEIGHT*100)}% 
              D:{Math.round(matchingConfig.DATE_WEIGHT*100)}% 
              T:{Math.round(matchingConfig.DESCRIPTION_WEIGHT*100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Mensagens de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <span className="material-symbols-outlined text-red-500">error</span>
            <div>
              <h3 className="font-medium text-red-900">Erro</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Barra de progresso */}
      {isLoading && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Processando análise...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Botão de análise */}
      <div className="flex justify-center">
        <button
          onClick={handleAnalyze}
          disabled={!file || !selectedPaymentMethod || isLoading || isLoadingExpenses}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined animate-spin">sync</span>
              <span>Analisando...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">analytics</span>
              <span>Analisar Fatura</span>
            </>
          )}
        </button>
      </div>

      {/* Painel de configuração */}
      <ConfigurationPanel
        config={matchingConfig}
        onConfigChange={handleConfigChange}
        onClose={() => setShowConfig(false)}
        isOpen={showConfig}
      />
    </div>
  );
}