import React, { createContext, useContext, useState } from 'react';
import { lightTheme, darkTheme } from '@/constants/theme';
import { ThemeColors } from '@/types/theme';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  themeColors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const themeColors: ThemeColors = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 