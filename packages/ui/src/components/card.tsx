import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'container' | 'outline' | 'elevated';
  padding?: 'xs' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'surface',
      padding = 'md',
      interactive = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'min-h-[120px] rounded-2xl transition-all duration-200 ease-in-out border';

    const variantStyles = {
      surface: 'bg-surface border-outline-variant text-on-surface shadow-sm',
      container: 'bg-surface-container border-outline-variant text-on-surface',
      outline: 'bg-transparent border-outline text-on-surface',
      elevated:
        'bg-surface border-outline-variant text-on-surface shadow-md hover:shadow-lg',
    };

    const paddingStyles = {
      xs: 'p-2',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
    };

    const interactiveStyles = interactive
      ? 'hover:-translate-y-1 hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      : '';

    const combinedClassName = [
      baseStyles,
      variantStyles[variant],
      paddingStyles[padding],
      interactiveStyles,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        tabIndex={interactive ? 0 : undefined}
        className={combinedClassName}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
