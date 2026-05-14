// src/types/index.ts

/**
 * Definições de tipos para o sistema de conciliação de faturas
 */

// ============================================================================
// TIPOS BÁSICOS
// ============================================================================

/**
 * Valor monetário (sempre positivo)
 */
export type MonetaryValue = number;

/**
 * Data em formato ISO string ou objeto Date
 */
export type DateValue = string | Date;

/**
 * Status de processamento
 */
export type ProcessingStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Tipos de notificação
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Formatos de exportação suportados
 */
export type ExportFormat = 'csv' | 'json' | 'excel' | 'html';

// ============================================================================
// TIPOS DE DADOS DE NEGÓCIO
// ============================================================================

/**
 * Parcela de uma despesa
 */
export interface ExpenseParcela {
  numero_parcela: number;
  data_parcela: string; // ISO date string
  amount: MonetaryValue;
  status?: 'pendente' | 'pago' | 'vencido';
}

/**
 * Despesa do aplicativo
 */
export interface AppExpense {
  id: string | number;
  description: string;
  descricao?: string; // Alias para description
  metodo_pagamento: string;
  data_compra: string; // ISO date string
  valor_total: MonetaryValue;
  parcelas: ExpenseParcela[];
  categoria?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Item da fatura (CSV)
 */
export interface InvoiceItem {
  data: string; // Formato "DD MMM" (ex: "15 JAN")
  descricao: string;
  valor: MonetaryValue;
  categoria?: string;
  referencia?: string;
}

/**
 * Item conciliado (match entre app e fatura)
 */
export interface ReconciledItem {
  invoice: InvoiceItem;
  app: AppExpense & {
    matchedParcela: ExpenseParcela;
  };
  confidence?: number; // 0-1, confiança do match
  matchType?: 'exact' | 'fuzzy' | 'manual';
}

// ============================================================================
// TIPOS DE RESULTADO
// ============================================================================

/**
 * Resultado da conciliação
 */
export interface ReconciliationResult {
  reconciled: ReconciledItem[];
  unreconciledInvoiceItems: InvoiceItem[];
  unreconciledAppItems: (AppExpense & ExpenseParcela & { description: string })[];
  totalInvoice: MonetaryValue;
  totalReconciled: MonetaryValue;
  reconciliationRate: number; // Porcentagem (0-100)
  errors?: string[];
  summary: {
    totalItems: number;
    reconciledItems: number;
    unreconciledInvoiceItems: number;
    unreconciledAppItems: number;
  };
  processedAt?: string; // ISO timestamp
  processingTime?: number; // Milissegundos
}

/**
 * Estatísticas da conciliação
 */
export interface ReconciliationStats {
  totalInvoice: MonetaryValue;
  totalReconciled: MonetaryValue;
  unreconciledValue: MonetaryValue;
  reconciliationRate: number;
  itemReconciliationRate: number;
  totalItems: number;
  reconciledItems: number;
  unreconciledInvoiceItems: number;
  unreconciledAppItems: number;
  averageTransactionValue: MonetaryValue;
}

// ============================================================================
// TIPOS DE CONFIGURAÇÃO
// ============================================================================

/**
 * Configuração de parsing de CSV
 */
export interface CsvConfig {
  name: string;
  delimiter: string;
  dateColumn: number;
  descriptionColumns: [number, number]; // [start, end]
  valueColumn: number;
  dateFormats: string[];
  encoding?: string;
}

/**
 * Opções de validação de arquivo
 */
export interface FileValidationOptions {
  required?: boolean;
  maxSize?: number; // bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
  minSize?: number; // bytes
}

/**
 * Opções de formatação
 */
export interface FormattingOptions {
  locale?: string;
  currency?: string;
  dateFormat?: 'short' | 'long' | 'iso' | 'relative' | 'custom';
  customFormat?: string;
  includeTime?: boolean;
}

/**
 * Opções de exportação
 */
export interface ExportOptions {
  includeHeaders?: boolean;
  dateFormat?: 'short' | 'long' | 'iso';
  currencyFormat?: 'symbol' | 'code' | 'none';
  encoding?: string;
}

// ============================================================================
// TIPOS DE COMPONENTES
// ============================================================================

/**
 * Props do componente ResultadoAnalise
 */
export interface ResultadoAnaliseProps {
  resultado: ReconciliationResult | null;
}

/**
 * Props do componente AnaliseTab
 */
export interface AnaliseTabProps {
  onResultChange?: (result: ReconciliationResult | null) => void;
  initialPaymentMethod?: string;
}

/**
 * Props do componente ExportManager
 */
export interface ExportManagerProps {
  data: any[];
  filename?: string;
  title?: string;
  onExportStart?: () => void;
  onExportComplete?: (filename: string) => void;
  onExportError?: (error: Error) => void;
}

/**
 * Props do componente StatsDashboard
 */
export interface StatsDashboardProps {
  resultado: ReconciliationResult | null;
  appExpenses?: AppExpense[];
  selectedPaymentMethod?: string;
}

// ============================================================================
// TIPOS DE HOOKS
// ============================================================================

/**
 * Retorno do hook useReconciliation
 */
export interface UseReconciliationReturn {
  isLoading: boolean;
  progress: number;
  error: string | null;
  resultado: ReconciliationResult | null;
  lastProcessedFile: {
    name: string;
    size: number;
    processedAt: string;
    paymentMethod: string;
  } | null;
  statistics: ReconciliationStats | null;
  processReconciliation: (file: File, paymentMethod: string) => Promise<ReconciliationResult>;
  clearState: () => void;
  reprocessLast: () => Promise<ReconciliationResult>;
  getFilteredExpenses: (paymentMethod: string) => AppExpense[];
  canProcess: (file: File | null, paymentMethod: string) => boolean;
  hasResult: boolean;
  hasError: boolean;
  isProcessing: boolean;
}

/**
 * Retorno do hook useExpensesData
 */
export interface UseExpensesDataReturn {
  data: AppExpense[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  retryCount: number;
  loadExpenses: (forceRefresh?: boolean) => Promise<AppExpense[]>;
  refresh: () => Promise<AppExpense[]>;
  cancelLoading: () => void;
  getExpensesByPaymentMethod: (paymentMethod: string) => AppExpense[];
  getPaymentMethods: () => string[];
  getStatistics: () => ExpensesStatistics | null;
  clearCache: () => void;
  hasData: boolean;
  hasError: boolean;
  isEmpty: boolean;
  isStale: boolean;
}

/**
 * Estatísticas das despesas
 */
export interface ExpensesStatistics {
  totalExpenses: number;
  paymentMethods: number;
  methodCounts: Record<string, number>;
  lastUpdated: string | null;
  cacheAge: number | null;
}

// ============================================================================
// TIPOS DE NOTIFICAÇÃO
// ============================================================================

/**
 * Ação de notificação
 */
export interface NotificationAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
  closeOnClick?: boolean;
}

/**
 * Notificação
 */
export interface Notification {
  id: number;
  type: NotificationType;
  title?: string;
  message?: string;
  duration?: number; // 0 = não remove automaticamente
  actions?: NotificationAction[];
}

/**
 * Context de notificações
 */
export interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => number;
  removeNotification: (id: number) => void;
  clearNotifications: () => void;
  showSuccess: (title: string, message?: string, options?: Partial<Notification>) => number;
  showError: (title: string, message?: string, options?: Partial<Notification>) => number;
  showWarning: (title: string, message?: string, options?: Partial<Notification>) => number;
  showInfo: (title: string, message?: string, options?: Partial<Notification>) => number;
  showReconciliationSuccess: (result: ReconciliationResult) => number;
  showReconciliationError: (error: Error) => number;
  showFileValidationError: (errors: string | string[]) => number;
  showDataLoadingError: (retryFunction: () => void) => number;
}

