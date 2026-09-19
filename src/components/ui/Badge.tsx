import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'pending';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: 'bg-stone-100 text-stone-700',
      success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      warning: 'bg-amber-50 text-amber-700 border border-amber-100',
      danger: 'bg-rose-50 text-rose-700 border border-rose-100',
      info: 'bg-blue-50 text-blue-700 border border-blue-100',
      neutral: 'bg-stone-100 text-stone-600',
      pending: 'bg-amber-50 text-amber-700 border border-amber-100',
    };

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-[10px] gap-1',
      md: 'px-2.5 py-1 text-xs gap-1.5',
      lg: 'px-3 py-1.5 text-sm gap-2',
    };

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center font-semibold rounded-full border
          ${variantStyles[variant]} ${sizeStyles[size]} ${className}
        `}
        {...props}
      >
        {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current opacity-70`} aria-hidden="true" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'neutral';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  const statusVariants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'default' | 'neutral'> = {
    active: 'success',
    pending: 'warning',
    matched: 'info',
    sold: 'success',
    withdrawn: 'neutral',
    confirmed: 'info',
    in_transit: 'info',
    delivered: 'success',
    settled: 'success',
    disputed: 'danger',
    requested: 'warning',
    approved: 'info',
    disbursed: 'success',
    open: 'warning',
    reviewing: 'info',
    resolved: 'success',
  };

  const v = variant || statusVariants[status] || 'default';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return <Badge variant={v} size="sm">{label}</Badge>;
};