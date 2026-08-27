import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, error, className = '', disabled, ...props }, ref) => {
    const errorStyles = error
      ? 'border-error text-error focus:ring-error'
      : 'border-outline-variant focus:border-primary focus:ring-primary';

    return (
      <div className="relative w-full flex items-center">
        <select
          ref={ref}
          disabled={disabled}
          className={`w-full min-h-[44px] px-md py-sm pr-10 bg-surface-container-lowest text-on-surface font-body text-body-md rounded-lg border appearance-none transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-surface-container-low disabled:text-on-surface-variant/40 disabled:cursor-not-allowed ${errorStyles} ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 pointer-events-none text-on-surface-variant flex items-center">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
