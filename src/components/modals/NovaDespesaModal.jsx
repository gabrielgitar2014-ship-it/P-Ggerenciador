import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useFinance } from '../../context/FinanceContext';
// A IMPORTAÇÃO DO 'paymentMethods' FOI REMOVIDA DAQUI
import { ArrowLeft, CircleDollarSign, PencilLine, CreditCard, Calendar, CalendarClock, Repeat, Hash, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

// LISTA DE MÉTODOS DE PAGAMENTO DEFINIDA DIRETAMENTE AQUI
const METODOS_DE_PAGAMENTO = ['Itaú', 'Bradesco', 'Nubank', 'PIX'];

/* ========================= Helpers (Sem Alterações) ========================= */
const getTodayLocalISO = () => { /* ... */ };
const getCurrentMonthISO = () => { /* ... */ };
const toFirstDay = (ym) => (ym && ym.length === 7 ? `${ym}-01` : ym);
const toMonthInput = (d) => (d ? String(d).slice(0, 7) : getCurrentMonthISO());
const isStartAfterPurchaseMonth = (mesInicioYYYYMMDD, dataCompraYYYYMMDD) => { /* ... */ };
const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
const buildParcelas = ({ despesaId, total, n, startDateYYYYMMDD }) => { /* ... */ };

const getInitialState = (despesaParaEditar = null) => {
    if (despesaParaEditar) {
      const parcelado = !!despesaParaEditar.is_parcelado || (despesaParaEditar.qtd_parcelas || 1) > 1;
      return {
        amount: despesaParaEditar.amount ?? '',
        description: despesaParaEditar.description ?? '',
        // USO DA CONSTANTE LOCAL
        metodo_pagamento: despesaParaEditar.metodo_pagamento ?? METODOS_DE_PAGAMENTO[0],
        data_compra: despesaParaEditar.data_compra ?? getTodayLocalISO(),
        isParcelado: parcelado,
        qtd_parcelas: parcelado ? (despesaParaEditar.qtd_parcelas ?? 2) : '',
        mes_inicio_cobranca: toMonthInput(despesaParaEditar.mes_inicio_cobranca),
      };
    }
    return {
      amount: '', description: '', 
      // USO DA CONSTANTE LOCAL
      metodo_pagamento: METODOS_DE_PAGAMENTO[0],
      data_compra: getTodayLocalISO(), isParcelado: false,
      qtd_parcelas: '', mes_inicio_cobranca: getCurrentMonthISO(),
    };
};

export default function NovaDespesaModal({ onBack, despesaParaEditar }) {
  const [formData, setFormData] = useState(() => getInitialState(despesaParaEditar));
  const [isSaving, setIsSaving] = useState(false);
  const { fetchData } = useFinance();
  const isEdit = !!despesaParaEditar?.id;

  useEffect(() => {
    setFormData(getInitialState(despesaParaEditar));
  }, [despesaParaEditar]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in-down">
        <div className="flex items-center gap-4 mb-6">
            <Button onClick={onBack} variant="ghost" size="icon" aria-label="Voltar">
                <ArrowLeft className="w-6 h-6" />
            </Button>
            <h2 className="text-3xl font-bold dark:text-white">
                {isEdit ? 'Editar Despesa' : 'Nova Despesa'}
            </h2>
        </div>

        <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-lg border border-white/40 dark:border-slate-700/60 w-full p-6 md:p-8 rounded-2xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label htmlFor="amount" className="block text-sm font-semibold mb-1 dark:text-slate-300">Valor (total)</label>
                <CircleDollarSign className="absolute left-3 top-10 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <input id="amount" type="number" step="0.01" inputMode="decimal" name="amount" className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 transition" value={formData.amount} onChange={handleInputChange} placeholder="0.00" required />
              </div>
              <div className="relative">
                <label htmlFor="description" className="block text-sm font-semibold mb-1 dark:text-slate-300">Descrição</label>
                <PencilLine className="absolute left-3 top-10 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <input id="description" type="text" name="description" className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 transition" value={formData.description} onChange={handleInputChange} placeholder="Ex: Compras no mercado" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label htmlFor="data_compra" className="block text-sm font-semibold mb-1 dark:text-slate-300">Data da compra</label>
                <Calendar className="absolute left-3 top-10 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <input id="data_compra" type="date" name="data_compra" className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 transition" value={formData.data_compra} onChange={handleInputChange} required />
              </div>
              <div className="relative">
                <label htmlFor="mes_inicio_cobranca" className="block text-sm font-semibold mb-1 dark:text-slate-300">Início da Cobrança</label>
                <CalendarClock className="absolute left-3 top-10 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <input id="mes_inicio_cobranca" type="month" name="mes_inicio_cobranca" className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 transition" value={formData.mes_inicio_cobranca} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label htmlFor="metodo_pagamento" className="block text-sm font-semibold mb-1 dark:text-slate-300">Método de pagamento</label>
                <CreditCard className="absolute left-3 top-10 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <select id="metodo_pagamento" name="metodo_pagamento" className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 transition" value={formData.metodo_pagamento} onChange={handleInputChange}>
                  {/* USO DA CONSTANTE LOCAL */}
                  {METODOS_DE_PAGAMENTO.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
              </div>
              <div className="flex flex-col justify-between">
                <div className="flex items-center space-x-3 mt-1">
                  <input id="isParcelado" type="checkbox" name="isParcelado" checked={!!formData.isParcelado} onChange={handleInputChange} className="h-5 w-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500 cursor-pointer" />
                  <label htmlFor="isParcelado" className="font-semibold dark:text-slate-300 cursor-pointer flex items-center gap-2">
                    <Repeat size={18} /> Parcelado?
                  </label>
                </div>
                {formData.isParcelado && (
                  <div className="relative mt-2 animate-fade-in">
                    <Hash className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
                    <input id="qtd_parcelas" type="number" name="qtd_parcelas" className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 transition" min={2} step="1" value={formData.qtd_parcelas || ''} onChange={handleInputChange} placeholder="Qtd. Parcelas" required={formData.isParcelado} />
                  </div>
                )}
              </div>
            </div>
            <hr className="border-slate-200/60 dark:border-slate-700/60 !mt-8" />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : (
                  <>
                    <Check size={18} className="mr-2" />
                    {isEdit ? 'Salvar Alterações' : 'Adicionar Despesa'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
    </div>
  );
}
