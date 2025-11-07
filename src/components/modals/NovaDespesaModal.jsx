// src/components/modals/NovaDespesaModal.jsx
// (Versão 4.0 - Refatoração Mobile-First)

import { useState, useEffect } from 'react';
[span_0](start_span)import { supabase } from '../../supabaseClient';[span_0](end_span)
import { useFinance } from '../../context/FinanceContext';
[span_1](start_span)import { CircleDollarSign, PencilLine, Hash, Check, ArrowLeft } from 'lucide-react';[span_1](end_span)
import { Button } from '@/components/ui/button';
[span_2](start_span)import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';[span_2](end_span)
import { Input } from '@/components/ui/input';
[span_3](start_span)import { Label } from '@/components/ui/label';[span_3](end_span)
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
[span_4](start_span)import { getOrSetDeviceId } from '../../utils/deviceId';[span_4](end_span)

import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
[span_5](start_span)} from "@/components/ui/dialog";[span_5](end_span)
[span_6](start_span)const METODOS_DE_PAGAMENTO = ['Itaú', 'Bradesco', 'Nubank', 'PIX'];[span_6](end_span)

/* ========================= Helpers (Mantidos) ========================= */
const getTodayLocalISO = () => {
  const today = new Date();
  [span_7](start_span)today.setMinutes(today.getMinutes() - today.getTimezoneOffset());[span_7](end_span)
  return today.toISOString().split('T')[0];
};

const getCurrentMonthISO = () => {
  const today = new Date();
  [span_8](start_span)const y = today.getFullYear();[span_8](end_span)
  const m = String(today.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};
const toFirstDay = (isoDate) => {
  [span_9](start_span)const [year, month] = isoDate.split('-');[span_9](end_span)
  return `${year}-${month}-01`;
};
[span_10](start_span)const toMonthInput = (d) => (d ? String(d).slice(0, 7) : getCurrentMonthISO());[span_10](end_span)
const isStartAfterPurchaseMonth = (mesInicioYYYYMMDD, dataCompraYYYYMMDD) => {
  if (!mesInicioYYYYMMDD || !dataCompraYYYYMMDD) return false;
  [span_11](start_span)const a = new Date(`${String(mesInicioYYYYMMDD).slice(0,7)}-01T00:00:00`);[span_11](end_span)
  [span_12](start_span)const b = new Date(`${String(dataCompraYYYYMMDD).slice(0,7)}-01T00:00:00`);[span_12](end_span)
  return a > b;
};
[span_13](start_span)const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;[span_13](end_span)

const buildParcelas = ({ despesaId, total, n, startDateYYYYMMDD }) => {
  const parcelas = [];
  [span_14](start_span)const per = round2(total / n);[span_14](end_span)
  const partial = round2(per * (n - 1));
  const last = round2(total - partial);
  [span_15](start_span)const [year, month, day] = startDateYYYYMMDD.split('-').map(Number);[span_15](end_span)
  const start = new Date(year, month - 1, 1);
  
  for (let k = 1; k <= n; k++) {
    [span_16](start_span)const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());[span_16](end_span)
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
  [span_17](start_span)}
  return parcelas;
};

