// src/tabs/GeneralTab.jsx
// GeneralTab v12.1 — Liquid Glass + FIX NovaDespesaModal open
// - Saudação por hora + nome
// - Barra % renda consumida
// - Esquerda: últimas 5 despesas (variableExpenses = despesas)
// - Direita: fixas perto de vencer (próximos 7 dias)
// - Botão Nova Despesa abre modal (registry) e tem fallback para modal local

import React, { useMemo, useState } from "react";
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

// ✅ AJUSTE O CAMINHO SE NECESSÁRIO
import NovaDespesaModal from "../modals/NovaDespesaModal"; // <- troque se seu path for outro

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

// ---------- LIQUID GLASS UTILS ----------
const glassBase =
  "relative overflow-hidden rounded-[2rem] border shadow-[0_20px_60px_-35px_rgba(0,0,0,0.45)]";
const glassSurface =
  "bg-white/55 border-white/45 backdrop-blur-2xl " +
  "dark:bg-slate-900/35 dark:border-white/10";
const glassGlow =
  "before:absolute before:inset-0 before:rounded-[2rem] before:bg-gradient-to-br " +
  "before:from-white/70 before:via-white/10 before:to-white/0 before:opacity-70 " +
  "dark:before:from-white/10 dark:before:via-white/5 dark:before:to-transparent dark:before:opacity-60 " +
  "before:pointer-events-none";
const glassNoise =
  "after:absolute after:inset-0 after:rounded-[2rem] after:opacity-[0.035] " +
  "after:bg-[radial-gradient(circle_at_20%_10%,rgba(0,0,0,0.9),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(0,0,0,0.6),transparent_40%),radial-gradient(circle_at_30%_85%,rgba(0,0,0,0.7),transparent_35%)] " +
  "dark:after:opacity-[0.06] after:pointer-events-none";

function GlassCard({ className = "", children }) {
  return (
    <div className={`${glassBase} ${glassSurface} ${glassGlow} ${glassNoise} ${className}`}>
      {children}
    </div>
  );
}

// ---------- UI COMPONENTS ----------
const HeroCard = ({ title, value, icon: Icon, iconBg, valueColor, subContent }) => {
  const { valuesVisible } = useVisibility();
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <GlassCard className="p-6">
        <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl opacity-60 bg-gradient-to-br from-indigo-300/40 via-emerald-200/20 to-rose-200/20 dark:from-indigo-400/15 dark:via-emerald-400/10 dark:to-rose-400/10 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-white/70 uppercase tracking-wide mb-2">
              {title}
            </div>
            <div className={`text-3xl font-extrabold ${valueColor}`}>
              {valuesVisible ? value : "••••"}
            </div>
          </div>
          <div
            className={`
              w-12 h-12 rounded-2xl flex items-center justify-center
              ${iconBg}
              ring-1 ring-white/40 dark:ring-white/10
              shadow-[0_18px_40px_-30px_rgba(0,0,0,0.7)]
            `}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        {subContent ? <div className="relative">{subContent}</div> : null}
      </GlassCard>
    </motion.div>
  );
};

const QuickAction = ({ label, icon: Icon, colorClass, bgClass, onClick, delay }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: "spring", stiffness: 240, damping: 18 }}
    onClick={onClick}
    className="flex flex-col items-center gap-2 group w-full"
  >
    <div
      className={`
        relative w-16 h-16 md:w-20 md:h-20 rounded-[1.6rem]
        flex items-center justify-center
        transition-transform duration-200
        group-hover:scale-[1.04] active:scale-95
        ${bgClass}
        border border-white/50 dark:border-white/10
        backdrop-blur-2xl
        shadow-[0_22px_60px_-45px_rgba(0,0,0,0.55)]
        overflow-hidden
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/10 to-white/0 opacity-70 dark:from-white/10 dark:via-white/5 dark:to-transparent dark:opacity-60 pointer-events-none" />
      <Icon className={`relative w-7 h-7 md:w-8 md:h-8 ${colorClass}`} />
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
        relative flex items-center justify-between gap-3 p-3 rounded-2xl
        border border-white/55 dark:border-white/10
        bg-white/45 dark:bg-white/5
        backdrop-blur-2xl
        hover:bg-white/60 dark:hover:bg-white/10 transition-colors
        shadow-[0_18px_55px_-45px_rgba(0,0,0,0.45)]
        overflow-hidden
      "
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/10 to-white/0 opacity-70 dark:from-white/10 dark:via-white/5 dark:to-transparent dark:opacity-60 pointer-events-none" />
      <div className="relative flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${iconBg} ring-1 ring-white/40 dark:ring-white/10`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{title}</div>
          {subtitle ? <div className="text-xs text-slate-600 dark:text-white/60 truncate">{subtitle}</div> : null}
        </div>
      </div>
      <div className="relative text-sm font-extrabold text-slate-900 dark:text-white shrink-0">
        {valuesVisible ? rightText : "••••"}
      </div>
    </div>
  );
};

