import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'ochre' | 'forest' | 'deepteal' | 'botanical' | 'olive' | 'copper' | 'teal' | 'sage';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';
  loading?: boolean;
  fullWidth?: boolean;
}

const variantMap: Record<string, string> = {
  // Deep forest gradient — the primary CTA
  primary:
    'bg-gradient-to-br from-forest-700 via-forest-600 to-botanical-600 text-cream-50 font-semibold ' +
    'shadow-[0_3px_12px_-3px_rgb(19_115_68_/_0.45),inset_0_1px_0_rgb(255_255_255_/_0.08)] ' +
    'hover:from-forest-600 hover:via-botanical-500 hover:to-forest-500 hover:-translate-y-px ' +
    'hover:shadow-[0_5px_18px_-3px_rgb(19_115_68_/_0.55)] ' +
    'active:translate-y-0 active:shadow-[0_2px_6px_-2px_rgb(19_115_68_/_0.3)] ' +
    'disabled:opacity-30 focus-ring',

  // Tonal surface — no color, just depth
  secondary:
    'bg-gradient-to-b from-bg-750 to-bg-800 text-cream-200 font-medium ' +
    'border border-bg-650 ' +
    'shadow-[0_1px_4px_-1px_rgb(1_5_3_/_0.4),inset_0_1px_0_rgb(255_255_255_/_0.03)] ' +
    'hover:from-bg-700 hover:to-bg-750 hover:border-bg-600 hover:text-cream-100 ' +
    'active:from-bg-800 active:to-bg-850 ' +
    'disabled:opacity-30 focus-ring',

  // Transparent with forest border
  outline:
    'bg-transparent text-forest-300 font-medium ' +
    'border border-forest-700/50 ' +
    'hover:bg-forest-900/25 hover:border-forest-600/70 hover:text-forest-200 ' +
    'active:bg-forest-900/40 ' +
    'disabled:opacity-30 focus-ring',

  // Minimal — text only, very subtle bg on hover
  ghost:
    'bg-transparent text-cream-400 font-medium ' +
    'hover:bg-bg-750 hover:text-cream-200 ' +
    'active:bg-bg-700 ' +
    'disabled:opacity-30 focus-ring',

  // Copper-amber gradient for destructive/safety actions
  danger:
    'bg-gradient-to-br from-copper-800 via-copper-700 to-ochre-700 text-cream-100 font-semibold ' +
    'shadow-[0_3px_12px_-3px_rgb(190_79_18_/_0.4),inset_0_1px_0_rgb(255_255_255_/_0.07)] ' +
    'hover:from-copper-700 hover:via-copper-600 hover:to-ochre-600 hover:-translate-y-px ' +
    'hover:shadow-[0_5px_18px_-3px_rgb(190_79_18_/_0.5)] ' +
    'active:translate-y-0 ' +
    'disabled:opacity-30 focus-ring',

  // Ochre / amber for finance
  ochre:
    'bg-gradient-to-br from-ochre-800 via-ochre-700 to-ochre-600 text-cream-100 font-semibold ' +
    'shadow-[0_3px_12px_-3px_rgb(204_118_14_/_0.4),inset_0_1px_0_rgb(255_255_255_/_0.07)] ' +
    'hover:from-ochre-700 hover:via-ochre-600 hover:to-ochre-500 hover:-translate-y-px ' +
    'hover:shadow-[0_5px_18px_-3px_rgb(204_118_14_/_0.5)] ' +
    'active:translate-y-0 ' +
    'disabled:opacity-30 focus-ring',

  copper:
    'bg-gradient-to-br from-copper-800 via-copper-700 to-ochre-700 text-cream-100 font-semibold ' +
    'shadow-[0_3px_12px_-3px_rgb(190_79_18_/_0.4),inset_0_1px_0_rgb(255_255_255_/_0.07)] ' +
    'hover:from-copper-700 hover:via-copper-600 hover:to-ochre-600 hover:-translate-y-px ' +
    'hover:shadow-[0_5px_18px_-3px_rgb(190_79_18_/_0.5)] ' +
    'active:translate-y-0 ' +
    'disabled:opacity-30 focus-ring',

  // Forest — alias of primary
  forest:
    'bg-gradient-to-br from-forest-700 via-forest-600 to-botanical-600 text-cream-50 font-semibold ' +
    'shadow-[0_3px_12px_-3px_rgb(19_115_68_/_0.45),inset_0_1px_0_rgb(255_255_255_/_0.08)] ' +
    'hover:from-forest-600 hover:via-botanical-500 hover:to-forest-500 hover:-translate-y-px ' +
    'hover:shadow-[0_5px_18px_-3px_rgb(19_115_68_/_0.55)] ' +
    'active:translate-y-0 ' +
    'disabled:opacity-30 focus-ring',

  botanical:
    'bg-gradient-to-br from-botanical-700 via-botanical-600 to-forest-600 text-cream-50 font-semibold ' +
    'shadow-[0_3px_12px_-3px_rgb(29_125_60_/_0.45),inset_0_1px_0_rgb(255_255_255_/_0.08)] ' +
    'hover:from-botanical-600 hover:via-forest-500 hover:to-botanical-500 hover:-translate-y-px ' +
    'hover:shadow-[0_5px_18px_-3px_rgb(29_125_60_/_0.55)] ' +
    'active:translate-y-0 ' +
    'disabled:opacity-30 focus-ring',

  olive:
    'bg-gradient-to-br from-olive-800 via-olive-700 to-ochre-800 text-cream-100 font-semibold ' +
    'shadow-[0_3px_12px_-3px_rgb(173_152_18_/_0.4),inset_0_1px_0_rgb(255_255_255_/_0.07)] ' +
    'hover:from-olive-700 hover:via-olive-600 hover:to-ochre-700 hover:-translate-y-px ' +
    'hover:shadow-[0_5px_18px_-3px_rgb(173_152_18_/_0.5)] ' +
    'active:translate-y-0 ' +
    'disabled:opacity-30 focus-ring',

  deepteal:
    'bg-gradient-to-br from-deepteal-800 via-deepteal-700 to-deepteal-600 text-cream-100 font-semibold ' +
    'shadow-[0_3px_12px_-3px_rgb(18_137_117_/_0.4),inset_0_1px_0_rgb(255_255_255_/_0.07)] ' +
    'hover:from-deepteal-700 hover:via-deepteal-600 hover:to-deepteal-500 hover:-translate-y-px ' +
    'hover:shadow-[0_5px_18px_-3px_rgb(18_137_117_/_0.5)] ' +
    'active:translate-y-0 ' +
    'disabled:opacity-30 focus-ring',

  teal:
    'bg-gradient-to-br from-deepteal-800 via-deepteal-700 to-deepteal-600 text-cream-100 font-semibold ' +
    'shadow-[0_3px_12px_-3px_rgb(18_137_117_/_0.4),inset_0_1px_0_rgb(255_255_255_/_0.07)] ' +
    'hover:from-deepteal-700 hover:via-deepteal-600 hover:to-deepteal-500 hover:-translate-y-px ' +
    'hover:shadow-[0_5px_18px_-3px_rgb(18_137_117_/_0.5)] ' +
    'active:translate-y-0 ' +
    'disabled:opacity-30 focus-ring',

  sage:
    'bg-gradient-to-br from-sage-700 via-sage-600 to-sage-500 text-cream-50 font-semibold ' +
    'shadow-[0_3px_12px_-3px_rgb(109_196_143_/_0.4),inset_0_1px_0_rgb(255_255_255_/_0.07)] ' +
    'hover:from-sage-600 hover:via-sage-500 hover:to-sage-400 hover:-translate-y-px ' +
    'hover:shadow-[0_5px_18px_-3px_rgb(109_196_143_/_0.5)] ' +
    'active:translate-y-0 ' +
    'disabled:opacity-30 focus-ring',
};

