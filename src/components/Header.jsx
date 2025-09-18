import React from 'react';
import { useVisibility } from '../context/VisibilityContext';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, Sun, Moon, Monitor } from 'lucide-react';

export default function Header({ selectedMonth, setSelectedMonth }) {
  const { valuesVisible, toggleValuesVisibility } = useVisibility();
  const { theme, setTheme } = useTheme();

  const handleThemeCycle = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const ThemeInfo = () => {
    if (theme === 'light') return { Icon: Moon, text: 'Mudar para Tema Escuro' };
    if (theme === 'dark') return { Icon: Sun, text: 'Mudar para Tema Claro' };
    return { Icon: Monitor, text: 'Mudar para Tema do Sistema' };
  };
  const { Icon: ThemeIcon, text: themeText } = ThemeInfo();

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const handlePreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newDate = new Date(year, month - 2, 1);
    const newYear = newDate.getFullYear();
    const newMonth = String(newDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newYear}-${newMonth}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newDate = new Date(year, month, 1);
    const newYear = newDate.getFullYear();
    const newMonth = String(newDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newYear}-${newMonth}`);
  };

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300`}>
      <div className="flex justify-between items-center p-4 h-20">
        <div className="flex-1 flex items-center justify-start gap-2">
          <button
            onClick={toggleValuesVisibility}
            // 👇 CLASSES ALTERADAS AQUI para o efeito neon
            className="p-2 text-cyan-400 drop-shadow-[0_0_4px_theme('colors.cyan.400')] rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
            title={valuesVisible ? "Ocultar valores" : "Mostrar valores"}
          >
            {valuesVisible ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
          </button>
          
          <button
            onClick={handleThemeCycle}
            // 👇 CLASSES ALTERADAS AQUI para o efeito neon
            className="p-2 text-cyan-400 drop-shadow-[0_0_4px_theme('colors.cyan.400')] rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
            title={themeText}
          >
            <ThemeIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center">
        </div>
        <div className="flex-1 flex items-center justify-end gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Mês Anterior"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="flex-shrink-0">
            <input
              type="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-medium text-sm px-2 py-1 border border-white/20 dark:border-slate-700/50 rounded-lg focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Próximo Mês"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </header>
  );
}
