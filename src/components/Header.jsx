// src/components/Header.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useVisibility } from '../context/VisibilityContext';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import {
  Eye, EyeOff, Sun, Moon, Monitor, EllipsisVertical, RefreshCw, CheckCircle2,
} from 'lucide-react';

export default function Header({ selectedMonth, setSelectedMonth }) {
  const { valuesVisible, toggleValuesVisibility } = useVisibility();
  const { theme, setTheme } = useTheme();
  const { isSyncing, lastSyncedAt, syncNow } = useFinance();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleThemeCycle = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };
  const ThemeInfo = () => {
    if (theme === 'light') return { Icon: Moon, text: 'Tema escuro' };
    if (theme === 'dark') return { Icon: Sun, text: 'Tema claro' };
    return { Icon: Monitor, text: 'Tema do sistema' };
  };
  const { Icon: ThemeIcon, text: themeText } = ThemeInfo();

  const handleMonthChange = (e) => setSelectedMonth(e.target.value);
  const handlePreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 2, 1);
    setSelectedMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  };
  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month, 1);
    setSelectedMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const lastSyncText = useMemo(() => {
    if (!lastSyncedAt) return 'Nunca';
    try {
      const d = typeof lastSyncedAt === 'string' ? new Date(lastSyncedAt) : lastSyncedAt;
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(d);
    } catch {
      return String(lastSyncedAt);
    }
  }, [lastSyncedAt]);

  return (
    <header className="sticky top-0 z-40 transition-all duration-300 bg-white/70 dark:bg-slate-900/60 backdrop-blur border-b border-black/5 dark:border-white/5">
      <div className="flex items-center justify-between px-3 py-3 h-16">
        {/* Esquerda: menu (três pontinhos) */}
        <div className="relative flex-1 flex items-center justify-start">
          <button
            ref={btnRef}
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 active:scale-95 transition"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Menu"
          >
            <EllipsisVertical className="w-6 h-6" />
          </button>

          {menuOpen && (
            <div
              ref={menuRef}
              role="menu"
              className="absolute left-0 top-12 w-64 rounded-xl border border-black/10 dark:border-white/10 shadow-xl bg-white dark:bg-slate-800 overflow-hidden"
            >
              <MenuItem
                onClick={() => {
                  toggleValuesVisibility();
                  setMenuOpen(false);
                }}
                icon={valuesVisible ? EyeOff : Eye}
                label={valuesVisible ? 'Ocultar valores' : 'Mostrar valores'}
                helper="Esconde/mostra números sensíveis"
              />

              <MenuItem
                onClick={() => {
                  handleThemeCycle();
                  setMenuOpen(false);
                }}
                icon={ThemeIcon}
                label={themeText}
                helper="Altera aparência do app"
              />

              <MenuItem
                onClick={async () => {
                  await syncNow();
                  setMenuOpen(false);
                }}
                icon={isSyncing ? RefreshCw : CheckCircle2}
                label={isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
                helper={`Última sync: ${lastSyncText}`}
                spinning={isSyncing}
              />
            </div>
          )}
        </div>

        {/* Centro: título */}
        <div className="flex-1 flex items-center justify-center pointer-events-none select-none">
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-fuchsia-500 drop-shadow">
            Rendify
          </h1>
        </div>

        {/* Direita: navegação de mês */}
        <div className="flex-1 flex items-center justify-end gap-1 sm:gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
            title="Mês Anterior"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          <input
            type="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="w-[9.5rem] sm:w-auto bg-slate-100/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-medium text-sm px-2 py-1 border border-black/10 dark:border-white/10 rounded-lg focus:ring-1 focus:ring-purple-500"
          />

          <button
            onClick={handleNextMonth}
            className="p-2 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
            title="Próximo Mês"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function MenuItem({ icon: Icon, label, helper, onClick, spinning, disabled }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      }`}
    >
      <div className="mt-0.5">
        <Icon className={`w-5 h-5 text-slate-700 dark:text-slate-200 ${spinning ? 'animate-spin' : ''}`} />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
        {helper && <span className="text-xs text-slate-500 dark:text-slate-400">{helper}</span>}
      </div>
    </button>
  );
}