const sizeMap: Record<string, string> = {
  xs:        'px-2.5 py-1 text-[11px] gap-1.5 min-h-[26px] rounded-[4px] tracking-wide',
  sm:        'px-3 py-1.5 text-xs gap-1.5 min-h-[30px] rounded-[5px] tracking-wide',
  md:        'px-4 py-2 text-sm gap-2 min-h-[36px] rounded-[6px]',
  lg:        'px-5 py-2.5 text-[15px] gap-2.5 min-h-[42px] rounded-[8px]',
  icon:      'p-2 min-h-[34px] min-w-[34px] rounded-[6px]',
  'icon-sm': 'p-1.5 min-h-[28px] min-w-[28px] rounded-[4px]',
};

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
      'inline-flex items-center justify-center font-ui ' +
      'transition-all duration-100 cursor-pointer select-none ' +
      'active:scale-[0.982] relative overflow-hidden';

    const v = variantMap[variant] || variantMap.primary;
    const s = sizeMap[size] || sizeMap.md;
    const w = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${v} ${s} ${w} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {/* Subtle inner highlight for all solid buttons */}
        {variant !== 'ghost' && variant !== 'outline' && (
          <span
            className="absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none"
            aria-hidden="true"
          />
        )}

        {loading ? (
          <svg
            className="shrink-0 relative"
            width="14" height="14"
            viewBox="0 0 14 14"
            style={{ animation: 'spin 0.85s linear infinite' }}
            aria-hidden="true"
          >
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.25" />
            <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        ) : null}

        <span className="relative flex items-center gap-[inherit]">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';