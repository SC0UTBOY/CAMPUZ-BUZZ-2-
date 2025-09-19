
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Search } from 'lucide-react';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
}

const EMOJI_CATEGORIES = {
  'Smileys & People': {
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌',
      '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
      '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢',
      '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔'
    ]
  },
  'Animals & Nature': {
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵',
      '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗',
      '🌸', '🌼', '🌻', '🌺', '🌷', '🌹', '🥀', '🌾', '🌿', '☘️', '🍀', '🍃', '🌳', '🌲', '🌴', '🌵'
    ]
  },
  'Food & Drink': {
    icon: '🍎',
    emojis: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝',
      '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐',
      '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟'
    ]
  },
  'Activities': {
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃',
      '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️',
      '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴'
    ]
  },
  'Objects': {
    icon: '⌚',
    emojis: [
      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼',
      '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭',
      '⏱️', '⏲️', '⏰', '🕰️', '⏳', '⌛', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸'
    ]
  },
  'Symbols': {
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
      '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳'
    ]
  }
};

// Create searchable emoji index
const createEmojiSearchIndex = () => {
  const searchIndex: { emoji: string; keywords: string[] }[] = [];
  
  Object.entries(EMOJI_CATEGORIES).forEach(([category, data]) => {
    data.emojis.forEach(emoji => {
      const keywords = [category.toLowerCase()];
      
      // Add specific keywords for common emojis
      const emojiKeywords: Record<string, string[]> = {
        '😀': ['smile', 'happy', 'grin'],
        '😍': ['love', 'heart eyes', 'adore'],
        '😭': ['cry', 'sad', 'tears'],
        '😂': ['laugh', 'lol', 'funny'],
        '🔥': ['fire', 'hot', 'lit'],
        '💯': ['hundred', '100', 'perfect'],
        '❤️': ['heart', 'love', 'red'],
        '👍': ['thumbs up', 'like', 'good'],
        '👎': ['thumbs down', 'dislike', 'bad'],
        '🎉': ['party', 'celebration', 'confetti'],
        '🍕': ['pizza', 'food', 'italian'],
        '🏀': ['basketball', 'sports', 'ball'],
        '📚': ['books', 'study', 'education'],
        '💻': ['computer', 'laptop', 'tech'],
      };
      
      if (emojiKeywords[emoji]) {
        keywords.push(...emojiKeywords[emoji]);
      }
      
      searchIndex.push({ emoji, keywords });
    });
  });
  
  return searchIndex;
};

const emojiSearchIndex = createEmojiSearchIndex();

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ 
  onEmojiSelect, 
  trigger 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Smileys & People');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(['😀', '😍', '😭', '😂', '🔥', '💯', '❤️', '👍']);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getFilteredEmojis = () => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return emojiSearchIndex
        .filter(({ keywords }) => 
          keywords.some(keyword => keyword.includes(searchLower))
        )
        .map(({ emoji }) => emoji)
        .slice(0, 64); // Limit results
    }
    
    if (activeCategory === 'Recent') {
      return recentEmojis;
    }
    
    return EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES]?.emojis || [];
  };

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    
    // Update recent emojis
    setRecentEmojis(prev => {
      const newRecent = [emoji, ...prev.filter(e => e !== emoji)].slice(0, 8);
      localStorage.setItem('recent-emojis', JSON.stringify(newRecent));
      return newRecent;
    });
    
    setIsOpen(false);
    setSearchTerm('');
  };

  // Load recent emojis on mount
  useEffect(() => {
    const saved = localStorage.getItem('recent-emojis');
    if (saved) {
      try {
        setRecentEmojis(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to load recent emojis');
      }
    }
  }, []);

  const categories = ['Recent', ...Object.keys(EMOJI_CATEGORIES)];

  return (
    <div className="relative" ref={pickerRef}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <EnhancedButton variant="ghost" size="sm">
            <Smile className="h-4 w-4" />
          </EnhancedButton>
        )}
      </div>

      {/* Picker Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-full mb-2 right-0 z-50"
          >
            <EnhancedCard className="w-80 max-h-96 p-0 overflow-hidden">
              {/* Search */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search emojis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Categories */}
              {!searchTerm && (
                <div className="flex p-2 border-b overflow-x-auto scrollbar-hide">
                  {categories.map((category) => (
                    <EnhancedButton
                      key={category}
                      variant={activeCategory === category ? "default" : "ghost"}
                      size="sm"
                      className="whitespace-nowrap mr-1 text-xs flex items-center gap-1"
                      onClick={() => setActiveCategory(category)}
                    >
                      {category === 'Recent' ? '🕒' : EMOJI_CATEGORIES[category as keyof typeof EMOJI_CATEGORIES]?.icon}
                      {category === 'Recent' ? 'Recent' : category.split(' ')[0]}
                    </EnhancedButton>
                  ))}
                </div>
              )}

              {/* Emoji Grid */}
              <ScrollArea className="h-64">
                <div className="p-3">
                  <div className="grid grid-cols-8 gap-2">
                    {getFilteredEmojis().map((emoji, index) => (
                      <motion.button
                        key={`${emoji}-${index}`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-xl hover:bg-muted rounded p-1 transition-colors flex items-center justify-center h-8"
                        onClick={() => handleEmojiClick(emoji)}
                        title={emoji}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>

                  {getFilteredEmojis().length === 0 && searchTerm && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Smile className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No emojis found for "{searchTerm}"</p>
                      <p className="text-xs mt-1">Try different keywords</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </EnhancedCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
