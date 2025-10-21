// src/context/ModalContext.jsx

import React, { createContext, useContext, useState } from 'react';

// Importe AQUI todos os modais que sua aplicação usará
import NovaDespesaModal from '../components/modals/NovaDespesaModal';
import NewIncomeModal from '../components/modals/NewIncomeModal';
import IncomeListModal from '../components/modals/IncomeListModal';
import NewFixedExpenseModal from '../components/modals/NewFixedExpenseModal';
import DespesasDetalhesModal from '../components/modals/DespesasDetalhesModal';
import TransactionDetailModal from '../components/modals/TransactionDetailModal';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';


const modalMap = {
  novaDespesa: NovaDespesaModal,
  novaRenda: NewIncomeModal,
  listaRendas: IncomeListModal,
  newFixedExpense: NewFixedExpenseModal,
  despesaDetalhes: DespesasDetalhesModal,
  transactionDetail: TransactionDetailModal,
};

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modal, setModal] = useState({ type: null, props: {} });

  const showModal = (type, props = {}) => setModal({ type, props });
  const hideModal = () => setModal({ type: null, props: {} });

  const renderModal = () => {
    // --- LÓGICA DO MODAL DE CONFIRMAÇÃO ---
    // Este bloco agora renderiza o AlertDialog quando o tipo é 'confirmation'
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
              {/* ESTA É A LINHA MAIS IMPORTANTE: onClick executa a função onConfirm */}
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
    
    return <ModalComponent isOpen={true} onClose={hideModal} {...modal.props} />;
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {renderModal()}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);