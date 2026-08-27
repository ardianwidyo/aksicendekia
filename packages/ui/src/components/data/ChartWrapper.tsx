import React from 'react';
import { SkeletonState } from '../states/SkeletonState';
import { EmptyState } from '../states/EmptyState';
import { ErrorState } from '../states/ErrorState';

export interface ChartWrapperProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  state?: 'normal' | 'loading' | 'empty' | 'error';
  onRetry?: () => void;
  className?: string;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  subtitle,
  children,
  state = 'normal',
  onRetry,
  className = '',
}) => {
  if (state === 'loading') {
    return <SkeletonState variant="chart" className={className} />;
  }

  if (state === 'error') {
    return <ErrorState onRetry={onRetry} className={className} />;
  }

  if (state === 'empty') {
    return (
      <EmptyState
        title="Belum Ada Grafik Data"
        description="Belum ada rekaman statistik untuk divisualisasikan."
        className={className}
      />
    );
  }

  return (
    <div className={`p-md rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm space-y-md ${className}`}>
      {title && (
        <div>
          <h3 className="font-heading text-title-md font-bold text-on-surface">
            {title}
          </h3>
          {subtitle && (
            <p className="font-body text-body-sm text-on-surface-variant">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="w-full min-h-[220px] flex items-center justify-center relative">
        {children || (
          <div className="w-full h-48 flex items-end justify-between gap-sm px-md pb-xs">
            <div className="w-full bg-primary-container/40 rounded-t h-[40%]" />
            <div className="w-full bg-primary-container/60 rounded-t h-[75%]" />
            <div className="w-full bg-primary rounded-t h-[90%]" />
            <div className="w-full bg-tertiary rounded-t h-[60%]" />
            <div className="w-full bg-secondary rounded-t h-[80%]" />
          </div>
        )}
      </div>
    </div>
  );
};
