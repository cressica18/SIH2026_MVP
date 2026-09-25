import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'harvest' | 'forest' | 'teal' | 'copper' | 'cream' | 'pending';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'sm',
      dot = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<string, string> = {
      default: 'bg-bg-700 text-cream-300 border-bg-600',
      success: 'bg-forest-900/50 text-forest-300 border-forest-700',
      warning: 'bg-harvest-900/50 text-harvest-300 border-harvest-700',
      danger: 'bg-copper-900/50 text-copper-300 border-copper-700',
      info: 'bg-teal-900/50 text-teal-300 border-teal-700',
      harvest: 'bg-harvest-900/50 text-harvest-300 border-harvest-700',
      forest: 'bg-forest-900/50 text-forest-300 border-forest-700',
      teal: 'bg-teal-900/50 text-teal-300 border-teal-700',
      copper: 'bg-copper-900/50 text-copper-300 border-copper-700',
      cream: 'bg-cream-200 text-bg-900 border-cream-300',
      pending: 'bg-harvest-900/50 text-harvest-300 border-harvest-700',
    };

    const sizeStyles = {
      xs: 'px-2 py-0.5 text-[10px] gap-1',
      sm: 'px-2.5 py-0.5 text-xs gap-1.5',
      md: 'px-3 py-1 text-sm gap-2',
      lg: 'px-3.5 py-1.5 text-base gap-2.5',
    };

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center rounded-full border font-medium select-none
          ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size]} ${className}
        `}
        {...props}
      >
        {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90" aria-hidden="true" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'harvest' | 'forest' | 'teal' | 'copper';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  const statusVariants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default' | 'harvest' | 'forest' | 'teal' | 'copper'> = {
    active: 'success',
    pending: 'warning',
    matched: 'info',
    sold: 'success',
    withdrawn: 'default',
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

  return <Badge variant={v} size="sm" dot>{label}</Badge>;
};