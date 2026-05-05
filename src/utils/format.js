// Função para formatar números como moeda brasileira
export const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    value = 0;
  }
  return new Intl.NumberFormat("pt-BR", { 
    style: "currency", 
    currency: "BRL" 
  }).format(value);
};

// Função para determinar a "saúde financeira" com base na renda e despesa
export const getFinancialHealth = (income, expense) => {
  if (income === 0 && expense > 0) {
    return { 
      status: "Crítico", 
      style: "bg-gradient-to-br from-slate-800 to-black", 
      message: "Você tem despesas mas nenhuma renda registrada para este mês." 
    };
  }
  if (income === 0) {
    return { 
      status: "Indefinido", 
      style: "bg-slate-500", 
      message: "Nenhuma renda registrada para este mês." 
    };
  }
  
  const percentage = (expense / income) * 100;

  if (percentage <= 65) {
    return { 
      status: "Saudável", 
      style: "bg-gradient-to-br from-green-500 to-emerald-600", 
      message: "Seus gastos estão sob controle. Ótimo trabalho!" 
    };
  }
  if (percentage <= 75) {
    return { 
      status: "Cuidado", 
      style: "bg-gradient-to-br from-orange-500 to-amber-600", 
      message: "Seus gastos estão aumentando. Fique atento!" 
    };
  }
  if (percentage <= 95) {
    return { 
      status: "Ruim", 
      style: "bg-gradient-to-br from-red-500 to-rose-600", 
      message: "Gastos elevados. É hora de revisar o orçamento." 
    };
  }
  return { 
    status: "Crítico", 
    style: "bg-gradient-to-br from-slate-800 to-black", 
    message: "Alerta! Seus gastos superaram sua renda." 
  };
};