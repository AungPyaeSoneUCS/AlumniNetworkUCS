// context/AppContext.tsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useColorScheme } from 'react-native';
import { connectRealtime, disconnectRealtime } from '../services/realtime';

type Lang = 'en' | 'mm';
export type ThemeMode = 'light' | 'dark' | 'system';

interface AppContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  isDarkMode: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isLoaded: boolean;
  isLoggedIn: boolean;
  currentUserId: string | null;
  refreshAuth: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>('en');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const systemScheme = useColorScheme();
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const isDarkMode = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';

  const checkSession = useCallback(async () => {
    try {
      const sessionData = await SecureStore.getItemAsync('user_session');
      if (sessionData) {
        const user = JSON.parse(sessionData);
        setIsLoggedIn(true);
        setCurrentUserId(user._id || null);
        return true;
      }
    } catch (e) {
      console.error('Failed to parse session', e);
    }
    setIsLoggedIn(false);
    setCurrentUserId(null);
    return false;
  }, []);

  // Load saved preferences when the app starts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedLang = await SecureStore.getItemAsync('app_lang');
        const savedTheme = await SecureStore.getItemAsync('app_theme');

        if (savedLang === 'en' || savedLang === 'mm') setLangState(savedLang);
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          setThemeModeState(savedTheme);
        }

        await checkSession();
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, [checkSession]);

  // When user logs in: connect realtime
  useEffect(() => {
    if (isLoggedIn) {
      connectRealtime();
    } else {
      disconnectRealtime();
    }
  }, [isLoggedIn]);

  // Update language and save to storage
  const setLang = async (newLang: Lang) => {
    setLangState(newLang);
    await SecureStore.setItemAsync('app_lang', newLang);
  };

  // Set theme mode (light / dark / system) and save to storage
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await SecureStore.setItemAsync('app_theme', mode);
  };

  // Toggle theme and save to storage (kept for in-screen quick toggles)
  const toggleTheme = async () => {
    const newMode: ThemeMode = isDarkMode ? 'light' : 'dark';
    await setThemeMode(newMode);
  };

  // Refresh auth state (call after login/logout)
  const refreshAuth = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  return (
    <AppContext.Provider value={{ lang, setLang, isDarkMode, themeMode, setThemeMode, toggleTheme, isLoaded, isLoggedIn, currentUserId, refreshAuth }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for easy access in your screens
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};