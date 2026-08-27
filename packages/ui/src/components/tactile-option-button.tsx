import React from 'react';

export interface TactileOptionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  optionKey?: string;
  status?: 'default' | 'selected' | 'correct' | 'incorrect';
  disabled?: boolean;
}

export const TactileOptionButton: React.FC<TactileOptionButtonProps> = ({
  label,
  optionKey,
  status = 'default',
  disabled = false,
  className = '',
  onClick,
  ...props
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'correct':
        return 'bg-emerald-600 text-white border-emerald-800 shadow-[0_4px_0_#065f46] cursor-default';
      case 'incorrect':
        return 'bg-rose-600 text-white border-rose-800 shadow-[0_4px_0_#9f1239] cursor-default';
      case 'selected':
        return 'bg-blue-100 text-blue-900 border-blue-600 shadow-[0_2px_0_#1d4ed8] translate-y-[2px]';
      case 'default':
      default:
        return 'bg-white text-slate-800 border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 shadow-[0_4px_0_#cbd5e1] active:translate-y-[2px] active:shadow-[0_2px_0_#cbd5e1]';
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        w-full min-h-[52px] px-5 py-3 rounded-xl border-2 font-medium text-left
        flex items-center gap-3 transition-all duration-100 ease-out select-none
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-75 disabled:cursor-not-allowed
        ${getStatusStyles()}
        ${className}
      `}
      {...props}
    >
      {optionKey && (
        <span
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0
            ${
              status === 'correct' || status === 'incorrect'
                ? 'bg-white/20 text-white'
                : status === 'selected'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }
          `}
        >
          {optionKey}
        </span>
      )}
      <span className="flex-1 text-base leading-snug">{label}</span>
    </button>
  );
};
