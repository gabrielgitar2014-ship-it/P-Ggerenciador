// Exporta a lista inicial de transações (rendas e despesas)
export const initialTransactions = [
  // Rendas
  {
    id: 1,
    type: "income",
    description: "Salário",
    amount: 5000,
    date: "2025-08-05",
  },
  {
    id: 6,
    type: "income",
    description: "Salário",
    amount: 5000,
    date: "2025-07-05",
  },

  // Despesas
  {
    id: 2,
    type: "expense",
    description: "Aluguel",
    amount: 1500,
    date: "2025-08-10",
    isFixed: true,
    dueDate: "10",
    bank: "Pix",
    paymentMonth: "current",
    paid: true,
  },
  {
    id: 3,
    type: "expense",
    description: "Supermercado",
    amount: 800,
    date: "2025-08-15",
    isFixed: false,
    bank: "Itau",
    paymentMonth: "current",
  },
  {
    id: 4,
    type: "expense",
    description: "Netflix",
    amount: 55.9,
    date: "2025-08-20",
    isFixed: true,
    dueDate: "20",
    bank: "Nubank",
    paymentMonth: "current",
    paid: false,
  },

  // Compra Parcelada 1
  {
    id: 5,
    type: "expense",
    description: "Celular Novo (3/12)",
    amount: 250,
    date: "2025-08-22",
    isFixed: false,
    bank: "Nubank",
    paymentMonth: "current",
    purchaseId: 101,
    parcela: { numeroDaParcela: 3, totalParcelas: 12, valorTotalCompra: 3000 },
  },

  // Compra Parcelada 2
  {
    id: 9,
    type: "expense",
    description: "Cadeira de Escritório (1/6)",
    amount: 120,
    date: "2025-08-25",
    isFixed: false,
    bank: "Bradesco",
    paymentMonth: "current",
    purchaseId: 102,
    parcela: { numeroDaParcela: 1, totalParcelas: 6, valorTotalCompra: 720 },
  },

  {
    id: 7,
    type: "expense",
    description: "Aluguel",
    amount: 1500,
    date: "2025-07-10",
    isFixed: true,
    dueDate: "10",
    bank: "Pix",
    paymentMonth: "current",
    paid: true,
  },
  {
    id: 8,
    type: "expense",
    description: "Cartão de Crédito Nubank",
    amount: 1800,
    date: "2025-07-25",
    isFixed: false,
    bank: "Nubank",
    paymentMonth: "next",
  },
];

// Exporta a lista inicial de pedidos de compra
export const mockPedidos = [
  {
    id: 1,
    justification: "Novo teclado mecânico",
    value: 350,
    status: "pendente",
  },
  {
    id: 2,
    justification: "Curso de React Avançado",
    value: 800,
    status: "aprovado",
  },
  {
    id: 3,
    justification: "Cadeira ergonômica",
    value: 1200,
    status: "recusado",
    declineReason: "Valor muito acima do orçamento atual.",
  },
];
