'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-on-surface/40 backdrop-blur-sm animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full max-w-lg bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between px-md py-sm border-b border-outline-variant">
            <h3 className="font-heading text-title-md font-bold text-on-surface">
              {title}
            </h3>
            <button
              onClick={onClose}
              aria-label="Tutup Dialog"
              className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-md overflow-y-auto flex-1 font-body text-body-md text-on-surface">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-xs px-md py-sm border-t border-outline-variant bg-surface-container-low">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
