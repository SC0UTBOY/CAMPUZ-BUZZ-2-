
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark';
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'dark', // Changed default to dark as per current setup
  storageKey = 'campuzbuzz_theme'
}) => {
  // Initialize theme from localStorage, system preference, or default
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return defaultTheme;
    
    try {
      // First check localStorage
      const savedTheme = localStorage.getItem(storageKey) as 'light' | 'dark' | null;
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        return savedTheme;
      }
      
      // Then check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      
      return 'light';
    } catch (error) {
      console.warn('Failed to access localStorage or matchMedia:', error);
      return defaultTheme;
    }
  });

  // Apply theme to document and localStorage whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove both classes first to avoid conflicts
    root.classList.remove('light', 'dark');
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Save to localStorage
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
    
    // Update meta theme-color for mobile browsers
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme === 'dark' ? '#0f0f23' : '#ffffff');
    }
  }, [theme, storageKey]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if no theme is saved in localStorage
      const savedTheme = localStorage.getItem(storageKey);
      if (!savedTheme) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [storageKey]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
