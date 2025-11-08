// src/components/modals/NovaDespesaModal.jsx
// (Versão 4.2 - Ajuste de layout das Datas para coluna única em mobile)
// (Versão 3.1 - Adicionado scroll na lista de Categorias)
// <<< [CORRIGIDO] Força os valores de categoria a serem 'string' para consistência

import React, { useState, useEffect } from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useFinance } from '../../context/FinanceContext';
import { CircleDollarSign, PencilLine, Hash, Check } from 'lucide-react';
import { CircleDollarSign, PencilLine, Hash, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
@@ -17,33 +18,43 @@ import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

// --- Helpers e Constantes (Mantidos) ---
const METODOS_DE_PAGAMENTO = ['Itaú', 'Bradesco', 'Nubank', 'PIX'];

/* ========================= Helpers ========================= */
const getTodayLocalISO = () => {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().split('T')[0];
};

const getCurrentMonthISO = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const toFirstDay = (isoDate) => {
  const [year, month] = isoDate.split('-');
  return `${year}-${month}-01`;
};

const toMonthInput = (d) => (d ? String(d).slice(0, 7) : getCurrentMonthISO());

const isStartAfterPurchaseMonth = (mesInicioYYYYMMDD, dataCompraYYYYMMDD) => {
  if (!mesInicioYYYYMMDD || !dataCompraYYYYMMDD) return false;
  const a = new Date(`${String(mesInicioYYYYMMDD).slice(0,7)}-01T00:00:00`);
  const b = new Date(`${String(dataCompraYYYYMMDD).slice(0,7)}-01T00:00:00`);
  return a > b;
};

const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

const buildParcelas = ({ despesaId, total, n, startDateYYYYMMDD }) => {
@@ -52,7 +63,7 @@ const buildParcelas = ({ despesaId, total, n, startDateYYYYMMDD }) => {
  const partial = round2(per * (n - 1));
  const last = round2(total - partial);
  const [year, month, day] = startDateYYYYMMDD.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const start = new Date(year, month - 1, 1); 

  for (let k = 1; k <= n; k++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
@@ -73,8 +84,7 @@ const buildParcelas = ({ despesaId, total, n, startDateYYYYMMDD }) => {

const getInitialState = (despesaParaEditar = null) => {
    if (despesaParaEditar) {
      const parcelado = !!despesaParaEditar.is_parcelado ||
        (despesaParaEditar.qtd_parcelas || 1) > 1;
      const parcelado = !!despesaParaEditar.is_parcelado || (despesaParaEditar.qtd_parcelas || 1) > 1;
      return {
        amount: despesaParaEditar.amount ?? '',
        description: despesaParaEditar.description ?? '',
@@ -83,7 +93,8 @@ const getInitialState = (despesaParaEditar = null) => {
        isParcelado: parcelado,
        qtd_parcelas: parcelado ? (despesaParaEditar.qtd_parcelas ?? 2) : '',
        mes_inicio_cobranca: toMonthInput(despesaParaEditar.mes_inicio_cobranca),
        categoria_id: despesaParaEditar.categoria_id || '',
        // <<< [CORREÇÃO 1] Garante que o estado inicial seja string
        categoria_id: String(despesaParaEditar.categoria_id || ''), 
      };
    }
    return {
@@ -96,18 +107,18 @@ const getInitialState = (despesaParaEditar = null) => {
      mes_inicio_cobranca: getCurrentMonthISO(),
      categoria_id: '',
    };
};
  };

/* ====================== Componente ========================= */
export default function NovaDespesaModal({ onClose, despesaParaEditar }) {
  const { saveVariableExpense, categorias } = useFinance();
  const { saveVariableExpense, categorias } = useFinance(); 

  const [formData, setFormData] = useState(() => getInitialState(despesaParaEditar));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const isEdit = !!despesaParaEditar?.id;
  

  useEffect(() => {
    setFormData(getInitialState(despesaParaEditar));
  }, [despesaParaEditar]);
@@ -126,7 +137,9 @@ export default function NovaDespesaModal({ onClose, despesaParaEditar }) {
  };

  const handleSelectChange = (name) => (value) => {
      setFormData(p => ({ ...p, [name]: value }));
      // <<< [CORREÇÃO 2] Garante que o valor salvo no estado seja string
      setFormData(p => ({ ...p, [name]: String(value) }));
      
      if (name === 'categoria_id' && value) {
          setCategoryError('');
      }
@@ -138,7 +151,6 @@ export default function NovaDespesaModal({ onClose, despesaParaEditar }) {
    if (isSaving) return;
    setError('');

    // VALIDAÇÃO DE CATEGORIA
    if (!formData.categoria_id) {
        setCategoryError('A despesa deve ser categorizada.');
        return;
@@ -147,13 +159,19 @@ export default function NovaDespesaModal({ onClose, despesaParaEditar }) {

    try {
      setIsSaving(true);
      // ... (lógica de submit)
      // No 'dadosParaSalvar', 'categoria_id' será uma string, 
      // mas o Supabase e o Postgres convertem automaticamente para BIGINT/NUMERIC.
      // Se não converterem, mude 'categoria_id: formData.categoria_id'
      // para 'categoria_id: Number(formData.categoria_id)' abaixo.
      const is_parcelado = !!formData.isParcelado;
      const qtd_parcelas = is_parcelado ? Math.max(2, parseInt(formData.qtd_parcelas || '2', 10)) : 1;
      const mes_inicio_db = toFirstDay(formData.mes_inicio_cobranca);
      const amountNumber = round2(parseFloat(String(formData.amount).replace(',', '.')) || 0);

      if (!amountNumber || amountNumber <= 0) throw new Error('Informe um valor (amount) válido.');
      if (is_parcelado && (!qtd_parcelas || qtd_parcelas < 2)) throw new Error('Informe a quantidade de parcelas (>= 2).');
      
      const deviceId = getOrSetDeviceId();

      const dadosParaSalvar = {
@@ -165,9 +183,10 @@ export default function NovaDespesaModal({ onClose, despesaParaEditar }) {
        mes_inicio_cobranca: mes_inicio_db,
        inicia_proximo_mes: isStartAfterPurchaseMonth(mes_inicio_db, formData.data_compra),
        device_id: deviceId,
        categoria_id: formData.categoria_id, 
        categoria_id: Number(formData.categoria_id), // Converte para Número no envio
      };

      
      // ... (Resto da lógica de submit)
      let savedData;
      if (isEdit) {
        const { data, error } = await supabase.from('despesas').update(dadosParaSalvar).eq('id', despesaParaEditar.id).select().single();
@@ -197,56 +216,51 @@ export default function NovaDespesaModal({ onClose, despesaParaEditar }) {


  return (
    // Ajustado o max-width para melhor proporção em mobile
    <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg max-h-[95vh] overflow-hidden p-0"> 
      <DialogHeader className="p-4 pb-2 border-b border-slate-200 dark:border-slate-700">
        <DialogTitle className="text-xl font-bold dark:text-white flex items-center gap-2">
    <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-hidden p-0">
      <DialogHeader className="p-6 pb-4">
        <DialogTitle className="text-2xl font-bold dark:text-white flex items-center gap-2">
          {isEdit ? 'Editar Despesa' : 'Nova Despesa Variável'}
        </DialogTitle>
      </DialogHeader>

      {/* Seção de Formulário com scroll vertical */}
      <form onSubmit={handleSubmit} className="space-y-4 p-4 max-h-[85vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6 max-h-[80vh] overflow-y-auto">
        {error && <div className="p-2 text-sm bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>}

        {/* --- DETALHES DA COMPRA --- */}
        <Card className="shadow-none border-0">
          <CardHeader className="p-0 pb-2">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-lg font-semibold">Detalhes da Compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-0">

            {/* 1. Valor */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="amount" className="flex items-center gap-1">
                <CircleDollarSign size={16} /> Valor
              </Label>
              <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleInputChange} placeholder="0,00" required />
            </div>

            {/* 2. Descrição */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="description" className="flex items-center gap-1">
                <PencilLine size={16} /> Descrição
              </Label>
              <Input id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Ex: Compras no mercado" required />
            </div>

            {/* 3. CAMPO DE CATEGORIA */}
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="categoria_id" className="flex items-center gap-1">
                    <Hash size={16} /> Categoria <span className="text-red-500">*</span>
                </Label>
                <Select 
                    value={formData.categoria_id} 
                    onValueChange={handleSelectChange('categoria_id')} 
                    onValueChange={(value) => handleSelectChange('categoria_id')(value)}
                >
                    <SelectTrigger id="categoria_id" className={categoryError ? "border-red-500" : ""}>
                        <SelectValue placeholder="Selecione a Categoria" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                        {categorias.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                    <SelectContent className="max-h-[300px] overflow-y-auto"> 
                        {(categorias || []).map(cat => (
                            // <<< [CORREÇÃO 3] Garante que o valor da opção seja string
                            <SelectItem key={cat.id} value={String(cat.id)}>
                                {cat.nome}
                            </SelectItem>
                        ))}
@@ -258,15 +272,14 @@ export default function NovaDespesaModal({ onClose, despesaParaEditar }) {
          </CardContent>
        </Card>

        {/* --- PAGAMENTO E DATAS --- */}
        <Card className="shadow-none border-0">
          <CardHeader className="p-0 pb-2">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-lg font-semibold">Pagamento e Datas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            <div className="grid w-full items-center gap-1.5">
              <Label>Método de pagamento</Label>
              <RadioGroup name="metodo_pagamento" value={formData.metodo_pagamento} onValueChange={handleRadioChange('metodo_pagamento')} className="flex flex-wrap gap-2 pt-2">
              <RadioGroup name="metodo_pagamento" value={formData.metodo_pagamento} onValueChange={handleRadioChange('metodo_pagamento')} className="flex flex-wrap gap-3 pt-2">
                {METODOS_DE_PAGAMENTO.map(method => (
                  <div key={method} className="flex items-center space-x-2 border rounded-full px-3 py-1 bg-white dark:bg-slate-900">
                    <RadioGroupItem value={method} id={method} />
@@ -276,8 +289,7 @@ export default function NovaDespesaModal({ onClose, despesaParaEditar }) {
              </RadioGroup>
            </div>

            {/* CORREÇÃO APLICADA AQUI: Remover grid-cols-2 e gap-4 para empilhar em colunas */}
            <div className="space-y-4"> 
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="data_compra">Data da compra</Label>
                <Input id="data_compra" name="data_compra" type="date" value={formData.data_compra} onChange={handleInputChange} required />
@@ -288,7 +300,6 @@ export default function NovaDespesaModal({ onClose, despesaParaEditar }) {
              </div>
            </div>

            {/* Compra Parcelada */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isParcelado" className="text-base">Compra Parcelada?</Label>
@@ -298,22 +309,21 @@ export default function NovaDespesaModal({ onClose, despesaParaEditar }) {
            </div>

            {formData.isParcelado && (
              <div className="grid w-full items-center gap-1.5">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="qtd_parcelas">Quantidade de Parcelas</Label>
                <Input id="qtd_parcelas" name="qtd_parcelas" type="number" min={2} value={formData.qtd_parcelas} onChange={handleInputChange} placeholder="Ex: 12" required={formData.isParcelado} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- FOOTER / BOTÕES --- */}
        <DialogFooter className="flex justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <DialogFooter className="flex justify-end gap-3 pt-4">
          <DialogClose asChild>
            <Button type="button" variant="ghost" className="text-sm">
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSaving} className="text-sm">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : (<><Check size={18} className="mr-2" />{isEdit ? 'Salvar Alterações' : 'Adicionar Despesa'}</>)}
          </Button>
        </DialogFooter>
