import React from 'react';

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  size = 'md',
  text,
  className = '',
  count = 3,
}) => {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const textSizeStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <svg className={sizeStyles[size]} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {text && <span className={`${textSizeStyles[size]} text-earth-500`}>{text}</span>}
      </span>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-3 animate-pulse">
            <div className="h-4 bg-earth-200 rounded w-3/4" />
            <div className="h-4 bg-earth-200 rounded w-1/2" />
            <div className="h-4 bg-earth-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <svg
        className={`${sizeStyles[size]} text-agri-600`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && <p className={`${textSizeStyles[size]} text-earth-500`}>{text}</p>}
    </div>
  );
};

export const PageLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
    <LoadingState variant="spinner" size="lg" />
    <p className="text-earth-500">{text}</p>
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-earth-200 p-5 animate-pulse space-y-4">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-earth-200" />
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-earth-200 rounded w-1/3" />
        <div className="h-4 bg-earth-200 rounded w-1/4" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div className="h-10 bg-earth-200 rounded-xl" />
      <div className="h-10 bg-earth-200 rounded-xl" />
      <div className="h-10 bg-earth-200 rounded-xl" />
    </div>
    <div className="h-4 bg-earth-200 rounded w-1/2" />
    <div className="h-4 bg-earth-200 rounded w-1/3" />
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-earth-200 p-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-earth-200" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-earth-200 rounded w-1/3" />
            <div className="h-4 bg-earth-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);