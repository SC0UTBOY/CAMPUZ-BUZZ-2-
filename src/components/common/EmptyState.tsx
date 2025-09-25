
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ""
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center text-center p-8 ${className}`}
    >
      <motion.div 
        className="mb-4 text-muted-foreground"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {icon}
      </motion.div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="animate-fade-in">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
};
