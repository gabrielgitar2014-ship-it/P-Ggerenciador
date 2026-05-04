// src/context/ModalContext.jsx

import React, { createContext, useContext, useState, useMemo } from 'react';

// --- SEUS IMPORTS ---
import NovaDespesaModal from '../components/modals/NovaDespesaModal';
import NewIncomeModal from '../components/modals/NewIncomeModal';
import IncomeListModal from '../components/modals/IncomeListModal';
import NewFixedExpenseModal from '../components/modals/NewFixedExpenseModal';
import DespesasDetalhesModal from '../components/modals/DespesasDetalhesModal'; 
import TransactionDetailModal from '../components/modals/TransactionDetailModal';
import RelatorioPDFModal from '../components/RelatorioPDFModal'; 
import ParcelamentoDetalhesModal from '../components/modals/ParcelamentoDetalhesModal';

// Componentes Shadcn/ui
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Dialog, DialogContent } from '@/components/ui/dialog';

const modalMap = {
  novaDespesa: NovaDespesaModal,
  novaRenda: NewIncomeModal,
  listaRendas: IncomeListModal,
  newFixedExpense: NewFixedExpenseModal,
  despesaDetalhes: DespesasDetalhesModal,
  transactionDetail: TransactionDetailModal,
  relatorioPDF: RelatorioPDFModal,
  parcelamentoDetalhes: ParcelamentoDetalhesModal,
  alert: null,
};

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modal, setModal] = useState({ type: null, props: {} });

  const showModal = (type, props = {}) => {
    console.log(`[ModalContext] Abrindo modal: ${type}`, props); // LOG DE DEBUG
    setModal({ type, props });
  };

  const hideModal = () => {
    console.log('[ModalContext] Fechando modal');
    setModal({ type: null, props: {} });
  };

  const renderModal = () => {
    if (!modal.type) return null;

    // 1. LÓGICA DO ALERT (Mantida)
    if (modal.type === 'alert') {
      const { title, description, confirmText, cancelText, onConfirm, onCancel } = modal.props;
      return (
        <AlertDialog open={true} onOpenChange={hideModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{title || 'Você tem certeza?'}</AlertDialogTitle>
              <AlertDialogDescription>{description || 'Esta ação não pode ser desfeita.'}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { if (onCancel) onCancel(); hideModal(); }}>
                  {cancelText || 'Cancelar'}
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => { onConfirm(); }}>
                {confirmText || 'Confirmar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    const ModalComponent = modalMap[modal.type];
    if (!ModalComponent) {
      console.error(`Tipo de modal desconhecido: ${modal.type}`);
      return null;
    }

    // --- CORREÇÃO AQUI ---
    
    // CASO ESPECIAL: O 'novaDespesa' é um modal customizado (Framer Motion)
    // Ele NÃO deve ser envolvido pelo <Dialog> do Shadcn, pois já tem seu próprio backdrop.
    if (modal.type === 'novaDespesa') {
      return (
        <ModalComponent 
          isOpen={true} // Forçamos true porque se entrou aqui, é pra exibir
          onClose={hideModal} 
          {...modal.props} 
        />
      );
    }

    // CASO PADRÃO: Outros modais que precisam do container Shadcn
    // Se seus outros modais (NewIncome, etc) forem apenas conteúdo sem backdrop, mantenha o Dialog.
    // Se eles também forem customizados igual o NovaDespesa, adicione no 'if' acima.
    return (
      <Dialog open={true} onOpenChange={hideModal}>
        {/* Passamos isOpen={true} por garantia, caso o componente filho use */}
        <ModalComponent onClose={hideModal} isOpen={true} {...modal.props} /> 
      </Dialog>
    );
  };

  const value = useMemo(() => ({
    showModal, 
    hideModal, 
    currentModal: modal.type,
  }), [modal.type]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {renderModal()}
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal deve ser usado dentro de um ModalProvider');
  }
  return context;
};