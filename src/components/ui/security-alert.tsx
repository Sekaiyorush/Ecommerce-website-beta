import { AlertCircle, CheckCircle2, Info, ShieldAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'error' | 'warning' | 'success' | 'info';

interface SecurityAlertProps {
  variant?: AlertVariant;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const variantConfig: Record<AlertVariant, {
  icon: React.ElementType;
  border: string;
  bg: string;
  iconColor: string;
  textColor: string;
  labelColor: string;
  label: string;
}> = {
  error: {
    icon: ShieldAlert,
    border: 'border-red-200',
    bg: 'bg-red-50/80',
    iconColor: 'text-red-500',
    textColor: 'text-red-700',
    labelColor: 'text-red-400',
    label: 'Error',
  },
  warning: {
    icon: AlertCircle,
    border: 'border-amber-200',
    bg: 'bg-amber-50/80',
    iconColor: 'text-amber-500',
    textColor: 'text-amber-700',
    labelColor: 'text-amber-400',
    label: 'Notice',
  },
  success: {
    icon: CheckCircle2,
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/80',
    iconColor: 'text-emerald-500',
    textColor: 'text-emerald-700',
    labelColor: 'text-emerald-400',
    label: 'Success',
  },
  info: {
    icon: Info,
    border: 'border-[#D4AF37]/30',
    bg: 'bg-[#D4AF37]/5',
    iconColor: 'text-[#AA771C]',
    textColor: 'text-slate-700',
    labelColor: 'text-[#AA771C]',
    label: 'Info',
  },
};

export function SecurityAlert({ variant = 'error', message, onDismiss, className }: SecurityAlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex items-start gap-3 px-4 py-3 border backdrop-blur-sm',
        config.border,
        config.bg,
        className
      )}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.iconColor)} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className={cn('text-[9px] font-bold tracking-[0.2em] uppercase mb-0.5', config.labelColor)}>
          {config.label}
        </p>
        <p className={cn('text-sm leading-snug', config.textColor)}>{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={cn('flex-shrink-0 transition-opacity hover:opacity-60', config.textColor)}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
