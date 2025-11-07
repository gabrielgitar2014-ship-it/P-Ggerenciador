// src/components/modals/NovaDespesaModal.jsx
// (Versão 4.1 - Refatoração Mobile-First e Correção de Build/Imports)

import React, { useState, useEffect } from 'react'; // Usando React e hooks
import { supabase } from '../../supabaseClient';
import { useFinance } from '../../context/FinanceContext';

// --- Importações UI e Ícones ---
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { CircleDollarSign, PencilLine, Hash, Check } from 'lucide-react';

// --- Helpers e Constantes ---
import { getOrSetDeviceId } from '../../utils/deviceId';

const METODOS_DE_PAGAMENTO = ['Itaú', 'Bradesco', 'Nubank', 'PIX'];

/* ========================= Helpers (Mantidos) ========================= */
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
  const parcelas = [];
  const per = round2(total / n);
  const partial = round2(per * (n - 1));
  const last = round2(total - partial);
  const [year, month, day] = startDateYYYYMMDD.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  
  for (let k = 1; k <= n; k++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    d.setMonth(d.getMonth() + (k - 1));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = '01';
    parcelas.push({
      despesa_id: despesaId,
      numero_parcela: k,
      amount: k < n ? per : last,
      data_parcela: `${yyyy}-${mm}-${dd}`,
      paga: false,
    });
  }
  return parcelas;
};

const getInitialState = (despesaParaEditar = null) => {
    if (despesaParaEditar) {
      const parcelado = !!despesaParaEditar.is_parcelado ||
        (despesaParaEditar.qtd_parcelas || 1) > 1;
      return {
        amount: despesaParaEditar.amount ?? '',
        description: despesaParaEditar.description ?? '',
        metodo_pagamento: despesaParaEditar.metodo_pagamento ?? METODOS_DE_PAGAMENTO[0],
        data_compra: despesaParaEditar.data_compra ?? getTodayLocalISO(),
        isParcelado: parcelado,
        qtd_parcelas: parcelado ? (despesaParaEditar.qtd_parcelas ?? 2) : '',
        mes_inicio_cobranca: toMonthInput(despesaParaEditar.mes_inicio_cobranca),
        categoria_id: despesaParaEditar.categoria_id || '',
      };
    }
    return {
      amount: '',
      description: '',
      metodo_pagamento: METODOS_DE_PAGAMENTO[0],
      data_compra: getTodayLocalISO(),
      isParcelado: false,
      qtd_parcelas: '',
      mes_inicio_cobranca: getCurrentMonthISO(),
      categoria_id: '',
    };
};

