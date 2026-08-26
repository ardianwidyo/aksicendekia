import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 select-none min-h-[44px] min-w-[44px]';

    const variantStyles = {
      primary:
        'bg-primary text-on-primary border-b-4 border-black/25 rounded-xl shadow-md hover:bg-primary/90 active:translate-y-[2px] active:border-b-2 active:shadow-sm disabled:opacity-50 disabled:pointer-events-none',
      secondary:
        'bg-secondary text-on-secondary border-b-4 border-black/25 rounded-xl shadow-md hover:bg-secondary/90 active:translate-y-[2px] active:border-b-2 active:shadow-sm disabled:opacity-50 disabled:pointer-events-none',
      ghost:
        'bg-transparent text-on-surface hover:bg-surface-container-high rounded-xl disabled:opacity-50 disabled:pointer-events-none',
      outline:
        'bg-surface border-2 border-outline text-on-surface hover:bg-surface-container rounded-xl disabled:opacity-50 disabled:pointer-events-none',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-7 py-3.5 text-base',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    const combinedClassName = [
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      widthStyle,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={combinedClassName}
        {...props}
      >
        {leftIcon && <span className="mr-2 inline-flex items-center">{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span className="ml-2 inline-flex items-center">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
