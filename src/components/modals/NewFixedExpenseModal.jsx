// src/components/modals/NewFixedExpenseModal.jsx
// (Versão FINAL com scroll na lista de categorias)

import { useState, useEffect } from "react";
import { useFinance } from "../../context/FinanceContext";
import { supabase } from '../../supabaseClient';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
    DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose 
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Hash, CircleDollarSign, PencilLine, Check } from 'lucide-react';

// --- Helpers de Formatação e Data (Assumidos) ---
const getCurrentMonthISO = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};
const getTodayLocalISO = () => {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().split('T')[0];
};
const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
// --- Fim Helpers ---


// O componente agora espera ser o conteúdo (DialogContent)
export default function NewFixedExpenseModal({ onClose, onSave, transactionToEdit }) {
  const { categorias } = useFinance();
  
  const isEditMode = !!transactionToEdit; 
  
  // --- Funções Auxiliares (Simplificadas do original) ---
  const initialData = { /* ... */ };
  const toFirstDay = (ym) => (ym && ym.length === 7 ? `${ym}-01` : ym);

  // --- Estados do Formulário ---
  const [startDate, setStartDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [bank, setBank] = useState("Nubank");
  const [isRecurring, setIsRecurring] = useState(false);
  const [hasEnd, setHasEnd] = useState(true);
  const [installments, setInstallments] = useState(12);
  const [categoriaId, setCategoriaId] = useState(""); 
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // --- Efeito de Inicialização / Edição ---
  useEffect(() => {
    // Lógica de Novo Item (Placeholder)
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    
    if (isEditMode && transactionToEdit) {
        // Lógica de Edição 
        const dateParts = transactionToEdit.date.split("-");
        const year = dateParts[0];
        const month = dateParts[1];
        setDescription(transactionToEdit.description || "");
        setAmount(transactionToEdit.amount || "");
        setDueDate(transactionToEdit.due_date || "");
        setBank(transactionToEdit.metodo_pagamento || "Nubank");
        setStartDate(`${year}-${month}`);
        setIsRecurring(!!transactionToEdit.isRecurring);
        setCategoriaId(transactionToEdit.categoria_id || "");
        setInstallments(transactionToEdit.installments || 12); 
    } else {
        // Lógica de Novo Item
        setStartDate(currentMonth);
        setDescription("");
        setAmount("");
        setDueDate("");
        setBank("Nubank");
        setIsRecurring(false);
        setHasEnd(true);
        setInstallments(12);
        setCategoriaId("");
    }
  }, [isEditMode, transactionToEdit]);

  // --- Handler de Salvamento ---
  const handleSave = () => {
    if (isSaving) return;
    setError("");
    
    if (!description || !amount || !dueDate || !bank || !startDate) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    if (!categoriaId) {
      setError("A despesa deve ser categorizada.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      let recurrence;
      if (!isRecurring) recurrence = { type: "single", installments: 1 };
      else if (hasEnd) recurrence = { type: "fixed", installments };
      else recurrence = { type: "infinite", installments: null };
      
      const payload = {
        description,
        amount: parseFloat(amount),
        bank,
        dueDate: parseInt(dueDate, 10),
        startDate,
        recurrence,
        categoria_id: categoriaId,
        
        ...(isEditMode && { id: transactionToEdit.id, purchase_id: transactionToEdit.purchase_id })
      };

      onSave(payload);
      
    } catch (e) {
      console.error("Erro ao preparar payload:", e);
      setError("Erro interno ao preparar dados.");
    } finally {
        setIsSaving(false); 
    }
  };

  const inputBase =
    "mt-1 block w-full p-2 rounded-md border border-neutral-300 dark:border-neutral-700 " +
    "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 " +
    "placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  // Retornamos o DialogContent para ser injetado
  return (
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden p-0">
      <DialogHeader className="p-6 pb-4">
        <DialogTitle className="text-2xl font-semibold">
          {isEditMode ? "Editar Despesa Fixa" : "Nova Despesa Fixa"}
        </DialogTitle>
      </DialogHeader>

      <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
        <div className="space-y-4">
          
          {error && (
            <p className="p-2 text-sm text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-300 rounded-md">
              {error}
            </p>
          )}

          {/* Cartão de Detalhes */}
          <Card className="shadow-none border-0">
            <CardContent className="space-y-4 pt-4">
              
              {/* Descrição */}
              <div>
                <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  <PencilLine size={16} className="inline mr-1" /> Descrição
                </Label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputBase}
                />
              </div>

              {/* Categoria */}
              <div>
                <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-1">
                  <Hash size={16} className="inline mr-1" /> Categoria <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={categoriaId}
                  onValueChange={setCategoriaId}
                >
                  <SelectTrigger className={inputBase + (categoriaId ? "" : " border-red-500")}>
                    <SelectValue placeholder="Selecione a Categoria" />
                  </SelectTrigger>
                  {/* CORREÇÃO APLICADA AQUI: Adicionado max-h-[300px] overflow-y-auto */}
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {categorias.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Valor e Vencimento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    <CircleDollarSign size={16} className="inline mr-1" /> Valor (R$)
                  </Label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={inputBase}
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    Dia do Vencimento
                  </Label>
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

              {/* Mês de Início */}
              <div>
                <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Mês de Início
                </Label>
                <input
                  type="month"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputBase}
                />
              </div>

              {/* Banco / Método */}
              <div>
                <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Banco / Método
                </Label>
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
            </CardContent>
          </Card>
          
          {/* Recorrência */}
          {!isEditMode && (
            <Card className="shadow-none border-0 mt-4">
              <CardHeader>
                <CardTitle>Recorrência</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Lógica de Recorrência (mantida) */}
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
                        <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                          Duração em meses
                        </Label>
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <DialogFooter className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </DialogClose>
        <Button 
          type="button" 
          onClick={handleSave} 
          disabled={isSaving || !description || !amount || !dueDate || !categoriaId}
          className="py-2 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          {isSaving ? 'Salvando...' : (<><Check size={18} className="mr-2" />{isEditMode ? 'Salvar Alterações' : 'Adicionar Despesa'}</>)}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}