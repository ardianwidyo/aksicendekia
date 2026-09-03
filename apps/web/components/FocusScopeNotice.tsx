'use client';

import React from 'react';
import { EmptyState, useI18n } from '@aksicendekia/ui';
import { isFocusModeEnabled } from '../lib/focus';

type FocusNoticeVariant =
  | 'dashboardBody'
  | 'missionMapBody'
  | 'leaderboardBody'
  | 'achievementsBody'
  | 'catalogBody';

export interface FocusScopeNoticeProps {
  /** Which i18n body copy to show (defaults to the dashboard wording). */
  variant?: FocusNoticeVariant;
  /**
   * When true (the default) the notice only renders while focus mode is on.
   * Pass `force` from a surface that has *already* filtered its data to empty
   * and wants the explanation shown regardless.
   */
  force?: boolean;
  className?: string;
}

/**
 * Feature 011 (US1 / FR-006). A shared, i18n empty state explaining why a
 * still-active but now off-focus surface (parent/teacher dashboards, mission
 * map, leaderboard, achievements) has no data — instead of the surface
 * crashing or rendering a confusing blank. Renders nothing when focus mode is
 * off, so turning the flag off restores each surface with no code change.
 */
export const FocusScopeNotice: React.FC<FocusScopeNoticeProps> = ({
  variant = 'dashboardBody',
  force = false,
  className,
}) => {
  const { t } = useI18n();
  if (!force && !isFocusModeEnabled()) return null;
  return (
    <EmptyState
      title={t('focus.title')}
      description={t(`focus.${variant}`)}
      className={className}
    />
  );
};
