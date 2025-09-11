import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

// Registra os componentes necessários do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const formatCurrency = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export default function DashboardPrincipal({ selectedMonth }) {
  const { allParcelas, transactions } = useData();

  // Hook para calcular todos os dados necessários para os gráficos
  const summaryData = useMemo(() => {
    const monthlyTransactions = transactions.filter(t => t.date && t.date.startsWith(selectedMonth));
    const monthlyParcelas = allParcelas.filter(p => p.data_parcela && p.data_parcela.startsWith(selectedMonth));

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const fixedExpenses = monthlyTransactions
      .filter(t => t.type === 'expense' && t.is_fixed)
      .reduce((acc, t) => acc + t.amount, 0);
      
    const variableExpenses = monthlyParcelas.reduce((acc, p) => acc + p.amount, 0);
    
    const totalExpense = fixedExpenses + variableExpenses;

    // Lógica para agrupar despesas por categoria
    const expensesByCategory = {};
    [...monthlyTransactions.filter(t => t.type === 'expense'), ...monthlyParcelas].forEach(item => {
        // 'item.despesas.categoria' para parcelas, 'item.categoria' para despesas fixas
        const category = item.despesas?.categoria || item.categoria || 'Sem Categoria';
        const amount = item.amount || 0;
        if (expensesByCategory[category]) {
            expensesByCategory[category] += amount;
        } else {
            expensesByCategory[category] = amount;
        }
    });

    return {
      income,
      totalExpense,
      balance: income - totalExpense,
      expensesByCategory,
    };
  }, [selectedMonth, allParcelas, transactions]);

  // Dados para o Gráfico de Rosca (Renda vs. Despesa)
  const doughnutData = {
    labels: ['Renda', 'Despesa'],
    datasets: [{
      data: [summaryData.income, summaryData.totalExpense],
      backgroundColor: ['#16a34a', '#dc2626'],
      borderColor: ['#f0fdf4', '#fef2f2'],
      borderWidth: 2,
    }],
  };

  // Dados para o Gráfico de Barras (Despesas por Categoria)
  const barData = {
    labels: Object.keys(summaryData.expensesByCategory),
    datasets: [{
      label: 'Gasto por Categoria',
      data: Object.values(summaryData.expensesByCategory),
      backgroundColor: '#4f46e5',
      borderColor: '#c7d2fe',
      borderWidth: 1,
    }],
  };

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                <div>
                    <h3 className="text-gray-500 text-sm">Renda do Mês</h3>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(summaryData.income)}</p>
                </div>
                <span className="material-symbols-outlined text-green-500 text-4xl">arrow_circle_up</span>
            </div>
            <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                <div>
                    <h3 className="text-gray-500 text-sm">Despesas Totais</h3>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(summaryData.totalExpense)}</p>
                </div>
                <span className="material-symbols-outlined text-red-500 text-4xl">arrow_circle_down</span>
            </div>
            <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                <div>
                    <h3 className="text-gray-500 text-sm">Saldo do Mês</h3>
                    <p className={`text-2xl font-bold ${summaryData.balance >= 0 ? "text-blue-600" : "text-red-600"}`}>{formatCurrency(summaryData.balance)}</p>
                </div>
                <span className={`material-symbols-outlined ${summaryData.balance >= 0 ? "text-blue-500" : "text-red-500"} text-4xl`}>scale</span>
            </div>
        </div>

        {/* Seção de Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-lg text-center mb-4">Renda vs. Despesas</h3>
                <div className="h-64 flex justify-center">
                    <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, responsive: true }} />
                </div>
            </div>
            <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-lg text-center mb-4">Gastos por Categoria</h3>
                <div className="h-64">
                    <Bar data={barData} options={{ maintainAspectRatio: false, responsive: true }} />
                </div>
            </div>
        </div>
    </div>
  );
}