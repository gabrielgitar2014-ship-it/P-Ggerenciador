// src/components/Header.jsx

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useVisibility } from '../context/VisibilityContext';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { Settings, Eye, EyeOff, Sun, Moon, Monitor, RefreshCw, CheckCircle2 } from 'lucide-react';

// O componente MenuItem permanece o mesmo
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

export default function Header({ selectedMonth }) {
  const { valuesVisible, toggleValuesVisibility } = useVisibility();
  const { theme, setTheme } = useTheme();
  const { isSyncing, lastSyncedAt, syncNow } = useFinance();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  const handleThemeCycle = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const ThemeInfo = useMemo(() => {
    if (theme === 'light') return { Icon: Moon, text: 'Tema escuro' };
    if (theme === 'dark') return { Icon: Sun, text: 'Tema claro' };
    return { Icon: Monitor, text: 'Tema do sistema' };
  }, [theme]);

  const lastSyncText = useMemo(() => {
    if (!lastSyncedAt) return 'Nunca';
    try {
      const d = new Date(lastSyncedAt);
      return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(d);
    } catch { return String(lastSyncedAt); }
  }, [lastSyncedAt]);

  // AQUI ESTÁ A MUDANÇA: Separando mês e ano
  const { displayMonth, displayYear } = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    return {
      displayMonth: date.toLocaleDateString('pt-BR', { month: 'long' }),
      displayYear: date.toLocaleDateString('pt-BR', { year: 'numeric' }),
    };
  }, [selectedMonth]);


  return (
    <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/60 backdrop-blur border-b border-black/5 dark:border-white/5">
      <div className="flex items-center justify-between px-3 py-3 h-16">
        {/* Esquerda: menu de configurações */}
        <div className="relative flex-1 flex items-center justify-start">
          <button ref={btnRef} onClick={() => setMenuOpen(v => !v)} className="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60" aria-label="Menu">
            <Settings className="w-6 h-6" />
          </button>
          {menuOpen && (
             <div ref={menuRef} className="absolute left-0 top-12 w-64 rounded-xl border border-black/10 dark:border-white/10 shadow-xl bg-white dark:bg-slate-800 overflow-hidden">
               <MenuItem onClick={() => { toggleValuesVisibility(); setMenuOpen(false); }} icon={valuesVisible ? EyeOff : Eye} label={valuesVisible ? 'Ocultar valores' : 'Mostrar valores'} helper="Esconde/mostra números sensíveis" />
               <MenuItem onClick={() => { handleThemeCycle(); setMenuOpen(false); }} icon={ThemeInfo.Icon} label={ThemeInfo.text} helper="Altera aparência do app" />
               <MenuItem onClick={async () => { await syncNow(); setMenuOpen(false); }} icon={isSyncing ? RefreshCw : CheckCircle2} label={isSyncing ? 'Sincronizando...' : 'Sincronizar agora'} helper={`Última sync: ${lastSyncText}`} spinning={isSyncing} />
             </div>
          )}
        </div>

        {/* Centro: Título do App */}
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-fuchsia-500">
            GenFinance
          </h1>
        </div>

        {/* Direita: NOVA EXIBIÇÃO DO MÊS E ANO */}
        <div className="flex-1 flex items-center justify-end text-right">
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 capitalize">
              {displayMonth}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {displayYear}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
