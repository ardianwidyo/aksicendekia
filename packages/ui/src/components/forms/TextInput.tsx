import React from 'react';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ error, leftIcon, rightIcon, className = '', disabled, ...props }, ref) => {
    const errorStyles = error
      ? 'border-error text-error focus:ring-error'
      : 'border-outline-variant focus:border-primary focus:ring-primary';

    return (
      <div className="relative w-full flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-on-surface-variant pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={`w-full min-h-[44px] px-md py-sm bg-surface-container-lowest text-on-surface font-body text-body-md rounded-lg border transition-all placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-surface-container-low disabled:text-on-surface-variant/40 disabled:cursor-not-allowed ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''} ${errorStyles} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-on-surface-variant flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
