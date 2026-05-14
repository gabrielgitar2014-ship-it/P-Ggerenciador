// src/utils/fileReader.js

/**
 * Configurações para leitura de arquivos
 */
const FILE_CONFIG = {
  // Tamanho máximo: 10MB
  MAX_SIZE: 10 * 1024 * 1024,
  
  // Tipos de arquivo permitidos
  ALLOWED_TYPES: [
    'text/csv',
    'application/csv',
    'text/plain',
    'application/vnd.ms-excel' // Para alguns CSVs que podem ser detectados como Excel
  ],
  
  // Extensões permitidas
  ALLOWED_EXTENSIONS: ['.csv', '.txt'],
  
  // Encodings suportados
  ENCODINGS: ['UTF-8', 'ISO-8859-1', 'Windows-1252'],
  
  // Timeout para leitura (em ms)
  READ_TIMEOUT: 30000
};

/**
 * Valida se o arquivo é válido para processamento
 * @param {File} file - Arquivo selecionado pelo usuário
 * @returns {Object} - Resultado da validação
 */
const validateFile = (file) => {
  const errors = [];
  
  // Verifica se o arquivo existe
  if (!file) {
    return { valid: false, errors: ['Nenhum arquivo fornecido'] };
  }
  
  // Verifica tamanho do arquivo
  if (file.size === 0) {
    errors.push('Arquivo está vazio');
  } else if (file.size > FILE_CONFIG.MAX_SIZE) {
    const maxSizeMB = (FILE_CONFIG.MAX_SIZE / (1024 * 1024)).toFixed(1);
    errors.push(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
  }
  
  // Verifica tipo do arquivo
  const hasValidType = FILE_CONFIG.ALLOWED_TYPES.includes(file.type);
  const hasValidExtension = FILE_CONFIG.ALLOWED_EXTENSIONS.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  if (!hasValidType && !hasValidExtension) {
    errors.push(`Tipo de arquivo não suportado. Tipos aceitos: ${FILE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`);
  }
  
  // Verifica nome do arquivo
  if (!file.name || file.name.trim().length === 0) {
    errors.push('Nome do arquivo é inválido');
  }
  
  // Verifica caracteres especiais no nome
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(file.name)) {
    errors.push('Nome do arquivo contém caracteres inválidos');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    info: {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toLocaleString('pt-BR')
    }
  };
};

/**
 * Detecta encoding do arquivo analisando os primeiros bytes
 * @param {ArrayBuffer} buffer - Buffer do arquivo
 * @returns {string} - Encoding detectado
 */
const detectEncoding = (buffer) => {
  const bytes = new Uint8Array(buffer.slice(0, 1024)); // Analisa primeiros 1KB
  
  // Verifica BOM (Byte Order Mark)
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return 'UTF-8'; // UTF-8 com BOM
  }
  
  if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
    return 'UTF-16LE';
  }
  
  if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
    return 'UTF-16BE';
  }
  
  // Verifica se é UTF-8 válido
  let isValidUTF8 = true;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    
    if (byte > 127) {
      // Caractere não-ASCII, verifica sequência UTF-8
      if ((byte & 0xE0) === 0xC0) {
        // 2 bytes
        if (i + 1 >= bytes.length || (bytes[i + 1] & 0xC0) !== 0x80) {
          isValidUTF8 = false;
          break;
        }
        i += 1;
      } else if ((byte & 0xF0) === 0xE0) {
        // 3 bytes
        if (i + 2 >= bytes.length || 
            (bytes[i + 1] & 0xC0) !== 0x80 || 
            (bytes[i + 2] & 0xC0) !== 0x80) {
          isValidUTF8 = false;
          break;
        }
        i += 2;
      } else if ((byte & 0xF8) === 0xF0) {
        // 4 bytes
        if (i + 3 >= bytes.length || 
            (bytes[i + 1] & 0xC0) !== 0x80 || 
            (bytes[i + 2] & 0xC0) !== 0x80 || 
            (bytes[i + 3] & 0xC0) !== 0x80) {
          isValidUTF8 = false;
          break;
        }
        i += 3;
      } else {
        isValidUTF8 = false;
        break;
      }
    }
  }
  
  if (isValidUTF8) {
    return 'UTF-8';
  }
  
  // Se não é UTF-8, assume ISO-8859-1 (Latin-1) que é comum em CSVs brasileiros
  return 'ISO-8859-1';
};

