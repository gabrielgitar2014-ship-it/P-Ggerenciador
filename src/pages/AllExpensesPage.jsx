import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useModal } from '../context/ModalContext';
import  ListaTransacoes  from '../components/ListaTransacoes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ChevronLeft, ChevronRight, WalletCards } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { supabase } from '../supabaseClient';

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const AllExpensesPage = ({ onBack, selectedMonth }) => {
  const { fetchData, deleteDespesa, transactions, allParcelas } = useFinance();
  const { showModal, hideModal } = useModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('recentes');

  const itemsPerPage = 15;

  const despesasDoMes = useMemo(() => {
    if (!selectedMonth) return [];

    const despesasFixas = transactions.filter(t => t.is_fixed && t.type === 'expense' && t.date?.startsWith(selectedMonth));
    const despesasPrincipais = transactions.filter(t => !t.is_fixed);
    const idsDespesasVariaveis = despesasPrincipais.map(d => d.id);
    
    const parcelasVariaveis = allParcelas
      .filter(p => idsDespesasVariaveis.includes(p.despesa_id) && p.data_parcela?.startsWith(selectedMonth))
      .map(p => {
        const despesaPrincipal = despesasPrincipais.find(d => d.id === p.despesa_id);
        
        // ✅ CORREÇÃO AQUI: Simplifica a informação da parcela.
        const parcelaInfo = despesaPrincipal ? `Parcela ${p.numero_parcela}/${despesaPrincipal.qtd_parcelas}` : '';
        
        return {
          ...despesaPrincipal,
          ...p,
          id: p.id,
          parcelaInfo: parcelaInfo,
        };
      });

    const todasAsDespesas = [...despesasFixas, ...parcelasVariaveis];
    
    const filtered = searchTerm
      ? todasAsDespesas.filter(d => {
          const searchTermLower = searchTerm.toLowerCase();
          const normalizedSearchTermForValue = searchTerm.replace(',', '.');
          return (
            d.description?.toLowerCase().includes(searchTermLower) ||
            d.id.toString().includes(searchTerm) ||
            d.despesa_id?.toString().includes(searchTerm) ||
            d.amount?.toString().includes(normalizedSearchTermForValue)
          );
        })
      : todasAsDespesas;
    
    const sorted = [...filtered].sort((a, b) => {
      // ✅ CORREÇÃO AQUI: Ordena sempre pela data da compra.
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
  }, [selectedMonth, transactions, allParcelas, searchTerm, sortOrder]);

  const totalDespesasValor = useMemo(() => {
    return despesasDoMes.reduce((sum, despesa) => sum + despesa.amount, 0);
  }, [despesasDoMes]);

  const totalPages = Math.ceil(despesasDoMes.length / itemsPerPage);
  const currentData = despesasDoMes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const nextPage = () => setCurrentPage((c) => Math.min(c + 1, totalPages));
  const prevPage = () => setCurrentPage((c) => Math.max(c - 1, 1));
  
  const handleSaveDespesa = async (dadosDaDespesa) => {
    try {
      let savedData;
      if (dadosDaDespesa.id) {
        const { data, error } = await supabase.from('despesas').update(dadosDaDespesa).eq('id', dadosDaDespesa.id).select().single();
        if (error) throw error;
        savedData = data;
      } else {
        const { data, error } = await supabase.from('despesas').insert(dadosDaDespesa).select().single();
        if (error) throw error;
        savedData = data;
      }
      fetchData();
      return savedData;
    } catch (error) {
      console.error("Erro ao salvar despesa em AllExpensesPage:", error);
      throw error;
    }
  };

  const handleEditDespesa = (despesa) => {
    if (despesa.is_fixed) {
      showModal('newFixedExpense', { transactionToEdit: despesa, onSave: handleSaveDespesa });
    } else {
      const despesaOriginal = transactions.find(t => t.id === despesa.despesa_id) || despesa;
      showModal('novaDespesa', { despesaParaEditar: despesaOriginal, onSave: handleSaveDespesa });
    }
  };

  const handleDeleteDespesa = (despesa) => {
    const despesaOriginal = transactions.find(t => t.id === despesa.despesa_id) || despesa;
    showModal('confirmation', {
      title: 'Confirmar Exclusão',
      description: `Tem certeza que deseja excluir a despesa "${despesaOriginal.description}"?`,
      onConfirm: async () => { await deleteDespesa(despesaOriginal); fetchData(); }
    });
  };

  return (
    <div className="flex flex-col h-full"> 
      <Card className="flex-grow flex flex-col min-h-0">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0"> 
                <ArrowLeft className="h-5 w-5" /> 
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <WalletCards className="h-3 w-3" />
                  Despesas do Mês
                </CardTitle>
                <CardDescription className="mt-1">
                  {formatCurrency(totalDespesasValor)} em {despesasDoMes.length} transações
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Buscar despesa..." />
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recentes">Mais Recentes</SelectItem>
                  <SelectItem value="antigas">Mais Antigas</SelectItem>
                  <SelectItem value="a-z">Ordem A-Z</SelectItem>
                  <SelectItem value="z-a">Ordem Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
    </div>
  );
};


export default AllExpensesPage;
