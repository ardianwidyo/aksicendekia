'use client';

'use client';

import * as React from 'react';
import { useState } from 'react';
import { Sidebar } from './sidebar';
import { TopBar } from './topbar';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Backdrop overlay for mobile drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuToggle={() => setIsSidebarOpen(true)} />

        {/* Content Container (Fluid Grid: 4-col 16px mobile, 12-col 1200px desktop) */}
        <main className="flex-1 px-4 md:px-8 py-6 max-w-container w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
