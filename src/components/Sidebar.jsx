import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
// ✅ 1. Ícones importados diretamente do lucide-react
import {
  LayoutDashboard,
  Pin,
  Landmark,
  Sun,
  Moon,
  Monitor,
  CheckCircle,
  AlertCircle,
  X,
  RotateCw,
  Trash2,
  
} from 'lucide-react';

const TABS_CONFIG = {
  geral: { Icon: LayoutDashboard, label: 'Geral' },
  fixas: { Icon: Pin, label: 'Fixas' },
  bancos: { Icon: Landmark, label: 'Bancos' },
};

const TABS = Object.keys(TABS_CONFIG);

function SyncToast({ status }) {
    if (!status.active) return null;
    const isSuccess = status.type === 'success';
    const baseClasses = "fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg text-white font-semibold flex items-center gap-3 z-[60]";
    const styleClasses = isSuccess ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gradient-to-br from-red-500 to-rose-600";
    
    return (
      <div className={`${baseClasses} ${styleClasses}`}>
        {isSuccess ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
        {status.message}
      </div>
    );
}

export default function Sidebar({
  isMenuOpen,
  setIsMenuOpen,
  activeTab,
  setActiveTab,
  onSync,
  onClearData,
  loading,
  
}) {
  const { theme, setTheme } = useTheme();
  const [syncStatus, setSyncStatus] = useState({ active: false, message: '', type: '' });

  const handleCloseMenu = () => setIsMenuOpen(false);
  const handleMenuTabChange = (tabName) => {
    setActiveTab(tabName);
    handleCloseMenu();
  };
  
  const handleThemeCycle = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const handleSyncWrapper = async () => {
    const result = await onSync();
    if (result) {
      setSyncStatus({ active: true, message: result.success ? 'Sincronizado com sucesso!' : `Falha: ${result.error || 'Erro desconhecido'}`, type: result.success ? 'success' : 'error' });
      setTimeout(() => setSyncStatus({ active: false, message: '', type: '' }), 3000);
    }
  };

  // ✅ 2. Lógica de tema simplificada para usar os ícones diretamente
  const ThemeInfo = () => {
    if (theme === 'light') return { Icon: Moon, text: 'Mudar para Tema Escuro' };
    if (theme === 'dark') return { Icon: Sun, text: 'Mudar para Tema Claro' };
    return { Icon: Monitor, text: 'Mudar para Tema do Sistema' };
  };
  const { Icon: ThemeIcon, text: themeText } = ThemeInfo();

  return (
    <>
      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 shadow-xl overflow-y-auto transform transition-transform duration-300 z-50 flex flex-col p-4 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-end mb-4">
          <button onClick={handleCloseMenu} className="p-2 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X className="h-5 w-5" /> 
          </button>
        </div>
        
        <nav className="flex-1">
          <h3 className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-2 px-4">Navegação</h3>
          <ul>
            {TABS.map(tab => {
              const isActive = activeTab === tab;
              const { Icon, label } = TABS_CONFIG[tab];
              return (
                <li key={tab}>
                  <button
                    onClick={() => handleMenuTabChange(tab)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${isActive ? 'bg-purple-100 text-purple-700 dark:bg-slate-700 dark:text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'}`}
                  >
                    <Icon className="h-5 w-5" /> 
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
          
          <hr className="my-4 border-slate-200 dark:border-slate-700" />
          
          <h3 className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-2 px-4">Opções</h3>
          <ul>
            <li>
              <button onClick={handleThemeCycle} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <ThemeIcon className="h-5 w-5" />
                {themeText}
              </button>
            </li>
            <li>
              <button onClick={handleSyncWrapper} disabled={loading} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50">
                <RotateCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Sincronizando...' : 'Sincronizar'}
              </button>
            </li>
            <li>
              <button onClick={onClearData} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                <Trash2 className="h-5 w-5" />
                Limpar Tudo
              </button>
            </li>
            <li>

              
            </li>
          </ul>
        </nav>
      </div>

      <SyncToast status={syncStatus} />
    </>
  );
}