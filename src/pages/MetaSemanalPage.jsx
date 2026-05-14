import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { ArrowLeft, Target, TrendingUp, AlertTriangle, Trash2, Edit2, Plus, Calendar } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { parseISO, isWithinInterval } from 'date-fns';

function formatCurrencyBRL(value) {
  if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function MetaSemanalPage() {
  const navigate = useNavigate();
  const { transactions, allParcelas, variableExpenses } = useFinance();
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null,
    meta_valor: '',
    data_inicio: '',
    data_fim: ''
  });

  // Calcula o saldo total do PRÓXIMO mês baseado nos dados globais
  const nextMonthDate = new Date();
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  const nextMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
  
  const saldoMes = useMemo(() => {
    let incomes = 0;
    let expenses = 0;

    transactions.forEach((t) => {
      const matchMonth = t.date && t.date.startsWith(nextMonth);
      if (matchMonth) {
        if (t.type === 'income') incomes += Number(t.amount);
        if (t.type === 'expense') expenses += Number(t.amount);
      }
    });

    allParcelas.forEach((p) => {
      const matchMonth = p.data_parcela && p.data_parcela.startsWith(nextMonth);
      if (matchMonth) {
        expenses += Number(p.amount);
      }
    });

    return incomes - expenses;
  }, [transactions, allParcelas, nextMonth]);

  const fetchMetas = async () => {
    try {
      const { data, error } = await supabase
        .from('metas_semanais')
        .select('*')
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      setMetas(data || []);
    } catch (err) {
      console.error("Erro ao buscar metas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetas();
  }, []);

  const handleSaveMeta = async () => {
    if (!formData.meta_valor || !formData.data_inicio || !formData.data_fim) {
      alert("Preencha todos os campos da meta.");
      return;
    }

    if (new Date(formData.data_fim) < new Date(formData.data_inicio)) {
      alert("A data de fim não pode ser anterior à data de início.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        meta_valor: Number(formData.meta_valor),
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim
      };

      if (formData.id) {
        const { error } = await supabase.from('metas_semanais').update(payload).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('metas_semanais').insert(payload);
        if (error) throw error;
      }
      
      setFormData({ id: null, meta_valor: '', data_inicio: '', data_fim: '' });
      fetchMetas();
    } catch (err) {
      alert("Erro ao salvar meta: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir esta meta?")) return;
    try {
      const { error } = await supabase.from('metas_semanais').delete().eq('id', id);
      if (error) throw error;
      fetchMetas();
    } catch (err) {
      alert("Erro ao excluir meta.");
    }
  };

  const editMeta = (meta) => {
    setFormData({
      id: meta.id,
      meta_valor: meta.meta_valor,
      data_inicio: meta.data_inicio,
      data_fim: meta.data_fim
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calcularGastoPeriodo = (meta) => {
    let gasto = 0;
    if (!meta || !meta.data_inicio || !meta.data_fim) return 0;
    
    const start = parseISO(meta.data_inicio);
    const end = parseISO(meta.data_fim);
    end.setHours(23, 59, 59, 999);

    // Pega o momento exato em que a meta foi criada no banco
    const metaCreatedAt = meta.created_at ? new Date(meta.created_at) : new Date(0);

    // Soma apenas as despesas (compras) cuja "data_compra" está dentro da vigência da meta.
    // E assegura que a despesa foi inserida DEPOIS da criação da meta.
    (variableExpenses || []).forEach((d) => {
      if (d.data_compra) {
        const dDate = parseISO(d.data_compra);
        const expenseCreatedAt = d.created_at ? new Date(d.created_at) : new Date(0);
        
        if (isWithinInterval(dDate, { start, end }) && expenseCreatedAt >= metaCreatedAt) {
          gasto += Number(d.amount);
        }
      }
    });

    return gasto;
  };

  const formatarDataLocal = (dataStr) => {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white pb-24">
      <div className="pt-12 px-6 pb-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 flex items-center gap-4 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:scale-105 transition-transform">
          <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold">Gerenciar Metas</h1>
          <p className="text-sm opacity-70">Controle de gastos por período</p>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-lg mx-auto">
        {/* Saldo Total */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <p className="text-sm font-semibold opacity-90 uppercase tracking-wide">Saldo Total do Próximo Mês</p>
          <h2 className="text-4xl font-black mt-1">{formatCurrencyBRL(saldoMes)}</h2>
        </div>

        {/* Definir Meta */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">{formData.id ? 'Editar Meta' : 'Nova Meta de Gastos'}</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Limite de gastos (R$)</label>
              <input 
                type="number"
                value={formData.meta_valor}
                onChange={(e) => setFormData({...formData, meta_valor: e.target.value})}
                className="w-full mt-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: 500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Data de Início</label>
                <input 
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
                  className="w-full mt-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Data Final</label>
                <input 
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({...formData, data_fim: e.target.value})}
                  className="w-full mt-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {formData.id && (
                <button 
                  onClick={() => setFormData({ id: null, meta_valor: '', data_inicio: '', data_fim: '' })}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button 
                onClick={handleSaveMeta}
                disabled={saving}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? '...' : (formData.id ? 'Salvar Edição' : 'Criar Meta')}
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Metas */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white px-2">Metas Cadastradas</h3>
          
          {loading ? (
            <div className="text-center p-6 opacity-50">Carregando metas...</div>
          ) : metas.length === 0 ? (
            <div className="text-center p-6 bg-slate-100 dark:bg-slate-900 rounded-[2rem] opacity-70">
              Nenhuma meta criada ainda.
            </div>
          ) : (
            metas.map((meta) => {
              const gasto = calcularGastoPeriodo(meta);
              const metaVal = Number(meta.meta_valor);
              const progress = Math.min((gasto / metaVal) * 100, 100);
              const isDanger = progress >= 85;

              return (
                <div key={meta.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-1">
                        <Calendar className="w-4 h-4" />
                        {formatarDataLocal(meta.data_inicio)} até {formatarDataLocal(meta.data_fim)}
                      </div>
                      <h4 className="text-2xl font-black">{formatCurrencyBRL(metaVal)}</h4>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editMeta(meta)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 hover:text-blue-600 rounded-full transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(meta.id)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-500">Consumido: {formatCurrencyBRL(gasto)}</span>
                    <span className={isDanger ? "text-rose-500" : "text-blue-500"}>{progress.toFixed(1)}%</span>
                  </div>

                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        progress >= 100 ? 'bg-rose-600' :
                        progress >= 85 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
