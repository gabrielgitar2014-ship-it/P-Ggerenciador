// /utils/reportUtils.js

const parseDateString = (dateString) => {
    if (typeof dateString !== 'string' || dateString.length < 10) return null;
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map(p => parseInt(p, 10));
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
        return date;
    }
    return null;
};

export const processarDadosRelatorio = (allParcelas, filtros) => {
    const { startDate, endDate, metodoPagamento, categoria } = filtros;

    const start = parseDateString(startDate);
    const end = parseDateString(endDate);

    if (!start || !end || !Array.isArray(allParcelas)) {
        console.error('Erro: Datas inválidas ou `allParcelas` não é um array.');
        return null;
    }
    end.setUTCHours(23, 59, 59, 999);

    const comprasUnicas = new Map();

    allParcelas.forEach(parcela => {
        const despesa = parcela.despesas;
        if (!despesa || !despesa.id || !despesa.data_compra) return;

        const dataCompra = parseDateString(despesa.data_compra);
        if (!dataCompra || dataCompra < start || dataCompra > end) {
            return;
        }

        const metodoOk = metodoPagamento === 'todos' || despesa.metodo_pagamento === metodoPagamento;
        const categoriaOk = categoria === 'todas' || despesa.categoria === categoria;

        if (metodoOk && categoriaOk) {
            if (!comprasUnicas.has(despesa.id)) {
                comprasUnicas.set(despesa.id, despesa);
            }
        }
    });

    const comprasDoPeriodo = Array.from(comprasUnicas.values());

    // --- CORREÇÃO APLICADA AQUI: Usando 'amount' ---
    const totalDespesas = comprasDoPeriodo.reduce((acc, compra) => acc + (compra.amount || 0), 0);
    
    // --- CORREÇÃO APLICADA AQUI: Usando 'amount' ---
    const totalDespesasParceladas = comprasDoPeriodo.reduce((acc, compra) => {
        if (compra.qtd_parcelas > 1) {
            return acc + (compra.amount || 0);
        }
        return acc;
    }, 0);
    
    // --- CORREÇÃO APLICADA AQUI: Usando 'amount' ---
    const gastosPorDiaDeCompra = comprasDoPeriodo.reduce((acc, compra) => {
        if(compra.data_compra) acc[compra.data_compra] = (acc[compra.data_compra] || 0) + (compra.amount || 0);
        return acc;
    }, {});
    const diaMaisGastou = Object.entries(gastosPorDiaDeCompra).reduce(
        (maior, [dia, valor]) => (valor > maior.valor ? { dia, valor } : maior), { dia: 'N/A', valor: 0 }
    );

    return {
        startDate, endDate, totalDespesas, 
        compras: comprasDoPeriodo,
        diaMaisGastou, metodoPagamento, categoria,
        totalDespesasParceladas,
    };
};