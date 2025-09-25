
import React from 'react';

type StatusType = 'online' | 'away' | 'offline';

interface StatusIndicatorProps {
  status: StatusType;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  className = "" 
}) => {
  const statusClasses = {
    online: 'status-online',
    away: 'status-away',
    offline: 'status-offline'
  };

  return (
    <div className={`${statusClasses[status]} ${className}`} />
  );
};
