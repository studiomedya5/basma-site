import { createContext, useContext, useState, useEffect } from "react";
import { STR } from "../lib/i18n";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("basma_lang") || "fr"; } catch { return "fr"; }
  });

  // Direction du document (RTL en arabe) + persistance
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    try { localStorage.setItem("basma_lang", lang); } catch { /* ignore */ }
  }, [lang]);

  const t = (key) => (STR[lang]?.[key] ?? STR.fr[key] ?? key);

  const value = {
    lang, setLang,
    toggle: () => setLang(lang === "fr" ? "ar" : "fr"),
    t,
    isAr: lang === "ar",
    dir: lang === "ar" ? "rtl" : "ltr",
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
