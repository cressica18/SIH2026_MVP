import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'pending' | 'agri';
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
      default: 'bg-earth-100 text-earth-800 border-earth-300 font-bold',
      success: 'bg-agri-50 text-agri-900 border-agri-300 font-bold',
      warning: 'bg-harvest-50 text-harvest-900 border-harvest-300 font-bold',
      danger: 'bg-alert-50 text-alert-900 border-alert-300 font-bold',
      info: 'bg-sky-50 text-sky-900 border-sky-300 font-bold',
      neutral: 'bg-earth-100 text-earth-800 border-earth-300 font-bold',
      pending: 'bg-harvest-50 text-harvest-900 border-harvest-300 font-bold',
      agri: 'bg-agri-100 text-agri-800 border-agri-300 font-bold',
    };

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-[11px] gap-1',
      md: 'px-2.5 py-1 text-xs gap-1.5',
      lg: 'px-3 py-1.5 text-sm gap-2',
    };

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center rounded-full border tracking-tight shadow-xs select-none
          ${variantStyles[variant]} ${sizeStyles[size]} ${className}
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
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'neutral' | 'agri';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  const statusVariants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'default' | 'neutral' | 'agri'> = {
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

  return <Badge variant={v} size="sm" dot>{label}</Badge>;
};