/**
 * Lê arquivo como ArrayBuffer para análise de encoding
 * @param {File} file - Arquivo a ser lido
 * @returns {Promise<ArrayBuffer>} - Buffer do arquivo
 */
const readAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    const timeout = setTimeout(() => {
      reader.abort();
      reject(new Error('Timeout na leitura do arquivo'));
    }, FILE_CONFIG.READ_TIMEOUT);
    
    reader.onload = (event) => {
      clearTimeout(timeout);
      resolve(event.target.result);
    };
    
    reader.onerror = (error) => {
      clearTimeout(timeout);
      console.error("Erro ao ler arquivo como ArrayBuffer:", error);
      reject(new Error('Erro ao ler arquivo para análise de encoding'));
    };
    
    reader.onabort = () => {
      clearTimeout(timeout);
      reject(new Error('Leitura do arquivo foi cancelada'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Lê arquivo como texto com encoding específico
 * @param {File} file - Arquivo a ser lido
 * @param {string} encoding - Encoding a ser usado
 * @returns {Promise<string>} - Conteúdo do arquivo como texto
 */
const readAsTextWithEncoding = (file, encoding = 'UTF-8') => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    const timeout = setTimeout(() => {
      reader.abort();
      reject(new Error('Timeout na leitura do arquivo'));
    }, FILE_CONFIG.READ_TIMEOUT);
    
    reader.onload = (event) => {
      clearTimeout(timeout);
      
      let content = event.target.result;
      
      // Remove BOM se presente
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      
      // Valida se o conteúdo não está corrompido
      if (content.includes('\uFFFD')) {
        reject(new Error(`Arquivo pode estar corrompido ou usar encoding diferente de ${encoding}`));
        return;
      }
      
      resolve(content);
    };
    
    reader.onerror = (error) => {
      clearTimeout(timeout);
      console.error("Erro ao ler arquivo como texto:", error);
      reject(new Error(`Erro ao ler arquivo com encoding ${encoding}`));
    };
    
    reader.onabort = () => {
      clearTimeout(timeout);
      reject(new Error('Leitura do arquivo foi cancelada'));
    };
    
    // Lê com encoding específico
    reader.readAsText(file, encoding);
  });
};

/**
 * Tenta ler arquivo com diferentes encodings
 * @param {File} file - Arquivo a ser lido
 * @param {string} detectedEncoding - Encoding detectado
 * @returns {Promise<Object>} - Resultado da leitura
 */
const tryReadWithEncodings = async (file, detectedEncoding) => {
  // Lista de encodings para tentar, começando pelo detectado
  const encodingsToTry = [
    detectedEncoding,
    ...FILE_CONFIG.ENCODINGS.filter(enc => enc !== detectedEncoding)
  ];
  
  const results = [];
  
  for (const encoding of encodingsToTry) {
    try {
      console.log(`Tentando ler arquivo com encoding: ${encoding}`);
      const content = await readAsTextWithEncoding(file, encoding);
      
      // Valida se o conteúdo parece válido
      const lines = content.split('\n');
      const hasValidLines = lines.some(line => line.trim().length > 0);
      const hasReasonableCharacters = !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(content.slice(0, 1000));
      
      if (hasValidLines && hasReasonableCharacters) {
        return {
          success: true,
          content,
          encoding,
          info: {
            lines: lines.length,
            size: content.length,
            preview: content.slice(0, 200) + (content.length > 200 ? '...' : '')
          }
        };
      } else {
        results.push({ encoding, error: 'Conteúdo parece inválido' });
      }
      
    } catch (error) {
      results.push({ encoding, error: error.message });
      console.warn(`Falha ao ler com ${encoding}:`, error.message);
    }
  }
  
  // Se chegou aqui, nenhum encoding funcionou
  throw new Error(`Não foi possível ler o arquivo com nenhum encoding. Tentativas: ${results.map(r => `${r.encoding}: ${r.error}`).join('; ')}`);
};

