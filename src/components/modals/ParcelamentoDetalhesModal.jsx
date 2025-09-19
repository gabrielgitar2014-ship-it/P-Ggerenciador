// src/components/modals/ParcelamentoDetalhesModal.jsx
import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';

const formatCurrency = (v) =>
  Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatMonthYear = (iso) => {
  if (!iso) return '—';
  const [y, m] = iso.split('-').map(Number);
  if (!y || !m) return '—';
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
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

export default function ParcelamentoDetalhesModal({ open, onClose, despesa }) {
  if (!open) return null;
  const d = despesa ?? {};

  const data = useMemo(() => {
    // Quantidade de parcelas
    const qtd = Math.max(1, Number(d?.qtd_parcelas ?? d?.parcelas?.length ?? 1));
    const isParcelada = (d?.isParcelada ?? d?.isParcelado ?? false) || qtd > 1;

    // Valor da parcela (o que aparece no mês)
    const valorParcela = (() => {
      if (Array.isArray(d?.parcelas) && d.parcelas.length) {
        const v = Number(d.parcelas[0]?.amount ?? 0);
        if (!Number.isNaN(v) && v > 0) return v;
      }
      const v = Number(d?.amount ?? d?.valor_parcela ?? 0);
      return Number.isNaN(v) ? 0 : v;
    })();

    // TOTAL DA COMPRA:
    // parcelada -> parcela * qtd | à vista -> amount
    const total = isParcelada
      ? Number((valorParcela * qtd).toFixed(2))
      : Number((Number(d?.amount ?? 0)).toFixed(2));

    // Início do cronograma
    const mi = (d?.mes_inicio_cobranca ?? '').trim(); // YYYY-MM
    const start = /^\d{4}-\d{2}$/.test(mi)
      ? new Date(parseInt(mi.slice(0, 4)), parseInt(mi.slice(5, 7)) - 1, 1)
      : (d?.data_compra ? new Date(d.data_compra) : new Date());

    // Cronograma (usa parcelas do banco quando existir)
    let cron = Array.isArray(d?.parcelas) && d.parcelas.length
      ? d.parcelas
          .map((p, i) => ({
            numero: Number(p?.numero_parcela ?? i + 1),
            data: p?.data_parcela ? new Date(p.data_parcela) : new Date(start.getFullYear(), start.getMonth() + i, 1),
            amount: Number(p?.amount ?? valorParcela),
            paga: String(p?.paga).toLowerCase() === 'true',
          }))
          .sort((a, b) => a.numero - b.numero)
      : Array.from({ length: qtd }, (_, i) => ({
          numero: i + 1,
          data: new Date(start.getFullYear(), start.getMonth() + i, 1),
          // distribui base, com ajuste de centavos na última
          amount:
            i === qtd - 1
              ? Number((total - Number((total / qtd).toFixed(2)) * (qtd - 1)).toFixed(2))
              : Number((total / qtd).toFixed(2)),
          paga: false,
        }));

    const today = new Date();
    const pagas = cron.filter((x) => x.paga || x.data <= today);
    const pago = pagas.reduce((acc, x) => acc + (Number(x.amount) || 0), 0);
    const perc = total > 0 ? Math.min(100, (pago / total) * 100) : 0;
    const end = cron[cron.length - 1]?.data ?? start;

    return {
      total,
      qtd,
      valorParcela,
      perc: Math.round(perc),
      atualInfo: `${Math.min(pagas.length, qtd)} de ${qtd}`,
      endISO: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-01`,
    };
  }, [d]);

  const body = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-2xl p-5 mx-3">
        <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-slate-700 mb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Detalhes do Parcelamento</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-1 mb-3">
          <DetailItem icon="shopping_bag" label="Total da Compra">
            <span className="font-semibold">{formatCurrency(data.total)}</span>
          </DetailItem>
          <DetailItem icon="payments" label="Plano de Parcelamento">
            {data.qtd}x de {formatCurrency(data.valorParcela)}
          </DetailItem>
          <DetailItem icon="price_check" label="Valor da Parcela">
            <span className="font-semibold">{formatCurrency(data.valorParcela)}</span>
          </DetailItem>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-end mb-1">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Progresso do Pagamento</span>
            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{data.perc}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-3 bg-gradient-to-r from-purple-500 to-fuchsia-500" style={{ width: `${data.perc}%` }} />
          </div>
        </div>

        <div className="space-y-1 border-t border-gray-200 dark:border-slate-700 pt-2">
          <DetailItem icon="receipt_long" label="Parcela Atual">{data.atualInfo}</DetailItem>
          <DetailItem icon="event_repeat" label="Previsão de Término">{formatMonthYear(data.endISO)}</DetailItem>
        </div>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}
