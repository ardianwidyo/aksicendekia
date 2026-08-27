import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  selectedValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  selectedValue,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`space-y-xs ${className}`} role="radiogroup">
      {options.map((option) => {
        const isChecked = selectedValue === option.value;
        return (
          <label
            key={option.value}
            className={`flex items-start gap-xs p-sm rounded-lg border border-outline-variant bg-surface-container-lowest cursor-pointer transition-all min-h-[44px] ${
              isChecked ? 'border-primary bg-primary-container/10' : 'hover:bg-surface-container-low'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isChecked}
                disabled={disabled}
                onChange={() => onChange?.(option.value)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded-full border-2 border-outline-variant peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary flex items-center justify-center bg-surface-container-lowest">
                {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
            </div>
            <div>
              <span className="font-body text-body-md font-medium text-on-surface">
                {option.label}
              </span>
              {option.description && (
                <p className="font-body text-body-sm text-on-surface-variant">
                  {option.description}
                </p>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
};
