// src/components/modals/NewIncomeModal.jsx

import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

export default function NewIncomeModal({ isOpen, onClose, onSave, incomeToEdit }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (incomeToEdit) {
        setDescription(incomeToEdit.description);
        setAmount(incomeToEdit.amount);
        setDate(incomeToEdit.date);
      } else {
        setDescription("");
        setAmount("");
        setDate(new Date().toISOString().split("T")[0]);
      }
    }
  }, [incomeToEdit, isOpen]);

  const handleSave = async () => {
    if (!description || !amount || amount <= 0) {
      alert("Por favor, preencha a descrição e o valor.");
      return;
    }

    setIsSaving(true);

    const transactionData = {
      description,
      amount: parseFloat(amount),
      date,
      type: "income",
    };

    try {
      if (incomeToEdit) {
        const { error } = await supabase.from('transactions').update(transactionData).eq('id', incomeToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('transactions').insert([transactionData]);
        if (error) throw error;
      }
      
      onSave(transactionData);
    } catch (err) {
      console.error("Erro ao salvar renda:", err);
      alert("Não foi possível salvar a renda.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-transparent z-40 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">
          {incomeToEdit ? "Editar Renda" : "Nova Renda"}
        </h2>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Valor da Renda (R$)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="py-2 px-4 bg-blue-600 text-white rounded-md disabled:bg-blue-400"
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}