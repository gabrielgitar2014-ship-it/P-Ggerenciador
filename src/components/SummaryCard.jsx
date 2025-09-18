import { Skeleton } from "@/components/ui/skeleton";
import { useVisibility } from '../context/VisibilityContext';

export default function SummaryCard({
  title,
  value,
  icon: Icon,
  colorClass,
  loading,
  onClick,
  isClickable = true,
  size = 'default' 
}) {
  const { valuesVisible } = useVisibility();
  
  const sizeStyles = {
    default: {
      padding: 'p-5',
      titleSize: 'text-md',
      valueSize: 'text-3xl',
      iconSize: 'w-8 h-8'
    },
    small: {
      padding: 'p-4',
      titleSize: 'text-sm',
      valueSize: 'text-2xl',
      iconSize: 'w-6 h-6'
    }
  };

  const styles = sizeStyles[size] || sizeStyles.default;

  const formatCurrency = (val) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

  const content = (
    <>
      <div className="flex justify-between items-start">
        <span className={`font-semibold ${styles.titleSize} text-slate-700 dark:text-slate-200`}>{title}</span>
        {Icon && <Icon className={`${styles.iconSize} ${colorClass}`} />}
      </div>
      <p className={`font-bold ${styles.valueSize} text-slate-900 dark:text-white`}>
        {valuesVisible ? formatCurrency(value) : 'R$ ••••'}
      </p>
    </>
  );

  const wrapperClasses = `
    ${styles.padding} rounded-2xl shadow-lg space-y-2
    bg-white/30 dark:bg-slate-800/30 
    backdrop-blur-lg 
    border border-white/40 dark:border-slate-700/60
    ${onClick && isClickable ? 'cursor-pointer transition-transform hover:scale-105 active:scale-100' : ''}
  `;

  return loading ? (
    <Skeleton className={`h-28 rounded-2xl ${size === 'small' && 'h-24'}`} />
  ) : (
    <div className={wrapperClasses} onClick={onClick}>
      {content}
    </div>
  );
}
