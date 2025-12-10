// src/utils/statementParser_enhanced.js
// Versão aprimorada com exportações corretas

/**
 * Configurações para diferentes formatos de CSV
 */
const CSV_CONFIGS = {
  bradesco_tabula: {
    name: 'Bradesco (Tabula)',
    delimiter: ',',
    dateColumn: 0,
    descriptionColumns: [1, -2], // Do índice 1 até penúltimo
    valueColumn: -1, // Última coluna
    dateFormats: ['DD/MM/YYYY', 'DD/MM', 'DD-MM-YYYY', 'DD-MM']
  },
  generic_csv: {
    name: 'CSV Genérico',
    delimiter: ',',
    dateColumn: 0,
    descriptionColumns: [1, -2],
    valueColumn: -1,
    dateFormats: ['DD/MM/YYYY', 'DD/MM', 'DD-MM-YYYY', 'DD-MM', 'YYYY-MM-DD']
  },
  semicolon_csv: {
    name: 'CSV com Ponto e Vírgula',
    delimiter: ';',
    dateColumn: 0,
    descriptionColumns: [1, -2],
    valueColumn: -1,
    dateFormats: ['DD/MM/YYYY', 'DD/MM', 'DD-MM-YYYY', 'DD-MM']
  }
};

/**
 * Converte string de valor monetário para número
 * @param {string} valueString - String com valor monetário
 * @returns {number} - Valor numérico ou NaN se inválido
 */
const parseValue = (valueString) => {
  if (typeof valueString !== 'string') return NaN;
  
  // Remove aspas e espaços
  let cleaned = valueString.replace(/"/g, '').trim();
  
  // Remove símbolos de moeda comuns
  cleaned = cleaned.replace(/[R$€£¥₹]/g, '');
  
  // Remove espaços restantes
  cleaned = cleaned.replace(/\s/g, '');
  
  // Detecta formato brasileiro (1.234,56) vs internacional (1,234.56)
  const hasBrazilianFormat = /\d{1,3}(\.\d{3})*,\d{2}$/.test(cleaned);
  const hasInternationalFormat = /\d{1,3}(,\d{3})*\.\d{2}$/.test(cleaned);
  
  if (hasBrazilianFormat) {
    // Formato brasileiro: remove pontos e substitui vírgula por ponto
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasInternationalFormat) {
    // Formato internacional: remove vírgulas
    cleaned = cleaned.replace(/,/g, '');
  } else {
    // Formato simples: apenas substitui vírgula por ponto se necessário
    cleaned = cleaned.replace(',', '.');
  }
  
  const value = parseFloat(cleaned);
  return isNaN(value) ? NaN : Math.abs(value); // Sempre retorna valor positivo
};

/**
 * Formata string de data para formato padrão
 * @param {string} dateString - String de data em vários formatos
 * @returns {string} - Data formatada como "DD MMM" ou "Data Inválida"
 */
const formatDate = (dateString) => {
  if (typeof dateString !== 'string') return "Data Inválida";
  
  const cleanedDate = dateString.replace(/"/g, '').trim();
  if (!cleanedDate) return "Data Inválida";
  
  let day, month, year;
  
  // Tenta vários formatos de data
  const patterns = [
    // DD/MM/YYYY ou DD-MM-YYYY
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/,
    // DD/MM ou DD-MM (assume ano atual)
    /^(\d{1,2})[\/-](\d{1,2})$/,
    // YYYY-MM-DD (formato ISO)
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // DD.MM.YYYY
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
    // DD.MM
    /^(\d{1,2})\.(\d{1,2})$/
  ];
  
  for (const pattern of patterns) {
    const match = cleanedDate.match(pattern);
    if (match) {
      if (pattern.source.includes('(\\d{4})')) {
        // Formato com ano
        if (pattern.source.startsWith('^(\\d{4})')) {
          // YYYY-MM-DD
          year = parseInt(match[1]);
          month = parseInt(match[2]);
          day = parseInt(match[3]);
        } else {
          // DD/MM/YYYY ou DD.MM.YYYY
          day = parseInt(match[1]);
          month = parseInt(match[2]);
          year = parseInt(match[3]);
        }
      } else {
        // Formato sem ano (assume ano atual)
        day = parseInt(match[1]);
        month = parseInt(match[2]);
        year = new Date().getFullYear();
      }
      break;
    }
  }
  
  // Se não encontrou padrão válido
  if (!day || !month || !year) {
    return "Data Inválida";
  }
  
  // Valida a data
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return "Data Inválida";
  }
  
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return "Data Inválida";
  
  // Formata como "DD MMM"
  const monthStr = date.toLocaleString('pt-BR', { month: 'short' })
    .toUpperCase()
    .replace('.', '');
  
  return `${String(date.getDate()).padStart(2, '0')} ${monthStr}`;
};

/**
 * Detecta o delimitador mais provável do CSV
 * @param {string} csvText - Conteúdo do CSV
 * @returns {string} - Delimitador detectado
 */
const detectDelimiter = (csvText) => {
  const lines = csvText.split('\n').slice(0, 5); // Analisa primeiras 5 linhas
  const delimiters = [',', ';', '\t', '|'];
  const counts = {};
  
  delimiters.forEach(delimiter => {
    counts[delimiter] = 0;
    lines.forEach(line => {
      counts[delimiter] += (line.split(delimiter).length - 1);
    });
  });
  
  // Retorna o delimitador mais frequente
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
};

/**
 * Divide uma linha CSV respeitando aspas
 * @param {string} line - Linha do CSV
 * @param {string} delimiter - Delimitador
 * @returns {Array<string>} - Campos da linha
 */
const splitCsvLine = (line, delimiter) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Aspas duplas escapadas
        current += '"';
        i += 2;
        continue;
      } else {
        // Início ou fim de aspas
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // Delimitador fora de aspas
      result.push(current.trim());
      current = '';
      i++;
      continue;
    } else {
      current += char;
    }
    
    i++;
  }
  
  // Adiciona o último campo
  result.push(current.trim());
  
  return result;
};

