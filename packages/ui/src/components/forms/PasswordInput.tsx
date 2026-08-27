'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { TextInput, TextInputProps } from './TextInput';

export interface PasswordInputProps extends Omit<TextInputProps, 'type'> {}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <TextInput
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
            className="p-1 hover:text-on-surface text-on-surface-variant transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center rounded focus:outline-none"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
