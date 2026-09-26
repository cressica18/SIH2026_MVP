import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 
    | 'default' | 'success' | 'warning' | 'danger' | 'info'
    | 'ochre' | 'forest' | 'deepteal' | 'copper' | 'cream'
    | 'botanical' | 'sage' | 'olive';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const variantStyles: Record<string, string> = {
  default:   'bg-bg-750/80 text-cream-400 border-bg-650',
  success:   'bg-gradient-to-br from-forest-900/60 to-forest-800/30 text-forest-200 border-forest-700/50',
  warning:   'bg-gradient-to-br from-olive-900/60 to-olive-800/30 text-olive-200 border-olive-700/50',
  danger:    'bg-gradient-to-br from-copper-900/60 to-copper-800/30 text-copper-200 border-copper-700/50',
  info:      'bg-gradient-to-br from-deepteal-900/60 to-deepteal-800/30 text-deepteal-200 border-deepteal-700/50',
  ochre:     'bg-gradient-to-br from-ochre-900/60 to-ochre-800/30 text-ochre-200 border-ochre-700/50',
  forest:    'bg-gradient-to-br from-forest-900/60 to-forest-800/30 text-forest-200 border-forest-700/50',
  deepteal:  'bg-gradient-to-br from-deepteal-900/60 to-deepteal-800/30 text-deepteal-200 border-deepteal-700/50',
  copper:    'bg-gradient-to-br from-copper-900/60 to-copper-800/30 text-copper-200 border-copper-700/50',
  cream:     'bg-bg-800 text-cream-300 border-bg-650',
  botanical: 'bg-gradient-to-br from-botanical-900/60 to-botanical-800/30 text-botanical-200 border-botanical-700/50',
  sage:      'bg-gradient-to-br from-sage-900/60 to-sage-800/30 text-sage-200 border-sage-700/50',
  olive:     'bg-gradient-to-br from-olive-900/60 to-olive-800/30 text-olive-200 border-olive-700/50',
};

const sizeStyles = {
  xs: 'px-2 py-0.5 text-[10px] gap-1 leading-tight',
  sm: 'px-2.5 py-[3px] text-[11px] gap-1.5 leading-tight',
  md: 'px-3 py-1 text-xs gap-2',
  lg: 'px-3.5 py-1.5 text-sm gap-2.5',
};

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
  ) => (
    <span
      ref={ref}
      className={`
        inline-flex items-center rounded-full border font-medium select-none whitespace-nowrap
        ${variantStyles[variant] || variantStyles.default}
        ${sizeStyles[size] || sizeStyles.sm}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0 animate-[pulseSoft_2.5s_ease-in-out_infinite]"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
);

Badge.displayName = 'Badge';

/* ── StatusBadge ── */
export interface StatusBadgeProps {
  status: string;
  variant?: BadgeProps['variant'];
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  const statusVariants: Record<string, BadgeProps['variant']> = {
    active:      'success',
    pending:     'warning',
    matched:     'info',
    sold:        'success',
    withdrawn:   'default',
    confirmed:   'info',
    in_transit:  'info',
    delivered:   'success',
    settled:     'success',
    disputed:    'danger',
    requested:   'warning',
    approved:    'info',
    disbursed:   'success',
    open:        'warning',
    reviewing:   'info',
    resolved:    'success',
    assigned:    'info',
    cancelled:   'danger',
  };

  const v = variant || statusVariants[status] || 'default';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return <Badge variant={v} size="sm" dot>{label}</Badge>;
};