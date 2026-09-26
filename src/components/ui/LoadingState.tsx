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
    md: 'w-7 h-7 border-2.5',
    lg: 'w-10 h-10 border-3',
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
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        {text && <span className={`${textSizeStyles[size]} text-cream-500`}>{text}</span>}
      </span>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2 animate-pulse">
            <div className="h-4 bg-bg-700 rounded w-3/4" />
            <div className="h-4 bg-bg-700 rounded w-1/2" />
            <div className="h-4 bg-bg-700 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 ${className}`}>
      <svg className={`${sizeStyles[size]} text-botanical-400`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      {text && <p className={`${textSizeStyles[size]} text-cream-500`}>{text}</p>}
    </div>
  );
};

export const PageLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
    <LoadingState variant="spinner" size="lg" />
    <p className="text-cream-500">{text}</p>
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-bg-850 rounded-lg border border-bg-750 p-4 animate-pulse space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-md bg-bg-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-bg-700 rounded w-1/3" />
        <div className="h-3 bg-bg-700 rounded w-1/4" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <div className="h-8 bg-bg-700 rounded-lg" />
      <div className="h-8 bg-bg-700 rounded-lg" />
      <div className="h-8 bg-bg-700 rounded-lg" />
    </div>
    <div className="h-3 bg-bg-700 rounded w-1/2" />
    <div className="h-3 bg-bg-700 rounded w-1/3" />
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-2.5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-bg-850 rounded-lg border border-bg-750 p-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-md bg-bg-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-bg-700 rounded w-1/3" />
            <div className="h-3 bg-bg-700 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="overflow-x-auto rounded-lg border border-bg-700 bg-bg-850">
    <table className="w-full" role="grid">
      <thead className="bg-bg-800 border-b border-bg-700">
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} scope="col" className="px-3 py-2.5">
              <div className="h-3 bg-bg-700 rounded w-20 animate-pulse" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-bg-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex} className="animate-pulse">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <td key={colIndex} className="px-3 py-2.5">
                <div className="h-4 bg-bg-700 rounded w-full" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);