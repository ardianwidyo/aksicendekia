import React from 'react';
import { Check, Minus } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, indeterminate, checked, className = '', disabled, ...props }, ref) => {
    return (
      <label className={`inline-flex items-center gap-xs cursor-pointer select-none min-h-[44px] ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}>
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <div className="w-5 h-5 rounded border-2 border-outline-variant bg-surface-container-lowest peer-checked:bg-primary peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 transition-all flex items-center justify-center text-on-primary">
            {indeterminate ? (
              <Minus className="w-3.5 h-3.5 stroke-[3]" />
            ) : (
              checked && <Check className="w-3.5 h-3.5 stroke-[3]" />
            )}
          </div>
        </div>
        {label && (
          <span className="font-body text-body-md text-on-surface">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