/* ====================== Componente ========================= */
export default function NovaDespesaModal({ onClose, despesaParaEditar }) {
  const { saveVariableExpense, categorias } = useFinance();
  
  const [formData, setFormData] = useState(() => getInitialState(despesaParaEditar));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const isEdit = !!despesaParaEditar?.id;
  
  useEffect(() => {
    setFormData(getInitialState(despesaParaEditar));
  }, [despesaParaEditar]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name) => (value) => {
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSwitchChange = (name) => (checked) => {
    setFormData(p => ({ ...p, isParcelado: checked, qtd_parcelas: checked ? (p.qtd_parcelas > 1 ? p.qtd_parcelas : 2) : 1 }));
  };
  
  const handleSelectChange = (name) => (value) => {
      setFormData(p => ({ ...p, [name]: value }));
      if (name === 'categoria_id' && value) {
          setCategoryError('');
      }
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setError('');
    
    // VALIDAÇÃO DE CATEGORIA
    if (!formData.categoria_id) {
        setCategoryError('A despesa deve ser categorizada.');
        return;
    }
    setCategoryError('');

    try {
      setIsSaving(true);
      const is_parcelado = !!formData.isParcelado;
      const qtd_parcelas = is_parcelado ? Math.max(2, parseInt(formData.qtd_parcelas || '2', 10)) : 1;
      const mes_inicio_db = toFirstDay(formData.mes_inicio_cobranca);
      const amountNumber = round2(parseFloat(String(formData.amount).replace(',', '.')) || 0);

      if (!amountNumber || amountNumber <= 0) throw new Error('Informe um valor (amount) válido.');
      if (is_parcelado && (!qtd_parcelas || qtd_parcelas < 2)) throw new Error('Informe a quantidade de parcelas (>= 2).');
      const deviceId = getOrSetDeviceId();

      const dadosParaSalvar = {
        amount: amountNumber,
        description: formData.description?.trim(),
        metodo_pagamento: formData.metodo_pagamento,
        data_compra: formData.data_compra, 
        is_parcelado, qtd_parcelas,
        mes_inicio_cobranca: mes_inicio_db,
        inicia_proximo_mes: isStartAfterPurchaseMonth(mes_inicio_db, formData.data_compra),
        device_id: deviceId,
        categoria_id: formData.categoria_id, 
      };

      let savedData;
      if (isEdit) {
        const { data, error } = await supabase.from('despesas').update(dadosParaSalvar).eq('id', despesaParaEditar.id).select().single();
        if (error) throw error;
        savedData = data;
      } else {
        const { data, error } = await supabase.from('despesas').insert(dadosParaSalvar).select().single();
        if (error) throw error;
        savedData = data;
      }
      
      const parcelas = buildParcelas({ despesaId: savedData.id, total: amountNumber, n: qtd_parcelas, startDateYYYYMMDD: mes_inicio_db });
      if (isEdit) {
        await supabase.from('parcelas').delete().eq('despesa_id', savedData.id);
      }
      const { error: insErr } = await supabase.from('parcelas').insert(parcelas);
      if (insErr) throw insErr;
      
      alert(isEdit ? 'Despesa atualizada com sucesso.' : 'Despesa criada com sucesso.');
      onClose();
    } catch (err) {
      alert(`Erro ao salvar: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    // CORREÇÃO 1: sm:max-w-md para dar mais espaço em telas maiores que mobile
    <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg max-h-[95vh] overflow-hidden p-0"> 
      <DialogHeader className="p-4 pb-2 border-b border-slate-200 dark:border-slate-700">
        <DialogTitle className="text-xl font-bold dark:text-white flex items-center gap-2">
          {isEdit ? 'Editar Despesa' : 'Nova Despesa Variável'}
        </DialogTitle>
      </DialogHeader>

      {/* CORREÇÃO 2: Aumenta o padding do form para p-4 e permite o scroll vertical */}
      <form onSubmit={handleSubmit} className="space-y-4 p-4 max-h-[85vh] overflow-y-auto">
        {error && <div className="p-2 text-sm bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>}

        {/* --- DETALHES DA COMPRA --- */}
        <Card className="shadow-none border-0">
          <CardHeader className="p-0 pb-2">
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
                >
                    <SelectTrigger id="categoria_id" className={categoryError ? "border-red-500" : ""}>
                        <SelectValue placeholder="Selecione a Categoria" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                        {categorias.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {cat.nome}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {categoryError && <p className="text-sm text-red-500">{categoryError}</p>}
            </div>

          </CardContent>
        </Card>

        {/* --- PAGAMENTO E DATAS --- */}
        <Card className="shadow-none border-0">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-lg font-semibold">Pagamento e Datas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            <div className="grid w-full items-center gap-1.5">
              <Label>Método de pagamento</Label>
              {/* Layout RadioGroup */}
              <RadioGroup name="metodo_pagamento" value={formData.metodo_pagamento} onValueChange={handleRadioChange('metodo_pagamento')} className="flex flex-wrap gap-2 pt-2">
                {METODOS_DE_PAGAMENTO.map(method => (
                  <div key={method} className="flex items-center space-x-2 border rounded-full px-3 py-1 bg-white dark:bg-slate-900">
                    <RadioGroupItem value={method} id={method} />
                    <Label htmlFor={method} className="text-sm font-normal cursor-pointer">{method}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Datas - Força duas colunas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="data_compra">Data da compra</Label>
                <Input id="data_compra" name="data_compra" type="date" value={formData.data_compra} onChange={handleInputChange} required />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="mes_inicio_cobranca">Início da Cobrança</Label>
                <Input id="mes_inicio_cobranca" name="mes_inicio_cobranca" type="month" value={formData.mes_inicio_cobranca} onChange={handleInputChange} required />
              </div>
            </div>

            {/* Compra Parcelada */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isParcelado" className="text-base">Compra Parcelada?</Label>
                <p className="text-sm text-muted-foreground">Ative se a compra tiver mais de uma parcela.</p>
              </div>
              <Switch id="isParcelado" checked={formData.isParcelado} onCheckedChange={handleSwitchChange('isParcelado')} />
            </div>

            {formData.isParcelado && (
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="qtd_parcelas">Quantidade de Parcelas</Label>
                <Input id="qtd_parcelas" name="qtd_parcelas" type="number" min={2} value={formData.qtd_parcelas} onChange={handleInputChange} placeholder="Ex: 12" required={formData.isParcelado} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- FOOTER / BOTÕES --- */}
        <DialogFooter className="flex justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <DialogClose asChild>
            <Button type="button" variant="ghost" className="text-sm">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSaving} className="text-sm">
            {isSaving ? 'Salvando...' : (<><Check size={18} className="mr-2" />{isEdit ? 'Salvar Alterações' : 'Adicionar Despesa'}</>)}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
