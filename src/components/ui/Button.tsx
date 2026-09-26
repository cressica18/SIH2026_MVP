import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'ochre' | 'forest' | 'deepteal' | 'botanical' | 'olive';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';
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
      'inline-flex items-center justify-center font-medium font-ui transition-all duration-80 ' +
      'disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer ' +
      'active:scale-[0.985] select-none focus-ring';

    const variantStyles: Record<string, string> = {
      primary:
        'bg-forest-500 text-bg-950 hover:bg-forest-400 active:bg-forest-600 ' +
        'shadow-sm shadow-forest-500/20 focus:ring-forest-500',
      secondary:
        'bg-bg-700 text-cream-100 hover:bg-bg-600 active:bg-bg-500 ' +
        'border border-bg-600 focus:ring-bg-500',
      outline:
        'bg-transparent text-forest-400 hover:bg-forest-500/10 active:bg-forest-500/15 ' +
        'border border-forest-500/40 focus:ring-forest-500',
      ghost:
        'bg-transparent text-cream-300 hover:bg-bg-700 active:bg-bg-600 ' +
        'focus:ring-bg-500',
      danger:
        'bg-copper-500 text-bg-950 hover:bg-copper-400 active:bg-copper-600 ' +
        'shadow-sm shadow-copper-500/20 focus:ring-copper-500',
      ochre:
        'bg-olive-500 text-bg-950 hover:bg-olive-400 active:bg-olive-600 ' +
        'shadow-sm shadow-olive-500/20 focus:ring-olive-500',
      forest:
        'bg-forest-500 text-bg-950 hover:bg-forest-400 active:bg-forest-600 ' +
        'shadow-sm shadow-forest-500/20 focus:ring-forest-500',
      deepteal:
        'bg-deepteal-500 text-bg-950 hover:bg-deepteal-400 active:bg-deepteal-600 ' +
        'shadow-sm shadow-deepteal-500/20 focus:ring-deepteal-500',
      botanical:
        'bg-botanical-500 text-bg-950 hover:bg-botanical-400 active:bg-botanical-600 ' +
        'shadow-sm shadow-botanical-500/20 focus:ring-botanical-500',
      olive:
        'bg-olive-500 text-bg-950 hover:bg-olive-400 active:bg-olive-600 ' +
        'shadow-sm shadow-olive-500/20 focus:ring-olive-500',
    };

    const sizeStyles = {
      xs: 'px-3 py-1.5 text-[11px] gap-1.25 min-h-[28px] rounded-xs',
      sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[32px] rounded-sm',
      md: 'px-4 py-2 text-sm gap-2 min-h-[36px] rounded-sm',
      lg: 'px-5 py-2.5 text-base gap-2.5 min-h-[40px] rounded-md',
      icon: 'p-2 min-h-[34px] min-w-[34px] rounded-sm',
      'icon-sm': 'p-1.5 min-h-[28px] min-w-[28px] rounded-xs',
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