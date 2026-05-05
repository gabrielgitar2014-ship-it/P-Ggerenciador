// src/utils/formatting.js

/**
 * Utilitários de formatação para o sistema de conciliação
 */

/**
 * Formata valores monetários
 * @param {number|string} value - Valor a ser formatado
 * @param {Object} options - Opções de formatação
 * @returns {string} - Valor formatado
 */
export const formatCurrency = (value, options = {}) => {
  const {
    currency = 'BRL',
    locale = 'pt-BR',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true,
    showSign = false
  } = options;

  let numValue = parseFloat(value) || 0;
  
  // Sempre trabalha com valor absoluto para formatação
  const absValue = Math.abs(numValue);
  const isNegative = numValue < 0;
  
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: showSymbol ? currency : undefined,
      minimumFractionDigits,
      maximumFractionDigits
    });
    
    let formatted = formatter.format(absValue);
    
    // Adiciona sinal se necessário
    if (showSign && isNegative) {
      formatted = `- ${formatted}`;
    } else if (showSign && !isNegative && numValue > 0) {
      formatted = `+ ${formatted}`;
    }
    
    return formatted;
    
  } catch (error) {
    console.warn('Erro na formatação de moeda:', error);
    return `R$ ${absValue.toFixed(2)}`;
  }
};

/**
 * Formata datas
 * @param {Date|string} date - Data a ser formatada
 * @param {Object} options - Opções de formatação
 * @returns {string} - Data formatada
 */
export const formatDate = (date, options = {}) => {
  const {
    format = 'short', // 'short', 'long', 'iso', 'relative', 'custom'
    locale = 'pt-BR',
    includeTime = false,
    customFormat = null
  } = options;

  if (!date) return 'N/A';
  
  let dateObj;
  
  // Converte para Date se necessário
  if (typeof date === 'string') {
    // Se já está no formato "DD MMM", retorna como está
    if (date.match(/^\d{2}\s[A-Z]{3}$/)) {
      return date;
    }
    
    // Tenta converter string para Date
    if (date.includes('-')) {
      dateObj = new Date(date + (date.includes('T') ? '' : 'T12:00:00'));
    } else {
      dateObj = new Date(date);
    }
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return 'Data Inválida';
  }
  
  if (isNaN(dateObj.getTime())) {
    return 'Data Inválida';
  }
  
  try {
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString(locale, {
          day: '2-digit',
          month: 'short'
        }).toUpperCase().replace('.', '');
        
      case 'long':
        const longOptions = {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        };
        if (includeTime) {
          longOptions.hour = '2-digit';
          longOptions.minute = '2-digit';
        }
        return dateObj.toLocaleDateString(locale, longOptions);
        
      case 'iso':
        return dateObj.toISOString().split('T')[0];
        
      case 'relative':
        return formatRelativeDate(dateObj, locale);
        
      case 'custom':
        if (customFormat) {
          return formatCustomDate(dateObj, customFormat, locale);
        }
        return dateObj.toLocaleDateString(locale);
        
      default:
        return dateObj.toLocaleDateString(locale);
    }
    
  } catch (error) {
    console.warn('Erro na formatação de data:', error);
    return dateObj.toLocaleDateString('pt-BR');
  }
};

/**
 * Formata data relativa (ex: "há 2 dias")
 * @param {Date} date - Data a ser formatada
 * @param {string} locale - Locale para formatação
 * @returns {string} - Data relativa formatada
 */
const formatRelativeDate = (date, locale = 'pt-BR') => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Hoje';
  } else if (diffDays === 1) {
    return 'Ontem';
  } else if (diffDays === -1) {
    return 'Amanhã';
  } else if (diffDays > 1 && diffDays <= 7) {
    return `Há ${diffDays} dias`;
  } else if (diffDays < -1 && diffDays >= -7) {
    return `Em ${Math.abs(diffDays)} dias`;
  } else {
    return date.toLocaleDateString(locale);
  }
};