// ============================================================================
// TIPOS DE VALIDAÇÃO
// ============================================================================

/**
 * Resultado de validação
 */
export interface ValidationResult<T = any> {
  valid: boolean;
  errors: string[];
  value: T;
  info?: Record<string, any>;
}

/**
 * Schema de validação de campo
 */
export interface FieldSchema {
  type: 'number' | 'date' | 'text' | 'email' | 'url' | 'file';
  options?: Record<string, any>;
}

/**
 * Schema de validação de objeto
 */
export type ValidationSchema = Record<string, FieldSchema>;

/**
 * Resultado de validação de objeto
 */
export interface ObjectValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
  values: Record<string, any>;
}

// ============================================================================
// TIPOS DE FILTRO
// ============================================================================

/**
 * Configuração de filtro
 */
export interface FilterConfig {
  searchTerm: string;
  minValue: string;
  maxValue: string;
}

/**
 * Filtros por seção
 */
export interface SectionFilters {
  reconciled: FilterConfig;
  unreconciledInvoice: FilterConfig;
  unreconciledApp: FilterConfig;
}

// ============================================================================
// TIPOS DE ERRO
// ============================================================================

/**
 * Erro customizado do sistema
 */
export class ReconciliationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ReconciliationError';
  }
}

/**
 * Códigos de erro conhecidos
 */
export enum ErrorCodes {
  FILE_INVALID = 'FILE_INVALID',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_EMPTY = 'FILE_EMPTY',
  CSV_PARSE_ERROR = 'CSV_PARSE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATA_LOAD_ERROR = 'DATA_LOAD_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RECONCILIATION_ERROR = 'RECONCILIATION_ERROR'
}

// ============================================================================
// TIPOS UTILITÁRIOS
// ============================================================================

/**
 * Torna todas as propriedades opcionais
 */
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Torna propriedades específicas obrigatórias
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Omite propriedades específicas
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Extrai o tipo de retorno de uma Promise
 */
export type PromiseType<T> = T extends Promise<infer U> ? U : T;

/**
 * Função de callback genérica
 */
export type Callback<T = void> = () => T;

/**
 * Função de callback com parâmetro
 */
export type CallbackWithParam<P, T = void> = (param: P) => T;

// ============================================================================
// CONSTANTES DE TIPO
// ============================================================================

/**
 * Métodos de pagamento suportados
 */
export const PAYMENT_METHODS = [
  'Cartão de Crédito',
  'Cartão de Débito',
  'PIX',
  'Boleto',
  'Transferência',
  'Dinheiro'
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];

/**
 * Status de conciliação
 */
export const RECONCILIATION_STATUS = [
  'reconciled',
  'unreconciledInvoice', 
  'unreconciledApp',
  'processing',
  'error'
] as const;

export type ReconciliationStatus = typeof RECONCILIATION_STATUS[number];