/**
 * Extrai o conteúdo de texto de um arquivo de forma robusta
 * @param {File} file - O arquivo selecionado pelo usuário
 * @param {Object} options - Opções de leitura
 * @returns {Promise<string>} - Conteúdo de texto completo do arquivo
 */
export async function extractTextFromFile(file, options = {}) {
  console.log('Iniciando extração de texto do arquivo:', file?.name);
  
  // Validação inicial
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(`Arquivo inválido: ${validation.errors.join(', ')}`);
  }
  
  console.log('Arquivo validado:', validation.info);
  
  try {
    // Etapa 1: Lê arquivo como buffer para detectar encoding
    const buffer = await readAsArrayBuffer(file);
    const detectedEncoding = detectEncoding(buffer);
    
    console.log(`Encoding detectado: ${detectedEncoding}`);
    
    // Etapa 2: Tenta ler com diferentes encodings
    const result = await tryReadWithEncodings(file, detectedEncoding);
    
    console.log(`Arquivo lido com sucesso usando ${result.encoding}:`, result.info);
    
    // Etapa 3: Validações finais do conteúdo
    if (!result.content || result.content.trim().length === 0) {
      throw new Error('Arquivo está vazio ou contém apenas espaços em branco');
    }
    
    // Verifica se parece ser um CSV
    const lines = result.content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('Arquivo deve conter pelo menos 2 linhas (cabeçalho + dados)');
    }
    
    // Verifica se tem delimitadores comuns de CSV
    const firstLine = lines[0];
    const hasCommonDelimiters = /[,;|\t]/.test(firstLine);
    if (!hasCommonDelimiters) {
      console.warn('Arquivo pode não ser um CSV válido - nenhum delimitador comum encontrado');
    }
    
    return result.content;
    
  } catch (error) {
    console.error('Erro na extração de texto:', error);
    
    // Melhora a mensagem de erro para o usuário
    let userMessage = error.message;
    
    if (error.message.includes('Timeout')) {
      userMessage = 'Arquivo muito grande ou leitura muito lenta. Tente um arquivo menor.';
    } else if (error.message.includes('encoding')) {
      userMessage = 'Problema com a codificação do arquivo. Tente salvar o CSV com codificação UTF-8.';
    } else if (error.message.includes('corrompido')) {
      userMessage = 'Arquivo pode estar corrompido. Tente gerar o CSV novamente.';
    }
    
    throw new Error(userMessage);
  }
}

/**
 * Função auxiliar para obter informações do arquivo sem lê-lo completamente
 * @param {File} file - Arquivo a ser analisado
 * @returns {Promise<Object>} - Informações do arquivo
 */
export async function getFileInfo(file) {
  const validation = validateFile(file);
  
  if (!validation.valid) {
    return {
      valid: false,
      errors: validation.errors,
      info: validation.info
    };
  }
  
  try {
    // Lê apenas uma pequena parte para detectar encoding e formato
    const buffer = await readAsArrayBuffer(file);
    const encoding = detectEncoding(buffer);
    
    // Lê primeiras linhas para preview
    const preview = await readAsTextWithEncoding(file, encoding);
    const lines = preview.split('\n').slice(0, 5);
    
    return {
      valid: true,
      info: {
        ...validation.info,
        encoding,
        preview: lines.join('\n'),
        estimatedLines: preview.split('\n').length,
        hasDelimiters: /[,;|\t]/.test(lines[0] || '')
      }
    };
    
  } catch (error) {
    return {
      valid: false,
      errors: [error.message],
      info: validation.info
    };
  }
}

/**
 * Exporta configurações para uso externo
 */
export { FILE_CONFIG };

