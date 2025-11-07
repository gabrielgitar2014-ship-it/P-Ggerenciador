// src/tabs/FixasTab.jsx

import { useState, useMemo } from "react";
import { useFinance } from "../../context/FinanceContext";
import { useModal } from "../../context/ModalContext";
import { useVisibility } from "../../context/VisibilityContext";
import { ArrowLeft } from "lucide-react";

export default function FixasTab({ selectedMonth, onBack }) {
  const { 
    transactions, 
    fetchData, 
    saveFixedExpense, 
    deleteDespesa, 
    toggleFixedExpensePaidStatus,
    updateFixedExpenseSeries
  } = useFinance();
  const { showModal, hideModal } = useModal();
  const { valuesVisible } = useVisibility();

  const [transactionToEdit, setTransactionToEdit] = useState(null); // Estado para o modo de edição

  // --- Helpers de Formatação ---
  const formatCurrency = (value) => {
    const numberValue = Number(value);
    if (isNaN(numberValue)) return 'R$ 0,00';
    return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  // --- LÓGICA DE EDIÇÃO EM SÉRIE ---
  const handleMassEdit = async (transaction, newExpenseData, updateType) => {
    try {
      await updateFixedExpenseSeries(transaction, newExpenseData, updateType);
      
      // Feedback de sucesso
      showModal('alert', {
        title: 'Sucesso!',
        description: `As despesas ${updateType === 'future' ? 'futuras' : 'da série'} foram atualizadas.`,
        confirmText: 'OK',
        onConfirm: hideModal,
      });
    } catch (error) {
      console.error("Falha ao atualizar a série de despesas:", error);
      showModal('alert', {
        title: 'Erro de Edição',
        description: `Não foi possível atualizar a série: ${error.message}`,
        confirmText: 'OK',
        onConfirm: hideModal,
      });
    } finally {
      setTransactionToEdit(null);
    }
  };

  // --- LÓGICA DE SALVAR/EDITAR ---
  const handleSave = async (expenseData) => {
    try {
      // Nota: Não chamamos hideModal aqui; ele será chamado pelo onConfirm/onCancel dos modais de escolha,
      // ou a edição/criação será feita diretamente aqui, e o modal será fechado.

      const isEditAndRecurring = expenseData.id && expenseData.purchase_id && expenseData.is_fixed;
      
      if (isEditAndRecurring) {
        // Se for edição de item recorrente, abre o modal de escolha.
        showModal('alert', {
          title: 'Opções de Edição',
          description: `Você deseja editar apenas esta despesa de ${expenseData.date.substring(0, 7)} ou todas as futuras desta série?`,
          confirmText: 'Todas as Futuras',
          cancelText: 'Apenas Esta', 
          onConfirm: async () => {
            hideModal(); // Fecha o modal de escolha
            await handleMassEdit(expenseData, expenseData, 'future');
          },
          onCancel: async () => {
            hideModal(); // Fecha o modal de escolha
            try {
              // Opção "Apenas Esta"
              await saveFixedExpense(expenseData); 
              fetchData();
              showModal('alert', {
                title: 'Sucesso!',
                description: 'A despesa do mês foi salva com sucesso.',
                confirmText: 'OK',
                onConfirm: hideModal,
              });
            } catch (error) {
              console.error("Falha ao salvar a despesa única:", error);
              showModal('alert', {
                title: 'Erro',
                description: `Não foi possível salvar a despesa: ${error.message}`,
                confirmText: 'OK',
                onConfirm: hideModal,
              });
            }
          }
        });
      } else {
        // Inserção ou edição de item único sem série
        await saveFixedExpense(expenseData);
        fetchData();
        setTransactionToEdit(null);
        hideModal(); // Fecha o modal de despesa após salvar/inserir
        showModal('alert', {
          title: 'Sucesso!',
          description: 'Despesa fixa salva com sucesso.',
          confirmText: 'OK',
          onConfirm: hideModal,
        });
      }
    } catch (error) {
      console.error("Falha ao salvar a despesa fixa:", error);
      showModal('alert', {
        title: 'Erro',
        description: `Não foi possível salvar a despesa: ${error.message}`,
        confirmText: 'OK',
        onConfirm: hideModal,
      });
    }
  };

  // --- Funções de Abertura do Modal ---
  
  const handleOpenEditModal = (transaction) => {
    // 1. Configura a transação a ser editada
    setTransactionToEdit(transaction); 
    // 2. Abre o modal de formulário, passando a transação e o handler de salvar
    showModal('newFixedExpense', { transactionToEdit: transaction, onSave: handleSave }); 
  };
  
  const handleOpenNewModal = () => {
    // 1. Reseta o estado de edição
    setTransactionToEdit(null);
    // 2. Abre o modal de formulário para criação
    showModal('newFixedExpense', { onSave: handleSave });
  };

  // --- LÓGICA DE EXCLUSÃO ---
  const handleDelete = (expense) => {
    
    const isRecurring = expense.is_fixed && expense.purchase_id;

    const confirmDeleteSingle = async () => {
        try {
            await deleteDespesa(expense, 'single'); 
            showModal('alert', {
                title: 'Excluído!',
                description: 'A despesa única foi deletada.',
                confirmText: 'OK',
                onConfirm: hideModal,
            });
        } catch (error) {
            console.error("Falha ao deletar a despesa única:", error);
            showModal('alert', {
                title: 'Erro de Exclusão',
                description: `Não foi possível deletar a despesa. Verifique as RLS do Supabase. Erro: ${error.message}`,
                confirmText: 'OK',
                onConfirm: hideModal,
            });
        }
    };

    if (isRecurring) {
      // Modal de escolha de exclusão (Série ou Única)
      showModal('alert', {
        title: 'Confirmar Exclusão',
        description: `Esta despesa faz parte de uma série. Você deseja excluir apenas a despesa de ${expense.date.substring(0, 7)} ou toda a série?`,
        confirmText: 'Toda a Série',
        cancelText: 'Apenas Esta', 
        onConfirm: async () => {
          // Opção "Toda a Série"
          try {
            await deleteDespesa(expense, 'all'); 
            showModal('alert', {
              title: 'Excluído!',
              description: 'A série de despesas fixas foi deletada.',
              confirmText: 'OK',
              onConfirm: hideModal,
            });
          } catch (error) {
             console.error("Falha ao deletar a série:", error);
             showModal('alert', {
                title: 'Erro de Exclusão',
                description: `Não foi possível deletar a série. Erro: ${error.message}`,
                confirmText: 'OK',
                onConfirm: hideModal,
            });
          }
        },
        onCancel: confirmDeleteSingle 
      });
    } else {
        // Exclusão de despesa fixa sem série (única)
        showModal('alert', {
          title: 'Confirmar Exclusão',
          description: `Você tem certeza que deseja excluir a despesa "${expense.description}"?`,
          confirmText: 'Sim, Excluir',
          onConfirm: confirmDeleteSingle
        });
    }
  };

  // --- Lógica de Detalhes (Abre o modal de detalhes) ---
  const handleShowDetails = (expense) => {
    showModal('transactionDetail', {
      transaction: expense,
      onEdit: () => {
        hideModal(); // Fecha o modal de detalhes
        handleOpenEditModal(expense); // Abre o modal de Edição
      },
      onDelete: () => {
        hideModal(); // Fecha o modal de detalhes
        handleDelete(expense); // Abre o modal de escolha/confirmação
      }
    });
  };

  // --- Lógica de Toggle de Pagamento ---
  const handleTogglePaidStatus = async (expense) => {
    try {
      await toggleFixedExpensePaidStatus(expense.id, !expense.paid);
    } catch (error) {
      alert(`Não foi possível alterar o status de pagamento: ${error.message}`);
      fetchData();
    }
  };
  
  // --- Filtro por Mês ---
  const monthlyFixedExpenses = useMemo(() => {
    return transactions.filter(
      (t) => t.is_fixed && t.type === 'expense' && t.date?.startsWith(selectedMonth)
    );
  }, [transactions, selectedMonth]);

  // --- Renderização ---
  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in-down">
      
      {/* Botão Voltar e Título */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-slate-700/50 transition-colors"
            aria-label="Voltar para o painel"
          >
            <ArrowLeft className="w-6 h-6 dark:text-white" />
          </button>
          <h1 className="text-2xl font-bold dark:text-white">Despesas Fixas</h1>
        </div>
        
        {/* Botão Adicionar (Chama a função que abre o modal) */}
        <button
          onClick={handleOpenNewModal}
          className="py-2 px-4 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          + Adicionar
        </button>
      </div>

      <div className="space-y-3">
        {monthlyFixedExpenses.length === 0 ? (
          <div className="p-5 rounded-2xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-full border border-white/40 dark:border-slate-700/60">
            Nenhuma despesa fixa registrada para este mês.
          </div>
        ) : (
          monthlyFixedExpenses.map((expense) => (
            <div key={expense.id} className="
              flex justify-between items-center p-4 rounded-xl
              bg-white/30 dark:bg-slate-800/30 
              backdrop-blur-md
              border border-white/40 dark:border-slate-700/60
            ">
              {/* Área clicável para detalhes */}
              <div onClick={() => handleShowDetails(expense)} className="text-left flex-1 min-w-0 cursor-pointer">
                <p className={`text-slate-800 dark:text-slate-100 truncate ${expense.paid ? "line-through text-slate-500 dark:text-slate-400" : ""}`}>{expense.description}</p>
                <p className="font-semibold text-red-600 dark:text-red-400 block">
                  {valuesVisible ? formatCurrency(expense.amount) : 'R$ ••••'}
                </p>
              </div>
              
              {/* Botão de Status */}
              <button 
                onClick={() => handleTogglePaidStatus(expense)} 
                className={`ml-4 py-1 px-4 text-sm font-semibold text-white rounded-full transition-colors 
                  ${expense.paid 
                    ? "bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600" 
                    : "bg-gradient-to-br from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600"
                  }`
                }
              >
                {expense.paid ? 'PAGO' : 'PENDENTE'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}