/**
 * Formata data com formato customizado
 * @param {Date} date - Data a ser formatada
 * @param {string} format - Formato customizado
 * @param {string} locale - Locale para formatação
 * @returns {string} - Data formatada
 */
const formatCustomDate = (date, format, locale = 'pt-BR') => {
  const tokens = {
    'DD': String(date.getDate()).padStart(2, '0'),
    'MM': String(date.getMonth() + 1).padStart(2, '0'),
    'YYYY': String(date.getFullYear()),
    'YY': String(date.getFullYear()).slice(-2),
    'MMM': date.toLocaleDateString(locale, { month: 'short' }).toUpperCase().replace('.', ''),
    'MMMM': date.toLocaleDateString(locale, { month: 'long' }),
    'HH': String(date.getHours()).padStart(2, '0'),
    'mm': String(date.getMinutes()).padStart(2, '0'),
    'ss': String(date.getSeconds()).padStart(2, '0')
  };
  
  let formatted = format;
  Object.keys(tokens).forEach(token => {
    formatted = formatted.replace(new RegExp(token, 'g'), tokens[token]);
  });
  
  return formatted;
};

/**
 * Formata números
 * @param {number|string} value - Valor a ser formatado
 * @param {Object} options - Opções de formatação
 * @returns {string} - Número formatado
 */
export const formatNumber = (value, options = {}) => {
  const {
    locale = 'pt-BR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useGrouping = true,
    style = 'decimal' // 'decimal', 'percent'
  } = options;

  const numValue = parseFloat(value) || 0;
  
  try {
    return new Intl.NumberFormat(locale, {
      style,
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping
    }).format(numValue);
    
  } catch (error) {
    console.warn('Erro na formatação de número:', error);
    return numValue.toFixed(maximumFractionDigits);
  }
};

/**
 * Formata porcentagem
 * @param {number} value - Valor decimal (0.5 = 50%)
 * @param {Object} options - Opções de formatação
 * @returns {string} - Porcentagem formatada
 */
export const formatPercentage = (value, options = {}) => {
  const {
    locale = 'pt-BR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 1
  } = options;

  return formatNumber(value, {
    locale,
    minimumFractionDigits,
    maximumFractionDigits,
    style: 'percent'
  });
};

/**
 * Formata tamanho de arquivo
 * @param {number} bytes - Tamanho em bytes
 * @param {Object} options - Opções de formatação
 * @returns {string} - Tamanho formatado
 */
export const formatFileSize = (bytes, options = {}) => {
  const { locale = 'pt-BR', decimals = 1 } = options;
  
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const value = bytes / Math.pow(k, i);
  
  return `${formatNumber(value, {
    locale,
    maximumFractionDigits: decimals
  })} ${sizes[i]}`;
};

/**
 * Formata texto truncando se necessário
 * @param {string} text - Texto a ser formatado
 * @param {Object} options - Opções de formatação
 * @returns {string} - Texto formatado
 */
export const formatText = (text, options = {}) => {
  const {
    maxLength = null,
    ellipsis = '...',
    capitalize = false,
    uppercase = false,
    lowercase = false,
    trim = true
  } = options;

  if (!text || typeof text !== 'string') {
    return '';
  }
  
  let formatted = text;
  
  // Aplica trim
  if (trim) {
    formatted = formatted.trim();
  }
  
  // Aplica transformações de caso
  if (uppercase) {
    formatted = formatted.toUpperCase();
  } else if (lowercase) {
    formatted = formatted.toLowerCase();
  } else if (capitalize) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }
  
  // Aplica truncamento
  if (maxLength && formatted.length > maxLength) {
    formatted = formatted.substring(0, maxLength - ellipsis.length) + ellipsis;
  }
  
  return formatted;
};

/**
 * Formata descrição de transação
 * @param {string} description - Descrição original
 * @param {Object} options - Opções de formatação
 * @returns {string} - Descrição formatada
 */
