'use client';

import * as React from 'react';
import { Award, Lock } from 'lucide-react';

export interface AchievementBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: React.ReactNode;
  unlocked?: boolean;
  level?: 'bronze' | 'silver' | 'gold' | 'master';
  size?: 'sm' | 'md' | 'lg';
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  title,
  icon,
  unlocked = true,
  level = 'gold',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeMap = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-20 h-20 text-2xl',
    lg: 'w-28 h-28 text-4xl',
  };

  const borderStyles = unlocked
    ? 'border-4 border-secondary shadow-lg hover:scale-105'
    : 'border-4 border-outline-variant opacity-50 grayscale';

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`} {...props}>
      <div
        className={`relative rounded-full flex items-center justify-center transition-all duration-300 ${sizeMap[size]} ${borderStyles} bg-gradient-to-br from-secondary-container via-surface to-primary-container overflow-hidden`}
        aria-label={`${title} (${unlocked ? 'Terbuka' : 'Terkunci'})`}
      >
        {/* Inner Sunburst pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(254,166,25,0.25)_0,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 text-on-surface">
          {unlocked ? (
            icon || <Award className="w-8 h-8 text-secondary" />
          ) : (
            <Lock className="w-6 h-6 text-on-surface-variant" />
          )}
        </div>
      </div>
      <span className="text-xs font-bold text-center text-on-surface max-w-[90px] truncate">
        {title}
      </span>
    </div>
  );
};
