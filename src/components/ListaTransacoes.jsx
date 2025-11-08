import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useModal } from '../context/ModalContext';

// ✅ ALTERAÇÃO AQUI: 'export' foi removido do início da linha
const ListaTransacoes = ({ transactions, onEdit, onDelete }) => {
  const { showModal } = useModal();

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };
  
  const handleShowDetails = (despesa) => {
    showModal('transactionDetail', { 
        transaction: despesa,
        onEdit: () => onEdit(despesa),
        onDelete: () => onDelete(despesa),
    });
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Nenhuma despesa encontrada para os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descrição</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((despesa) => (
          <TableRow 
            key={despesa.id} 
            onClick={() => handleShowDetails(despesa)}
            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <TableCell className="font-medium">
              <div>{despesa.description || despesa.descricao}</div>
              <div className="text-xs text-muted-foreground flex items-center">
                <span>{formatDate(despesa.data_compra)}</span>
                
                {despesa.parcelaInfo && (
                  <span className="ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                    {despesa.parcelaInfo}
                  </span>
                )}
              </div>
            </TableCell>
            
            <TableCell className={`text-right font-mono text-sm text-red-600`}>
              - R$ {Math.abs(despesa.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </TableCell>
            
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// ✅ ALTERAÇÃO AQUI: Adiciona a exportação padrão no final do arquivo
export default ListaTransacoes;


