import React from 'react';
import { SearchX, FolderOpen } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Belum Ada Data',
  description = 'Tidak ada informasi yang tersedia untuk ditampilkan saat ini.',
  actionLabel,
  onAction,
  icon,
  className = '',
}) => {
  return (
    <div
      className={`border border-outline-variant bg-surface-container-lowest rounded-xl p-lg flex flex-col items-center justify-center text-center min-h-[280px] ${className}`}
    >
      <div className="w-20 h-20 mb-md rounded-full bg-surface-container-low flex items-center justify-center text-primary">
        {icon || <SearchX className="w-10 h-10 stroke-[1.5]" />}
      </div>
      <h3 className="font-heading text-title-md text-on-surface mb-xs font-semibold">
        {title}
      </h3>
      <p className="font-body text-body-md text-on-surface-variant max-w-md mb-md">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="border-b-[4px] border-on-primary-fixed-variant bg-primary active:border-b-0 active:translate-y-[2px] text-on-primary font-body font-semibold text-sm px-md py-sm rounded-lg inline-flex items-center gap-xs transition-all min-h-[44px]"
        >
          <FolderOpen className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
