'use client';

import React from 'react';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../button';
import { Card } from '../card';
import { useI18n } from '../../providers/i18n-provider';

export interface GuestFeatureGateCardProps {
  featureTitle?: string;
  description?: string;
  onRegisterClick?: () => void;
  onLoginClick?: () => void;
}

export const GuestFeatureGateCard: React.FC<GuestFeatureGateCardProps> = ({
  featureTitle,
  description,
  onRegisterClick,
  onLoginClick,
}) => {
  const { t } = useI18n();

  return (
    <Card variant="surface" padding="lg" className="text-center max-w-lg mx-auto my-8 space-y-5 border border-primary/20 shadow-md">
      <div className="w-14 h-14 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
        <Lock className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-heading font-bold text-on-surface">
          {featureTitle || t('guest.feature_gate.title') || 'Fitur Khusus Pengguna Terdaftar'}
        </h3>
        <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
          {description ||
            t('guest.feature_gate.description') ||
            'Fitur ini membutuhkan akun agar dapat terhubung dengan teman, guru, atau orang tua.'}
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        {onRegisterClick && (
          <Button
            variant="primary"
            size="md"
            onClick={onRegisterClick}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {t('guest.feature_gate.cta') || 'Daftar Akun Gratis'}
          </Button>
        )}
        {onLoginClick && (
          <Button
            variant="ghost"
            size="md"
            onClick={onLoginClick}
          >
            {t('guest.feature_gate.login_cta') || 'Sudah punya akun? Masuk'}
          </Button>
        )}
      </div>
    </Card>
  );
};
