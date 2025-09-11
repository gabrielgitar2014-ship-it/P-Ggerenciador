import { useState, useEffect } from "react";

export default function NewFixedExpenseModal({ isOpen, onClose, onSave, transactionToEdit }) {
  const [startDate, setStartDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [bank, setBank] = useState("Nubank");
  const [isRecurring, setIsRecurring] = useState(false);
  const [hasEnd, setHasEnd] = useState(true);
  const [installments, setInstallments] = useState(12);

  // --- NOVO: Define se o modal está em modo de edição ---
  const isEditMode = !!transactionToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        // MODO DE EDIÇÃO: Preenche os campos com os dados da transação
        const [year, month] = transactionToEdit.date.split('-');
        setDescription(transactionToEdit.description);
        setAmount(transactionToEdit.amount);
        setDueDate(transactionToEdit.due_date);
        setBank(transactionToEdit.metodo_pagamento);
        setStartDate(`${year}-${month}`);
        // Desativa a seção de recorrência no modo de edição
        setIsRecurring(false);
      } else {
        // MODO DE CRIAÇÃO: Reseta os campos para o padrão
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        setStartDate(currentMonth);
        setDescription("");
        setAmount("");
        setDueDate("");
        setBank("Nubank");
        setIsRecurring(false);
        setHasEnd(true);
        setInstallments(12);
      }
    }
  }, [isOpen, transactionToEdit, isEditMode]);

  const handleSave = () => {
    if (!description || !amount || !dueDate || !bank || !startDate) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    
    if (isEditMode) {
        // Em modo de edição, envia um objeto simples para atualização
        const [year, month] = startDate.split('-');
        const day = String(dueDate).padStart(2, '0');
        onSave({
            id: transactionToEdit.id,
            description,
            amount: parseFloat(amount),
            date: `${year}-${month}-${day}`,
            metodo_pagamento: bank,
            due_date: parseInt(dueDate, 10),
        });
    } else {
        // Em modo de criação, envia o objeto com a lógica de recorrência
        let recurrence;
        if (!isRecurring) recurrence = { type: 'single', installments: 1 };
        else if (hasEnd) recurrence = { type: 'fixed', installments: installments };
        else recurrence = { type: 'infinite', installments: null };
        
        onSave({
            description,
            amount: parseFloat(amount),
            bank,
            dueDate,
            startDate,
            recurrence: recurrence,
        });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-transparent z-40 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Título dinâmico */}
        <h2 className="text-2xl font-bold mb-4">{isEditMode ? "Editar Despesa Fixa" : "Nova Despesa Fixa"}</h2>
        
        <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-4">
              {/* Campos do formulário (sem alteração) */}
              <div>
                <label className="block text-sm font-medium">Descrição</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full p-2 border rounded-md"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Valor (R$)</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full p-2 border rounded-md"/>
                </div>
                <div>
                  <label className="block text-sm font-medium">Dia do Vencimento</label>
                  <input type="number" value={dueDate} onChange={(e) => setDueDate(e.target.value)} placeholder="Ex: 10" min="1" max="31" className="mt-1 block w-full p-2 border rounded-md"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Mês de Início</label>
                <input type="month" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full p-2 border rounded-md"/>
              </div>
              <div>
                <label className="block text-sm font-medium">Banco / Método</label>
                <select value={bank} onChange={(e) => setBank(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
                  <option>Nubank</option>
                  <option>Itaú</option>
                  <option>Bradesco</option>
                  <option>Pix</option>
                </select>
              </div>

              {/* A seção de recorrência fica desativada no modo de edição */}
              {!isEditMode && (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center">
                    <input id="recurring-checkbox" type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                    <label htmlFor="recurring-checkbox" className="ml-2 block text-sm font-medium">Esta é uma despesa recorrente</label>
                  </div>
                  {isRecurring && (
                    <div className="pl-6 animate-fade-in space-y-3">
                      <div className="flex items-center">
                        <input id="has-end-checkbox" type="checkbox" checked={hasEnd} onChange={(e) => setHasEnd(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                        <label htmlFor="has-end-checkbox" className="ml-2 block text-sm text-gray-900">A recorrência tem uma data de fim</label>
                      </div>
                      {hasEnd ? (
                        <div>
                          <label className="block text-sm font-medium">Duração em meses</label>
                          <input type="number" value={installments} onChange={(e) => setInstallments(parseInt(e.target.value, 10))} min="2" className="mt-1 block w-full p-2 border rounded-md"/>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 bg-gray-100 p-2 rounded-md">Esta despesa será criada por tempo indeterminado.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>

        <div className="mt-6 flex justify-end gap-4 border-t pt-4">
          <button onClick={onClose} className="py-2 px-4 bg-gray-200 rounded-md">Cancelar</button>
          <button onClick={handleSave} className="py-2 px-4 bg-blue-600 text-white rounded-md">Salvar</button>
        </div>
      </div>
    </div>
  );
}