// src/tabs/GeneralTab.jsx
// GeneralTab v11.1 — Greeting + Progress Bar + Last 5 "despesas" + Fixas perto de vencer
// + Tema claro agradável (light default + dark:)
// Pronto para uso.

import React, { useMemo } from "react";
import { useFinance } from "../../context/FinanceContext";
import { useVisibility } from "../../context/VisibilityContext";
import { useModal } from "../../context/ModalContext";
import {
  ArrowUp,
  ArrowDown,
  CreditCard,
  ReceiptText,
  Plus,
  Wallet,
  CircleDollarSign,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

// ---------- HELPERS ----------
function formatCurrencyBRL(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "R$ 0,00";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseISODate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getGreetingByHour(date = new Date()) {
  const h = date.getHours();
  if (h >= 0 && h <= 4) return "Boa madrugada";
  if (h >= 5 && h <= 11) return "Bom dia";
  if (h >= 12 && h <= 17) return "Boa tarde";
  return "Boa noite";
}

function pickMonthMatch(dateStr, selectedMonth) {
  if (!dateStr || !selectedMonth) return false;
  return String(dateStr).startsWith(selectedMonth);
}

// ---------- UI COMPONENTS ----------
const HeroCard = ({ title, value, icon: Icon, iconBg, valueColor, subContent }) => {
  const { valuesVisible } = useVisibility();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="
        relative overflow-hidden rounded-[2rem] p-6
        bg-white border border-slate-200 text-slate-900 shadow-xl
        dark:bg-slate-900 dark:border-white/10 dark:text-white
      "
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-white/70 uppercase tracking-wide mb-2">
            {title}
          </div>
          <div className={`text-3xl font-bold ${valueColor}`}>
            {valuesVisible ? value : "••••"}
          </div>
        </div>

        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>

      {subContent}
    </motion.div>
  );
};

const QuickAction = ({ label, icon: Icon, colorClass, bgClass, onClick, delay }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: "spring", stiffness: 200 }}
    onClick={onClick}
    className="flex flex-col items-center gap-2 group w-full"
  >
    <div
      className={`
        w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem]
        flex items-center justify-center
        shadow-md group-hover:shadow-lg group-hover:scale-[1.03] active:scale-95 transition-transform
        border border-slate-200 bg-white
        dark:border-white/10 dark:bg-slate-900/40
        ${bgClass}
      `}
    >
      <Icon className={`w-7 h-7 md:w-8 md:h-8 ${colorClass}`} />
    </div>

    <span
      className="
        text-xs md:text-sm font-semibold
        text-slate-700 group-hover:text-slate-900
        dark:text-slate-200 dark:group-hover:text-white
        transition-colors text-center
      "
    >
      {label}
    </span>
  </motion.button>
);

const ListItem = ({ title, subtitle, rightText, icon: Icon, iconBg }) => {
  const { valuesVisible } = useVisibility();

  return (
    <div
      className="
        flex items-center justify-between gap-3 p-3 rounded-2xl
        bg-white border border-slate-200 hover:bg-slate-50 transition-colors
        dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10
      "
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${iconBg} shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{title}</div>
          {subtitle ? (
            <div className="text-xs text-slate-500 dark:text-white/60 truncate">{subtitle}</div>
          ) : null}
        </div>
      </div>

      <div className="text-sm font-bold text-slate-900 dark:text-white shrink-0">
        {valuesVisible ? rightText : "••••"}
      </div>
    </div>
  );
};