/**
 * Detecta automaticamente a configuração do CSV
 * @param {string} csvText - Conteúdo do CSV
 * @returns {Object} - Configuração detectada
 */
const detectCsvConfig = (csvText) => {
  const delimiter = detectDelimiter(csvText);
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV deve ter pelo menos 2 linhas (cabeçalho + dados)');
  }
  
  // Analisa a primeira linha de dados (ignora cabeçalho)
  const sampleLine = splitCsvLine(lines[1], delimiter);
  
  // Tenta detectar colunas de data e valor
  let dateColumn = -1;
  let valueColumn = -1;
  
  sampleLine.forEach((value, index) => {
    // Detecta coluna de data
    if (dateColumn === -1 && formatDate(value) !== "Data Inválida") {
      dateColumn = index;
    }
    
    // Detecta coluna de valor (última coluna que parece ser um número)
    if (!isNaN(parseValue(value))) {
      valueColumn = index;
    }
  });
  
  // Se não detectou, usa valores padrão
  if (dateColumn === -1) dateColumn = 0;
  if (valueColumn === -1) valueColumn = sampleLine.length - 1;
  
  return {
    name: 'Detectado Automaticamente',
    delimiter,
    dateColumn,
    descriptionColumns: [dateColumn + 1, valueColumn - 1],
    valueColumn,
    dateFormats: ['DD/MM/YYYY', 'DD/MM', 'DD-MM-YYYY', 'DD-MM', 'YYYY-MM-DD']
  };
};

/**
 * Valida e limpa dados de uma transação
 * @param {Object} transaction - Dados da transação
 * @param {number} lineNumber - Número da linha (para debug)
 * @returns {Object|null} - Transação válida ou null se inválida
 */
