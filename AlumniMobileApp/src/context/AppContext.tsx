// context/AppContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';

type Lang = 'en' | 'mm';

interface AppContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>('en');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load saved preferences when the app starts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedLang = await SecureStore.getItemAsync('app_lang');
        const savedTheme = await SecureStore.getItemAsync('app_theme');
        
        if (savedLang === 'en' || savedLang === 'mm') setLangState(savedLang);
        if (savedTheme !== null) setIsDarkMode(savedTheme === 'dark');
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, []);

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

  return (
    <AppContext.Provider value={{ lang, setLang, isDarkMode, toggleTheme, isLoaded }}>
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