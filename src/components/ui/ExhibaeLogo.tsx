import React from 'react';
import { cn } from '@/lib/utils';

interface ExhibaeLogoProps {
  variant: 'header' | 'footer';
  className?: string;
}

export const ExhibaeLogo: React.FC<ExhibaeLogoProps> = ({
  variant,
  className,
}) => {
  const getPresetClasses = () => {
    switch (variant) {
      case 'header':
        return 'h-16 w-auto';
      case 'footer':
        return 'min-w-[100px] h-full max-w-[280px] w-auto';
      default:
        return 'h-24 w-auto';
    }
  };

  return (
    <img
      src="/images/exhibae-full.png"
      alt="Exhibae"
      className={cn(
        'object-contain object-center',
        getPresetClasses(),
        className
      )}
    />
  );
}; 