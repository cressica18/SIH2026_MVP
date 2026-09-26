import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'harvest' | 'botanical';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-100 ' +
      'disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer ' +
      'active:scale-[0.98] select-none focus-ring';

    const variantStyles: Record<string, string> = {
      primary:
        'bg-botanical-500 text-bg-950 hover:bg-botanical-400 active:bg-botanical-600 ' +
        'shadow-sm shadow-botanical-500/20 focus:ring-botanical-500',
      secondary:
        'bg-bg-700 text-cream-100 hover:bg-bg-600 active:bg-bg-500 ' +
        'border border-bg-600 focus:ring-bg-500',
      outline:
        'bg-transparent text-botanical-400 hover:bg-botanical-500/10 active:bg-botanical-500/15 ' +
        'border border-botanical-500/40 focus:ring-botanical-500',
      ghost:
        'bg-transparent text-cream-300 hover:bg-bg-700 active:bg-bg-600 ' +
        'focus:ring-bg-500',
      danger:
        'bg-copper-500 text-bg-950 hover:bg-copper-400 active:bg-copper-600 ' +
        'shadow-sm shadow-copper-500/20 focus:ring-copper-500',
      harvest:
        'bg-harvest-500 text-bg-950 hover:bg-harvest-400 active:bg-harvest-600 ' +
        'shadow-sm shadow-harvest-500/20 focus:ring-harvest-500',
      botanical:
        'bg-botanical-500 text-bg-950 hover:bg-botanical-400 active:bg-botanical-600 ' +
        'shadow-sm shadow-botanical-500/20 focus:ring-botanical-500',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[34px] rounded-sm',
      md: 'px-4 py-2 text-sm gap-2 min-h-[38px] rounded-sm',
      lg: 'px-5 py-2.5 text-base gap-2.5 min-h-[42px] rounded-md',
      icon: 'p-2 min-h-[38px] min-w-[38px] rounded-sm',
      'icon-sm': 'p-1.5 min-h-[30px] min-w-[30px] rounded-xs',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size]} ${widthStyles} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';