// ---------- MAIN ----------
export default function GeneralTab({ selectedMonth, onNavigate, userName }) {
  const { showModal } = useModal();
  const { transactions, allParcelas, variableExpenses, saveIncome, saveExpense } = useFinance();

  const greeting = useMemo(() => getGreetingByHour(new Date()), []);
  const displayName =
    userName && String(userName).trim() ? String(userName).trim() : "Gabriel Ricco";

  // Totais do mês (mesma regra do seu fluxo atual: fixas via transactions + variáveis via parcelas)
  const { totalRendas, totalDespesas, saldoMes } = useMemo(() => {
    const monthTx = (transactions || []).filter((t) => pickMonthMatch(t?.date, selectedMonth));

    const incomes = monthTx
      .filter((t) => t?.type === "income")
      .reduce((sum, t) => sum + safeNumber(t?.amount), 0);

    const fixed = monthTx
      .filter((t) => t?.type === "expense" && t?.is_fixed)
      .reduce((sum, t) => sum + safeNumber(t?.amount), 0);

    const variable = (allParcelas || [])
      .filter((p) => pickMonthMatch(p?.data_parcela, selectedMonth))
      .reduce((sum, p) => sum + safeNumber(p?.amount), 0);

    const expenses = fixed + variable;

    return { totalRendas: incomes, totalDespesas: expenses, saldoMes: incomes - expenses };
  }, [transactions, allParcelas, selectedMonth]);

  // % renda consumida
  const percentSpent = useMemo(() => {
    if (!totalRendas || totalRendas <= 0) return 0;
    const pct = (totalDespesas / totalRendas) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [totalRendas, totalDespesas]);

  const handleAddNewIncome = () => {
    showModal("novaRenda", { onSave: saveIncome });
  };

  const handleAddNewExpense = () => {
    if (!saveExpense) {
      console.warn("saveExpense não está disponível no contexto financeiro.");
      return;
    }
    showModal("novaDespesa", {
      onSave: async (expenseData) => {
        return await saveExpense(expenseData);
      },
    });
  };

  // Esquerda: últimas 5 despesas da tabela "despesas" (assumindo variableExpenses = despesas (pai))
  const last5Despesas = useMemo(() => {
    const list = Array.isArray(variableExpenses) ? variableExpenses : [];

    const getDateStr = (d) =>
      d?.data_compra || d?.dataCompra || d?.date || d?.created_at || d?.updated_at;

    const getAmount = (d) => safeNumber(d?.amount ?? d?.valor ?? d?.value);

    const getTitle = (d) => d?.description || d?.descricao || d?.title || "Despesa";

    return list
      .filter((d) => pickMonthMatch(getDateStr(d), selectedMonth))
      .map((d) => ({
        id: d?.id,
        title: getTitle(d),
        amount: getAmount(d),
        dateStr: getDateStr(d),
      }))
      .sort((a, b) => {
        const da = parseISODate(a.dateStr)?.getTime() ?? 0;
        const db = parseISODate(b.dateStr)?.getTime() ?? 0;
        return db - da;
      })
      .slice(0, 5);
  }, [variableExpenses, selectedMonth]);

  // Direita: fixas perto de vencer (próximos 7 dias)
  const fixedNearDue = useMemo(() => {
    const fixedTx = (transactions || []).filter((t) => t?.type === "expense" && t?.is_fixed);

    const getDueDateStr = (t) =>
      t?.due_date || t?.data_vencimento || t?.vencimento || t?.date;

    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in7Days = new Date(startToday);
    in7Days.setDate(in7Days.getDate() + 7);

    return fixedTx
      .map((t) => {
        const dueStr = getDueDateStr(t);
        const dueDate = parseISODate(dueStr);
        return {
          id: t?.id,
          title: t?.description || t?.title || "Despesa fixa",
          amount: safeNumber(t?.amount),
          dueStr,
          dueDate,
        };
      })
      .filter((x) => {
        if (!x.dueDate) return false;

        // Perto de vencer = entre hoje e +7 dias
        const isNear = x.dueDate >= startToday && x.dueDate <= in7Days;

        // Se selectedMonth estiver setado, tenta manter coerência do mês exibido
        const isMonthOk = selectedMonth ? pickMonthMatch(x.dueStr, selectedMonth) : true;

        return isNear && isMonthOk;
      })
      .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
      .slice(0, 5);
  }, [transactions, selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Header / Saudação */}
      <div className="px-1">
        <div className="text-slate-900 dark:text-white text-lg md:text-2xl font-extrabold">
          {greeting}, <span className="text-slate-800 dark:text-white/90">{displayName}</span> 👋
        </div>
        <div className="text-slate-500 dark:text-white/60 text-sm mt-1">
          Visão geral do mês {selectedMonth}
        </div>
      </div>

      {/* HERO CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HeroCard
          title="Saldo do mês"
          value={formatCurrencyBRL(saldoMes)}
          icon={Wallet}
          iconBg="bg-indigo-500/80"
          valueColor={saldoMes >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
          subContent={
            <div
              className="
                rounded-2xl p-4 border
                bg-slate-50 border-slate-200
                dark:bg-slate-800/50 dark:border-white/10
              "
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-white/70 uppercase">
                  Consumo da renda
                </span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {Math.round(percentSpent)}%
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-emerald-500 dark:bg-emerald-400"
                  style={{ width: `${percentSpent}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-3 text-xs text-slate-600 dark:text-white/70">
                <span>
                  Despesas:{" "}
                  <span className="text-slate-900 dark:text-white">
                    {formatCurrencyBRL(totalDespesas)}
                  </span>
                </span>
                <span>
                  Renda:{" "}
                  <span className="text-slate-900 dark:text-white">
                    {formatCurrencyBRL(totalRendas)}
                  </span>
                </span>
              </div>
            </div>
          }
        />

        <HeroCard
          title="Receitas"
          value={formatCurrencyBRL(totalRendas)}
          icon={CircleDollarSign}
          iconBg="bg-emerald-500/80"
          valueColor="text-emerald-600 dark:text-emerald-400"
        />

        <HeroCard
          title="Despesas"
          value={formatCurrencyBRL(totalDespesas)}
          icon={ReceiptText}
          iconBg="bg-rose-500/80"
          valueColor="text-rose-600 dark:text-rose-400"
        />
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div className="grid grid-cols-4 gap-3 md:gap-6">
        <QuickAction
          label="Nova Receita"
          icon={ArrowUp}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="bg-emerald-50 dark:bg-emerald-500/15"
          onClick={handleAddNewIncome}
          delay={0.05}
        />
        <QuickAction
          label="Nova Despesa"
          icon={ArrowDown}
          colorClass="text-rose-600 dark:text-rose-400"
          bgClass="bg-rose-50 dark:bg-rose-500/15"
          onClick={handleAddNewExpense}
          delay={0.1}
        />
        <QuickAction
          label="Bancos"
          icon={CreditCard}
          colorClass="text-indigo-600 dark:text-indigo-300"
          bgClass="bg-indigo-50 dark:bg-indigo-500/15"
          onClick={() => onNavigate("bancos")}
          delay={0.15}
        />
        <QuickAction
          label="Fixas"
          icon={Plus}
          colorClass="text-amber-600 dark:text-amber-300"
          bgClass="bg-amber-50 dark:bg-amber-500/15"
          onClick={() => onNavigate("fixas")}
          delay={0.2}
        />
      </div>

      {/* LISTAS EM 2 COLUNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Esquerda: últimas despesas */}
        <div
          className="
            rounded-[2rem] p-5 border shadow-sm
            bg-white border-slate-200
            dark:bg-slate-900 dark:border-white/10
          "
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-900 dark:text-white font-extrabold text-base">
              Últimas despesas
            </div>
            <button
              onClick={() => onNavigate("allExpenses")}
              className="
                text-xs font-bold inline-flex items-center gap-1
                text-slate-500 hover:text-slate-900
                dark:text-white/70 dark:hover:text-white
              "
            >
              Ver tudo <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {last5Despesas.length === 0 ? (
              <div className="text-slate-500 dark:text-white/60 text-sm">
                Nenhuma despesa encontrada para este mês.
              </div>
            ) : (
              last5Despesas.map((d) => (
                <ListItem
                  key={d.id ?? `${d.title}-${d.dateStr}`}
                  title={d.title}
                  subtitle={d.dateStr ? `Compra: ${String(d.dateStr).slice(0, 10)}` : undefined}
                  rightText={formatCurrencyBRL(d.amount)}
                  icon={ReceiptText}
                  iconBg="bg-rose-500/70"
                />
              ))
            )}
          </div>
        </div>

        {/* Direita: fixas perto de vencer */}
        <div
          className="
            rounded-[2rem] p-5 border shadow-sm
            bg-white border-slate-200
            dark:bg-slate-900 dark:border-white/10
          "
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-900 dark:text-white font-extrabold text-base">
              Fixas perto de vencer
            </div>
            <button
              onClick={() => onNavigate("fixas")}
              className="
                text-xs font-bold inline-flex items-center gap-1
                text-slate-500 hover:text-slate-900
                dark:text-white/70 dark:hover:text-white
              "
            >
              Ver fixas <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {fixedNearDue.length === 0 ? (
              <div className="text-slate-500 dark:text-white/60 text-sm">
                Nenhuma despesa fixa perto do vencimento (próximos 7 dias).
              </div>
            ) : (
              fixedNearDue.map((x) => (
                <ListItem
                  key={x.id ?? `${x.title}-${x.dueStr}`}
                  title={x.title}
                  subtitle={x.dueStr ? `Vence: ${String(x.dueStr).slice(0, 10)}` : undefined}
                  rightText={formatCurrencyBRL(x.amount)}
                  icon={Wallet}
                  iconBg="bg-amber-500/70"
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
