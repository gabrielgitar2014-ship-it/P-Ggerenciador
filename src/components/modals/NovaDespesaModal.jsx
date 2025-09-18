import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useFinance } from '../../context/FinanceContext';
import { ArrowLeft, CircleDollarSign, PencilLine, CreditCard, Calendar, CalendarClock, Repeat, Hash, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { motion } from 'framer-motion';

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

const toFirstDay = (ym) => (ym && ym.length === 7 ? `${ym}-01` : ym);
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
  const start = new Date(year, month - 1, day);

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

/* ============== Estado inicial (novo/edição) ============== */
const getInitialState = (despesaParaEditar = null) => {
    if (despesaParaEditar) {
      const parcelado = !!despesaParaEditar.is_parcelado || (despesaParaEditar.qtd_parcelas || 1) > 1;
      return {
        amount: despesaParaEditar.amount ?? '',
        description: despesaParaEditar.description ?? '',
        metodo_pagamento: despesaParaEditar.metodo_pagamento ?? METODOS_DE_PAGAMENTO[0],
        data_compra: despesaParaEditar.data_compra ?? getTodayLocalISO(),
        isParcelado: parcelado,
        qtd_parcelas: parcelado ? (despesaParaEditar.qtd_parcelas ?? 2) : '',
        mes_inicio_cobranca: toMonthInput(despesaParaEditar.mes_inicio_cobranca),
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
    };
  };

/* ====================== Componente ========================= */
export default function NovaDespesaModal({ onBack, despesaParaEditar }) {
  const [formData, setFormData] = useState(() => getInitialState(despesaParaEditar));
  const [isSaving, setIsSaving] = useState(false);
  const { fetchData } = useFinance();
  const isEdit = !!despesaParaEditar?.id;

  useEffect(() => {
    setFormData(getInitialState(despesaParaEditar));
  }, [despesaParaEditar]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    try {
      setIsSaving(true);
      const is_parcelado = !!formData.isParcelado;
      const qtd_parcelas = is_parcelado ? Math.max(2, parseInt(formData.qtd_parcelas || '2', 10)) : 1;
      const mes_inicio_db = toFirstDay(formData.mes_inicio_cobranca);
      const amountNumber = round2(parseFloat(String(formData.amount).replace(',', '.')) || 0);

      if (!amountNumber || amountNumber <= 0) throw new Error('Informe um valor (amount) válido.');
      if (is_parcelado && (!qtd_parcelas || qtd_parcelas < 2)) throw new Error('Informe a quantidade de parcelas (>= 2).');

      const dadosParaSalvar = {
        amount: amountNumber,
        description: formData.description?.trim(),
        metodo_pagamento: formData.metodo_pagamento,
        data_compra: formData.data_compra, 
        is_parcelado, qtd_parcelas,
        mes_inicio_cobranca: mes_inicio_db,
        inicia_proximo_mes: isStartAfterPurchaseMonth(mes_inicio_db, formData.data_compra),
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
      await fetchData();
      onBack();
    } catch (err) {
      alert(`Erro ao salvar: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto p-4 sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={onBack} variant="ghost" size="icon" aria-label="Voltar">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h2 className="text-3xl font-bold dark:text-white">
          {isEdit ? 'Editar Despesa' : 'Nova Despesa'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-lg border-white/40 dark:border-slate-700/60">
          <CardHeader>
            <CardTitle>Detalhes da Compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="description">Descrição</Label>
              <div className="relative">
                <PencilLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Ex: Compras no mercado" className="pl-10" required />
              </div>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="amount">Valor (total)</Label>
              <div className="relative">
                <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input id="amount" name="amount" type="number" step="0.01" inputMode="decimal" value={formData.amount} onChange={handleInputChange} placeholder="0,00" className="pl-10" required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-lg border-white/40 dark:border-slate-700/60">
          <CardHeader>
            <CardTitle>Pagamento e Datas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid w-full items-center gap-1.5">
              <Label>Método de pagamento</Label>
              <RadioGroup name="metodo_pagamento" value={formData.metodo_pagamento} onValueChange={(value) => setFormData(p => ({...p, metodo_pagamento: value}))} className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {METODOS_DE_PAGAMENTO.map(method => (
                  <div key={method} className="flex items-center space-x-2">
                    <RadioGroupItem value={method} id={method} />
                    <Label htmlFor={method} className="font-normal">{method}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="data_compra">Data da compra</Label>
                <Input id="data_compra" name="data_compra" type="date" value={formData.data_compra} onChange={handleInputChange} required />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="mes_inicio_cobranca">Início da Cobrança</Label>
                <Input id="mes_inicio_cobranca" name="mes_inicio_cobranca" type="month" value={formData.mes_inicio_cobranca} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isParcelado" className="text-base">Compra Parcelada?</Label>
                <p className="text-sm text-muted-foreground">Ative se a compra tiver mais de uma parcela.</p>
              </div>
              <Switch id="isParcelado" checked={formData.isParcelado} onCheckedChange={(checked) => setFormData(p => ({...p, isParcelado: checked}))} />
            </div>

            {formData.isParcelado && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="qtd_parcelas">Quantidade de Parcelas</Label>
                <Input id="qtd_parcelas" name="qtd_parcelas" type="number" min={2} value={formData.qtd_parcelas} onChange={handleInputChange} placeholder="Ex: 12" required={formData.isParcelado} />
              </motion.div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onBack}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : (<><Check size={18} className="mr-2" />{isEdit ? 'Salvar Alterações' : 'Adicionar Despesa'}</>)}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
