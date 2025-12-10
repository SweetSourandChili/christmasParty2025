"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { translations, Language, TranslationKey } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "tr",
  setLanguage: () => {},
  t: (key) => key,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [language, setLanguageState] = useState<Language>("tr");
  const [mounted, setMounted] = useState(false);
  const [fetched, setFetched] = useState(false);

  // Load language from localStorage first (for quick initial load)
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("language") as Language;
    if (saved && (saved === "en" || saved === "tr")) {
      setLanguageState(saved);
    }
  }, []);

  // Fetch language from database when user is authenticated
  useEffect(() => {
    if (status === "authenticated" && !fetched) {
      fetchLanguageFromDB();
    }
  }, [status, fetched]);

  const fetchLanguageFromDB = async () => {
    try {
      const res = await fetch("/api/user/language");
      if (res.ok) {
        const data = await res.json();
        if (data.language && (data.language === "en" || data.language === "tr")) {
          setLanguageState(data.language);
          localStorage.setItem("language", data.language);
        }
      }
    } catch (error) {
      console.error("Failed to fetch language preference:", error);
    } finally {
      setFetched(true);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);

    // Save to database if authenticated
    if (session?.user) {
      try {
        await fetch("/api/user/language", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: lang }),
        });
      } catch (error) {
        console.error("Failed to save language preference:", error);
      }
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language: "tr", setLanguage, t: (key) => translations.tr[key] || key }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
