'use client';

import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 border-slate-300',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    warning: 'bg-amber-100 text-amber-800 border-amber-300',
    error: 'bg-rose-100 text-rose-800 border-rose-300',
    info: 'bg-sky-100 text-sky-800 border-sky-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
