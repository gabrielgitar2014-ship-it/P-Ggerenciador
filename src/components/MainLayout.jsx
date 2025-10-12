// src/components/MainLayout.jsx

import Header from './Header'; // Verifique se o caminho para o Header está correto

const MainLayout = ({ children, selectedMonth, setSelectedMonth }) => {
  return (
    <div className="flex min-h-screen bg-transparent">
      <div className="flex-1 flex flex-col">
        <Header
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
        />
        <main className="container mx-auto p-4 pb-28 flex-1
            bg-white/10 dark:bg-slate-800/10
            backdrop-blur-lg
            rounded-t-2xl md:rounded-none
            border-t border-l border-r border-white/30 dark:border-slate-600/30
            shadow-lg
          ">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;