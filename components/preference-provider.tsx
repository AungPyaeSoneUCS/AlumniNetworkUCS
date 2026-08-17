// file: components/preference-provider.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type Lang = "en" | "mm";
type Theme = "light" | "dark";

type PreferenceContextType = {
  lang: Lang;
  theme: Theme;
  setLang: (lang: Lang) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
};

const PreferenceContext = createContext<PreferenceContextType | null>(null);

export function PreferenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>("en");
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch("/api/preferences", {
          cache: "no-store",
        });

        const data = await res.json();

        const dbLang: Lang =
          data.languagePreference === "mm" ? "mm" : "en";

        const dbTheme: Theme =
          data.themePreference === "dark" ? "dark" : "light";

        setLangState(dbLang);
        setThemeState(dbTheme);

        localStorage.setItem("loginLang", dbLang);
        localStorage.setItem("theme", dbTheme);

        document.body.classList.toggle("mm", dbLang === "mm");
        document.documentElement.classList.toggle(
          "dark",
          dbTheme === "dark"
        );

        window.dispatchEvent(
          new CustomEvent("language-change", {
            detail: dbLang,
          })
        );
      } catch {
        const localLang =
          localStorage.getItem("loginLang") === "mm" ? "mm" : "en";

        const localTheme =
          localStorage.getItem("theme") === "dark" ? "dark" : "light";

        setLangState(localLang);
        setThemeState(localTheme);
      }
    }

    loadPreferences();
  }, []);

  async function savePreferences(nextLang: Lang, nextTheme: Theme) {
    setLangState(nextLang);
    setThemeState(nextTheme);

    localStorage.setItem("loginLang", nextLang);
    localStorage.setItem("theme", nextTheme);

    document.body.classList.toggle("mm", nextLang === "mm");
    document.documentElement.classList.toggle(
      "dark",
      nextTheme === "dark"
    );

    window.dispatchEvent(
      new CustomEvent("language-change", {
        detail: nextLang,
      })
    );

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
  }

  return (
    <PreferenceContext.Provider
      value={{
        lang,
        theme,
        setLang: async (nextLang) =>
          savePreferences(nextLang, theme),
        setTheme: async (nextTheme) =>
          savePreferences(lang, nextTheme),
      }}
    >
      {children}
    </PreferenceContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferenceContext);

  if (!context) {
    throw new Error(
      "usePreferences must be used inside PreferenceProvider"
    );
  }

  return context;
}