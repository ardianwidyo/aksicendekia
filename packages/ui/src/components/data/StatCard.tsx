import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { SkeletonState } from '../states/SkeletonState';
import { EmptyState } from '../states/EmptyState';
import { ErrorState } from '../states/ErrorState';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  state?: 'normal' | 'loading' | 'empty' | 'error';
  onRetry?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  state = 'normal',
  onRetry,
  className = '',
}) => {
  if (state === 'loading') {
    return <SkeletonState variant="card" className={className} />;
  }

  if (state === 'error') {
    return <ErrorState onRetry={onRetry} className={className} />;
  }

  if (state === 'empty') {
    return <EmptyState title="Statistik Kosong" description="Belum ada data statistik." className={className} />;
  }

  return (
    <div className={`p-md rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-xs">
        <span className="font-body text-label-md font-medium text-on-surface-variant">
          {title}
        </span>
        {icon && (
          <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-sm">
        <span className="font-heading text-display-lg font-bold text-on-surface text-3xl">
          {value}
        </span>
        {change && (
          <div
            className={`flex items-center gap-0.5 text-xs font-semibold px-xs py-0.5 rounded-full ${
              trend === 'up'
                ? 'bg-tertiary-container/30 text-tertiary'
                : trend === 'down'
                ? 'bg-error-container/30 text-error'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            {trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
            {trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );
};
