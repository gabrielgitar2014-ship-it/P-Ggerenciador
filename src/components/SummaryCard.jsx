import { Skeleton } from "@/components/ui/skeleton";
import { useVisibility } from "../context/VisibilityContext";
import PropTypes from "prop-types";

export default function SummaryCard({
  title,
  value,
  icon: Icon,
  colorClass = "",
  loading = false,
  onClick,
  isClickable = true,
  size = "default",

  // Novas opções de formatação
  noCents = false,
  useGrouping = true,
  showCurrencySymbol = true,
  valueEmphasis = false,
  valueClassName = "",
}) {
  const { valuesVisible } = useVisibility();

  const sizeStyles = {
    default: {
      padding: "p-3",
      titleSize: "text-md",
      valueSize: "text-3xl",      // base
      valueSizeEmphasis: "text-5xl", // ênfase
      iconSize: "w-8 h-8",
      skeletonH: "h-28",
    },
    small: {
      padding: "p-3",
      titleSize: "text-sm",
      valueSize: "text-lg",        // base
      valueSizeEmphasis: "text-3xl", // ênfase
      iconSize: "w-6 h-6",
      skeletonH: "h-24",
    },
  };

  const styles = sizeStyles[size] || sizeStyles.default;

  const toNumber = (v) => (typeof v === "number" ? v : Number(v) || 0);

  const formatValue = (val) => {
    const num = toNumber(val);

    // Se não mostrar símbolo, formatamos como número "puro"
    if (!showCurrencySymbol) {
      return num.toLocaleString("pt-BR", {
        minimumFractionDigits: noCents ? 0 : 2,
        maximumFractionDigits: noCents ? 0 : 2,
        useGrouping,
      });
    }

    // Caso contrário, formato monetário BRL
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: noCents ? 0 : 2,
      maximumFractionDigits: noCents ? 0 : 2,
      useGrouping,
    }).format(num);
  };

  if (loading) {
    return <Skeleton className={`rounded-2xl ${styles.skeletonH}`} aria-busy="true" />;
  }

  const clickable = Boolean(onClick) && isClickable;

  const wrapperClasses = [
    styles.padding,
    "rounded-2xl shadow-lg space-y-2",
    "bg-white/30 dark:bg-slate-800/30",
    "backdrop-blur-lg",
    "border border-white/40 dark:border-slate-700/60",
    clickable
      ? "cursor-pointer transition-transform hover:scale-105 active:scale-100"
      : "opacity-90",
    !isClickable ? "pointer-events-none opacity-60" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleKeyDown = (e) => {
    if (!clickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(e);
    }
  };

  const valueSizeClass = valueEmphasis ? styles.valueSizeEmphasis : styles.valueSize;

  return (
    <div
      className={wrapperClasses}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className="flex justify-between items-start">
        <span className={`font-semibold ${styles.titleSize} text-slate-700 dark:text-slate-200`}>
          {title}
        </span>
        {Icon ? <Icon className={`${styles.iconSize} ${colorClass}`} aria-hidden="true" /> : null}
      </div>

      <p className={`font-bold ${valueSizeClass} text-slate-900 dark:text-white ${valueClassName}`}>
        {valuesVisible ? formatValue(value) : (showCurrencySymbol ? "R$ ••••" : "••••")}
      </p>
    </div>
  );
}

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  icon: PropTypes.elementType,
  colorClass: PropTypes.string,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  isClickable: PropTypes.bool,
  size: PropTypes.oneOf(["default", "small"]),

  // Novas props
  noCents: PropTypes.bool,
  useGrouping: PropTypes.bool,
  showCurrencySymbol: PropTypes.bool,
  valueEmphasis: PropTypes.bool,
  valueClassName: PropTypes.string,
};

