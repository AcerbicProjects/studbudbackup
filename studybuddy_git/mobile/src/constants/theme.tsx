import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

export const COLORS = {
  primary: '#4F46E5',
  secondary: '#8B5CF6',
  accent: '#22C55E',
  light: {
    primary: '#4F46E5',
    secondary: '#8B5CF6',
    accent: '#22C55E',
    background: '#F8FAFC',
    backgroundGradient: ['#FFFFFF', '#EEF2F6', '#E0E7FF'] as [string, string, string], // White -> Light Blue -> Indigo
    card: 'rgba(255, 255, 255, 0.8)', // Glassmorphism base
    text: '#0F172A',
    textMuted: '#64748B',
    border: 'rgba(226, 232, 240, 0.8)',
    inputBg: 'rgba(241, 245, 249, 0.6)',
    error: '#EF4444',
    success: '#22C55E',
    glows: {
      indigo: 'rgba(79, 70, 229, 0.15)',
      purple: 'rgba(139, 92, 246, 0.15)',
      cyan: 'rgba(6, 182, 212, 0.15)',
    },
  },
  dark: {
    primary: '#4F46E5',
    secondary: '#8B5CF6',
    accent: '#22C55E',
    background: '#0B1120', // Deep Navy
    backgroundGradient: ['#0B1120', '#0F172A', '#1E1B4B'] as [string, string, string],
    card: 'rgba(30, 41, 59, 0.7)', // Glassmorphism base
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    border: 'rgba(51, 65, 85, 0.5)',
    inputBg: 'rgba(15, 23, 42, 0.5)',
    error: '#EF4444',
    success: '#22C55E',
    glows: {
      indigo: 'rgba(79, 70, 229, 0.3)',
      purple: 'rgba(139, 92, 246, 0.3)',
      cyan: 'rgba(6, 182, 212, 0.3)',
    },
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 20, // 20-28px rounded corners
  xl: 28,
  round: 9999,
};

export const SHADOWS = {
  light: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  dark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    h1: 38,
  },
};

export type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: typeof COLORS.light;
  isDark: boolean;
  spacing: typeof SPACING;
  borderRadius: typeof BORDER_RADIUS;
  shadows: typeof SHADOWS.light;
  typography: typeof TYPOGRAPHY;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>(systemScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    if (systemScheme === 'light' || systemScheme === 'dark') {
      setTheme(systemScheme);
    }
  }, [systemScheme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const colors = theme === 'light' ? COLORS.light : COLORS.dark;
  const shadows = theme === 'light' ? SHADOWS.light : SHADOWS.dark;
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        colors,
        isDark,
        spacing: SPACING,
        borderRadius: BORDER_RADIUS,
        shadows,
        typography: TYPOGRAPHY,
      }}
    >
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
