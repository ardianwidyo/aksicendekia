'use client';

import React, { useState } from 'react';
import { Modal } from '../forms/Modal';
import { TextInput } from '../forms/TextInput';
import { Button } from '../button';
import { useI18n } from '../../providers/i18n-provider';

const PRESET_AVATARS = [
  { id: 'avatar_default_kancil', name: 'Kancil Cerdik', emoji: '🦌' },
  { id: 'avatar_garuda', name: 'Garuda Berani', emoji: '🦅' },
  { id: 'avatar_komodo', name: 'Komodo Kuat', emoji: '🦎' },
  { id: 'avatar_badak', name: 'Badak Tangguh', emoji: '🦏' },
  { id: 'avatar_orangutan', name: 'Mawas Bijak', emoji: '🦧' },
  { id: 'avatar_harimau', name: 'Harimau Gigih', emoji: '🐯' },
];

export interface GuestProfileModalProps {
  isOpen: boolean;
  currentName: string;
  currentAvatarId: string;
  onClose: () => void;
  onSave: (data: { displayName: string; avatarId: string }) => void;
}

export const GuestProfileModal: React.FC<GuestProfileModalProps> = ({
  isOpen,
  currentName,
  currentAvatarId,
  onClose,
  onSave,
}) => {
  const { t } = useI18n();
  const [name, setName] = useState(currentName);
  const [avatarId, setAvatarId] = useState(currentAvatarId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      displayName: name.trim() || 'Siswa Hebat',
      avatarId,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('guest.profile.edit_title') || 'Profil Belajar Lokal'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-1">
            {t('guest.profile.name_label') || 'Nama Panggilan'}
          </label>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('guest.profile.name_placeholder') || 'Masukkan nama panggilanmu'}
            maxLength={30}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2">
            {t('guest.profile.avatar_label') || 'Pilih Karakter Favorit'}
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {PRESET_AVATARS.map((av) => {
              const isSelected = avatarId === av.id;
              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvatarId(av.id)}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 min-h-[44px] ${
                    isSelected
                      ? 'border-primary bg-primary/10 ring-2 ring-primary text-primary font-bold shadow-sm'
                      : 'border-outline/20 hover:border-primary/40 text-on-surface-variant'
                  }`}
                >
                  <span className="text-2xl">{av.emoji}</span>
                  <span className="text-xs truncate w-full">{av.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            {t('common.cancel') || 'Batal'}
          </Button>
          <Button variant="primary" type="submit">
            {t('guest.profile.save') || 'Simpan Profil'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
