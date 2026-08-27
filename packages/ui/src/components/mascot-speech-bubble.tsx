'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';

export interface MascotSpeechBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  speakerName?: string;
  message: string;
  avatarIcon?: React.ReactNode;
  pointerPosition?: 'left' | 'bottom';
}

export const MascotSpeechBubble: React.FC<MascotSpeechBubbleProps> = ({
  speakerName = 'Aksi',
  message,
  avatarIcon,
  pointerPosition = 'left',
  className = '',
  ...props
}) => {
  return (
    <div className={`flex items-start gap-3 ${className}`} {...props}>
      {/* Mascot Avatar Container */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-container border-2 border-primary flex items-center justify-center text-on-primary-container shadow-md">
        {avatarIcon || <Sparkles className="w-6 h-6 text-primary" />}
      </div>

      {/* Bubble Container with Pointer */}
      <div className="relative bg-surface-container border border-outline-variant rounded-2xl p-4 shadow-sm max-w-lg">
        {/* Triangular Pointer */}
        {pointerPosition === 'left' && (
          <div className="absolute top-4 -left-2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-surface-container border-b-8 border-b-transparent" />
        )}
        {pointerPosition === 'bottom' && (
          <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-8 border-l-transparent border-t-8 border-t-surface-container border-r-8 border-r-transparent" />
        )}

        <div className="font-bold text-xs text-primary mb-1">{speakerName}</div>
        <p className="text-sm font-medium text-on-surface leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
};