// ---------- MAIN ----------
export default function GeneralTab({ selectedMonth, onNavigate, userName }) {
  const { showModal } = useModal();
  const { transactions, allParcelas, variableExpenses, saveIncome, saveExpense } = useFinance();

  // ✅ fallback local modal
  const [localDespesaOpen, setLocalDespesaOpen] = useState(false);

  const greeting = useMemo(() => getGreetingByHour(new Date()), []);
  const displayName = userName && String(userName).trim() ? String(userName).trim() : "Gabriel Ricco";

  const { totalRendas, totalDespesas, saldoMes } = useMemo(() => {
    const monthTx = (transactions || []).filter((t) => pickMonthMatch(t?.date, selectedMonth));
    const incomes = monthTx.filter((t) => t?.type === "income").reduce((sum, t) => sum + safeNumber(t?.amount), 0);
    const fixed = monthTx.filter((t) => t?.type === "expense" && t?.is_fixed).reduce((sum, t) => sum + safeNumber(t?.amount), 0);
    const variable = (allParcelas || []).filter((p) => pickMonthMatch(p?.data_parcela, selectedMonth)).reduce((sum, p) => sum + safeNumber(p?.amount), 0);
    const expenses = fixed + variable;
    return { totalRendas: incomes, totalDespesas: expenses, saldoMes: incomes - expenses };
  }, [transactions, allParcelas, selectedMonth]);

  const percentSpent = useMemo(() => {
    if (!totalRendas || totalRendas <= 0) return 0;
    const pct = (totalDespesas / totalRendas) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [totalRendas, totalDespesas]);

  const handleAddNewIncome = () => {
    showModal("novaRenda", { onSave: saveIncome });
  };

  const handleAddNewExpense = () => {
    console.log("Abrindo modal de Nova Despesa (Variável) via showModal");
    
    // CORREÇÃO: Chama showModal diretamente com o tipo 'novaDespesa'
    // Passamos o onSave para conectar com o FinanceContext
    showModal('novaDespesa', { 
      onSave: async (expenseData) => {
        console.log("Salvando despesa:", expenseData);
        if (saveExpense) {
          await saveExpense(expenseData);
        } else {
          console.error("ERRO: saveExpense não encontrado no FinanceContext");
        }
      }
    });
  };
  

  const last5Despesas = useMemo(() => {
    const list = Array.isArray(variableExpenses) ? variableExpenses : [];
    const getDateStr = (d) => d?.data_compra || d?.dataCompra || d?.date || d?.created_at || d?.updated_at;
    const getAmount = (d) => safeNumber(d?.amount ?? d?.valor ?? d?.value);
    const getTitle = (d) => d?.description || d?.descricao || d?.title || "Despesa";

    return list
      .filter((d) => pickMonthMatch(getDateStr(d), selectedMonth))
      .map((d) => ({ id: d?.id, title: getTitle(d), amount: getAmount(d), dateStr: getDateStr(d) }))
      .sort((a, b) => (parseISODate(b.dateStr)?.getTime() ?? 0) - (parseISODate(a.dateStr)?.getTime() ?? 0))
      .slice(0, 5);
  }, [variableExpenses, selectedMonth]);

  const fixedNearDue = useMemo(() => {
    const fixedTx = (transactions || []).filter((t) => t?.type === "expense" && t?.is_fixed);
    const getDueDateStr = (t) => t?.due_date || t?.data_vencimento || t?.vencimento || t?.date;

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
        const isNear = x.dueDate >= startToday && x.dueDate <= in7Days;
        const isMonthOk = selectedMonth ? pickMonthMatch(x.dueStr, selectedMonth) : true;
        return isNear && isMonthOk;
      })
      .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
      .slice(0, 5);
  }, [transactions, selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Liquid backdrop */}
      <div className="relative">
        <div className="pointer-events-none absolute -inset-6 -z-10">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-60 bg-gradient-to-br from-indigo-300/55 via-sky-200/25 to-transparent dark:from-indigo-500/20 dark:via-sky-500/10" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-60 bg-gradient-to-br from-rose-200/45 via-amber-200/25 to-transparent dark:from-rose-500/15 dark:via-amber-500/10" />
        </div>

        {/* Header */}
        <div className="px-1">
          <div className="text-slate-900 dark:text-white text-lg md:text-2xl font-extrabold tracking-tight">
            {greeting}, <span className="text-slate-800 dark:text-white/90">{displayName}</span> 👋
          </div>
          <div className="text-slate-600 dark:text-white/60 text-sm mt-1">
            Visão geral do mês {selectedMonth}
          </div>
        </div>
      </div>

      {/* HERO CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HeroCard
          title="Saldo do mês"
          value={formatCurrencyBRL(saldoMes)}
          icon={Wallet}
          iconBg="bg-indigo-500/85"
          valueColor={saldoMes >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}
          subContent={
            <div
              className="
                relative overflow-hidden rounded-2xl p-4
                border border-white/55 dark:border-white/10
                bg-white/45 dark:bg-white/5
                backdrop-blur-2xl
                shadow-[0_20px_60px_-45px_rgba(0,0,0,0.45)]
              "
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/10 to-white/0 opacity-70 dark:from-white/10 dark:via-white/5 dark:to-transparent dark:opacity-60 pointer-events-none" />

              <div className="relative flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-600 dark:text-white/70 uppercase tracking-wide">
                  Consumo da renda
                </span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {Math.round(percentSpent)}%
                </span>
              </div>

              <div className="relative w-full h-3 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
                <div
                  className="
                    absolute inset-y-0 left-0 rounded-full
                    bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500
                    dark:from-emerald-400 dark:via-emerald-300 dark:to-emerald-400
                    shadow-[0_10px_30px_-20px_rgba(16,185,129,0.7)]
                  "
                  style={{ width: `${percentSpent}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
              </div>

              <div className="relative flex items-center justify-between mt-3 text-xs text-slate-700 dark:text-white/70">
                <span>
                  Despesas:{" "}
                  <span className="text-slate-900 dark:text-white font-semibold">
                    {formatCurrencyBRL(totalDespesas)}
                  </span>
                </span>
                <span>
                  Renda:{" "}
                  <span className="text-slate-900 dark:text-white font-semibold">
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
          iconBg="bg-emerald-500/85"
          valueColor="text-emerald-700 dark:text-emerald-400"
        />

        <HeroCard
          title="Despesas"
          value={formatCurrencyBRL(totalDespesas)}
          icon={ReceiptText}
          iconBg="bg-rose-500/85"
          valueColor="text-rose-700 dark:text-rose-400"
        />
      </div>

      {/* AÇÕES */}
      <div className="grid grid-cols-4 gap-3 md:gap-6">
        <QuickAction
          label="Nova Receita"
          icon={ArrowUp}
          colorClass="text-emerald-700 dark:text-emerald-300"
          bgClass="bg-emerald-200/30 dark:bg-emerald-500/15"
          onClick={handleAddNewIncome}
          delay={0.05}
        />
        <QuickAction
          label="Nova Despesa"
          icon={ArrowDown}
          colorClass="text-rose-700 dark:text-rose-300"
          bgClass="bg-rose-200/30 dark:bg-rose-500/15"
          onClick={handleAddNewExpense}
          delay={0.1}
        />
        <QuickAction
          label="Bancos"
          icon={CreditCard}
          colorClass="text-indigo-700 dark:text-indigo-300"
          bgClass="bg-indigo-200/30 dark:bg-indigo-500/15"
          onClick={() => onNavigate("bancos")}
          delay={0.15}
        />
        <QuickAction
          label="Fixas"
          icon={Plus}
          colorClass="text-amber-700 dark:text-amber-300"
          bgClass="bg-amber-200/30 dark:bg-amber-500/15"
          onClick={() => onNavigate("fixas")}
          delay={0.2}
        />
      </div>

      {/* 2 COLUNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <div className="relative flex items-center justify-between mb-4">
            <div className="text-slate-900 dark:text-white font-extrabold text-base">
              Últimas despesas
            </div>
            <button
              onClick={() => onNavigate("allExpenses")}
              className="text-xs font-bold inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white"
            >
              Ver tudo <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative space-y-3">
            {last5Despesas.length === 0 ? (
              <div className="text-slate-600 dark:text-white/60 text-sm">
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
                  iconBg="bg-rose-500/80"
                />
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="relative flex items-center justify-between mb-4">
            <div className="text-slate-900 dark:text-white font-extrabold text-base">
              Fixas perto de vencer
            </div>
            <button
              onClick={() => onNavigate("fixas")}
              className="text-xs font-bold inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white"
            >
              Ver fixas <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative space-y-3">
            {fixedNearDue.length === 0 ? (
              <div className="text-slate-600 dark:text-white/60 text-sm">
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
                  iconBg="bg-amber-500/80"
                />
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* ✅ FALLBACK MODAL LOCAL (caso sua key não exista no registry) */}
      {localDespesaOpen ? (
        <NovaDespesaModal
          isOpen={localDespesaOpen}
          onClose={() => setLocalDespesaOpen(false)}
          onSave={async (expenseData) => {
            const res = await saveExpense(expenseData);
            setLocalDespesaOpen(false);
            return res;
          }}
        />
      ) : null}
    </div>
  );
}
