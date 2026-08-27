'use client';

import React, { useState } from 'react';
import { SkeletonState } from '../states/SkeletonState';
import { EmptyState } from '../states/EmptyState';
import { ErrorState } from '../states/ErrorState';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  state?: 'normal' | 'loading' | 'empty' | 'error';
  onRetry?: () => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTabId,
  state = 'normal',
  onRetry,
  className = '',
}) => {
  const [activeId, setActiveId] = useState(defaultTabId || tabs[0]?.id || '');

  if (state === 'loading') {
    return <SkeletonState variant="generic" className={className} />;
  }

  if (state === 'error') {
    return <ErrorState onRetry={onRetry} className={className} />;
  }

  if (state === 'empty' || tabs.length === 0) {
    return <EmptyState title="Tidak Ada Tab" description="Konten tab belum tersedia." className={className} />;
  }

  const activeTab = tabs.find((t) => t.id === activeId) || tabs[0];

  return (
    <div className={`w-full space-y-md ${className}`}>
      <div className="flex border-b border-outline-variant gap-xs overflow-x-auto" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(tab.id)}
              className={`flex items-center gap-xs px-md py-sm font-body text-label-lg font-semibold border-b-2 transition-all whitespace-nowrap min-h-[44px] ${
                isActive
                  ? 'border-primary text-primary bg-primary-container/10'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="font-body text-body-md text-on-surface">
        {activeTab?.content}
      </div>
    </div>
  );
};
