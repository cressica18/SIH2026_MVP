import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'panel' | 'farmer' | 'buyer' | 'logistics' | 'admin' | 'subtle' | 'subtle-harvest' | 'subtle-forest' | 'subtle-teal' | 'subtle-copper';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  interactive?: boolean;
}

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
    const variantStyles: Record<string, string> = {
      default: 'bg-bg-850 border border-bg-750',
      outlined: 'bg-bg-850 border border-bg-750',
      elevated: 'bg-bg-800 border border-bg-700 shadow-lg',
      panel: 'bg-bg-800 border border-bg-700',
      farmer: 'bg-gradient-card-forest border border-forest-800',
      buyer: 'bg-gradient-card-teal border border-teal-800',
      logistics: 'bg-gradient-card-harvest border border-harvest-800',
      admin: 'bg-gradient-card-sage border border-sage-800',
      subtle: 'bg-bg-800 border border-bg-700',
      'subtle-harvest': 'bg-gradient-card-harvest/50 border border-harvest-800/50',
      'subtle-forest': 'bg-gradient-card-forest/50 border border-forest-800/50',
      'subtle-teal': 'bg-gradient-card-teal/50 border border-teal-800/50',
      'subtle-copper': 'bg-gradient-card-copper/50 border border-copper-800/50',
    };

    const paddingStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6 sm:p-7',
    };

    const hoverStyles = (hover || interactive)
      ? 'transition-all duration-200 hover:shadow-lg hover:border-sage-600 hover:-translate-y-0.5'
      : '';

    const cursorStyles = interactive ? 'cursor-pointer' : '';

    return (
      <div
        ref={ref}
        className={`${variantStyles[variant] || variantStyles.outlined} ${paddingStyles[padding as keyof typeof paddingStyles] || paddingStyles.md} rounded-xl ${hoverStyles} ${cursorStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`mb-4 pb-4 border-b border-bg-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = '', children, ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-base sm:text-lg font-semibold text-cream-50 tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
);

CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className = '', children, ...props }, ref) => (
    <p
      ref={ref}
      className={`text-sm text-cream-400 mt-1 leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`mt-4 pt-4 border-t border-bg-700 flex items-center justify-between gap-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';