// src/tabs/GeneralTab.jsx
// (Versão 6.0 - Card de Bancos sem exibição de valor)

import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useVisibility } from '../../context/VisibilityContext';
import { useModal } from '../../context/ModalContext';
import { 
  ArrowUp, ArrowDown, ChevronRight, 
  BarChart3, Sparkle, AlertTriangle, Info, CreditCard
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// --- (MAPA DE ÍCONES E HELPERS) ---
const insightIconMap = {
  gasto_elevado: BarChart3,
  oportunidade: Sparkle,
  padrao_incomum: AlertTriangle,
  default: Info
};
function formatCurrencyBRL(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// --- (COMPONENTES INTERNOS) ---

function SaldoTotalCard({ valor, mes }) {
  const { valuesVisible } = useVisibility();
  const mesFormatado = mes ? `em ${mes}` : '';
  return (
    <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-lg text-center">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Saldo Total {mesFormatado}</span>
      <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mt-2">
        {valuesVisible ? formatCurrencyBRL(valor) : '••••••••'}
      </h2>
    </div>
  );
}

function ResumoCard({ type, valor, onClick }) { 
  const { valuesVisible } = useVisibility();
  const config = {
    renda: { label: 'Renda', Icon: ArrowUp, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/50' },
    despesa: { label: 'Despesas', Icon: ArrowDown, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/50' },
    fixa: { label: 'Despesas Fixas', Icon: ArrowDown, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/50' },
    bancos: { label: 'Cartões/Contas', Icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/50' },
  }[type];
  if (!config) return null;
  return (
    <button 
      onClick={onClick}
      className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md flex items-center justify-between text-left w-full hover:shadow-lg transition-shadow"
      aria-label={`Ver detalhes de ${config.label}`}
    >
      <div>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{config.label}</span>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {/* Lógica de correção: Se for 'bancos', mostra texto descritivo, ignora o valor */}
          {type === 'bancos' 
            ? 'Cartões'
            : (valuesVisible ? formatCurrencyBRL(valor) : '••••••••')
          }
        </h3>
      </div>
      <div className="flex items-center">
        <div className={`p-2 rounded-full ${config.bg} ${config.color}`}>
          <config.Icon className="w-5 h-5" />
        </div>
        <div className="ml-2 text-slate-400">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </button>
  );
}

function InsightCard({ insight }) {
  const { title, description, type } = insight;
  const Icon = insightIconMap[type] || insightIconMap.default; 
  return (
    <div className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg flex items-start gap-4">
      <div className="flex-shrink-0 text-blue-600 dark:text-blue-400 mt-1">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">{title}</h4>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1967'];

function CategoriaListItem({ cor, nome, valor, percentual }) {
  const { valuesVisible } = useVisibility();
  return (
    <li className="flex items-center justify-between py-2">
      <div className="flex items-center">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cor }}></span>
        <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{nome}</span>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {valuesVisible ? formatCurrencyBRL(valor) : '••••••••'}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {percentual.toFixed(1)}%
        </div>
      </div>
    </li>
  );
}


// ===================================================================
// O COMPONENTE PRINCIPAL DA ABA
// ===================================================================
export default function GeneralTab({ selectedMonth, onNavigate, onOpenNovaDespesa }) {
  const { valuesVisible } = useVisibility();
  const { showModal } = useModal();
  
  const { 
    transactions, 
    variableExpenses,
    allParcelas,
    bancos,
    getSaldoPorBanco,
    saveIncome, 
    insights, 
    loading,
    categorias
  } = useFinance();

  // --- Lógica de Cálculo de Saldo ---
  const { 
    totalRendas, 
    totalDespesasFixas, 
    totalDespesasVariaveis, 
    saldoMes 
  } = useMemo(() => {
    const rendas = (transactions || []).filter(t => t.type === 'income' && t.date?.startsWith(selectedMonth));
    const fixas = (transactions || []).filter(t => t.type === 'expense' && t.is_fixed && t.date?.startsWith(selectedMonth));
    const parcelas = (allParcelas || []).filter(p => p.data_parcela?.startsWith(selectedMonth));

    const totalRendas = rendas.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const totalDespesasFixas = fixas.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const totalDespesasVariaveis = parcelas.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const saldoMes = totalRendas - (totalDespesasFixas + totalDespesasVariaveis);

    return { totalRendas, totalDespesasFixas, totalDespesasVariaveis, saldoMes };
  }, [transactions, allParcelas, selectedMonth]);

  // Removido o cálculo de totalBancos, pois não é mais necessário

  // --- Lógica Dinâmica do Gráfico de Pizza ---
  const { dataForPieChart, totalGastos } = useMemo(() => {
    const categoryTotals = new Map(
      (categorias || []).map(cat => [cat.id, { ...cat, total: 0 }])
    );
    const fixasDoMes = (transactions || []).filter(
      t => t.type === 'expense' && t.is_fixed && t.date?.startsWith(selectedMonth)
    );
    for (const t of fixasDoMes) {
      if (t.categoria_id && categoryTotals.has(t.categoria_id)) {
        categoryTotals.get(t.categoria_id).total += Number(t.amount || 0);
      }
    }
    const parcelasDoMes = (allParcelas || []).filter(
      p => p.data_parcela?.startsWith(selectedMonth)
    );
    const despesaCategoryMap = new Map(
      (variableExpenses || []).map(d => [d.id, d.categoria_id])
    );
    for (const p of parcelasDoMes) {
      const categoria_id = despesaCategoryMap.get(p.despesa_id);
      if (categoria_id && categoryTotals.has(categoria_id)) {
        categoryTotals.get(categoria_id).total += Number(p.amount || 0);
      }
    }
    const data = Array.from(categoryTotals.values())
      .filter(cat => cat.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((cat, index) => ({
        name: cat.nome,
        value: cat.total,
        color: PIE_COLORS[index % PIE_COLORS.length]
      }));
    const totalCalculado = data.reduce((acc, item) => acc + item.value, 0);
    const topN = 5;
    let dataFinal = data;
    if (data.length > topN) {
      const topData = data.slice(0, topN);
      const othersValue = data.slice(topN).reduce((acc, cat) => acc + cat.value, 0);
      dataFinal = [
        ...topData,
        { 
          name: 'Outros', 
          value: othersValue, 
          color: PIE_COLORS[topN % PIE_COLORS.length] 
        }
      ];
    }
    return { 
      dataForPieChart: dataFinal, 
      totalGastos: totalCalculado > 0 ? totalCalculado : 1
    };
  }, [categorias, transactions, allParcelas, variableExpenses, selectedMonth]);


  // Formata o mês para exibição
  const displayMonth = useMemo(() => {
    if (!selectedMonth) return '';
    const [year, month] = selectedMonth.split('-');
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long' });
  }, [selectedMonth]);

  // Funções de abrir modal de Renda
  const monthlyIncomes = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(t => t.type === 'income' && t.date.startsWith(selectedMonth));
  }, [selectedMonth, transactions]);

  const handleEditIncome = (income) => showModal('novaRenda', { 
    incomeToEdit: income, 
    onSave: saveIncome 
  });
  
  const handleAddNewIncome = () => showModal('novaRenda', { 
    onSave: saveIncome 
  });
  
  
  return (
    <div className="flex-grow space-y-4 md:space-y-6">
      
      <SaldoTotalCard valor={saldoMes} mes={displayMonth} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4"> 
        
        {/* === CARD RENDA === */}
        <ResumoCard 
          type="renda" 
          valor={totalRendas} 
          onClick={() => showModal('listaRendas', { 
            incomes: monthlyIncomes, 
            onEdit: handleEditIncome,
            onAddNew: handleAddNewIncome
          })}
        />
        
        {/* === CARD DESPESAS (Variáveis) === */}
        <ResumoCard 
          type="despesa" 
          valor={totalDespesasVariaveis}
          onClick={onOpenNovaDespesa}
        />
        
        {/* === CARD DESPESAS FIXAS === */}
        <ResumoCard 
          type="fixa" 
          valor={totalDespesasFixas} 
          onClick={() => onNavigate('fixas')}
        />
        
        {/* === CARD: BANCOS / CONTAS (SEM VALOR) === */}
        <ResumoCard 
          type="bancos" 
          valor={0} // Valor irrelevante, usado apenas para satisfazer a prop.
          onClick={() => onNavigate('bancos')} 
        />
      </div>
      
      {/* 3. Seção de Gráfico e Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* Coluna Esquerda: Gastos por Categoria */}
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Gastos por Categoria</h3>
          <div className="h-48 w-full mt-4">
            {(loading || dataForPieChart.length === 0) ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                {loading ? "Calculando..." : "Sem dados de gastos para este mês."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataForPieChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataForPieChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="mt-4 space-y-2">
            {dataForPieChart.map(entry => (
              <CategoriaListItem 
                key={entry.name}
                cor={entry.color}
                nome={entry.name}
                valor={entry.value}
                percentual={(entry.value / totalGastos) * 100}
              />
            ))}
          </ul>
        </div>

        {/* Coluna Direita: Insights da IA */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 px-2"> Dicas do GEN</h3>
          {loading ? (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg h-20 animate-pulse" />
              <div className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg h-20 animate-pulse" />
            </>
          ) : insights && insights.length > 0 ? (
            insights.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))
          ) : (
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
              Nenhum insight novo para este mês.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
