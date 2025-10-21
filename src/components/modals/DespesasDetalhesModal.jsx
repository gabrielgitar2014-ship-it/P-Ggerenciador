import React, { useState, useMemo } from 'react';
import ParcelamentoDetalhesModal from './ParcelamentoDetalhesModal';

const formatCurrency = (v) => {
  const n = Number(v ?? 0);
  if (!isFinite(n)) return 'R$ --';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
const formatDate = (s) => {
  if (!s) return '—';
  const iso = /^\d{4}-\d{2}$/.test(s) ? `${s}-01` : s;
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
};

function DetailItem({ icon, label, children }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
        <span className="material-symbols-outlined text-base">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-sm text-slate-800 dark:text-slate-100">{children}</div>
    </div>
  );
}

export default function DespesasDetalhesModal({ isOpen, onClose, despesa }) {
  const [showParcelas, setShowParcelas] = useState(false);
  const d = useMemo(() => {
    if (!despesa) return null;
    const qtd = Number(despesa.qtd_parcelas ?? 1);
    return {
      ...despesa,
      amount: Number(despesa.amount ?? 0),
      qtd_parcelas: qtd,
      isParcelada: qtd > 1 || Boolean(despesa.isParcelada ?? despesa.isParcelado),
    };
  }, [despesa]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="w-full max-w-xl mx-3 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-700 mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Detalhes da Despesa</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {!d ? (
            <div className="py-10 text-center text-slate-500">Carregando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <DetailItem icon="description" label="Descrição">
                  <span className="font-medium">{d.description || '—'}</span>
                </DetailItem>

                <DetailItem icon="account_balance" label="Método / Parcelamento">
                  {(d.metodo_pagamento || '—')}{' '}
                  <span className="mx-1 text-slate-400">•</span>{' '}
                  {d.isParcelada ? `${d.qtd_parcelas}x` : 'À vista'}
                </DetailItem>

                <DetailItem icon="event" label="Data da Compra">
                  {formatDate(d.data_compra)}
                </DetailItem>

                <DetailItem icon="event_repeat" label="Início da Cobrança">
                  {formatDate(d.mes_inicio_cobranca)}
                </DetailItem>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="material-symbols-outlined text-base">price_check</span>
                      <span className="text-sm">Valor Total</span>
                    </div>
                    <span className="text-base font-semibold">{formatCurrency(d.amount)}</span>
                  </div>
                </div>

                {d.isParcelada && (
                  <button
                    onClick={() => setShowParcelas(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm shadow"
                  >
                    <span className="material-symbols-outlined text-base">visibility</span>
                    Ver parcelamento
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ParcelamentoDetalhesModal
        open={showParcelas}
        onClose={() => setShowParcelas(false)}
        despesa={d}
      />
    </>
  );
}
