// src/utils/reconciliationEngine_enhanced.js
// Versão aprimorada com matching inteligente e detecção de anomalias

const monthMap = { 
  jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06', 
  jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12' 
};

// Configurações avançadas
const MATCHING_CONFIG = {
  VALUE_TOLERANCE: 0.02, // 2 centavos
  DATE_TOLERANCE_DAYS: 3, // ±3 dias
  MIN_MATCH_SCORE: 60, // Score mínimo para considerar match
  DESCRIPTION_WEIGHT: 0.3,
  VALUE_WEIGHT: 0.4,
  DATE_WEIGHT: 0.3
};

// Padrões de estabelecimentos conhecidos
const ESTABLISHMENT_PATTERNS = {
  'UBER': /UBER.*|.*UBER.*|UBR\s/i,
  'IFOOD': /IFOOD.*|.*IFOOD.*|IFD\s/i,
  'NETFLIX': /NETFLIX.*|.*NETFLIX.*/i,
  'SPOTIFY': /SPOTIFY.*|.*SPOTIFY.*/i,
  'AMAZON': /AMAZON.*|.*AMAZON.*|AMZ\s/i,
  'GOOGLE': /GOOGLE.*|.*GOOGLE.*|GOOGL\s/i,
  'APPLE': /APPLE.*|.*APPLE.*|APL\s/i,
  'MERCADO_PAGO': /MERCADO.*PAGO|MP\s.*|.*MERCADOPAGO.*/i,
  'PAYPAL': /PAYPAL.*|.*PAYPAL.*/i,
  'NUBANK': /NUBANK.*|.*NUBANK.*|NU\s/i,
  'PICPAY': /PICPAY.*|.*PICPAY.*|PIC\s/i,
  'MAGAZINE_LUIZA': /MAGALU.*|.*MAGAZINE.*LUIZA.*|MAG.*LUZ/i,
  'AMERICANAS': /AMERICANAS.*|.*AMERICANAS.*|AMER\s/i,
  'SUBMARINO': /SUBMARINO.*|.*SUBMARINO.*/i,
  'SHOPEE': /SHOPEE.*|.*SHOPEE.*/i,
  'MERCADO_LIVRE': /MERCADO.*LIVRE|ML\s.*|.*MERCADOLIVRE.*/i
};

/**
 * Converte string de valor monetário para número
 */
