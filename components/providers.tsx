// file: components/providers.tsx

"use client";

import type React from "react";
import { SessionProvider } from "next-auth/react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Lang = "en" | "mm";
type Theme = "light" | "dark";

type Dictionary = Record<string, string>;

const dictionaries: Record<Lang, Dictionary> = {
  en: {
    loginFailed: "Login failed.",
  },

  mm: {
    loginFailed: "ဝင်ရောက်မှု မအောင်မြင်ပါ။",
  },
};

type ContextType = {
  lang: Lang;
  theme: Theme;
  setLang: (lang: Lang) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  t: (key: string) => string;
};

const I18nContext = createContext<ContextType | null>(null);

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside Providers");
  }

  return context;
}

function cleanLang(value: unknown): Lang {
  return value === "mm" ? "mm" : "en";
}

function cleanTheme(value: unknown): Theme {
  return value === "dark" ? "dark" : "light";
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [theme, setThemeState] = useState<Theme>("light");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const savedLang = cleanLang(localStorage.getItem("lang"));
        const savedTheme = cleanTheme(localStorage.getItem("theme"));

        setLangState(savedLang);
        setThemeState(savedTheme);

        const res = await fetch("/api/preferences", {
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();

          const dbLang = cleanLang(data.languagePreference);
          const dbTheme = cleanTheme(data.themePreference);

          setLangState(dbLang);
          setThemeState(dbTheme);

          localStorage.setItem("lang", dbLang);
          localStorage.setItem("theme", dbTheme);
        }
      } catch (error) {
        console.error("Load preferences failed:", error);
      } finally {
        setLoaded(true);
      }
    }

    loadPreferences();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    document.documentElement.lang = lang;

    document.documentElement.classList.toggle("dark", theme === "dark");
    document.body.classList.toggle("mm", lang === "mm");

    localStorage.setItem("lang", lang);
    localStorage.setItem("theme", theme);

    window.dispatchEvent(
      new CustomEvent("language-change", {
        detail: lang,
      })
    );
  }, [lang, theme, loaded]);

  async function savePreferences(nextLang: Lang, nextTheme: Theme) {
    setLangState(nextLang);
    setThemeState(nextTheme);

    localStorage.setItem("lang", nextLang);
    localStorage.setItem("theme", nextTheme);

    try {
      await fetch("/api/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          languagePreference: nextLang,
          themePreference: nextTheme,
        }),
      });
    } catch (error) {
      console.error("Save preferences failed:", error);
    }
  }

  const value = useMemo<ContextType>(() => {
    const dict = dictionaries[lang] || dictionaries.en;

    return {
      lang,
      theme,

      setLang: async (nextLang: Lang) => {
        await savePreferences(nextLang, theme);
      },

      setTheme: async (nextTheme: Theme) => {
        await savePreferences(lang, nextTheme);
      },

      t: (key: string) => dict[key] || key,
    };
  }, [lang, theme]);

  return (
    <SessionProvider>
      <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
    </SessionProvider>
  );
}