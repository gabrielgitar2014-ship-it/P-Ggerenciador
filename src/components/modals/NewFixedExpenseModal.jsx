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

  const isEditMode = !!transactionToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        const [year, month] = transactionToEdit.date.split("-");
        setDescription(transactionToEdit.description);
        setAmount(transactionToEdit.amount);
        setDueDate(transactionToEdit.due_date);
        setBank(transactionToEdit.metodo_pagamento);
        setStartDate(`${year}-${month}`);
        setIsRecurring(false);
      } else {
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
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
      const [year, month] = startDate.split("-");
      const day = String(dueDate).padStart(2, "0");
      onSave({
        id: transactionToEdit.id,
        description,
        amount: parseFloat(amount),
        date: `${year}-${month}-${day}`,
        metodo_pagamento: bank,
        due_date: parseInt(dueDate, 10),
      });
    } else {
      let recurrence;
      if (!isRecurring) recurrence = { type: "single", installments: 1 };
      else if (hasEnd) recurrence = { type: "fixed", installments };
      else recurrence = { type: "infinite", installments: null };

      onSave({
        description,
        amount: parseFloat(amount),
        bank,
        dueDate,
        startDate,
        recurrence,
      });
    }
  };

  if (!isOpen) return null;

  const inputBase =
    "mt-1 block w-full p-2 rounded-md border border-neutral-300 dark:border-neutral-700 " +
    "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 " +
    "placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-black/40 dark:bg-black/70 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl
                      bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800
                      text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-2xl font-semibold">
            {isEditMode ? "Editar Despesa Fixa" : "Nova Despesa Fixa"}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Descrição
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputBase}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputBase}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Dia do Vencimento
                </label>
                <input
                  type="number"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="Ex: 10"
                  min="1"
                  max="31"
                  className={inputBase}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Mês de Início
              </label>
              <input
                type="month"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputBase}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Banco / Método
              </label>
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className={inputBase}
              >
                <option>Nubank</option>
                <option>Itaú</option>
                <option>Bradesco</option>
                <option>Pix</option>
              </select>
            </div>

            {!isEditMode && (
              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-3">
                <div className="flex items-center">
                  <input
                    id="recurring-checkbox"
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600"
                  />
                  <label
                    htmlFor="recurring-checkbox"
                    className="ml-2 block text-sm font-medium text-neutral-700 dark:text-neutral-200"
                  >
                    Esta é uma despesa recorrente
                  </label>
                </div>

                {isRecurring && (
                  <div className="pl-6 space-y-3">
                    <div className="flex items-center">
                      <input
                        id="has-end-checkbox"
                        type="checkbox"
                        checked={hasEnd}
                        onChange={(e) => setHasEnd(e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600"
                      />
                      <label
                        htmlFor="has-end-checkbox"
                        className="ml-2 block text-sm text-neutral-700 dark:text-neutral-200"
                      >
                        A recorrência tem uma data de fim
                      </label>
                    </div>

                    {hasEnd ? (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                          Duração em meses
                        </label>
                        <input
                          type="number"
                          value={installments}
                          onChange={(e) => setInstallments(parseInt(e.target.value, 10))}
                          min="2"
                          className={inputBase}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 p-2 rounded-md">
                        Esta despesa será criada por tempo indeterminado.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-md border border-neutral-300 dark:border-neutral-700
                       bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100
                       hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="py-2 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
