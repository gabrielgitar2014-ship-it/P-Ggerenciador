// src/context/ModalContext.jsx

import React, { createContext, useContext, useState } from 'react';

// Importe AQUI todos os modais que sua aplicação usará
import NovaDespesaModal from '../components/modals/NovaDespesaModal';
import NewIncomeModal from '../components/modals/NewIncomeModal';
import IncomeListModal from '../components/modals/IncomeListModal';
import NewFixedExpenseModal from '../components/modals/NewFixedExpenseModal';
import DespesasDetalhesModal from '../components/modals/DespesasDetalhesModal';
import TransactionDetailModal from '../components/modals/TransactionDetailModal';
import RelatorioPDFModal from '../components/RelatorioPDFModal'; 
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// <<< [NOVO] 1. Importe o 'Dialog' de shadcn/ui
import { Dialog } from '@/components/ui/dialog';
// --- Fim da Alteração

const modalMap = {
  novaDespesa: NovaDespesaModal,
  novaRenda: NewIncomeModal,
  listaRendas: IncomeListModal,
  newFixedExpense: NewFixedExpenseModal,
  despesaDetalhes: DespesasDetalhesModal,
  transactionDetail: TransactionDetailModal,
  relatorioPDF: RelatorioPDFModal,
};

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modal, setModal] = useState({ type: null, props: {} });

  const showModal = (type, props = {}) => setModal({ type, props });
  const hideModal = () => setModal({ type: null, props: {} });

  const renderModal = () => {
    // --- LÓGICA DO MODAL DE CONFIRMAÇÃO (Permanece igual) ---
    if (modal.type === 'confirmation') {
      const { title, description, confirmText, onConfirm } = modal.props;
      return (
        <AlertDialog open={true} onOpenChange={hideModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{title || 'Você tem certeza?'}</AlertDialogTitle>
              <AlertDialogDescription>
                {description || 'Esta ação não pode ser desfeita.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={hideModal}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm}>
                {confirmText || 'Confirmar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    // --- LÓGICA PARA OUTROS MODAIS ---
    const ModalComponent = modalMap[modal.type];
    if (!ModalComponent) return null;
    
    // <<< CORREÇÃO: Passando a função hideModal para a prop onClose >>>
    return (
      <Dialog open={true} onOpenChange={hideModal}>
        <ModalComponent {...modal.props} onClose={hideModal} /> 
      </Dialog>
    );
    // --- Fim da Correção
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {renderModal()}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);
