// src/context/ModalContext.jsx

import React, { createContext, useContext, useState, useMemo } from 'react';

// Importe AQUI todos os modais que sua aplicação usará
// ATENÇÃO: Os paths devem estar corretos em sua estrutura de pastas
import NovaDespesaModal from '../components/modals/NovaDespesaModal';
import NewIncomeModal from '../components/modals/NewIncomeModal';
import IncomeListModal from '../components/modals/IncomeListModal';
import NewFixedExpenseModal from '../components/modals/NewFixedExpenseModal';
// DespesasDetalhesModal pode ser o modal de despesa variável detalhada
import DespesasDetalhesModal from '../components/modals/DespesasDetalhesModal'; 
import TransactionDetailModal from '../components/modals/TransactionDetailModal';
import RelatorioPDFModal from '../components/RelatorioPDFModal'; 
// Importe o modal de detalhes do parcelamento, se existir (foi referenciado)
import ParcelamentoDetalhesModal from '../components/modals/ParcelamentoDetalhesModal';


// Componentes Shadcn/ui para modais
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Dialog } from '@/components/ui/dialog';

// Mapeamento dos tipos de modais para os componentes
const modalMap = {
  novaDespesa: NovaDespesaModal,
  novaRenda: NewIncomeModal,
  listaRendas: IncomeListModal,
  newFixedExpense: NewFixedExpenseModal,
  despesaDetalhes: DespesasDetalhesModal,
  transactionDetail: TransactionDetailModal,
  relatorioPDF: RelatorioPDFModal,
  parcelamentoDetalhes: ParcelamentoDetalhesModal, // Adicionado
  alert: null, // O tipo 'alert' é renderizado separadamente
};

const ModalContext = createContext();

export function ModalProvider({ children }) {
  // Estado que armazena o tipo do modal e as props a serem passadas
  const [modal, setModal] = useState({ type: null, props: {} });

  // Função para abrir um modal
  const showModal = (type, props = {}) => {
    setModal({ type, props });
  };

  // Função para fechar o modal
  const hideModal = () => {
    setModal({ type: null, props: {} });
  };

  // Função que decide qual modal renderizar com base no estado
  const renderModal = () => {
    if (!modal.type) return null;

    // --- LÓGICA DO ALERT DIALOG (CORRIGIDA) ---
    if (modal.type === 'alert') {
      const { title, description, confirmText, cancelText, onConfirm, onCancel } = modal.props;
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
              {/* CORREÇÃO CRUCIAL: O AlertDialogCancel agora verifica se onCancel foi fornecido */}
              <AlertDialogCancel 
                  onClick={() => {
                      if (onCancel) {
                          // Se uma função onCancel foi passada (ex: exclusão "Apenas Esta"), execute-a
                          onCancel(); 
                      } 
                      // O onOpenChange do AlertDialog cuida de fechar, mas é bom garantir o fluxo
                      // Se onCancel for executado, ele deve também fechar o modal ou acionar um novo fluxo.
                      // Se não houver onCancel, feche o modal diretamente:
                      if (!onCancel) {
                         hideModal();
                      }
                  }}
              >
                  {cancelText || 'Cancelar'}
              </AlertDialogCancel>
              
              <AlertDialogAction onClick={() => {
                  onConfirm();
                  // O onConfirm geralmente fecha o modal como parte de sua lógica,
                  // mas garantimos que a função seja chamada.
                  // Se a ação de confirmação não fechar o modal, hideModal pode ser chamado aqui:
                  // hideModal(); 
              }}>
                {confirmText || 'Confirmar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    // --- LÓGICA PARA OUTROS MODAIS (Dialogs) ---
    const ModalComponent = modalMap[modal.type];
    if (!ModalComponent) {
      console.error(`Tipo de modal desconhecido: ${modal.type}`);
      return null;
    }
    
    // Todos os modais que usam Dialog devem receber 'onClose' para fechar a si mesmos
    return (
      <Dialog open={true} onOpenChange={hideModal}>
        {/* Usamos o 'asChild' nos componentes filhos para que o DialogContent englobe o ModalComponent.
            Porém, é mais comum o ModalComponent ser o DialogContent, então passamos o onClose.
            No seu projeto, se o componente ModalComponent for o DialogContent, o código abaixo funciona:
        */}
        <ModalComponent {...modal.props} onClose={hideModal} /> 
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

// Hook de conveniência
export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal deve ser usado dentro de um ModalProvider');
  }
  return context;
};