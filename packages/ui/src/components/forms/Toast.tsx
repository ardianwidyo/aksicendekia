'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  variant?: ToastVariant;
  message: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-tertiary" />,
  error: <AlertCircle className="w-5 h-5 text-error" />,
  warning: <AlertTriangle className="w-5 h-5 text-secondary" />,
  info: <Info className="w-5 h-5 text-primary" />,
};

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-tertiary-container/30 border-tertiary text-on-tertiary-container',
  error: 'bg-error-container/30 border-error text-on-error-container',
  warning: 'bg-secondary-container/30 border-secondary text-on-secondary-container',
  info: 'bg-primary-container/30 border-primary text-on-primary-container',
};

export const Toast: React.FC<ToastProps> = ({
  variant = 'info',
  message,
  isOpen,
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-xs p-md rounded-xl border shadow-lg max-w-sm font-body text-body-md animate-slide-up backdrop-blur-md">
      <div className={`p-md rounded-xl border flex items-center gap-xs ${variantStyles[variant]}`}>
        {variantIcons[variant]}
        <span className="flex-1 font-medium">{message}</span>
        <button
          onClick={onClose}
          aria-label="Tutup Notifikasi"
          className="p-1 rounded hover:bg-black/10 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
