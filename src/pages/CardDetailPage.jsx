import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useVisibility } from '../context/VisibilityContext';
import CartaoPersonalizado from '../components/CartaoPersonalizado';
import ListaTransacoes from '../components/ListaTransacoes';
import { useModal } from '../context/ModalContext'; // Já estava sendo usado
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// <<< [ALTERAÇÃO] Imports de PDF removidos. Apenas o 'Printer' é necessário.
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
// import jsPDF from 'jspdf'; // REMOVIDO
// import autoTable from 'jspdf-autotable'; // REMOVIDO
// --- Fim da Alteração

import SearchBar from '../components/SearchBar';
import { supabase } from '../supabaseClient';
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from 'framer-motion';

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const CardDetailPage = ({ banco, onBack, onNavigate, selectedMonth }) => {
  const { getSaldoPorBanco, fetchData, deleteDespesa, transactions, variableExpenses, allParcelas } = useFinance();
  const { showModal } = useModal(); // <--- 'showModal' já está disponível
  const { valuesVisible } = useVisibility();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('recentes');
  const [mostrarApenasParcelados, setMostrarApenasParcelados] = useState(false);

  const itemsPerPage = 10;

  // Lógica do useMemo (corrigida, sem duplicação)
  const despesasDoMes = useMemo(() => {
    if (!banco || !selectedMonth) return [];
    const bancoNomeLowerCase = banco.nome.toLowerCase();

    // 1. Pega despesas fixas
    const despesasFixas = transactions.filter(t => 
        t.metodo_pagamento?.toLowerCase() === bancoNomeLowerCase && 
        t.is_fixed && 
        t.date?.startsWith(selectedMonth)
    );

    // 2. Pega despesas variáveis principais (para mapear)
    const despesasPrincipaisDoBanco = variableExpenses.filter(t => 
        t.metodo_pagamento?.toLowerCase() === bancoNomeLowerCase
    );
    const idsDespesasVariaveis = despesasPrincipaisDoBanco.map(d => d.id);

    // 3. Filtra as parcelas (única fonte de variáveis)
    const parcelasVariaveis = allParcelas
      .filter(p => idsDespesasVariaveis.includes(p.despesa_id) && p.data_parcela?.startsWith(selectedMonth))
      .map(p => {
        const despesaPrincipal = despesasPrincipaisDoBanco.find(d => d.id === p.despesa_id);
        const parcelaInfo = despesaPrincipal ? `Parcela ${p.numero_parcela}/${despesaPrincipal.qtd_parcelas}` : '';
        return { 
            ...despesaPrincipal,
            ...p,
            id: p.id,
            date: p.data_parcela,
            parcelaInfo: parcelaInfo,
            category: despesaPrincipal?.category || 'N/A' // <<< [BÔNUS] Adicionei a categoria
        };
      });

    // 5. Junta tudo (APENAS Fixas e Parceladas)
    const todasAsDespesas = [...despesasFixas.map(f => ({...f, category: f.category || 'Fixa'})), ...parcelasVariaveis];
    
    // Lógica de filtro e ordenação
    const filtradoPorParcelamento = mostrarApenasParcelados ? todasAsDespesas.filter(d => d.is_parcelado === true) : todasAsDespesas;
    
    const filtered = searchTerm ? filtradoPorParcelamento.filter(d => {
          const searchTermLower = searchTerm.toLowerCase();
          const normalizedSearchTermForValue = searchTerm.replace(',', '.');
          return (d.description?.toLowerCase().includes(searchTermLower) || d.id.toString().includes(searchTerm) || d.despesa_id?.toString().includes(searchTerm) || d.amount?.toString().includes(normalizedSearchTermForValue));
        }) : filtradoPorParcelamento;
        
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.date || a.data_compra);
      const dateB = new Date(b.date || b.data_compra);
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
  }, [banco, selectedMonth, transactions, variableExpenses, allParcelas, searchTerm, sortOrder, mostrarApenasParcelados]);


  const totalDespesasValor = useMemo(() => {
    return (despesasDoMes || []).reduce((sum, despesa) => sum + (despesa.amount || 0), 0);
  }, [despesasDoMes]);

  const totalPages = Math.ceil((despesasDoMes?.length || 0) / itemsPerPage);
  const currentData = despesasDoMes ? despesasDoMes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];

  const nextPage = () => setCurrentPage((current) => Math.min(current + 1, totalPages));
  const prevPage = () => setCurrentPage((current) => Math.max(current - 1, 1));
  
  const handleEditDespesa = (despesa) => {
    const despesaOriginal = transactions.find(t => t.id === despesa.despesa_id) || 
                           variableExpenses.find(v => v.id === despesa.despesa_id) || 
                           despesa;
    onNavigate('editarDespesa', despesaOriginal);
  };
  
  const handleDeleteDespesa = (despesa) => {
    const despesaOriginal = transactions.find(t => !t.is_fixed && t.id === despesa.despesa_id) ||
                           variableExpenses.find(v => v.id === despesa.despesa_id) || 
                           despesa;
    showModal('confirmation', {
      title: 'Confirmar Exclusão',
      description: `Tem certeza que deseja excluir a despesa "${despesaOriginal.description}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => { 
        await deleteDespesa(despesaOriginal); 
        fetchData(); 
      }
    });
  };

  const cardTitle = mostrarApenasParcelados ? `Parcelas de ${banco.nome}` : `Transações de ${banco.nome}`;
  const transactionLabel = mostrarApenasParcelados ? ((despesasDoMes?.length || 0) === 1 ? 'parcela' : 'parcelas') : ((despesasDoMes?.length || 0) === 1 ? 'transação' : 'transações');

  // <<< [ALTERAÇÃO] Função 'handlePrintPDF' removida daqui
  
  // <<< [NOVO] Esta função chama o modal
  const handleOpenPdfModal = () => {
    showModal('relatorioPDF', {
      despesas: despesasDoMes, // Passa a lista COMPLETA de despesas
      defaultTitle: `${cardTitle} - ${selectedMonth}`, // Passa o título padrão
      totalValor: totalDespesasValor // Passa o valor total
    });
  };
  // --- Fim da [NOVO]

  return (
    <motion.div
      className="p-4 md:p-6 space-y-4 flex flex-col h-full overflow-hidden"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
    > 
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2 self-start text-slate-800 dark:text-slate-100 hover:bg-slate-500/10"> 
        <ArrowLeft className="h-4 w-4" /> Voltar 
      </Button>
      
      <div className="flex justify-center flex-shrink-0">
        <CartaoPersonalizado banco={banco} saldo={getSaldoPorBanco(banco, selectedMonth)} isSelected={true} />
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-4 pt-4">
        <div className="w-full md:flex-1">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Buscar em transações..." />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="parcelados" 
            checked={mostrarApenasParcelados} 
            onCheckedChange={setMostrarApenasParcelados}
            className="border-slate-500"
          />
          <label htmlFor="parcelados" className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Mostrar apenas parcelados
          </label>
        </div>
      </div>
      
      <Card className="flex-grow flex flex-col min-h-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border-white/50 dark:border-slate-700/60">
        <CardHeader className="flex-shrink-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-slate-800 dark:text-slate-100">{cardTitle}</CardTitle>
              <CardDescription className="mt-1 text-slate-700 dark:text-slate-300">
                {valuesVisible ? formatCurrency(totalDespesasValor) : 'R$ ••••'} em {despesasDoMes?.length || 0} {transactionLabel}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
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
              
              {/* <<< [ALTERAÇÃO] Botão de Impressão agora chama o modal */}
              <Button onClick={handleOpenPdfModal} variant="outline" size="icon" className="shrink-0">
                <Printer className="h-4 w-4" />
                <span className="sr-only">Imprimir PDF</span>
              </Button>
              {/* --- Fim da Alteração --- */}

              <Button onClick={() => onNavigate('novaDespesa')} className="gap-2">
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nova Despesa</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col min-h-0 p-0">
          <div className="flex-grow overflow-y-auto px-6">
            <ListaTransacoes
              transactions={currentData}
              onEdit={handleEditDespesa}
              onDelete={handleDeleteDespesa}
              listVariants={listContainerVariants}
            />
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 pt-4 pb-4 px-6 flex-shrink-0">
              <span className="text-sm text-slate-600 dark:text-slate-400"> Página {currentPage} de {totalPages} </span>
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
    </motion.div>
  );
};

export default CardDetailPage;
