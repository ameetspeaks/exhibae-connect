import React, { ReactNode } from 'react';
import { UserRole } from '@/types/auth';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface DashboardWidgetProps {
  role: UserRole;
  title: string;
  description?: string;
  icon?: ReactNode;
  variant?: 'default' | 'outline' | 'accent' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
  loading?: boolean;
  className?: string;
  children: ReactNode;
}

const DashboardWidget = ({
  role,
  title,
  description,
  icon,
  variant = 'default',
  size = 'md',
  footer,
  loading = false,
  className,
  children
}: DashboardWidgetProps) => {
  // Define role-specific color schemes
  const getRoleColorScheme = () => {
    switch (role) {
      case UserRole.MANAGER:
        return {
          primary: 'bg-indigo-600',
          text: 'text-indigo-600',
          light: 'bg-indigo-50',
          border: 'border-indigo-200',
          gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
          accent: 'border-l-4 border-l-indigo-500'
        };
      case UserRole.ORGANISER:
        return {
          primary: 'bg-emerald-600',
          text: 'text-emerald-600',
          light: 'bg-emerald-50',
          border: 'border-emerald-200',
          gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
          accent: 'border-l-4 border-l-emerald-500'
        };
      case UserRole.BRAND:
        return {
          primary: 'bg-amber-600',
          text: 'text-amber-600',
          light: 'bg-amber-50',
          border: 'border-amber-200',
          gradient: 'bg-gradient-to-br from-amber-500 to-amber-700',
          accent: 'border-l-4 border-l-amber-500'
        };
      case UserRole.SHOPPER:
        return {
          primary: 'bg-exhibae-navy',
          text: 'text-exhibae-navy',
          light: 'bg-blue-50',
          border: 'border-blue-200',
          gradient: 'bg-gradient-to-br from-blue-500 to-exhibae-navy',
          accent: 'border-l-4 border-l-exhibae-navy'
        };
      default:
        return {
          primary: 'bg-gray-600',
          text: 'text-gray-600',
          light: 'bg-gray-50',
          border: 'border-gray-200',
          gradient: 'bg-gradient-to-br from-gray-500 to-gray-700',
          accent: 'border-l-4 border-l-gray-500'
        };
    }
  };

  const colors = getRoleColorScheme();

  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'p-3';
      case 'lg':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'outline':
        return cn('bg-white border', colors.border);
      case 'accent':
        return cn('bg-white', colors.accent);
      case 'gradient':
        return cn(colors.gradient, 'text-white');
      default:
        return cn('bg-white');
    }
  };

  return (
    <Card className={cn(
      getVariantStyles(),
      'transition-shadow hover:shadow-md',
      className
    )}>
      {(title || description) && (
        <CardHeader className={cn(getSizeStyles(), 'pb-2')}>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className={cn(
                "text-lg font-semibold",
                variant === 'gradient' ? 'text-white' : colors.text
              )}>
                {title}
              </CardTitle>
              {description && (
                <CardDescription className={variant === 'gradient' ? 'text-white/80' : 'text-gray-500'}>
                  {description}
                </CardDescription>
              )}
            </div>
            {icon && (
              <div className={cn(
                "rounded-full p-2",
                variant === 'gradient' ? 'bg-white/10' : colors.light
              )}>
                {icon}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(
        getSizeStyles(),
        'pt-2',
        loading && 'opacity-50'
      )}>
        {children}
      </CardContent>
      {footer && (
        <CardFooter className={cn(
          getSizeStyles(),
          'pt-2 border-t',
          variant === 'gradient' ? 'border-white/10' : 'border-gray-100'
        )}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};

export default DashboardWidget; 