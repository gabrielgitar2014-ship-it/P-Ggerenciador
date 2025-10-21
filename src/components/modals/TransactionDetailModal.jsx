import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, X, Calendar, CreditCard, DollarSign, ListChecks } from 'lucide-react';
import ParcelamentoDetalhesModal from './ParcelamentoDetalhesModal'; // ✅ 1. Importa o novo modal

// Funções auxiliares
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
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
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <span className="font-medium text-sm text-slate-800 dark:text-slate-200 text-right">{value}</span>
    </div>
  );
}

export default function TransactionDetailModal({ isOpen, onClose, transaction, onEdit, onDelete }) {
  // ✅ 2. Adiciona um estado para controlar o modal de parcelamento
  const [showParcelasModal, setShowParcelasModal] = useState(false);

  if (!isOpen || !transaction) return null;

  const dataVencimento = transaction.date || transaction.data_parcela || transaction.data_compra;
  const subDescricao = transaction.parcelaInfo || '';
  const isIncome = transaction.type === 'income';

  // Verifica se a transação é parcelada para mostrar o botão
  const isParcelada = transaction.is_parcelado || (transaction.qtd_parcelas && transaction.qtd_parcelas > 1);

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in" 
        onClick={onClose} 
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-2xl animate-slide-up">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col overflow-hidden">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white truncate" title={transaction.description}>
                {transaction.description || "Detalhes da Transação"}
              </h2>
              {subDescricao && (
                <p className="text-sm text-slate-500 dark:text-slate-400">{subDescricao}</p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Conteúdo */}
          <div className="p-6 space-y-2">
            <DetailRow
              icon={DollarSign}
              label={isIncome ? "Valor Recebido" : "Valor:"}
              value={formatCurrency(transaction.amount)}
            />
            <DetailRow
              icon={Calendar}
              label="Data de Vencimento:"
              value={formatDate(dataVencimento)}
            />
            <DetailRow
              icon={CreditCard}
              label="Método:"
              value={transaction.metodo_pagamento || 'N/A'}
            />
            {/* ✅ 3. Adiciona o botão para ver parcelas, se aplicável */}
            {isParcelada && (
              <div className="pt-2">
                <Button variant="outline" onClick={() => setShowParcelasModal(true)} className="w-full gap-2">
                  <ListChecks className="h-4 w-4" />
                  Ver Detalhes do Parcelamento
                </Button>
              </div>
            )}
          </div>

          {/* Rodapé com Botões */}
          <div className="flex items-center justify-end gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
            <Button variant="destructive" onClick={() => onDelete(transaction)} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
            <Button onClick={() => onEdit(transaction)} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>
      </div>

      {/* ✅ 4. Renderiza o modal de detalhes do parcelamento quando o estado for 'true' */}
      <ParcelamentoDetalhesModal
        open={showParcelasModal}
        onClose={() => setShowParcelasModal(false)}
        despesa={transaction}
      />
    </>
  );
}