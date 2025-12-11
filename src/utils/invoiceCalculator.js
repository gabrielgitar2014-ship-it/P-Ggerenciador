// src/utils/invoiceCalculator.js

/**
 * Retorna a quantidade de dias de um determinado mês/ano.
 * O JavaScript lida com o dia 0 do mês seguinte como o último dia do mês atual.
 * Ex: (2025, 10) -> Novembro (índice 10) -> retorna 30.
 */
const getDaysInMonth = (year, monthIndex) => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

/**
 * CRÍTICO: Cria uma data segura ("Clamped").
 * Se o dia desejado for 31, mas o mês só tem 30 dias, retorna dia 30.
 * Isso impede que 31/11 vire 01/12 (bug que causava diferença de saldo).
 */
const createClampedDate = (year, monthIndex, desiredDay) => {
  // 1. Descobre o último dia possível naquele mês (ex: 28, 29, 30 ou 31)
  const maxDay = getDaysInMonth(year, monthIndex);
  
  // 2. Escolhe o menor entre o dia desejado e o máximo permitido
  // Ex: Math.min(31, 30) = 30.
  const safeDay = Math.min(desiredDay, maxDay);
  
  // 3. Retorna data ao meio-dia para evitar problemas de fuso horário/DST
  return new Date(year, monthIndex, safeDay, 12, 0, 0);
};

// Parse da string de parcelamento (ex: "09/10" -> { atual: 9, total: 10 })
const parseInstallment = (installmentStr) => {
  if (!installmentStr) return { atual: 1, total: 1 };
  
  const cleanStr = installmentStr.replace(/[^0-9/]/g, '');
  
  if (cleanStr.includes('/')) {
    const parts = cleanStr.split('/');
    const atual = parseInt(parts[0], 10) || 1;
    const total = parseInt(parts[1], 10) || 1;
    return { atual, total };
  }
  
  // Fallback se não detectar barra
  return { atual: 1, total: 1 };
};

// --- FUNÇÃO PRINCIPAL ---
export const generateInstallments = (confirmedTransactions, invoiceDate, selectedAccount) => {
  if (!confirmedTransactions || confirmedTransactions.length === 0) return [];

  // 1. Identificar o Mês de Referência ABSOLUTO escolhido pelo usuário
  // invoiceDate vem como "YYYY-MM" (ex: "2025-11")
  const [refYearStr, refMonthStr] = invoiceDate.split('-');
  const refYear = parseInt(refYearStr, 10);
  const refMonthIndex = parseInt(refMonthStr, 10) - 1; // JS usa meses 0-11

  return confirmedTransactions.map(tx => {
    // A. Tratamento de Valores (R$ -> Float)
    const valueClean = String(tx.value)
      .replace('R$', '')
      .replace(/\./g, '')   // Remove milhar
      .replace(',', '.')    // Normaliza decimal
      .trim();
    
    let amountParcela = parseFloat(valueClean);
    if (isNaN(amountParcela)) amountParcela = 0;

    // B. Extração de Metadados da Parcela
    const instInfo = parseInstallment(tx.installment); // { atual, total }
    
    // C. Extração do Dia Original da Transação
    // Se a string for "31/10", pegamos o 31.
    let originalDay = 1;
    if (tx.date && tx.date.includes('/')) {
      originalDay = parseInt(tx.date.split('/')[0], 10) || 1;
    }

    // D. LÓGICA DE ANCORAGEM REVERSA (REGRA DE OURO)
    // Se esta é a parcela 'atual' e o usuário disse que a fatura é de 'Novembro' (refMonthIndex),
    // então esta parcela OBRIGATORIAMENTE vence em Novembro.
    // Calculamos a data de compra retroagindo (atual - 1) meses.
    
    const monthsToGoBack = instInfo.atual - 1;
    const purchaseMonthIndex = refMonthIndex - monthsToGoBack;
    
    // Calcula Data de Compra usando a Trava de Segurança
    // O JS aceita monthIndex negativo e ajusta o ano automaticamente, 
    // mas o createClampedDate garante que o dia não estoure.
    const purchaseDateObj = createClampedDate(refYear, purchaseMonthIndex, originalDay);
    
    // Recapturamos o ano e mês normalizados pelo objeto Date (caso tenha virado o ano)
    const normalizedPurchaseYear = purchaseDateObj.getFullYear();
    const normalizedPurchaseMonth = purchaseDateObj.getMonth(); // 0-11

    // Valor total do contrato (Despesa Pai) = Valor da Parcela * Qtd Parcelas
    const totalAmount = amountParcela * instInfo.total;

    // E. Gerar Array de Parcelas (Filhos)
    const parcelas = [];
    for (let i = 1; i <= instInfo.total; i++) {
      // Calcula o mês alvo desta parcela específica na iteração
      const targetMonthIndex = normalizedPurchaseMonth + (i - 1);
      
      // Gera data travada no limite do mês alvo
      // Ex: Se originalDay é 31 e targetMonthIndex é Novembro -> retorna dia 30.
      const parcelaDateObj = createClampedDate(
        normalizedPurchaseYear, 
        targetMonthIndex, 
        originalDay
      );

      parcelas.push({
        despesa_id: null, // Será preenchido após o INSERT do pai
        numero_parcela: i,
        amount: amountParcela,
        data_parcela: parcelaDateObj.toISOString().split('T')[0], // YYYY-MM-DD
        paga: false 
      });
    }

    // F. Retorno Estruturado para o Contexto
    return {
      despesa: {
        description: tx.description,
        amount: totalAmount, // Valor Total
        metodo_pagamento: null, // Será preenchido no Context via ID
        inicia_proximo_mes: false, // Forçamos false pois a data já está corrigida manualmente
        is_parcelado: instInfo.total > 1,
        qtd_parcelas: instInfo.total,
        data_compra: purchaseDateObj.toISOString().split('T')[0], // Data retroativa correta
        mes_inicio_cobranca: invoiceDate, // Referência visual
        categoria_id: tx.category_id ? Number(tx.category_id) : null,
        category: null 
      },
      parcelas: parcelas,
      account_id: parseInt(selectedAccount, 10),
      
      // Metadados para debug
      metaParcelas: {
        totalParcelas: instInfo.total,
        parcelaAtual: instInfo.atual
      },
      rawTransaction: tx
    };
  });
};