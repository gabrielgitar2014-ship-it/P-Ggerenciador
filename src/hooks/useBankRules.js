// src/hooks/useBankRules.js
import { useMemo } from 'react';

export function useBankRules() {
  
  // Configuração Centralizada dos Bancos (Fechamento e Vencimento)
  // Ajuste os dias conforme sua realidade real
  const banksConfig = useMemo(() => ({
    nubank: { 
      nome: 'Nubank', 
      fechamento: 28, // Fecha dia 28
      vencimento: 5,  // Vence dia 05
      cor: 'bg-purple-800',
      gradient: 'from-[#820AD1] to-[#450570]',
      bandeira: 'mastercard'
    },
    itau: { 
      nome: 'Itaú', 
      fechamento: 28, 
      vencimento: 5, 
      cor: 'bg-blue-950',
      gradient: 'from-[#ec7000] to-[#2e2d88]',
      bandeira: 'visa'
    },
    bradesco: { 
      nome: 'Bradesco', 
      fechamento: 28, 
      vencimento: 5, 
      cor: 'bg-black',
      gradient: 'from-[#cc092f] to-[#990020]',
      bandeira: 'visa'
    },
    pix: { 
      nome: 'PIX', 
      fechamento: null, 
      vencimento: null, 
      cor: 'bg-emerald-500',
      gradient: 'from-emerald-500 to-emerald-700',
      bandeira: 'pix'
    }
  }), []);

  // Função que calcula a data da primeira parcela baseada na regra do cartão
  const calculateFirstInstallmentDate = (dataCompraStr, nomeBanco) => {
    const bancoKey = Object.keys(banksConfig).find(k => 
      banksConfig[k].nome.toLowerCase() === nomeBanco?.toLowerCase()
    );
    
    const regras = banksConfig[bancoKey];
    const dataCompra = new Date(dataCompraStr + 'T12:00:00'); // Evita fuso
    
    // Se não for cartão ou banco desconhecido, usa lógica padrão (mês seguinte dia da compra)
    if (!regras || !regras.fechamento) {
      const nextMonth = new Date(dataCompra);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    }

    const diaCompra = dataCompra.getDate();
    let mesAlvo = dataCompra.getMonth(); // 0-11
    let anoAlvo = dataCompra.getFullYear();

    // LÓGICA DO CARTÃO:
    // Se comprou ANTES do fechamento (ex: dia 15, fecha 28) -> Vence no próximo mês (Mês + 1)
    // Se comprou DEPOIS do fechamento (ex: dia 29, fecha 28) -> Vence no outro mês (Mês + 2)
    
    if (diaCompra >= regras.fechamento) {
      mesAlvo = mesAlvo + 2; // Pula o próximo mês
    } else {
      mesAlvo = mesAlvo + 1; // Mês seguinte
    }

    // Ajusta virada de ano automaticamente
    const dataVencimento = new Date(anoAlvo, mesAlvo, regras.vencimento);
    return dataVencimento;
  };

  const getBankStyle = (nomeBanco) => {
    const key = Object.keys(banksConfig).find(k => banksConfig[k].nome.toLowerCase() === nomeBanco?.toLowerCase());
    return banksConfig[key || 'pix']; // Fallback
  };

  return {
    banksConfig,
    calculateFirstInstallmentDate,
    getBankStyle
  };
}