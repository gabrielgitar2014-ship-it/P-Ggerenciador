import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { getElementAtEvent } from 'react-chartjs-2';

// Imports de data, ícones e componentes da UI
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Wallet, Tag, Filter, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Importações e registro do Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);


// Funções auxiliares
const valueFormatter = (number) => `R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(number || 0)}`;
const useChartColors = (count) => {
    return useMemo(() => {
        const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899', '#6366F1', '#14B8A6', '#F97316'];
        return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
    }, [count]);
};


export default function CategoriasPage({ onBack, onNavigate }) {
    // --- ESTADOS ---
    const [allData, setAllData] = useState([]); 
    const [filteredData, setFilteredData] = useState([]);
    const [kpiData, setKpiData] = useState({ total: 0, topCategory: 'N/A', categoryCount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [selectedCategories, setSelectedCategories] = useState(new Set());

    const doughnutChartRef = useRef();
    const barChartRef = useRef();

    // --- LÓGICA ---
    useEffect(() => {
        const fetchDataForPeriod = async () => {
            if (!dateRange?.from || !dateRange?.to) return;
            setIsLoading(true);
            const startDate = format(dateRange.from, 'yyyy-MM-dd');
            const endDate = format(dateRange.to, 'yyyy-MM-dd');
            const { data, error } = await supabase.from('parcelas').select(`amount, despesas (category)`).gte('data_parcela', startDate).lte('data_parcela', endDate);
            if (error) { console.error("Erro ao buscar dados do período:", error); setIsLoading(false); return; }
            const aggregatedData = data.reduce((acc, current) => {
                if (current && typeof current.amount === 'number') {
                    const categoryName = current.despesas?.category || 'Sem Categoria';
                    acc[categoryName] = (acc[categoryName] || 0) + current.amount;
                }
                return acc;
            }, {});
            const formattedData = Object.entries(aggregatedData).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
            setAllData(formattedData);
            setIsLoading(false);
        };
        fetchDataForPeriod();
    }, [dateRange]);

    const availableCategories = useMemo(() => {
        const categorySet = new Set(allData.map(item => item.name));
        return Array.from(categorySet).sort();
    }, [allData]);

    useEffect(() => {
        setSelectedCategories(new Set(availableCategories));
    }, [availableCategories]);

    useEffect(() => {
        const dataToProcess = allData.filter(item => selectedCategories.has(item.name));
        setFilteredData(dataToProcess);
        if (dataToProcess.length > 0) {
            const total = dataToProcess.reduce((sum, item) => sum + item.value, 0);
            setKpiData({ total, topCategory: dataToProcess[0].name, categoryCount: dataToProcess.length });
        } else {
            setKpiData({ total: 0, topCategory: 'N/A', categoryCount: 0 });
        }
    }, [allData, selectedCategories]);

    const handleSetPeriod = (period) => {
        const today = new Date();
        if (period === 'day') setDateRange({ from: startOfDay(today), to: endOfDay(today) });
        if (period === 'week') setDateRange({ from: startOfWeek(today), to: endOfWeek(today) });
        if (period === 'month') setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
    };
    
    const handleChartClick = (event, chartRef) => {
        if (!chartRef.current) return;
        const element = getElementAtEvent(chartRef.current, event);
        if (element.length > 0) {
            const elementIndex = element[0].index;
            const clickedCategory = filteredData[elementIndex].name;
            onNavigate('categoryDetail', { categoryName: clickedCategory, dateRange: dateRange });
        }
    };

    const handleQuickCategoryFilter = (category) => {
      if (category === 'all') {
        setSelectedCategories(new Set(availableCategories));
      } else {
        setSelectedCategories(new Set([category]));
      }
    };

    // --- CONFIGURAÇÃO DOS GRÁFICOS (COMPLETA E CORRIGIDA) ---
    const chartColors = useChartColors(filteredData.length);
    const doughnutChartData = {
        labels: filteredData.map(d => d.name),
        datasets: [{
            label: 'Gasto por Categoria',
            data: filteredData.map(d => d.value),
            backgroundColor: chartColors,
            borderColor: '#1f2937',
            borderWidth: 2,
            hoverOffset: 8
        }]
    };
    const doughnutOptions = {
        responsive: true, maintainAspectRatio: false, cutout: '60%',
        plugins: {
            legend: { position: 'bottom', labels: { color: '#cbd5e1' } },
            title: { display: true, text: 'Distribuição de Gastos', color: '#f1f5f9', font: { size: 16 } }
        }
    };
    const barChartData = {
        labels: filteredData.map(d => d.name),
        datasets: [{
            label: `Gastos`,
            data: filteredData.map(d => d.value),
            backgroundColor: chartColors,
            borderRadius: 4
        }]
    };
    const barOptions = {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Comparativo por Categoria', color: '#f1f5f9', font: { size: 16 } }
        }
    };

    // --- RENDERIZAÇÃO ---
    return (
        <div className="p-4 space-y-6 animate-fade-in-down dark text-slate-50 bg-slate-900">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Button onClick={onBack} variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:bg-slate-800 hover:text-slate-100 flex-shrink-0"><ArrowLeft className="h-6 w-6" /></Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100">Análise de Categorias</h1>
                        <p className="text-slate-400">Filtre seus gastos por período e categoria.</p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center sm:justify-end gap-2">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => handleSetPeriod('day')}>Hoje</Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => handleSetPeriod('week')}>Semana</Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => handleSetPeriod('month')}>Mês</Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button variant={"outline"} className="w-full justify-start text-left font-normal sm:w-[240px]"><CalendarIcon className="mr-2 h-4 w-4" />
                                  {dateRange?.from ? (dateRange.to ? (`${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}`) : format(dateRange.from, "dd/MM/yy")) : (<span>Selecione</span>)}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                              <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={1} className="sm:hidden" />
                              <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} className="hidden sm:block" />
                          </PopoverContent>
                      </Popover>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="flex items-center gap-2">
                                  <Filter className="h-4 w-4" /> <span className="hidden sm:inline">Categorias</span> ({selectedCategories.size})
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 text-slate-200">
                              <DropdownMenuLabel>Exibir Categorias</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-slate-700" />
                              {availableCategories.map(category => (
                                  <DropdownMenuCheckboxItem
                                      key={category}
                                      checked={selectedCategories.has(category)}
                                      onCheckedChange={() => {
                                          const newSet = new Set(selectedCategories);
                                          newSet.has(category) ? newSet.delete(category) : newSet.add(category);
                                          setSelectedCategories(newSet);
                                      }}
                                  >
                                      {category}
                                  </DropdownMenuCheckboxItem>
                              ))}
                          </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 gap-4"><Skeleton className="h-28 rounded-xl bg-slate-800" /><Skeleton className="h-28 rounded-xl bg-slate-800" /><Skeleton className="h-28 rounded-xl bg-slate-800" /></div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-slate-800/50 border-slate-700"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-slate-300">Total Gasto</CardTitle><Wallet className="h-4 w-4 text-slate-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-400">{valueFormatter(kpiData.total)}</div></CardContent></Card>
                        <Card className="bg-slate-800/50 border-slate-700"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-slate-300">Principal Categoria</CardTitle><TrendingUp className="h-4 w-4 text-slate-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-indigo-400">{kpiData.topCategory}</div></CardContent></Card>
                        <Card className="bg-slate-800/50 border-slate-700"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-slate-300">Categorias com Gastos</CardTitle><Tag className="h-4 w-4 text-slate-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-amber-400">{kpiData.categoryCount}</div></CardContent></Card>
                    </div>

                    <div className="pt-4">
                        <h3 className="text-sm font-semibold text-slate-400 mb-2">Filtros Rápidos</h3>
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant={selectedCategories.size === availableCategories.length ? 'default' : 'secondary'} onClick={() => handleQuickCategoryFilter('all')}>Exibir Todas</Button>
                            <Button size="sm" variant={selectedCategories.has('Alimentação') && selectedCategories.size === 1 ? 'default' : 'secondary'} onClick={() => handleQuickCategoryFilter('Alimentação')}>Alimentação</Button>
                            <Button size="sm" variant={selectedCategories.has('Moradia') && selectedCategories.size === 1 ? 'default' : 'secondary'} onClick={() => handleQuickCategoryFilter('Moradia')}>Moradia</Button>
                            <Button size="sm" variant={selectedCategories.has('Transporte') && selectedCategories.size === 1 ? 'default' : 'secondary'} onClick={() => handleQuickCategoryFilter('Transporte')}>Transporte</Button>
                            <Button size="sm" variant={selectedCategories.has('Outros') && selectedCategories.size === 1 ? 'default' : 'secondary'} onClick={() => handleQuickCategoryFilter('Outros')}>Outros</Button>
                        </div>
                    </div>
                </>
            )}

            {filteredData.length === 0 && !isLoading && (
                <div className="text-center py-10 bg-slate-800/30 rounded-xl">
                    <p className="text-slate-400">Nenhum dado de gasto encontrado para este período ou filtros selecionados.</p>
                </div>
            )}

            {filteredData.length > 0 && !isLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4 h-80 relative">
                            <Doughnut ref={doughnutChartRef} data={doughnutChartData} options={doughnutOptions} onClick={(event) => handleChartClick(event, doughnutChartRef)} />
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-3 bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4 h-80 relative">
                            <Bar ref={barChartRef} data={barChartData} options={barOptions} onClick={(event) => handleChartClick(event, barChartRef)} />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
