import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'harvest' | 'forest' | 'teal' | 'copper';
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
      'disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ' +
      'active:scale-[0.97] select-none focus-ring';

    const variantStyles: Record<string, string> = {
      primary:
        'bg-teal-600 text-bg-950 hover:bg-teal-500 active:bg-teal-700 ' +
        'shadow-sm shadow-teal-600/30 focus:ring-teal-500',
      secondary:
        'bg-bg-700 text-cream-100 hover:bg-bg-600 active:bg-bg-500 ' +
        'border border-bg-600 focus:ring-bg-500',
      outline:
        'bg-transparent text-teal-400 hover:bg-teal-500/10 active:bg-teal-500/20 ' +
        'border border-teal-500/50 focus:ring-teal-500',
      ghost:
        'bg-transparent text-cream-300 hover:bg-bg-700 active:bg-bg-600 ' +
        'focus:ring-bg-500',
      danger:
        'bg-copper-600 text-bg-950 hover:bg-copper-500 active:bg-copper-700 ' +
        'shadow-sm shadow-copper-600/30 focus:ring-copper-500',
      harvest:
        'bg-harvest-600 text-bg-950 hover:bg-harvest-500 active:bg-harvest-700 ' +
        'shadow-sm shadow-harvest-600/30 focus:ring-harvest-500',
      forest:
        'bg-forest-600 text-bg-950 hover:bg-forest-500 active:bg-forest-700 ' +
        'shadow-sm shadow-forest-600/30 focus:ring-forest-500',
      teal:
        'bg-teal-600 text-bg-950 hover:bg-teal-500 active:bg-teal-700 ' +
        'shadow-sm shadow-teal-600/30 focus:ring-teal-500',
      copper:
        'bg-copper-600 text-bg-950 hover:bg-copper-500 active:bg-copper-700 ' +
        'shadow-sm shadow-copper-600/30 focus:ring-copper-500',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[36px] rounded-lg',
      md: 'px-4 py-2 text-sm gap-2 min-h-[40px] rounded-lg',
      lg: 'px-5 py-2.5 text-base gap-2.5 min-h-[44px] rounded-lg',
      icon: 'p-2 min-h-[40px] min-w-[40px] rounded-lg',
      'icon-sm': 'p-1.5 min-h-[32px] min-w-[32px] rounded-md',
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
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';