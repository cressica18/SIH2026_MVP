import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 
    | 'default' | 'elevated' | 'outlined' | 'panel'
    | 'farmer' | 'buyer' | 'logistics' | 'admin'
    | 'neutral' | 'glass' | 'borderless'
    | 'subtle-harvest' | 'subtle-teal' | 'subtle-botanical' | 'subtle-ochre'
    | 'subtle-evergreen' | 'subtle-deepteal' | 'subtle-sage' | 'subtle-copper';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  interactive?: boolean;
}

const variantStyles: Record<string, string> = {
  default:          'bg-card-neutral',
  outlined:         'bg-bg-850 border border-bg-750',
  elevated:         'bg-card-neutral shadow-md',
  panel:            'bg-bg-800 border border-bg-700',
  farmer:           'bg-card-farmer',
  buyer:            'bg-card-buyer',
  logistics:        'bg-card-logistics',
  admin:            'bg-card-admin',
  neutral:          'bg-card-neutral',
  glass:            'bg-card-glass',
  borderless:       'bg-transparent border-0',
  'subtle-harvest': 'bg-bg-850 border border-harvest-800/40 bg-gradient-to-br from-olive-900/15 to-transparent',
  'subtle-teal':    'bg-bg-850 border border-deepteal-800/40 bg-gradient-to-br from-deepteal-900/15 to-transparent',
  'subtle-botanical':'bg-bg-850 border border-botanical-800/40 bg-gradient-to-br from-botanical-900/15 to-transparent',
  'subtle-ochre':   'bg-bg-850 border border-ochre-800/40 bg-gradient-to-br from-ochre-900/15 to-transparent',
  'subtle-evergreen':'bg-bg-850 border border-forest-800/40 bg-gradient-to-br from-forest-900/15 to-transparent',
  'subtle-deepteal': 'bg-bg-850 border border-deepteal-800/40 bg-gradient-to-br from-deepteal-900/15 to-transparent',
  'subtle-sage':    'bg-bg-850 border border-sage-800/40 bg-gradient-to-br from-sage-900/15 to-transparent',
  'subtle-copper':  'bg-bg-850 border border-copper-800/40 bg-gradient-to-br from-copper-900/15 to-transparent',
};

const paddingStyles = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-5 sm:p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'outlined',
      padding = 'md',
      hover = false,
      interactive = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const hoverStyles = (hover || interactive)
      ? 'transition-all duration-150 hover:shadow-md hover:border-bg-600 hover:-translate-y-px'
      : '';
    const cursorStyles = interactive ? 'cursor-pointer' : '';

    return (
      <div
        ref={ref}
        className={`
          ${variantStyles[variant] || variantStyles.outlined}
          ${paddingStyles[padding as keyof typeof paddingStyles] || paddingStyles.md}
          rounded-xl
          ${hoverStyles}
          ${cursorStyles}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/* ── CardHeader ── */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`mb-3 pb-3 border-b border-bg-700/60 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

/* ── CardTitle ── */
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = '', children, ...props }, ref) => (
    <h3
      ref={ref}
      className={`font-display text-base sm:text-lg font-semibold text-cream-100 tracking-tight leading-snug ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

/* ── CardDescription ── */
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className = '', children, ...props }, ref) => (
    <p
      ref={ref}
      className={`text-xs sm:text-sm text-cream-400 mt-1 leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

/* ── CardContent ── */
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

/* ── CardFooter ── */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`mt-3 pt-3 border-t border-bg-700/60 flex items-center justify-between gap-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';