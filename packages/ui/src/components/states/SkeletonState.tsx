import React from 'react';

export interface SkeletonStateProps {
  className?: string;
  rows?: number;
  variant?: 'table' | 'card' | 'chart' | 'generic';
}

export const SkeletonState: React.FC<SkeletonStateProps> = ({
  className = '',
  rows = 3,
  variant = 'generic',
}) => {
  if (variant === 'table') {
    return (
      <div className={`w-full space-y-3 p-md ${className}`}>
        <div className="h-8 bg-surface-container-high animate-pulse rounded-md w-full" />
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex gap-md items-center">
            <div className="h-10 bg-surface-container animate-pulse rounded-md flex-1" />
            <div className="h-10 bg-surface-container animate-pulse rounded-md w-24" />
            <div className="h-10 bg-surface-container animate-pulse rounded-md w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={`w-full h-64 p-md flex flex-col justify-end gap-xs ${className}`}>
        <div className="h-6 bg-surface-container-high animate-pulse rounded-md w-1/3 mb-auto" />
        <div className="flex items-end justify-between gap-sm h-40">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-surface-container-high animate-pulse rounded-t-md w-full"
              style={{ height: `${(idx + 1) * 15 + 20}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`p-md rounded-xl bg-surface-container-lowest border border-outline-variant space-y-md ${className}`}>
        <div className="flex items-center gap-sm">
          <div className="w-12 h-12 rounded-full bg-surface-container animate-pulse" />
          <div className="space-y-xs flex-1">
            <div className="h-4 bg-surface-container-high animate-pulse rounded w-1/2" />
            <div className="h-3 bg-surface-container animate-pulse rounded w-1/3" />
          </div>
        </div>
        <div className="h-12 bg-surface-container animate-pulse rounded-md w-full" />
      </div>
    );
  }

  return (
    <div className={`w-full space-y-sm p-md animate-pulse ${className}`}>
      <div className="h-6 bg-surface-container-high rounded-md w-3/4" />
      <div className="h-4 bg-surface-container rounded-md w-full" />
      <div className="h-4 bg-surface-container rounded-md w-5/6" />
    </div>
  );
};
