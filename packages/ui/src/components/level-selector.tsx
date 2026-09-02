'use client';

import * as React from 'react';
import { GradeLevel, GRADE_LEVELS } from '@aksicendekia/design-tokens';
import { isStageInFocus } from '@aksicendekia/content-kit';
import { Baby, Sparkles, Compass, Atom, Check } from 'lucide-react';
import { useTheme } from '../providers/theme-provider';
import { useI18n } from '../providers/i18n-provider';

export interface LevelSelectorProps {
  activeLevel?: GradeLevel;
  onLevelChange?: (level: GradeLevel) => void;
  variant?: 'grid' | 'horizontal';
}

const levelIcons: Record<GradeLevel, React.ReactNode> = {
  tk: <Baby className="w-6 h-6" />,
  sd: <Sparkles className="w-6 h-6" />,
  smp: <Compass className="w-6 h-6" />,
  sma: <Atom className="w-6 h-6" />,
};

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  activeLevel,
  onLevelChange,
  variant = 'grid',
}) => {
  const { gradeLevel, setGradeLevel } = useTheme();
  const { t } = useI18n();

  const currentLevel = activeLevel || gradeLevel;

  const handleSelect = (level: GradeLevel) => {
    setGradeLevel(level);
    if (onLevelChange) {
      onLevelChange(level);
    }
  };

  // Feature 011 (FR-001..FR-002): under focus mode only the in-focus stage(s)
  // are offered. `isStageInFocus` is the identity function when focus is off,
  // so disabling focus mode restores every stage with no code change here.
  const levels: GradeLevel[] = (['tk', 'sd', 'smp', 'sma'] as const).filter((lvl) =>
    isStageInFocus(lvl.toUpperCase() as 'TK' | 'SD' | 'SMP' | 'SMA'),
  );

  const containerLayout =
    variant === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
      : 'flex flex-wrap gap-3';

  return (
    <div className={containerLayout} role="radiogroup" aria-label="Level Selector">
      {levels.map((lvl) => {
        const isSelected = currentLevel === lvl;
        const meta = GRADE_LEVELS[lvl];

        return (
          <button
            key={lvl}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => handleSelect(lvl)}
            className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 text-left min-h-[64px] min-w-[120px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              isSelected
                ? 'bg-primary-container/20 border-primary shadow-md scale-[1.02]'
                : 'bg-surface border-outline-variant hover:border-primary/50 hover:bg-surface-container-low'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isSelected
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {levelIcons[lvl]}
              </div>
              <div>
                <div className="font-heading font-bold text-base text-on-surface">
                  {t(meta.nameKey)}
                </div>
                <div className="text-xs text-on-surface-variant font-medium">
                  {t(meta.subtitleKey)}
                </div>
              </div>
            </div>

            {isSelected && (
              <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm ml-2">
                <Check className="w-4 h-4" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
