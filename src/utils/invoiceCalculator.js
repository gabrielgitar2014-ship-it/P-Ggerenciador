// src/utils/invoiceCalculator.js

// CONFIGURAÇÃO: Dia fixo de vencimento da fatura
const FIXED_BILLING_DAY = 5;

// Parse da string de parcelamento (ex: "09/10")
const parseInstallment = (installmentStr) => {
  if (!installmentStr) return { atual: 1, total: 1 };
  const cleanStr = installmentStr.replace(/[^0-9/]/g, '');
  if (cleanStr.includes('/')) {
    const parts = cleanStr.split('/');
    const atual = parseInt(parts[0], 10) || 1;
    const total = parseInt(parts[1], 10) || 1;
    return { atual, total };
  }
  return { atual: 1, total: 1 };
};

/**
 * Define a DATA REAL DA COMPRA baseada no texto lido (OCR).
 * Ex: Se leu "31/10" e a fatura é de "2025-11", entende-se 2025-10-31.
 * Se leu "20/12" e a fatura é de "2025-01", entende-se 2024-12-20 (Ano anterior).
 */
const getRealPurchaseDate = (dateStr, invoiceYear, invoiceMonthIndex) => {
  // Padrão esperado: dd/MM
  if (!dateStr || !dateStr.includes('/')) {
    // Fallback: Se não tem data, usa dia 1 do mês da fatura
    return new Date(invoiceYear, invoiceMonthIndex, 1, 12, 0, 0);
  }

  const parts = dateStr.split('/');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1-12

  // Lógica do Ano:
  // Se o mês da compra for MAIOR que o mês da fatura (ex: Compra em Dez, Fatura em Jan),
  // então a compra foi no ano anterior.
  // Nota: invoiceMonthIndex é 0-11, month é 1-12.
  let year = invoiceYear;
  
  // Ex: Fatura Jan (0). Compra Dez (12). 12 > 1 -> Ano Anterior.
  // Ex: Fatura Nov (10). Compra Out (10). 10 não é > 11. Mesmo ano.
  if (month > (invoiceMonthIndex + 1) + 2) { 
     // Margem de segurança: se a diferença for muito grande, assume ano anterior
     year = invoiceYear - 1;
  }
  
  // Tratamento específico para virada de ano comum (Compra Dez / Fatura Jan)
  if ((invoiceMonthIndex === 0) && (month === 12)) {
      year = invoiceYear - 1;
  }

  return new Date(year, month - 1, day, 12, 0, 0);
};

// --- FUNÇÃO PRINCIPAL ---
export const generateInstallments = (confirmedTransactions, invoiceDate, selectedAccount) => {
  if (!confirmedTransactions || confirmedTransactions.length === 0) return [];

  // 1. Dados da Fatura Selecionada (O "Alvo" do Pagamento)
  const [refYearStr, refMonthStr] = invoiceDate.split('-');
  const refYear = parseInt(refYearStr, 10);
  const refMonthIndex = parseInt(refMonthStr, 10) - 1; // 0-11

  return confirmedTransactions.map(tx => {
    // A. Valores
    const valueClean = String(tx.value)
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim();
    let amountParcela = parseFloat(valueClean);
    if (isNaN(amountParcela)) amountParcela = 0;

    // B. Parcelas
    const instInfo = parseInstallment(tx.installment);

    // C. DATA DA COMPRA (A CORREÇÃO)
    // Usamos a data escrita no papel/imagem, não uma data calculada.
    const realPurchaseDate = getRealPurchaseDate(tx.date, refYear, refMonthIndex);
    const purchaseDateISO = realPurchaseDate.toISOString().split('T')[0];

    // Valor Total
    const totalAmount = amountParcela * instInfo.total;

    // D. Geração das Parcelas (Aqui aplicamos a lógica de Vencimento)
    const parcelas = [];
    
    // Precisamos saber onde cai a "parcela atual" (instInfo.atual).
    // O usuário disse que ESTA fatura (invoiceDate) contém a parcela 'atual'.
    // Portanto, a parcela 'atual' vence em 'refMonthIndex'.
    
    // Calculamos o deslocamento para achar o vencimento da 1ª parcela
    // Ex: Se estamos na parcela 3/10 em Novembro.
    // Parcela 3 = Nov. Parcela 2 = Out. Parcela 1 = Set.
    // startMonthIndex = Nov - (3-1) = Set.
    
    const startMonthIndex = refMonthIndex - (instInfo.atual - 1);

    for (let i = 1; i <= instInfo.total; i++) {
      // Mês de vencimento desta parcela
      const targetMonthIndex = startMonthIndex + (i - 1);
      
      // Data de Vencimento Fixa (Dia 5)
      const parcelaDateObj = new Date(refYear, targetMonthIndex, FIXED_BILLING_DAY, 12, 0, 0);

      parcelas.push({
        despesa_id: null,
        numero_parcela: i,
        amount: amountParcela,
        data_parcela: parcelaDateObj.toISOString().split('T')[0], // YYYY-MM-05
        paga: false 
      });
    }

    return {
      despesa: {
        description: tx.description,
        amount: totalAmount,
        metodo_pagamento: null,
        inicia_proximo_mes: false,
        is_parcelado: instInfo.total > 1,
        qtd_parcelas: instInfo.total,
        data_compra: purchaseDateISO, // AGORA SIM: Data real (ex: 31/10)
        mes_inicio_cobranca: invoiceDate,
        categoria_id: tx.category_id ? Number(tx.category_id) : null,
        category: null 
      },
      parcelas: parcelas,
      account_id: parseInt(selectedAccount, 10),
      metaParcelas: {
        totalParcelas: instInfo.total,
        parcelaAtual: instInfo.atual
      },
      rawTransaction: tx
    };
  });
};
