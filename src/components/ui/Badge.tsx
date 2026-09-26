import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'ochre' | 'evergreen' | 'deepteal' | 'copper' | 'cream' | 'botanical' | 'sage' | 'harvest';
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
      default: 'bg-bg-700 text-cream-400 border-bg-600',
      success: 'bg-evergreen-900/40 text-evergreen-300 border-evergreen-800',
      warning: 'bg-ochre-900/40 text-ochre-300 border-ochre-800',
      danger: 'bg-copper-900/40 text-copper-300 border-copper-800',
      info: 'bg-deepteal-900/40 text-deepteal-300 border-deepteal-800',
      ochre: 'bg-ochre-900/40 text-ochre-300 border-ochre-800',
      evergreen: 'bg-evergreen-900/40 text-evergreen-300 border-evergreen-800',
      deepteal: 'bg-deepteal-900/40 text-deepteal-300 border-deepteal-800',
      copper: 'bg-copper-900/40 text-copper-300 border-copper-800',
      cream: 'bg-cream-200 text-bg-900 border-cream-300',
      botanical: 'bg-botanical-900/40 text-botanical-300 border-botanical-800',
      sage: 'bg-sage-900/40 text-sage-300 border-sage-800',
      harvest: 'bg-harvest-900/40 text-harvest-300 border-harvest-800',
    };

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center rounded-full border font-medium select-none
          ${variantStyles[variant] || variantStyles.default}
          ${size === 'xs' ? 'px-2 py-0.5 text-[10px] gap-1' : ''}
          ${size === 'sm' ? 'px-2.5 py-0.5 text-[11px] gap-1.5' : ''}
          ${size === 'md' ? 'px-3 py-1 text-xs gap-2' : ''}
          ${size === 'lg' ? 'px-3.5 py-1.5 text-sm gap-2.5' : ''}
          ${className}
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
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'ochre' | 'evergreen' | 'deepteal' | 'copper' | 'botanical' | 'sage';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  const statusVariants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default' | 'ochre' | 'evergreen' | 'deepteal' | 'copper' | 'botanical' | 'sage'> = {
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