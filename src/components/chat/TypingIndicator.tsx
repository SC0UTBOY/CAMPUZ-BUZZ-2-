
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  users: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing`;
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing`;
    } else {
      return `${users[0]} and ${users.length - 1} others are typing`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center space-x-2 px-4 py-2 text-sm text-muted-foreground"
    >
      <div className="flex space-x-1">
        <motion.div
          className="w-1 h-1 bg-muted-foreground rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.2 }}
        />
        <motion.div
          className="w-1 h-1 bg-muted-foreground rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.2, delay: 0.1 }}
        />
        <motion.div
          className="w-1 h-1 bg-muted-foreground rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.2, delay: 0.2 }}
        />
      </div>
      <span>{getTypingText()}{dots}</span>
    </motion.div>
  );
};
