import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import CartaoPersonalizado from '../components/CartaoPersonalizado';
import { ListaTransacoes } from '../components/ListaTransacoes';
import { useModal } from '../context/ModalContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { supabase } from '../supabaseClient';

const CardDetailPage = ({ banco, onBack, selectedMonth }) => {
  const { getSaldoPorBanco, fetchData, deleteDespesa, transactions, allParcelas } = useFinance();
  const { showModal, hideModal } = useModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('recentes');

  const itemsPerPage = 10;

  const despesasDoMes = useMemo(() => {
    if (!banco || !selectedMonth) return [];
    const bancoNomeLowerCase = banco.nome.toLowerCase();

    const despesasFixas = transactions.filter(t => t.metodo_pagamento?.toLowerCase() === bancoNomeLowerCase && t.is_fixed && t.date?.startsWith(selectedMonth));
    const despesasPrincipaisDoBanco = transactions.filter(t => t.metodo_pagamento?.toLowerCase() === bancoNomeLowerCase && !t.is_fixed);
    const idsDespesasVariaveis = despesasPrincipaisDoBanco.map(d => d.id);

    const parcelasVariaveis = allParcelas
      .filter(p => idsDespesasVariaveis.includes(p.despesa_id) && p.data_parcela?.startsWith(selectedMonth))
      .map(p => {
        const despesaPrincipal = despesasPrincipaisDoBanco.find(d => d.id === p.despesa_id);
        
        // ✅ CORREÇÃO AQUI: Simplifica a informação da parcela, removendo a data da compra daqui.
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
          const descriptionMatch = d.description?.toLowerCase().includes(searchTermLower);
          const idMatch = d.id.toString().includes(searchTerm);
          const parentIdMatch = d.despesa_id?.toString().includes(searchTerm);
          const valueMatch = d.amount?.toString().includes(normalizedSearchTermForValue);
          return descriptionMatch || idMatch || parentIdMatch || valueMatch;
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
  }, [banco, selectedMonth, transactions, allParcelas, searchTerm, sortOrder]);

  const totalPages = Math.ceil(despesasDoMes.length / itemsPerPage);
  const currentData = despesasDoMes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const nextPage = () => setCurrentPage((current) => Math.min(current + 1, totalPages));
  const prevPage = () => setCurrentPage((current) => Math.max(current - 1, 1));
  
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
      console.error("Erro ao salvar despesa em CardDetailPage:", error);
      throw error;
    }
  };

  const handleEditDespesa = (despesa) => {
    const despesaOriginal = transactions.find(t => t.id === despesa.despesa_id) || despesa;
    showModal('novaDespesa', { despesaParaEditar: despesaOriginal, onSave: handleSaveDespesa });
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
    <div className="p-4 md:p-6 space-y-4 flex flex-col h-full overflow-hidden"> 
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2 self-start"> 
        <ArrowLeft className="h-4 w-4" /> Voltar 
      </Button>
      <div className="flex justify-center flex-shrink-0">
        <CartaoPersonalizado banco={banco} saldo={getSaldoPorBanco(banco, selectedMonth)} isSelected={true} />
      </div>
      <Card className="flex-grow flex flex-col min-h-0">
        <CardHeader className="flex-shrink-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle>Transações de {banco.nome}</CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Buscar por nome, nº ou valor..." />
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recentes">Mais Recentes</SelectItem>
                  <SelectItem value="antigas">Mais Antigas</SelectItem>
                  <SelectItem value="a-z">Ordem A-Z</SelectItem>
                  <SelectItem value="z-a">Ordem Z-A</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => showModal('novaDespesa', { onSave: handleSaveDespesa })} className="gap-2">
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nova Despesa</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col min-h-0 p-0">
          <div className="flex-grow overflow-y-auto px-6">
            <ListaTransacoes transactions={currentData} onEdit={handleEditDespesa} onDelete={handleDeleteDespesa} />
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 pt-4 pb-4 px-6 flex-shrink-0">
              <span className="text-sm text-muted-foreground"> Página {currentPage} de {totalPages} </span>
              <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage === totalPages}>
                Próximo <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CardDetailPage;