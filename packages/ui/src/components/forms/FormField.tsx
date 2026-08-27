import React from 'react';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helperText,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-xs w-full ${className}`}>
      {label && (
        <label className="block font-body text-label-md font-semibold text-on-surface">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="font-body text-body-sm text-error font-medium">{error}</p>
      ) : helperText ? (
        <p className="font-body text-body-sm text-on-surface-variant">{helperText}</p>
      ) : null}
    </div>
  );
};