const getInitialState = (despesaParaEditar = null) => {
    if (despesaParaEditar) {
      const parcelado = !!despesaParaEditar.is_parcelado ||
        (despesaParaEditar.qtd_parcelas || 1) > 1;[span_17](end_span)
      return {
        amount: despesaParaEditar.amount ?? [span_18](start_span)'',[span_18](end_span)
        description: despesaParaEditar.description ?? [span_19](start_span)'',[span_19](end_span)
        metodo_pagamento: despesaParaEditar.metodo_pagamento ?? [span_20](start_span)METODOS_DE_PAGAMENTO[0],[span_20](end_span)
        [span_21](start_span)data_compra: despesaParaEditar.data_compra ?? getTodayLocalISO(),[span_21](end_span)
        isParcelado: parcelado,
        qtd_parcelas: parcelado ? (despesaParaEditar.qtd_parcelas ?? 2) [span_22](start_span): '',[span_22](end_span)
        mes_inicio_cobranca: toMonthInput(despesaParaEditar.mes_inicio_cobranca),
        categoria_id: despesaParaEditar.categoria_id || [span_23](start_span)'',[span_23](end_span)
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
    [span_24](start_span)};[span_24](end_span)
};

/* ====================== Componente ========================= */
export default function NovaDespesaModal({ onClose, despesaParaEditar }) {
  [span_25](start_span)const { saveVariableExpense, categorias } = useFinance();[span_25](end_span)
  
  const [formData, setFormData] = useState(() => getInitialState(despesaParaEditar));
  [span_26](start_span)const [isSaving, setIsSaving] = useState(false);[span_26](end_span)
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const isEdit = !!despesaParaEditar?.id;
  
  useEffect(() => {
    [span_27](start_span)setFormData(getInitialState(despesaParaEditar));[span_27](end_span)
  }, [despesaParaEditar]);

  const handleInputChange = (e) => {
    [span_28](start_span)const { name, value } = e.target;[span_28](end_span)
    [span_29](start_span)setFormData((prev) => ({ ...prev, [name]: value }));[span_29](end_span)
  };

  const handleRadioChange = (name) => (value) => {
    [span_30](start_span)setFormData(p => ({ ...p, [name]: value }));[span_30](end_span)
  };

  const handleSwitchChange = (name) => (checked) => {
    [span_31](start_span)setFormData(p => ({ ...p, isParcelado: checked, qtd_parcelas: checked ? (p.qtd_parcelas > 1 ? p.qtd_parcelas : 2) : 1 }));[span_31](end_span)
  };
  
  const handleSelectChange = (name) => (value) => {
      [span_32](start_span)setFormData(p => ({ ...p, [name]: value }));[span_32](end_span)
      if (name === 'categoria_id' && value) {
          setCategoryError('');
      }
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setError('');
    
    // VALIDAÇÃO DE CATEGORIA
    [span_33](start_span)if (!formData.categoria_id) {[span_33](end_span)
        setCategoryError('A despesa deve ser categorizada.');
        [span_34](start_span)return;[span_34](end_span)
    }
    setCategoryError('');

    try {
      setIsSaving(true);
      const is_parcelado = !!formData.isParcelado;
      const qtd_parcelas = is_parcelado ? [span_35](start_span)Math.max(2, parseInt(formData.qtd_parcelas || '2', 10)) : 1;[span_35](end_span)
      const mes_inicio_db = toFirstDay(formData.mes_inicio_cobranca);
      [span_36](start_span)const amountNumber = round2(parseFloat(String(formData.amount).replace(',', '.')) || 0);[span_36](end_span)

      if (!amountNumber || amountNumber <= 0) throw new Error('Informe um valor (amount) válido.');
      [span_37](start_span)if (is_parcelado && (!qtd_parcelas || qtd_parcelas < 2)) throw new Error('Informe a quantidade de parcelas (>= 2).');[span_37](end_span)
      [span_38](start_span)const deviceId = getOrSetDeviceId();[span_38](end_span)

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
      [span_39](start_span)};[span_39](end_span)

      let savedData;
      if (isEdit) {
        const { data, error } = await supabase.from('despesas').update(dadosParaSalvar).eq('id', despesaParaEditar.id).select().single();
        [span_40](start_span)if (error) throw error;[span_40](end_span)
        savedData = data;
      } else {
        const { data, error } = await supabase.from('despesas').insert(dadosParaSalvar).select().single();
        [span_41](start_span)if (error) throw error;[span_41](end_span)
        savedData = data;
      }
      
      [span_42](start_span)const parcelas = buildParcelas({ despesaId: savedData.id, total: amountNumber, n: qtd_parcelas, startDateYYYYMMDD: mes_inicio_db });[span_42](end_span)
      if (isEdit) {
        [span_43](start_span)await supabase.from('parcelas').delete().eq('despesa_id', savedData.id);[span_43](end_span)
      }
      const { error: insErr } = await supabase.from('parcelas').insert(parcelas);
      if (insErr) throw insErr;
      
      [span_44](start_span)alert(isEdit ? 'Despesa atualizada com sucesso.' : 'Despesa criada com sucesso.');[span_44](end_span)
      [span_45](start_span)onClose();[span_45](end_span)
    } catch (err) {
      [span_46](start_span)alert(`Erro ao salvar: ${err?.message || err}`);[span_46](end_span)
    } finally {
      [span_47](start_span)setIsSaving(false);[span_47](end_span)
    }
  };


  return (
    // CORREÇÃO 1: sm:max-w-[95%] para telas menores que 640px, e max-h-full
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
              [span_48](start_span)<Label htmlFor="amount" className="flex items-center gap-1">[span_48](end_span)
                <CircleDollarSign size={16} /> Valor
              </Label>
              {/* Removido o 'max-w-sm' para mobile-first */}
              <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleInputChange} placeholder="0,00" required />
            </div>
            
            {/* 2. Descrição */}
            <div className="grid w-full items-center gap-1.5">
              [span_49](start_span)<Label htmlFor="description" className="flex items-center gap-1">[span_49](end_span)
                <PencilLine size={16} /> Descrição
              </Label>
              <Input id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Ex: Compras no mercado" required />
            </div>
            
            {/* 3. CAMPO DE CATEGORIA */}
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="categoria_id" className="flex items-center gap-1">
                    [span_50](start_span)<Hash size={16} /> Categoria <span className="text-red-500">*</span>[span_50](end_span)
                </Label>
                <Select 
                    value={formData.categoria_id} 
                    onValueChange={handleSelectChange('categoria_id')} 
                >
                    <SelectTrigger id="categoria_id" className={categoryError ? [span_51](start_span)"border-red-500" : ""}>[span_51](end_span)
                        <SelectValue placeholder="Selecione a Categoria" />
                    </SelectTrigger>
                    [span_52](start_span)<SelectContent className="max-h-[300px] overflow-y-auto">[span_52](end_span)
                        {categorias.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {cat.nome}
                            [span_53](start_span)</SelectItem>[span_53](end_span)
                        ))}
                    </SelectContent>
                </Select>
                {categoryError && <p className="text-sm text-red-500">{categoryError}</p>}
            [span_54](start_span)</div>[span_54](end_span)

          </CardContent>
        </Card>

        {/* --- PAGAMENTO E DATAS --- */}
        <Card className="shadow-none border-0">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-lg font-semibold">Pagamento e Datas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            [span_55](start_span)<div className="grid w-full items-center gap-1.5">[span_55](end_span)
              <Label>Método de pagamento</Label>
              {/* CORREÇÃO 3: Removido grid-cols-4 para forçar o wrap natural em mobile */}
              <RadioGroup name="metodo_pagamento" value={formData.metodo_pagamento} onValueChange={handleRadioChange('metodo_pagamento')} className="flex flex-wrap gap-2 pt-2">
                {METODOS_DE_PAGAMENTO.map(method => (
                  <div key={method} className="flex items-center space-x-2 border rounded-full px-3 py-1 bg-white dark:bg-slate-900">
                    [span_56](start_span)<RadioGroupItem value={method} id={method} />[span_56](end_span)
                    <Label htmlFor={method} className="text-sm font-normal cursor-pointer">{method}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* CORREÇÃO 4: Força duas colunas em todos os tamanhos, mas com margem de segurança */}
            [span_57](start_span)<div className="grid grid-cols-2 gap-4">[span_57](end_span)
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="data_compra">Data da compra</Label>
                <Input id="data_compra" name="data_compra" type="date" value={formData.data_compra} onChange={handleInputChange} required />
              </div>
              [span_58](start_span)<div className="grid w-full items-center gap-1.5">[span_58](end_span)
                <Label htmlFor="mes_inicio_cobranca">Início da Cobrança</Label>
                <Input id="mes_inicio_cobranca" name="mes_inicio_cobranca" type="month" value={formData.mes_inicio_cobranca} onChange={handleInputChange} required />
              </div>
            </div>

            {/* Compra Parcelada */}
            [span_59](start_span)<div className="flex items-center justify-between rounded-lg border p-4">[span_59](end_span)
              <div className="space-y-0.5">
                <Label htmlFor="isParcelado" className="text-base">Compra Parcelada?</Label>
                <p className="text-sm text-muted-foreground">Ative se a compra tiver mais de uma parcela.</p>
              </div>
              <Switch id="isParcelado" checked={formData.isParcelado} onCheckedChange={handleSwitchChange('isParcelado')} />
            </div>

            [span_60](start_span){formData.isParcelado && ([span_60](end_span)
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="qtd_parcelas">Quantidade de Parcelas</Label>
                <Input id="qtd_parcelas" name="qtd_parcelas" type="number" min={2} value={formData.qtd_parcelas} onChange={handleInputChange} placeholder="Ex: 12" required={formData.isParcelado} />
              </div>
            )}
          [span_61](start_span)</CardContent>[span_61](end_span)
        </Card>

        {/* --- FOOTER / BOTÕES --- */}
        <DialogFooter className="flex justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <DialogClose asChild>
            <Button type="button" variant="ghost" className="text-sm">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSaving} className="text-sm">
            {isSaving ? [span_62](start_span)'Salvando...' : (<><Check size={18} className="mr-2" />{isEdit ? 'Salvar Alterações' : 'Adicionar Despesa'}</>)}[span_62](end_span)
          </Button>
        </DialogFooter>
      </form>
    [span_63](start_span)</DialogContent>[span_63](end_span)
  );
}