const validateTransaction = (transaction, lineNumber) => {
  const { data, descricao, valor } = transaction;
  
  // Validações básicas
  if (data === "Data Inválida") {
    console.warn(`Linha ${lineNumber}: Data inválida`);
    return null;
  }
  
  if (isNaN(valor) || valor <= 0) {
    console.warn(`Linha ${lineNumber}: Valor inválido (${valor})`);
    return null;
  }
  
  if (!descricao || descricao.trim().length === 0) {
    console.warn(`Linha ${lineNumber}: Descrição vazia`);
    return null;
  }
  
  // Limpa e normaliza dados
  return {
    data: data.trim(),
    descricao: descricao.replace(/"/g, '').trim(),
    valor: parseFloat(valor.toFixed(2)) // Arredonda para 2 casas decimais
  };
};

/**
 * Analisa um CSV de forma robusta e flexível
 * @param {string} csvText - O conteúdo completo do arquivo CSV
 * @param {Object} customConfig - Configuração personalizada (opcional)
 * @returns {Array<Object>} - Lista de objetos de transação
 */
export function parseCsv(csvText, customConfig = null) {
  console.log("Iniciando análise de CSV...");
  
  if (!csvText || typeof csvText !== 'string') {
    throw new Error("Conteúdo do CSV é inválido");
  }
  
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error("CSV deve conter pelo menos uma linha de cabeçalho e uma linha de dados");
  }
  
  // Usa configuração personalizada ou detecta automaticamente
  const config = customConfig || detectCsvConfig(csvText);
  console.log("Configuração detectada:", config);
  
  const transactions = [];
  const errors = [];
  
  // Processa cada linha (pula o cabeçalho)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    try {
      // Divide a linha usando o delimitador correto
      const values = splitCsvLine(line, config.delimiter);
      
      if (values.length < 2) {
        errors.push(`Linha ${i + 1}: Poucos campos (${values.length})`);
        continue;
      }
      
      // Extrai data
      const dateValue = values[config.dateColumn] || '';
      const data = formatDate(dateValue);
      
      // Extrai valor
      const valueIndex = config.valueColumn >= 0 ? 
        config.valueColumn : 
        values.length + config.valueColumn; // Suporte a índices negativos
      
      const valueValue = values[valueIndex] || '';
      const valor = parseValue(valueValue);
      
      // Extrai descrição (pode ser múltiplas colunas)
      let descricao = '';
      const [startCol, endCol] = config.descriptionColumns;
      const actualEndCol = endCol >= 0 ? endCol : values.length + endCol;
      
      for (let j = startCol; j <= actualEndCol && j < values.length; j++) {
        if (j !== config.dateColumn && j !== valueIndex) {
          if (descricao) descricao += ' ';
          descricao += (values[j] || '').trim();
        }
      }
      
      // Valida e adiciona transação
      const transaction = validateTransaction({ data, descricao, valor }, i + 1);
      if (transaction) {
        transactions.push(transaction);
      }
      
    } catch (error) {
      errors.push(`Linha ${i + 1}: ${error.message}`);
      console.warn(`Erro na linha ${i + 1}:`, error);
    }
  }
  
  // Verifica se encontrou transações válidas
  if (transactions.length === 0) {
    const errorMsg = errors.length > 0 ? 
      `Nenhuma transação válida encontrada. Erros: ${errors.slice(0, 3).join('; ')}` :
      "Nenhuma transação válida encontrada no arquivo CSV";
    throw new Error(errorMsg);
  }
  
  // Log de resultados
  console.log(`Análise concluída: ${transactions.length} transações extraídas`);
  if (errors.length > 0) {
    console.warn(`${errors.length} linha(s) com problemas:`, errors.slice(0, 5));
  }
  
  return transactions;
}

/**
 * Função auxiliar para testar diferentes configurações
 * @param {string} csvText - Conteúdo do CSV
 * @returns {Object} - Resultado dos testes
 */
export function testCsvConfigs(csvText) {
  const results = {};
  
  // Testa configuração automática
  try {
    const autoConfig = detectCsvConfig(csvText);
    results.auto = {
      config: autoConfig,
      transactions: parseCsv(csvText, autoConfig),
      success: true
    };
  } catch (error) {
    results.auto = { success: false, error: error.message };
  }
  
  // Testa configurações predefinidas
  Object.entries(CSV_CONFIGS).forEach(([key, config]) => {
    try {
      results[key] = {
        config,
        transactions: parseCsv(csvText, config),
        success: true
      };
    } catch (error) {
      results[key] = { success: false, error: error.message };
    }
  });
  
  return results;
}

/**
 * Exporta configurações disponíveis
 */
export { CSV_CONFIGS };

// Exportação padrão
export default {
  parseCsv,
  testCsvConfigs,
  CSV_CONFIGS
};

