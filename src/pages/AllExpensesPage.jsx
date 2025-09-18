import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useModal } from '../context/ModalContext';
import ListaTransacoes from '../components/ListaTransacoes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ChevronLeft, ChevronRight, WalletCards } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { supabase } from '../supabaseClient';

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

// Lista fixa de métodos de pagamento, conforme solicitado.
const paymentMethods = ['Bradesco', 'Nubank', 'Itau', 'PIX'];

const AllExpensesPage = ({ onBack, selectedMonth }) => {
  const { fetchData, deleteDespesa, transactions, allParcelas } = useFinance();
  const { showModal } = useModal();
  
  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('recentes');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('todos');

  // Novo estado para controlar qual painel de filtro é exibido
  const [activeFilterUI, setActiveFilterUI] = useState(null); // null, 'periodo', ou 'metodo'

  // Estado da paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  const despesasFiltradas = useMemo(() => {
    // ... (A lógica interna de filtragem e ordenação continua a mesma da versão anterior)
    if (!selectedMonth) return [];
    const despesasFixas = transactions.filter(t => t.is_fixed && t.type === 'expense' && t.date?.startsWith(selectedMonth));
    const despesasPrincipais = transactions.filter(t => !t.is_fixed);
    const idsDespesasVariaveis = despesasPrincipais.map(d => d.id);
    const parcelasVariaveis = allParcelas.filter(p => idsDespesasVariaveis.includes(p.despesa_id) && p.data_parcela?.startsWith(selectedMonth)).map(p => {
        const despesaPrincipal = despesasPrincipais.find(d => d.id === p.despesa_id);
        const parcelaInfo = despesaPrincipal ? `Parcela ${p.numero_parcela}/${despesaPrincipal.qtd_parcelas}` : '';
        return { ...despesaPrincipal, ...p, id: p.id, parcelaInfo };
    });
    let todasAsDespesas = [...despesasFixas, ...parcelasVariaveis];
    let filtered = todasAsDespesas.filter(d => {
        if (!searchTerm) return true;
        const searchTermLower = searchTerm.toLowerCase();
        const normalizedSearchTermForValue = searchTerm.replace(',', '.');
        return (d.description?.toLowerCase().includes(searchTermLower) || d.metodo_pagamento?.toLowerCase().includes(searchTermLower) || d.amount?.toString().includes(normalizedSearchTermForValue));
    }).filter(d => {
        if (paymentMethod === 'todos') return true;
        return d.metodo_pagamento === paymentMethod;
    }).filter(d => {
        const itemDate = new Date(d.data_compra || d.date);
        if (startDate && itemDate < new Date(startDate)) return false;
        if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            if (itemDate > endOfDay) return false;
        }
        return true;
    });
    const sorted = [...filtered].sort((a, b) => {
        const dateA = new Date(a.data_compra || a.date);
        const dateB = new Date(b.data_compra || b.date);
        const descA = a.description?.toLowerCase() || '';
        const descB = b.description?.toLowerCase() || '';
        switch (sortOrder) {
            case 'antigas': return dateA - dateB;
            case 'a-z': return descA.localeCompare(descB);
            case 'z-a': return descB.localeCompare(descA);
            default: return dateB - dateA;
        }
    });
    setCurrentPage(1); 
    return sorted;
  }, [selectedMonth, transactions, allParcelas, searchTerm, sortOrder, startDate, endDate, paymentMethod]);
  
  const handleSortOrFilterChange = (value) => {
    if (['recentes', 'antigas', 'a-z', 'z-a'].includes(value)) {
      setSortOrder(value);
      setActiveFilterUI(null); // Fecha qualquer painel de filtro aberto
    } else if (value === 'filtrar-periodo') {
      setActiveFilterUI('periodo');
    } else if (value === 'filtrar-metodo') {
      setActiveFilterUI('metodo');
    }
  };

  const totalDespesasValor = useMemo(() => despesasFiltradas.reduce((sum, d) => sum + d.amount, 0), [despesasFiltradas]);
  const totalPages = Math.ceil(despesasFiltradas.length / itemsPerPage);
  const currentData = despesasFiltradas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const nextPage = () => setCurrentPage((c) => Math.min(c + 1, totalPages));
  const prevPage = () => setCurrentPage((c) => Math.max(c - 1, 1));
  const handleSaveDespesa = async (dadosDaDespesa) => { /* ... sem alterações ... */ };
  const handleEditDespesa = (despesa) => { /* ... sem alterações ... */ };
  const handleDeleteDespesa = (despesa) => { /* ... sem alterações ... */ };

  return (
    <div className="flex flex-col h-full space-y-4"> 
      <div className="flex items-center gap-3 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack}> 
          <ArrowLeft className="h-5 w-5" /> 
        </Button>
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Despesas do Mês</h1>
        </div>
      </div>
      
      <div className="flex-shrink-0">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Buscar por descrição..." />
      </div>
      
      <Card className="flex-grow flex flex-col min-h-0">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <WalletCards className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Resultado ({despesasFiltradas.length})</CardTitle>
                <CardDescription className="mt-1">
                  Total filtrado: {formatCurrency(totalDespesasValor)}
                </CardDescription>
              </div>
            </div>
            {/* SELETOR PRINCIPAL ATUALIZADO */}
            <Select onValueChange={handleSortOrFilterChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Ordenar ou Filtrar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recentes">Ordenar: Mais Recentes</SelectItem>
                <SelectItem value="antigas">Ordenar: Mais Antigas</SelectItem>
                <SelectItem value="a-z">Ordenar: A-Z</SelectItem>
                <SelectItem value="z-a">Ordenar: Z-A</SelectItem>
                <SelectItem value="filtrar-periodo">Filtrar por Período</SelectItem>
                <SelectItem value="filtrar-metodo">Filtrar por Método</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col min-h-0 p-0">
          <div className="flex-grow overflow-y-auto p-2 md:p-4">
            <ListaTransacoes transactions={currentData} onEdit={handleEditDespesa} onDelete={handleDeleteDespesa} />
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 p-4 border-t flex-shrink-0">
              <span className="text-sm text-muted-foreground"> Página {currentPage} de {totalPages} </span>
              <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /> Anterior</Button>
              <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage === totalPages}>Próximo <ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PAINÉIS DE FILTRO QUE APARECEM DE FORMA CONDICIONAL */}
      {activeFilterUI === 'periodo' && (
        <Card className="flex-shrink-0 animate-fade-in-down">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">Filtrar por Período</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-auto flex-grow"/>
              <span className="font-bold">até</span>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-auto flex-grow"/>
            </div>
            <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => { setStartDate(''); setEndDate(''); }}>Limpar</Button>
                <Button onClick={() => setActiveFilterUI(null)}>Fechar</Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {activeFilterUI === 'metodo' && (
        <Card className="flex-shrink-0 animate-fade-in-down">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">Filtrar por Método de Pagamento</h3>
            <Select onValueChange={(value) => { setPaymentMethod(value); setActiveFilterUI(null); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um método..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Métodos</SelectItem>
                {paymentMethods.map(method => <SelectItem key={method} value={method}>{method}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AllExpensesPage;
