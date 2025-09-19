
import React from 'react';
import { cn } from '@/lib/utils';

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glass' | 'gradient';
  hover?: boolean;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  className,
  variant = 'default',
  hover = true,
  ...props
}) => {
  const variants = {
    default: 'bg-card border border-border/50',
    elevated: 'bg-card border border-border/50 shadow-lg',
    glass: 'bg-card/70 backdrop-blur-md border border-border/30',
    gradient: 'bg-gradient-to-br from-card to-card/80 border border-border/50'
  };

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-300',
        variants[variant],
        hover && 'hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
