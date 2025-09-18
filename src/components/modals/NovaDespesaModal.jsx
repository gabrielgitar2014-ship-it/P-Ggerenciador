import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
// ✅ 1. IMPORTAÇÃO DO CALCULADORAMODAL REMOVIDA
import { METODOS_DE_PAGAMENTO } from '../../constants/paymentMethods';
import { CircleDollarSign, PencilLine, CreditCard, Calendar, CalendarClock, Repeat, Hash, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

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
        metodo_pagamento: despesaParaEditar.metodo_pagamento ?? METODOS_DE_PAGAMENTO?.[0] ?? 'Itaú',
        data_compra: despesaParaEditar.data_compra ?? getTodayLocalISO(),
        isParcelado: parcelado,
        qtd_parcelas: parcelado ? (despesaParaEditar.qtd_parcelas ?? 2) : '',
        mes_inicio_cobranca: toMonthInput(despesaParaEditar.mes_inicio_cobranca),
      };
    }
    return {
      amount: '',
      description: '',
      metodo_pagamento: METODOS_DE_PAGAMENTO?.[0] ?? 'Itaú',
      data_compra: getTodayLocalISO(),
      isParcelado: false,
      qtd_parcelas: '',
      mes_inicio_cobranca: getCurrentMonthISO(),
    };
  };

/* ====================== Componente ========================= */
export default function NovaDespesaModal({ onClose, onSave, despesaParaEditar }) {
  const [formData, setFormData] = useState(() => getInitialState(despesaParaEditar));
  // ✅ 2. ESTADO DO MODAL DA CALCULADORA REMOVIDO
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = !!despesaParaEditar?.id;
  const { fetchData } = useFinance();

  useEffect(() => {
    setFormData(getInitialState(despesaParaEditar));
  }, [despesaParaEditar]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ✅ 3. FUNÇÃO DE CALLBACK DA CALCULADORA REMOVIDA
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    try {
      setIsSaving(true);
      const is_parcelado = !!formData.isParcelado;
      const qtd_parcelas = is_parcelado ? Math.max(2, parseInt(formData.qtd_parcelas || '2', 10)) : 1;
      const mes_inicio_db = toFirstDay(formData.mes_inicio_cobranca);
      const amountNumber = round2(parseFloat(String(formData.amount).replace(',', '.')) || 0);

      if (!amountNumber || amountNumber <= 0) {
        alert('Informe um valor (amount) válido.');
        setIsSaving(false); return;
      }
      if (is_parcelado && (!qtd_parcelas || qtd_parcelas < 2)) {
        alert('Informe a quantidade de parcelas (>= 2) para despesas parceladas.');
        setIsSaving(false); return;
      }

      const dadosParaSalvar = {
        amount: amountNumber,
        description: formData.description?.trim(),
        metodo_pagamento: formData.metodo_pagamento,
        data_compra: formData.data_compra, 
        is_parcelado, qtd_parcelas,
        mes_inicio_cobranca: mes_inicio_db,
        inicia_proximo_mes: isStartAfterPurchaseMonth(mes_inicio_db, formData.data_compra),
      };

      let despesaId = despesaParaEditar?.id ?? null;
      if (onSave) {
        const payload = { ...dadosParaSalvar, id: despesaId || undefined };
        const despesaSalva = await onSave(payload);

        if (!despesaSalva?.id) {
          throw new Error("A função 'onSave' não retornou um ID válido.");
        }
        despesaId = despesaSalva.id;
      } else {
        throw new Error("Função onSave não fornecida ao modal.");
      }

      if (!despesaId) {
        throw new Error('Não foi possível obter um ID para a despesa.');
      }

      const parcelas = buildParcelas({ despesaId, total: amountNumber, n: qtd_parcelas, startDateYYYYMMDD: mes_inicio_db });
      
      if (isEdit) {
        await supabase.from('parcelas').delete().eq('despesa_id', despesaId);
      }
      
      const { error: insErr } = await supabase.from('parcelas').insert(parcelas);
      if (insErr) throw insErr;
      
      alert(isEdit ? 'Despesa atualizada com sucesso.' : 'Despesa criada com sucesso.');
      
      await fetchData();
      
      onClose?.();

    } catch (err) {
      alert(`Erro ao salvar: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* ✅ 4. RENDERIZAÇÃO CONDICIONAL DA CALCULADORA REMOVIDA */}
      
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative animate-slide-up">
          <div className="pb-4 border-b border-slate-200 dark:border-slate-600 mb-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-500 dark:from-blue-400 dark:to-purple-400">
              {isEdit ? 'Editar Despesa' : 'Nova Despesa'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Preencha os detalhes da sua despesa.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label htmlFor="amount" className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Valor (total)</label>
                <CircleDollarSign className="absolute left-3 top-10 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <input id="amount" type="number" step="0.01" inputMode="decimal" name="amount" className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition" value={formData.amount} onChange={handleInputChange} placeholder="0.00" required />
                {/* ✅ 5. BOTÃO QUE ABRE A CALCULADORA REMOVIDO */}
              </div>
              <div className="relative">
                <label htmlFor="description" className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Descrição</label>
                <PencilLine className="absolute left-3 top-10 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <input id="description" type="text" name="description" className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition" value={formData.description} onChange={handleInputChange} placeholder="Ex: Compras no mercado" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label htmlFor="data_compra" className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Data da compra</label>
                <Calendar className="absolute left-3 top-10 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <input id="data_compra" type="date" name="data_compra" className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition" value={formData.data_compra} onChange={handleInputChange} required />
              </div>
              <div className="relative">
                <label htmlFor="mes_inicio_cobranca" className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Início da Cobrança</label>
                <CalendarClock className="absolute left-3 top-10 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <input id="mes_inicio_cobranca" type="month" name="mes_inicio_cobranca" className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition" value={formData.mes_inicio_cobranca} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label htmlFor="metodo_pagamento" className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Método de pagamento</label>
                <CreditCard className="absolute left-3 top-10 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <select id="metodo_pagamento" name="metodo_pagamento" className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white" value={formData.metodo_pagamento} onChange={handleInputChange}>
                  {(METODOS_DE_PAGAMENTO || ['Itaú', 'Bradesco', 'Nubank', 'PIX']).map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
              </div>
              <div className="flex flex-col justify-between">
                <div className="flex items-center space-x-3 mt-1">
                  <input id="isParcelado" type="checkbox" name="isParcelado" checked={!!formData.isParcelado} onChange={handleInputChange} className="h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer" />
                  <label htmlFor="isParcelado" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-2">
                    <Repeat size={18} /> Parcelado?
                  </label>
                </div>
                {formData.isParcelado && (
                  <div className="relative mt-2 animate-fade-in">
                    <Hash className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
                    <input id="qtd_parcelas" type="number" name="qtd_parcelas" className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition" min={2} step="1" value={formData.qtd_parcelas || ''} onChange={handleInputChange} placeholder="Qtd. Parcelas" required={formData.isParcelado} />
                  </div>
                )}
              </div>
            </div>
            <hr className="border-slate-200 dark:border-slate-600 !mt-8" />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-5 py-2 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-300 rounded-lg shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition duration-150 ease-in-out">
                Cancelar
              </button>
              <button type="submit" disabled={isSaving} className="px-5 py-2 inline-flex items-center gap-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed transition duration-150 ease-in-out">
                {isSaving ? 'Salvando...' : (
                  <>
                    <Check size={18} />
                    {isEdit ? 'Salvar' : 'Adicionar'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
