import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DialogContent, DialogHeader, DialogTitle, DialogClose 
} from '@/components/ui/dialog';
import { 
  Edit, Trash2, X, Calendar, CreditCard, DollarSign, ListChecks, Tag
} from 'lucide-react';
import ParcelamentoDetalhesModal from './ParcelamentoDetalhesModal'; 

// Funções auxiliares
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  // Assumindo que a data vem no formato 'YYYY-MM-DD'
  return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
};

const formatCurrency = (value) => {
  const numberValue = Number(value);
  if (isNaN(numberValue)) return 'R$ 0,00';
  return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Componente para um item de detalhe
function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <span className="font-medium text-sm text-slate-800 dark:text-slate-200 text-right">{value}</span>
    </div>
  );
}

// O ModalContext.jsx irá encapsular este conteúdo no Dialog
export default function TransactionDetailModal({ onClose, transaction, onEdit, onDelete }) {
  // A prop 'isOpen' foi removida, pois o ModalContext gerencia o estado aberto
  const [showParcelasModal, setShowParcelasModal] = useState(false);
  
  if (!transaction) return <DialogClose onClick={onClose} />;
  
  // Lógica para detectar se é parcelada (mantida a original)
  const isParcelada = transaction.parcela_total_parcelas > 1 || transaction.is_parcelado;
  
  return (
    <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
      
      {/* Header */}
      <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-700">
        <DialogTitle className="text-xl font-semibold">Detalhes da Despesa</DialogTitle>
        <DialogClose onClick={onClose} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </DialogClose>
      </DialogHeader>

      {/* Corpo com Detalhes */}
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{transaction.description}</h3>
        
        {/* Detalhes da Transação */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-2">
            
            <DetailRow
              icon={DollarSign}
              label="Valor:"
              value={formatCurrency(transaction.amount)}
            />
            <DetailRow
              icon={Tag}
              label="Categoria:"
              // Assumindo que a categoria está em 'category' ou 'categoria_nome'
              value={transaction.category || transaction.categoria_nome || 'Não Categorizado'}
            />
            <DetailRow
              icon={Calendar}
              label="Data:"
              value={formatDate(transaction.date || transaction.data_compra)}
            />
            <DetailRow
              icon={CreditCard}
              label="Método:"
              value={transaction.metodo_pagamento || 'N/A'}
            />
            
            {/* Adiciona o botão para ver parcelas, se aplicável */}
            {isParcelada && (
              <div className="pt-2">
                <Button variant="outline" onClick={() => setShowParcelasModal(true)} className="w-full gap-2">
                  <ListChecks className="h-4 w-4" />
                  Ver Detalhes do Parcelamento
                </Button>
              </div>
            )}
        </div>
      </div>

      {/* Rodapé com Botões de Ação */}
      <div className="flex items-center justify-end gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
        {/* Chamam as funções que foram pré-configuradas em FixasTab.jsx */}
        <Button variant="destructive" onClick={onDelete} className="gap-2">
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
        <Button onClick={onEdit} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Edit className="h-4 w-4" />
          Editar
        </Button>
      </div>
      
      {/* Renderiza o modal de detalhes do parcelamento quando o estado for 'true' */}
      <ParcelamentoDetalhesModal
        open={showParcelasModal}
        onClose={() => setShowParcelasModal(false)}
        transaction={transaction}
      />
    </DialogContent>
  );
}