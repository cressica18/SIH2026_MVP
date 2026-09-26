import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'ochre' | 'forest' | 'deepteal' | 'botanical' | 'olive' | 'copper' | 'teal';
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
      'inline-flex items-center justify-center font-medium font-ui transition-all duration-100 ' +
      'disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ' +
      'active:scale-[0.982] select-none focus-ring relative overflow-hidden';

    const variantStyles: Record<string, string> = {
      // Gradient primary — deep forest gradient, not flat
      primary:
        'bg-gradient-to-br from-forest-700 via-forest-600 to-botanical-600 text-cream-50 font-semibold ' +
        'shadow-[0_4px_14px_-4px_rgb(19_115_68_/_0.4),inset_0_1px_0_0_rgb(255_255_255_/_0.07)] ' +
        'hover:from-forest-600 hover:via-forest-500 hover:to-botanical-500 hover:-translate-y-px ' +
        'hover:shadow-[0_6px_20px_-4px_rgb(19_115_68_/_0.5),inset_0_1px_0_0_rgb(255_255_255_/_0.1)] ' +
        'active:translate-y-0 active:shadow-[0_2px_8px_-2px_rgb(19_115_68_/_0.3)]',

      // Secondary — deep surface with gradient
      secondary:
        'bg-gradient-to-b from-bg-750 to-bg-800 text-cream-200 ' +
        'border border-bg-650 ' +
        'hover:from-bg-700 hover:to-bg-750 hover:border-bg-600 hover:text-cream-100 ' +
        'shadow-[0_2px_6px_-2px_rgb(1_5_3_/_0.4),inset_0_1px_0_0_rgb(255_255_255_/_0.03)]',

      // Outline — transparent with forest tint
      outline:
        'bg-transparent text-forest-300 ' +
        'border border-forest-700/60 ' +
        'hover:bg-forest-900/30 hover:border-forest-600/80 hover:text-forest-200 ' +
        'active:bg-forest-900/45',

      // Ghost — subtle, text-only feel
      ghost:
        'bg-transparent text-cream-400 ' +
        'hover:bg-bg-750 hover:text-cream-200 ' +
        'active:bg-bg-700',

      // Danger — copper gradient (not flat orange)
      danger:
        'bg-gradient-to-br from-copper-800 via-copper-700 to-ochre-700 text-cream-100 font-semibold ' +
        'shadow-[0_4px_14px_-4px_rgb(190_79_18_/_0.35),inset_0_1px_0_0_rgb(255_255_255_/_0.06)] ' +
        'hover:from-copper-700 hover:via-copper-600 hover:to-ochre-600 hover:-translate-y-px ' +
        'hover:shadow-[0_6px_20px_-4px_rgb(190_79_18_/_0.48)] ' +
        'active:translate-y-0',

      // Ochre — amber/golden gradient
      ochre:
        'bg-gradient-to-br from-ochre-800 via-ochre-700 to-ochre-600 text-cream-100 font-semibold ' +
        'shadow-[0_4px_14px_-4px_rgb(204_118_14_/_0.35),inset_0_1px_0_0_rgb(255_255_255_/_0.06)] ' +
        'hover:from-ochre-700 hover:via-ochre-600 hover:to-ochre-500 hover:-translate-y-px ' +
        'hover:shadow-[0_6px_20px_-4px_rgb(204_118_14_/_0.48)] ' +
        'active:translate-y-0',

      // Copper — warm amber gradient
      copper:
        'bg-gradient-to-br from-copper-800 via-copper-700 to-ochre-700 text-cream-100 font-semibold ' +
        'shadow-[0_4px_14px_-4px_rgb(190_79_18_/_0.35),inset_0_1px_0_0_rgb(255_255_255_/_0.06)] ' +
        'hover:from-copper-700 hover:via-copper-600 hover:to-ochre-600 hover:-translate-y-px ' +
        'hover:shadow-[0_6px_20px_-4px_rgb(190_79_18_/_0.48)] ' +
        'active:translate-y-0',

      // Forest — same as primary
      forest:
        'bg-gradient-to-br from-forest-700 via-forest-600 to-botanical-600 text-cream-50 font-semibold ' +
        'shadow-[0_4px_14px_-4px_rgb(19_115_68_/_0.4),inset_0_1px_0_0_rgb(255_255_255_/_0.07)] ' +
        'hover:from-forest-600 hover:via-forest-500 hover:to-botanical-500 hover:-translate-y-px ' +
        'hover:shadow-[0_6px_20px_-4px_rgb(19_115_68_/_0.5)] ' +
        'active:translate-y-0',

      // Botanical — slightly warmer green gradient
      botanical:
        'bg-gradient-to-br from-botanical-700 via-botanical-600 to-forest-600 text-cream-50 font-semibold ' +
        'shadow-[0_4px_14px_-4px_rgb(29_125_60_/_0.4),inset_0_1px_0_0_rgb(255_255_255_/_0.07)] ' +
        'hover:from-botanical-600 hover:via-botanical-500 hover:to-forest-500 hover:-translate-y-px ' +
        'hover:shadow-[0_6px_20px_-4px_rgb(29_125_60_/_0.5)] ' +
        'active:translate-y-0',

      // Olive — harvest/amber-green gradient
      olive:
        'bg-gradient-to-br from-olive-800 via-olive-700 to-ochre-800 text-cream-100 font-semibold ' +
        'shadow-[0_4px_14px_-4px_rgb(173_152_18_/_0.35),inset_0_1px_0_0_rgb(255_255_255_/_0.06)] ' +
        'hover:from-olive-700 hover:via-olive-600 hover:to-ochre-700 hover:-translate-y-px ' +
        'hover:shadow-[0_6px_20px_-4px_rgb(173_152_18_/_0.45)] ' +
        'active:translate-y-0',

      // Deep teal — buyer variant
      deepteal:
        'bg-gradient-to-br from-deepteal-800 via-deepteal-700 to-deepteal-600 text-cream-100 font-semibold ' +
        'shadow-[0_4px_14px_-4px_rgb(18_137_117_/_0.35),inset_0_1px_0_0_rgb(255_255_255_/_0.06)] ' +
        'hover:from-deepteal-700 hover:via-deepteal-600 hover:to-deepteal-500 hover:-translate-y-px ' +
        'hover:shadow-[0_6px_20px_-4px_rgb(18_137_117_/_0.45)] ' +
        'active:translate-y-0',

      // Teal alias
      teal:
        'bg-gradient-to-br from-deepteal-800 via-deepteal-700 to-deepteal-600 text-cream-100 font-semibold ' +
        'shadow-[0_4px_14px_-4px_rgb(18_137_117_/_0.35),inset_0_1px_0_0_rgb(255_255_255_/_0.06)] ' +
        'hover:from-deepteal-700 hover:via-deepteal-600 hover:to-deepteal-500 hover:-translate-y-px ' +
        'hover:shadow-[0_6px_20px_-4px_rgb(18_137_117_/_0.45)] ' +
        'active:translate-y-0',
    };

    const sizeStyles = {
      xs:       'px-2.5 py-1.5 text-[11px] gap-1.5 min-h-[26px] rounded-xs tracking-wide',
      sm:       'px-3 py-1.5 text-xs gap-1.5 min-h-[30px] rounded-sm tracking-wide',
      md:       'px-4 py-2 text-sm gap-2 min-h-[36px] rounded-sm',
      lg:       'px-5 py-2.5 text-base gap-2.5 min-h-[40px] rounded-md',
      icon:     'p-2 min-h-[34px] min-w-[34px] rounded-sm',
      'icon-sm':'p-1.5 min-h-[28px] min-w-[28px] rounded-xs',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size]} ${widthStyles} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {/* Subtle inner highlight overlay for all buttons */}
        <span className="absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" aria-hidden="true" />
        {loading && (
          <svg className="animate-spin h-4 w-4 shrink-0 relative" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        <span className="relative flex items-center gap-[inherit]">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';