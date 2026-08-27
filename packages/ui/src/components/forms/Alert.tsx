import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const variantConfig: Record<AlertVariant, { icon: React.ReactNode; container: string }> = {
  info: {
    icon: <Info className="w-5 h-5 text-primary" />,
    container: 'bg-primary-container/20 border-primary-container text-on-surface',
  },
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-tertiary" />,
    container: 'bg-tertiary-container/20 border-tertiary-container text-on-surface',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-secondary" />,
    container: 'bg-secondary-container/20 border-secondary-container text-on-surface',
  },
  error: {
    icon: <AlertCircle className="w-5 h-5 text-error" />,
    container: 'bg-error-container/20 border-error-container text-on-surface',
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}) => {
  const config = variantConfig[variant];

  return (
    <div
      role="alert"
      className={`p-md rounded-xl border flex items-start gap-xs ${config.container} ${className}`}
    >
      <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
      <div className="flex-1 font-body text-body-md">
        {title && <h4 className="font-semibold text-label-lg mb-0.5">{title}</h4>}
        <div className="text-on-surface-variant">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Tutup Peringatan"
          className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-black/5 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
