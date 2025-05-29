import React from 'react';
import { LOGO_CONFIG } from '@/config/logo';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'full' | 'icon' | 'icon-badge';
  preset?: 'header' | 'sidebar' | 'footer' | 'email';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  preset,
  className,
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

  const getPresetClasses = () => {
    switch (preset) {
      case 'header':
        return 'h-full max-h-96 w-auto';
      case 'footer':
        return 'h-full max-h-96 w-auto';
      case 'sidebar':
        return 'h-12 w-auto';
      case 'email':
        return 'h-12 w-auto';
      default:
        return 'h-12 w-auto';
    }
  };

  return (
    <img
      src={getLogoSrc()}
      alt="Exhibae"
      className={cn(
        'object-contain',
        getPresetClasses(),
        className
      )}
    />
  );
}; 