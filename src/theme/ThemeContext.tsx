import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, Theme } from './colors';

type ThemeType = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  themeType: ThemeType;
  toggleTheme: () => void;
  setTheme: (type: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: colors.light,
  themeType: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeType, setThemeType] = useState<ThemeType>(systemColorScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    // Load persisted theme
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('user_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeType(savedTheme);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newType = themeType === 'light' ? 'dark' : 'light';
    setThemeType(newType);
    await AsyncStorage.setItem('user_theme', newType);
  };

  const updateTheme = async (type: ThemeType) => {
      setThemeType(type);
      await AsyncStorage.setItem('user_theme', type);
  }

  const theme = colors[themeType];

  return (
    <ThemeContext.Provider value={{ theme, themeType, toggleTheme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

