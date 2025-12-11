import React from 'react';
// <<< REMOVIDO: Imports de Tabela
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, CalendarDays, ShoppingCart } from 'lucide-react'; // Adicionei ícones
import { useModal } from '../context/ModalContext';

// >>> ADICIONADO: Helper para formatar a data do grupo (Hoje, Ontem, etc.)
const formatGroupDate = (dateString) => {
  const date = new Date(dateString + 'T00:00:00'); // Trata a data no fuso local
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const options = { day: 'numeric', month: 'long' };

  if (date.toDateString() === today.toDateString()) {
    return `Hoje, ${date.toLocaleDateString('pt-BR', options)}`;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `Ontem, ${date.toLocaleDateString('pt-BR', options)}`;
  }
  
  // Formato completo para dias mais antigos
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
};

// Helper antigo, ainda útil para as datas internas
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
};

// >>> ALTERADO: Prop agora é `despesasAgrupadas`
const ListaTransacoes = ({ despesasAgrupadas, onEdit, onDelete }) => {
  const { showModal } = useModal();

  const handleShowDetails = (despesa) => {
    showModal('transactionDetail', { 
        transaction: despesa,
        onEdit: () => onEdit(despesa),
        onDelete: () => onDelete(despesa),
    });
  };

  // >>> ALTERADO: Verifica as chaves do objeto
  const dateKeys = Object.keys(despesasAgrupadas);

  if (!dateKeys || dateKeys.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Nenhuma despesa encontrada para os filtros selecionados.</p>
      </div>
    );
  }

  // >>> ALTERADO: Estrutura de Lista (substitui <Table>)
  return (
    <div className="space-y-6"> {/* Container principal da lista */}
      {dateKeys.map((dateString) => (
        <section key={dateString} className="space-y-3">
          {/* Cabeçalho do Grupo de Data */}
          <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 sticky top-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm py-2 z-10">
            {formatGroupDate(dateString)}
          </h3>
          
          {/* Lista de Transações para essa Data */}
          <div className="space-y-2">
            {despesasAgrupadas[dateString].map((despesa) => (
              <div 
                key={despesa.id} 
                onClick={() => handleShowDetails(despesa)}
                className="flex items-center p-3 bg-white/70 dark:bg-slate-800/70 rounded-lg shadow-sm cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                {/* Ícone (Placeholder) - Como na imagem de exemplo */}
                <div className="mr-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-full">
                  {/* TODO: Adicionar lógica de ícone por categoria */}
                  <ShoppingCart className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </div>
                
                {/* Informações da Despesa */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{despesa.description || despesa.descricao}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    {/* Informação de Categoria (se tiver) ou Parcela */}
                    {despesa.parcelaInfo ? (
                      <span className="font-medium">{despesa.parcelaInfo}</span>
                    ) : (
                      <span className="capitalize">{despesa.category || 'Geral'}</span>
                    )}
                    
                    <span className="hidden sm:inline">|</span>
                    
                    {/* Informação de Data (Simplificada) */}
                    <div className="flex items-center gap-1">
                       <CalendarDays className="h-3 w-3" />
                       Venc: {formatDate(despesa.date)}
                    </div>
                  </div>
                </div>

                {/* Valor e Ações */}
                <div className="flex items-center gap-1 ml-3">
                  <span className={`text-right font-mono text-sm font-semibold ${despesa.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {despesa.amount > 0 ? '+' : '-'} R$ {Math.abs(despesa.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(despesa); }} className="gap-2">
                        <Edit className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(despesa); }} className="gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ListaTransacoes;