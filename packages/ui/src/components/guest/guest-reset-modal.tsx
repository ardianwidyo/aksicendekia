'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../forms/Modal';
import { Button } from '../button';
import { useI18n } from '../../providers/i18n-provider';

export interface GuestResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const GuestResetModal: React.FC<GuestResetModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t } = useI18n();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('guest.reset.dialog.title') || 'Reset Progres Belajar Lokal?'}
    >
      <div className="space-y-4">
        <div className="p-4 bg-error/10 rounded-2xl border border-error/25 flex items-start gap-3 text-error">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-on-surface">
            {t('guest.reset.dialog.description') ||
              'Seluruh XP, modul selesai, dan riwayat belajar di perangkat ini akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.'}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            {t('guest.reset.dialog.cancel') || 'Batal'}
          </Button>
          <Button
            variant="primary"
            type="button"
            className="bg-error hover:bg-error/90 text-on-error border-error"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {t('guest.reset.dialog.confirm') || 'Ya, Hapus Semua Progres'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
