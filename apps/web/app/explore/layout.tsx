'use client';

import React, { useState } from 'react';
import {
  AppShell,
  GuestHeaderBanner,
  GuestProfileModal,
  GuestResetModal,
  GuestSyncModal,
} from '@aksicendekia/ui';
import { useGuestProgress } from '../../lib/context/guest-progress-context';
import { useRouter } from 'next/navigation';

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { state, updateProfile, clearState, isPrivateMode } = useGuestProgress();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);

  return (
    <AppShell>
      <div className="space-y-6">
        <GuestHeaderBanner
          displayName={state?.profile.displayName}
          totalXp={state?.gamification.totalXp}
          currentStreak={state?.gamification.streak.currentStreak}
          isIncognito={isPrivateMode}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenReset={() => setIsResetOpen(true)}
          onOpenSync={() => setIsSyncOpen(true)}
        />

        {children}
      </div>

      {state && (
        <GuestProfileModal
          isOpen={isProfileOpen}
          currentName={state.profile.displayName}
          currentAvatarId={state.profile.avatarId}
          onClose={() => setIsProfileOpen(false)}
          onSave={updateProfile}
        />
      )}

      <GuestResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={clearState}
      />

      <GuestSyncModal
        isOpen={isSyncOpen}
        totalXp={state?.gamification.totalXp || 0}
        completedLessonsCount={state?.curriculumProgress.completedLessonIds.length || 0}
        onClose={() => setIsSyncOpen(false)}
        onConfirm={() => {
          setIsSyncOpen(false);
          router.push('/register');
        }}
        onSkip={() => setIsSyncOpen(false)}
      />
    </AppShell>
  );
}
