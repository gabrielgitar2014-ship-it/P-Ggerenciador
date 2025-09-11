import GeneralTab from "../components/tabs/Generaltab.jsx";
import DespesasTab from "../components/tabs/DespesasTab.jsx";
import RendaTab from "../components/tabs/RendaTab.jsx";
import FixasTab from "../components/tabs/FixasTab.jsx";
import BancosTab from "../components/tabs/BancosTab.jsx";
import PedidosTab from "../components/tabs/PedidosTab.jsx";
import CalculadoraTab from "../components/tabs/CalculadoraTab.jsx";

// Array principal de configuração das abas
export const TABS_CONFIG = [
  // Abas que aparecem no menu principal do rodapé
  {
    id: 'geral',
    icon: 'dashboard',
    component: GeneralTab,
    isMainMenu: true,
  },
  {
    id: 'despesas',
    icon: 'receipt_long',
    component: DespesasTab,
    isMainMenu: true,
  },
  {
    id: 'renda',
    icon: 'attach_money',
    component: RendaTab,
    isMainMenu: true,
  },
  {
    id: 'fixas',
    icon: 'push_pin',
    component: FixasTab,
    isMainMenu: true,
  },
  {
    id: 'bancos',
    icon: 'credit_card',
    component: BancosTab,
    isMainMenu: true,
  },
  // Abas que não aparecem no menu principal, mas existem no sistema
  {
    id: 'pedidos',
    icon: 'shopping_cart',
    component: PedidosTab,
    isMainMenu: false,
  },
  {
    id: 'calculadora',
    icon: 'calculate',
    component: CalculadoraTab,
    isMainMenu: false,
  },
];