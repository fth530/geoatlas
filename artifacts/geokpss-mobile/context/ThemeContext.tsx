import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';

export type ColorMode = 'light' | 'dark';

type ThemeContextValue = {
  colorMode: ColorMode;
  isDark: boolean;
  toggleTheme: () => void;
};

const STORAGE_KEY = 'geokpss-color-mode-v1';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorMode] = useState<ColorMode>('light');
  const changedBeforeHydration = useRef(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!active || changedBeforeHydration.current) return;
        if (saved === 'light' || saved === 'dark') setColorMode(saved);
      })
      .catch(() => {
        // Keep the app usable with the default light theme if storage is unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorMode,
      isDark: colorMode === 'dark',
      toggleTheme: () => {
        changedBeforeHydration.current = true;
        const next = colorMode === 'dark' ? 'light' : 'dark';
        setColorMode(next);
        void AsyncStorage.setItem(STORAGE_KEY, next);
      },
    }),
    [colorMode],
  );

  return (
    <>
      <StatusBar style={colorMode === 'dark' ? 'light' : 'dark'} />
      <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    </>
  );
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme must be used inside ThemeProvider');
  return value;
}
