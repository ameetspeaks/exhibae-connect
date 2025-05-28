import React from 'react';
import { LOGO_CONFIG } from '@/config/logo';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'full' | 'icon' | 'icon-badge';
  preset?: 'header' | 'sidebar' | 'footer' | 'email';
  className?: string;
  height?: number;
  width?: number | 'auto';
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  preset,
  className,
  height,
  width,
}) => {
  const getLogoSrc = () => {
    switch (variant) {
      case 'icon':
        return LOGO_CONFIG.MAIN.ICON;
      case 'icon-badge':
        return LOGO_CONFIG.MAIN.ICON_BADGE;
      default:
        return LOGO_CONFIG.MAIN.FULL;
    }
  };

  const getDimensions = () => {
    if (height || width) {
      return { height, width };
    }
    if (preset) {
      return LOGO_CONFIG.DIMENSIONS[preset.toUpperCase()];
    }
    return LOGO_CONFIG.DIMENSIONS.HEADER;
  };

  const dimensions = getDimensions();

  return (
    <img
      src={getLogoSrc()}
      alt="Exhibae"
      className={cn('object-contain', className)}
      style={{
        height: typeof dimensions.height === 'number' ? `${dimensions.height}px` : dimensions.height,
        width: dimensions.width === 'auto' ? 'auto' : `${dimensions.width}px`,
      }}
    />
  );
}; 