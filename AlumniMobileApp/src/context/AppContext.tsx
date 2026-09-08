// context/AppContext.tsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { registerForPushNotifications } from '../services/notifications';
import { connectRealtime, disconnectRealtime } from '../services/realtime';

type Lang = 'en' | 'mm';

interface AppContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isLoaded: boolean;
  isLoggedIn: boolean;
  currentUserId: string | null;
  refreshAuth: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>('en');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
        if (savedTheme !== null) setIsDarkMode(savedTheme === 'dark');

        await checkSession();
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, [checkSession]);

  // When user logs in: connect realtime + register push token
  useEffect(() => {
    if (isLoggedIn) {
      connectRealtime();
      registerForPushNotifications();
    } else {
      disconnectRealtime();
    }
  }, [isLoggedIn]);

  // Update language and save to storage
  const setLang = async (newLang: Lang) => {
    setLangState(newLang);
    await SecureStore.setItemAsync('app_lang', newLang);
  };

  // Toggle theme and save to storage
  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    await SecureStore.setItemAsync('app_theme', newTheme ? 'dark' : 'light');
  };

  // Refresh auth state (call after login/logout)
  const refreshAuth = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  return (
    <AppContext.Provider value={{ lang, setLang, isDarkMode, toggleTheme, isLoaded, isLoggedIn, currentUserId, refreshAuth }}>
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