export const formatTransactionDescription = (description, options = {}) => {
  const { maxLength = 50, removeExtraSpaces = true } = options;
  
  if (!description) return 'Sem descrição';
  
  let formatted = description;
  
  // Remove aspas
  formatted = formatted.replace(/"/g, '');
  
  // Remove espaços extras
  if (removeExtraSpaces) {
    formatted = formatted.replace(/\s+/g, ' ');
  }
  
  // Aplica formatação de texto
  return formatText(formatted, {
    maxLength,
    trim: true,
    capitalize: true
  });
};

/**
 * Formata status de conciliação
 * @param {string} status - Status da conciliação
 * @param {Object} options - Opções de formatação
 * @returns {Object} - Status formatado com cor e ícone
 */
export const formatReconciliationStatus = (status, options = {}) => {
  const { includeIcon = true, includeColor = true } = options;
  
  const statusMap = {
    reconciled: {
      label: 'Conciliado',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: 'check_circle'
    },
    unreconciledInvoice: {
      label: 'Não Lançado',
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      icon: 'warning'
    },
    unreconciledApp: {
      label: 'Não Encontrado',
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      icon: 'error'
    },
    processing: {
      label: 'Processando',
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      icon: 'hourglass_top'
    },
    error: {
      label: 'Erro',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: 'error'
    }
  };
  
  const statusInfo = statusMap[status] || statusMap.error;
  
  return {
    label: statusInfo.label,
    ...(includeColor && {
      color: statusInfo.color,
      bgColor: statusInfo.bgColor,
      textColor: statusInfo.textColor
    }),
    ...(includeIcon && {
      icon: statusInfo.icon
    })
  };
};

/**
 * Formata duração em milissegundos
 * @param {number} ms - Duração em milissegundos
 * @param {Object} options - Opções de formatação
 * @returns {string} - Duração formatada
 */
export const formatDuration = (ms, options = {}) => {
  const { precision = 'auto', locale = 'pt-BR' } = options;
  
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (precision === 'auto') {
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  // Formatação customizada baseada na precisão
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
  if (seconds % 60 > 0) parts.push(`${seconds % 60}s`);
  
  return parts.join(' ') || '0s';
};

/**
 * Formata lista de itens
 * @param {Array} items - Lista de itens
 * @param {Object} options - Opções de formatação
 * @returns {string} - Lista formatada
 */
export const formatList = (items, options = {}) => {
  const {
    separator = ', ',
    lastSeparator = ' e ',
    maxItems = null,
    moreText = 'outros'
  } = options;

  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }
  
  let displayItems = items;
  let hasMore = false;
  
  if (maxItems && items.length > maxItems) {
    displayItems = items.slice(0, maxItems);
    hasMore = true;
  }
  
  if (displayItems.length === 1) {
    return String(displayItems[0]);
  }
  
  const lastItem = displayItems.pop();
  let formatted = displayItems.join(separator) + lastSeparator + lastItem;
  
  if (hasMore) {
    const remainingCount = items.length - maxItems;
    formatted += ` ${lastSeparator}${remainingCount} ${moreText}`;
  }
  
  return formatted;
};

/**
 * Exporta formatadores pré-configurados
 */
export const FORMATTERS = {
  currency: {
    brl: (value) => formatCurrency(value, { currency: 'BRL' }),
    usd: (value) => formatCurrency(value, { currency: 'USD', locale: 'en-US' }),
    eur: (value) => formatCurrency(value, { currency: 'EUR', locale: 'de-DE' })
  },
  
  date: {
    short: (date) => formatDate(date, { format: 'short' }),
    long: (date) => formatDate(date, { format: 'long' }),
    iso: (date) => formatDate(date, { format: 'iso' }),
    relative: (date) => formatDate(date, { format: 'relative' })
  },
  
  number: {
    integer: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
    decimal: (value) => formatNumber(value, { maximumFractionDigits: 2 }),
    percentage: (value) => formatPercentage(value)
  }
};

