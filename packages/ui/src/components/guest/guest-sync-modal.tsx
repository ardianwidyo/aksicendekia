'use client';

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Modal } from '../forms/Modal';
import { Button } from '../button';
import { useI18n } from '../../providers/i18n-provider';

export interface GuestSyncModalProps {
  isOpen: boolean;
  totalXp: number;
  completedLessonsCount: number;
  onClose: () => void;
  onConfirm: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export const GuestSyncModal: React.FC<GuestSyncModalProps> = ({
  isOpen,
  totalXp,
  completedLessonsCount,
  onClose,
  onConfirm,
  onSkip,
  isLoading = false,
}) => {
  const { t } = useI18n();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('guest.sync.dialog.title') || 'Simpan Progres Belajarmu!'}
    >
      <div className="space-y-5">
        <div className="p-4 bg-primary/10 rounded-2xl border border-primary/25 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-primary text-on-primary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface">
              {totalXp} XP &amp; {completedLessonsCount} Pelajaran Telah Selesai
            </h4>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              {t('guest.sync.dialog.description') ||
                'Kami mendeteksi progres belajar tamu di perangkat ini. Apakah kamu ingin memindahkan XP, modul selesai, dan streak ke akun barumu?'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            type="button"
            onClick={onSkip}
            disabled={isLoading}
          >
            {t('guest.sync.dialog.skip') || 'Lewati (Mulai dari Awal)'}
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isLoading ? 'Menyimpan...' : (t('guest.sync.dialog.confirm') || 'Ya, Simpan ke Akunku')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
