import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Gagal Memuat Data',
  description = 'Terjadi kesalahan saat mengambil informasi dari server. Periksa koneksi internet Anda.',
  onRetry,
  retryLabel = 'Coba Lagi',
  className = '',
}) => {
  return (
    <div
      className={`border border-error-container bg-error-container/20 rounded-xl p-lg flex flex-col items-center justify-center text-center min-h-[280px] ${className}`}
    >
      <div className="w-20 h-20 mb-md rounded-full bg-error-container/50 flex items-center justify-center text-error">
        <AlertCircle className="w-10 h-10 stroke-[1.5]" />
      </div>
      <h3 className="font-heading text-title-md text-error mb-xs font-semibold">
        {title}
      </h3>
      <p className="font-body text-body-md text-on-surface-variant max-w-md mb-md">
        {description}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="border-b-[4px] border-on-primary-fixed-variant bg-primary active:border-b-0 active:translate-y-[2px] text-on-primary font-body font-semibold text-sm px-md py-sm rounded-lg inline-flex items-center gap-xs transition-all min-h-[44px]"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
};
