
export const formatMessageTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 168) { // Less than a week
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
};

export const parseMessageMentions = (content: string): { text: string; mentions: string[] } => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return { text: content, mentions };
};

export const validateRoomName = (name: string): { isValid: boolean; error?: string } => {
  if (name.length < 1) {
    return { isValid: false, error: 'Room name is required' };
  }
  
  if (name.length > 100) {
    return { isValid: false, error: 'Room name must be less than 100 characters' };
  }
  
  return { isValid: true };
};
