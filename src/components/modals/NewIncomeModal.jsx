// src/components/modals/NewIncomeModal.jsx

import { useState, useEffect } from "react";
import { DialogContent } from "@/components/ui/dialog"; // Adicionada a importação
// A importação do 'supabase' não é mais necessária neste arquivo.

// Removida a prop 'isOpen'
export default function NewIncomeModal({ onClose, onSave, incomeToEdit }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Apenas verifica incomeToEdit, pois o modal só é montado se está aberto
    if (incomeToEdit) {
      setDescription(incomeToEdit.description);
      setAmount(incomeToEdit.amount);
      setDate(incomeToEdit.date);
    } else {
      // Reseta os campos para uma nova entrada
      setDescription("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [incomeToEdit]); // Removida a dependência 'isOpen'

  const handleSave = async () => {
    if (!description || !amount || parseFloat(amount) <= 0) {
      alert("Por favor, preencha a descrição e um valor válido.");
      return;
    }

    setIsSaving(true);

    const transactionData = {
      description,
      amount: parseFloat(amount),
      date,
    };

    if (incomeToEdit) {
      transactionData.id = incomeToEdit.id;
    }

    try {
      await onSave(transactionData);
      onClose(); // Fecha o modal após o sucesso
    } catch (err) {
      console.error("Erro retornado ao modal:", err);
      alert("Não foi possível salvar a renda. Verifique o console para mais detalhes.");
    } finally {
      setIsSaving(false);
    }
  };

  // Envolvemos o conteúdo com o DialogContent do shadcn/ui.
  // Ele adiciona os estilos corretos de modal/dialog.
  return (
    <DialogContent className="sm:max-w-lg p-0"> 
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
          <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">
            {incomeToEdit ? "Editar Renda" : "Nova Renda"}
          </h2>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Valor da Renda (R$)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="py-2 px-4 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="py-2 px-4 bg-blue-600 text-white rounded-md disabled:bg-blue-400 hover:bg-blue-700 transition-colors"
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
    </DialogContent>
  );
}
