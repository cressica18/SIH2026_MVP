import React, { useState } from 'react';
import { Sprout, ImageOff } from 'lucide-react';

export interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackTitle?: string;
  className?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'Produce lot image',
  fallbackTitle,
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`bg-earth-100 flex flex-col items-center justify-center p-4 text-earth-500 border border-earth-200/80 ${className}`}
        aria-label={alt}
      >
        <div className="w-10 h-10 rounded-full bg-earth-200 flex items-center justify-center text-earth-600 mb-1.5 shadow-xs">
          <Sprout className="w-5 h-5 text-agri-600" />
        </div>
        <span className="text-xs font-semibold text-earth-800 text-center line-clamp-1">
          {fallbackTitle || alt}
        </span>
        <span className="text-[10px] text-earth-500 font-medium">Vasundhara Verified Lot</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={className}
      {...props}
    />
  );
};