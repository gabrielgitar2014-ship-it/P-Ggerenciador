// src/components/Header.jsx
import React from 'react';

export default function Header({ selectedMonth, setSelectedMonth, isMenuOpen, setIsMenuOpen }) {

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
    <header className={`sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 transition-all duration-300`}>
      <div className="flex justify-between items-center p-4 h-20">
        <div className="flex-1 flex items-center justify-start">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Menu Principal"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white"></h1>
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
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm px-2 py-1 border-none rounded-lg focus:ring-1 focus:ring-purple-500"
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