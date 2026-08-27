'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { SkeletonState } from '../states/SkeletonState';
import { EmptyState } from '../states/EmptyState';
import { ErrorState } from '../states/ErrorState';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  divider?: boolean;
}

export interface DropdownMenuProps {
  triggerLabel: string;
  triggerIcon?: React.ReactNode;
  items: DropdownMenuItem[];
  state?: 'normal' | 'loading' | 'empty' | 'error';
  onRetry?: () => void;
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  triggerLabel,
  triggerIcon,
  items,
  state = 'normal',
  onRetry,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex items-center gap-xs px-md py-sm rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-body text-label-md font-semibold transition-colors min-h-[44px]"
      >
        {triggerIcon}
        <span>{triggerLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-xs w-56 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg z-40 overflow-hidden animate-fade-in py-xs">
          {state === 'loading' && <SkeletonState rows={2} className="p-xs" />}
          {state === 'error' && <ErrorState onRetry={onRetry} className="p-xs text-xs" />}
          {state === 'empty' && (
            <EmptyState title="Kosong" description="Tidak ada menu." className="p-xs text-xs" />
          )}
          {state === 'normal' &&
            items.map((item) => (
              <React.Fragment key={item.id}>
                {item.divider && <div className="my-xs border-t border-outline-variant" />}
                <button
                  onClick={() => {
                    item.onClick?.();
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-xs px-md py-sm font-body text-body-sm text-left transition-colors ${
                    item.danger
                      ? 'text-error hover:bg-error-container/30 font-semibold'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </React.Fragment>
            ))}
        </div>
      )}
    </div>
  );
};
