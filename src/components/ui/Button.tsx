import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'agri';
  size?: 'sm' | 'md' | 'lg';
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
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] select-none';

    const variantStyles = {
      primary: 'bg-agri-600 text-white hover:bg-agri-700 focus:ring-agri-500 shadow-sm shadow-agri-600/20 active:bg-agri-800',
      secondary: 'bg-earth-100 text-earth-900 hover:bg-earth-200 focus:ring-earth-400 active:bg-earth-300 border border-earth-300',
      outline: 'bg-white border border-earth-300 text-earth-800 hover:bg-earth-50 hover:border-earth-400 focus:ring-agri-500 shadow-xs',
      ghost: 'bg-transparent text-earth-700 hover:bg-earth-100 hover:text-earth-900 focus:ring-agri-500 active:bg-earth-200',
      danger: 'bg-alert-600 text-white hover:bg-alert-700 focus:ring-alert-500 shadow-sm shadow-alert-600/20 active:bg-alert-800',
      agri: 'bg-gradient-to-r from-agri-600 to-agri-700 text-white hover:from-agri-700 hover:to-agri-800 focus:ring-agri-500 shadow-sm shadow-agri-600/20 active:from-agri-800 active:to-agri-900',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[36px]',
      md: 'px-4 py-2.5 text-xs sm:text-sm gap-2 min-h-[40px]',
      lg: 'px-5 py-3 text-sm sm:text-base gap-2.5 min-h-[48px]',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
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