const parseValue = (valueString) => {
  if (typeof valueString !== 'string') return 0;
  
  const cleanedString = valueString
    .replace(/"/g, '')
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  const value = parseFloat(cleanedString);
  return isNaN(value) ? 0 : Math.abs(value);
};

/**
 * Formata string de data para formato padrão
 */
const formatDate = (dateString) => {
  if (typeof dateString !== 'string') return "Data Inválida";
  
  const cleanedDate = dateString.replace(/"/g, '').trim();
  
  let day, month, year;
  
  const fullDateMatch = cleanedDate.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (fullDateMatch) {
    day = parseInt(fullDateMatch[1]);
    month = parseInt(fullDateMatch[2]);
    year = parseInt(fullDateMatch[3]);
  } else {
    const shortDateMatch = cleanedDate.match(/(\d{1,2})[\/-](\d{1,2})/);
    if (shortDateMatch) {
      day = parseInt(shortDateMatch[1]);
      month = parseInt(shortDateMatch[2]);
      year = new Date().getFullYear();
    } else {
      return "Data Inválida";
    }
  }
  
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return "Data Inválida";
  }
  
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return "Data Inválida";
  
  const monthStr = date.toLocaleString('pt-BR', { month: 'short' })
    .toUpperCase()
    .replace('.', '');
  
  return `${String(date.getDate()).padStart(2, '0')} ${monthStr}`;
};

/**
 * Normaliza descrição e identifica estabelecimento
 */
const normalizeDescription = (description) => {
  if (typeof description !== 'string') return { normalized: '', establishment: null };
  
  const normalized = description
    .replace(/"/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  
  // Identifica estabelecimento conhecido
  let establishment = null;
  for (const [name, pattern] of Object.entries(ESTABLISHMENT_PATTERNS)) {
    if (pattern.test(description)) {
      establishment = name;
      break;
    }
  }
  
  return { normalized, establishment };
};

/**
 * Calcula diferença em dias entre duas datas
 */
const dateDifferenceInDays = (date1, date2) => {
  try {
    // Parse da data da fatura (formato "DD MMM")
    let invoiceDate;
    if (typeof date1 === 'string' && date1.includes(' ')) {
      const [day, monthStr] = date1.split(' ');
      const month = monthMap[monthStr.toLowerCase()] || '01';
      const year = new Date().getFullYear();
      invoiceDate = new Date(year, parseInt(month) - 1, parseInt(day));
    } else {
      invoiceDate = new Date(date1);
    }
    
    // Parse da data do app (formato ISO)
    const appDate = new Date(date2);
    
    if (isNaN(invoiceDate.getTime()) || isNaN(appDate.getTime())) {
      return Infinity;
    }
    
    const diffTime = Math.abs(invoiceDate - appDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    return Infinity;
  }
};

/**
 * Calcula similaridade entre duas descrições usando algoritmo de Levenshtein
 */
const calculateDescriptionSimilarity = (desc1, desc2) => {
  if (!desc1 || !desc2) return 0;
  
  const s1 = desc1.toLowerCase().trim();
  const s2 = desc2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  // Algoritmo de Levenshtein simplificado
  const matrix = [];
  const len1 = s1.length;
  const len2 = s2.length;
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const maxLen = Math.max(len1, len2);
  const distance = matrix[len1][len2];
  return maxLen === 0 ? 1 : (maxLen - distance) / maxLen;
};

/**
 * Calcula score de matching entre item da fatura e despesa do app
 */
const calculateMatchScore = (invoiceItem, appExpense) => {
  let score = 0;
  
  // Score por valor (40% do peso)
  const invoiceValue = parseValue(invoiceItem.valor);
  const appValue = appExpense.amount || 0;
  const valueDiff = Math.abs(invoiceValue - appValue);
  const valueScore = valueDiff <= MATCHING_CONFIG.VALUE_TOLERANCE ? 
    MATCHING_CONFIG.VALUE_WEIGHT * 100 : 
    Math.max(0, MATCHING_CONFIG.VALUE_WEIGHT * 100 - (valueDiff * 50));
  score += valueScore;
  
  // Score por data (30% do peso)
  const dateDiff = dateDifferenceInDays(invoiceItem.data, appExpense.data_parcela);
  const dateScore = dateDiff <= MATCHING_CONFIG.DATE_TOLERANCE_DAYS ? 
    MATCHING_CONFIG.DATE_WEIGHT * 100 : 
    Math.max(0, MATCHING_CONFIG.DATE_WEIGHT * 100 - (dateDiff * 10));
  score += dateScore;
  
  // Score por descrição (30% do peso)
  const invoiceDesc = normalizeDescription(invoiceItem.descricao);
  const appDesc = normalizeDescription(appExpense.description || '');
  
  let descScore = 0;
  
  // Bonus se mesmo estabelecimento
  if (invoiceDesc.establishment && appDesc.establishment && 
      invoiceDesc.establishment === appDesc.establishment) {
    descScore = MATCHING_CONFIG.DESCRIPTION_WEIGHT * 100;
  } else {
    // Similaridade textual
    const similarity = calculateDescriptionSimilarity(
      invoiceDesc.normalized, 
      appDesc.normalized
    );
    descScore = similarity * MATCHING_CONFIG.DESCRIPTION_WEIGHT * 100;
  }
  
  score += descScore;
  
  return {
    total: Math.round(score),
    breakdown: {
      value: Math.round(valueScore),
      date: Math.round(dateScore),
      description: Math.round(descScore)
    },
    details: {
      valueDiff,
      dateDiff,
      similarity: calculateDescriptionSimilarity(invoiceDesc.normalized, appDesc.normalized),
      sameEstablishment: invoiceDesc.establishment === appDesc.establishment
    }
  };
};

/**
 * Detecta anomalias nos gastos
 */
const detectAnomalies = (expenses) => {
  const anomalies = [];
  
  // Agrupa por estabelecimento
  const byEstablishment = {};
  expenses.forEach(expense => {
    const desc = normalizeDescription(expense.descricao || expense.description || '');
    const establishment = desc.establishment || 'OUTROS';
    
    if (!byEstablishment[establishment]) {
      byEstablishment[establishment] = [];
    }
    byEstablishment[establishment].push(expense);
  });
  
  // Analisa cada grupo
  Object.entries(byEstablishment).forEach(([establishment, items]) => {
    if (items.length < 3) return; // Precisa de pelo menos 3 itens para análise
    
    const values = items.map(item => parseValue(item.valor || item.amount || 0));
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    items.forEach(item => {
      const value = parseValue(item.valor || item.amount || 0);
      const zScore = stdDev > 0 ? Math.abs((value - avg) / stdDev) : 0;
      
      if (zScore > 2) { // Mais de 2 desvios padrão
        anomalies.push({
          ...item,
          anomalyType: 'unusual_amount',
          establishment,
          expectedRange: [Math.max(0, avg - stdDev), avg + stdDev],
          confidence: Math.min(zScore / 3, 1),
          zScore: zScore.toFixed(2)
        });
      }
    });
  });
  
  return anomalies;
};

/**
 * Função principal de conciliação aprimorada
 */
export function reconcileExpensesEnhanced(invoiceItems, appExpenses) {
  console.log("Iniciando conciliação aprimorada...");
  
  if (!Array.isArray(invoiceItems) || !Array.isArray(appExpenses)) {
    return {
      reconciled: [],
      unreconciledInvoiceItems: [],
      unreconciledAppItems: [],
      totalInvoice: 0,
      totalReconciled: 0,
      errors: ['Parâmetros inválidos']
    };
  }
  
  const reconciled = [];
  const appExpensesClone = JSON.parse(JSON.stringify(appExpenses));
  
  // Calcula totais
  const totalInvoice = invoiceItems.reduce((sum, item) => {
    const value = parseValue(item.valor) || 0;
    return sum + value;
  }, 0);
  
  let totalReconciled = 0;
  const errors = [];
  const matchingDetails = [];
  
  // Processo de conciliação com scoring
  const remainingInvoiceItems = [];
  
  invoiceItems.forEach((invoiceItem, invoiceIndex) => {
    let bestMatch = null;
    let bestScore = 0;
    let bestMatchIndex = -1;
    let bestExpenseIndex = -1;
    
    try {
      const invoiceValue = parseValue(invoiceItem.valor);
      const invoiceDate = invoiceItem.data;
      
      if (!invoiceDate || invoiceValue <= 0) {
        errors.push(`Item da fatura ${invoiceIndex + 1} com dados inválidos`);
        remainingInvoiceItems.push(invoiceItem);
        return;
      }
      
      // Busca melhor correspondência
      appExpensesClone.forEach((appExpense, expenseIndex) => {
        if (!appExpense.parcelas || !Array.isArray(appExpense.parcelas)) {
          return;
        }
        
        appExpense.parcelas.forEach((parcela, parcelaIndex) => {
          if (!parcela || typeof parcela !== 'object') return;
          
          const score = calculateMatchScore(invoiceItem, {
            ...parcela,
            description: appExpense.description || appExpense.descricao
          });
          
          if (score.total > bestScore && score.total >= MATCHING_CONFIG.MIN_MATCH_SCORE) {
            bestScore = score.total;
            bestMatch = {
              expense: appExpense,
              parcela,
              score
            };
            bestMatchIndex = parcelaIndex;
            bestExpenseIndex = expenseIndex;
          }
        });
      });
      
      if (bestMatch) {
        reconciled.push({
          invoice: invoiceItem,
          app: {
            ...bestMatch.expense,
            matchedParcela: bestMatch.parcela,
            description: bestMatch.expense.description || bestMatch.expense.descricao || 'Sem descrição'
          },
          matchScore: bestMatch.score,
          confidence: bestScore >= 80 ? 'high' : bestScore >= 60 ? 'medium' : 'low'
        });
        
        totalReconciled += invoiceValue;
        appExpensesClone[bestExpenseIndex].parcelas.splice(bestMatchIndex, 1);
        
        matchingDetails.push({
          invoiceItem: invoiceItem.descricao,
          appItem: bestMatch.expense.description,
          score: bestScore,
          details: bestMatch.score.breakdown
        });
        
        console.log(`Match encontrado (score: ${bestScore}): ${invoiceItem.descricao} <-> ${bestMatch.expense.description}`);
      } else {
        remainingInvoiceItems.push(invoiceItem);
      }
    } catch (error) {
      console.error(`Erro ao processar item da fatura ${invoiceIndex + 1}:`, error);
      errors.push(`Erro ao processar item ${invoiceIndex + 1}: ${error.message}`);
      remainingInvoiceItems.push(invoiceItem);
    }
  });
  
  // Coleta parcelas não conciliadas do app
  const unreconciledAppItems = [];
  appExpensesClone.forEach(expense => {
    if (expense.parcelas && Array.isArray(expense.parcelas)) {
      expense.parcelas.forEach(parcela => {
        if (parcela && typeof parcela === 'object') {
          unreconciledAppItems.push({
            ...expense,
            ...parcela,
            description: `${expense.description || expense.descricao || 'Sem descrição'} (Parcela ${parcela.numero_parcela || 'N/A'})`,
            data: parcela.data_parcela,
            valor: parcela.amount
          });
        }
      });
    }
  });
  
  // Detecta anomalias
  const anomalies = detectAnomalies([...invoiceItems, ...unreconciledAppItems]);
  
  const result = {
    reconciled,
    unreconciledInvoiceItems: remainingInvoiceItems,
    unreconciledAppItems,
    totalInvoice,
    totalReconciled,
    reconciliationRate: totalInvoice > 0 ? (totalReconciled / totalInvoice * 100).toFixed(2) : 0,
    errors: errors.length > 0 ? errors : undefined,
    anomalies,
    matchingDetails,
    summary: {
      totalItems: invoiceItems.length,
      reconciledItems: reconciled.length,
      unreconciledInvoiceItems: remainingInvoiceItems.length,
      unreconciledAppItems: unreconciledAppItems.length,
      highConfidenceMatches: reconciled.filter(r => r.confidence === 'high').length,
      mediumConfidenceMatches: reconciled.filter(r => r.confidence === 'medium').length,
      lowConfidenceMatches: reconciled.filter(r => r.confidence === 'low').length,
      anomaliesDetected: anomalies.length
    },
    config: MATCHING_CONFIG
  };
  
  console.log('Conciliação aprimorada finalizada:', result.summary);
  return result;
}

// Função para atualizar configurações
export function updateMatchingConfig(newConfig) {
  Object.assign(MATCHING_CONFIG, newConfig);
  console.log('Configuração atualizada:', MATCHING_CONFIG);
}

// Função para adicionar novos padrões de estabelecimento
export function addEstablishmentPattern(name, pattern) {
  ESTABLISHMENT_PATTERNS[name] = pattern;
  console.log(`Padrão adicionado: ${name}`);
}

