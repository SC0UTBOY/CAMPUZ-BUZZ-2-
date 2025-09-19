
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EnhancedButtonProps extends ButtonProps {
  gradient?: boolean;
  glow?: boolean;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  children,
  className,
  gradient = false,
  glow = false,
  ...props
}) => {
  return (
    <Button
      className={cn(
        'transition-all duration-300 font-medium',
        gradient && 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70',
        glow && 'shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30',
        'hover:scale-105 active:scale-95',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};
