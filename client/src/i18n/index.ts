import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en";
import es from "./locales/es";
import pt from "./locales/pt";
import ar from "./locales/ar";
import fr from "./locales/fr";
import it from "./locales/it";
import zh from "./locales/zh";

export const LANGUAGES = [
  { code: "en", label: "English",    flag: "🇬🇧", dir: "ltr" as const },
  { code: "es", label: "Español",    flag: "🇲🇽", dir: "ltr" as const },
  { code: "pt", label: "Português",  flag: "🇧🇷", dir: "ltr" as const },
  { code: "ar", label: "العربية",    flag: "🇸🇦", dir: "rtl" as const },
  { code: "fr", label: "Français",   flag: "🇫🇷", dir: "ltr" as const },
  { code: "it", label: "Italiano",   flag: "🇮🇹", dir: "ltr" as const },
  { code: "zh", label: "中文",        flag: "🇨🇳", dir: "ltr" as const },
] as const;

export type LangCode = typeof LANGUAGES[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      pt: { translation: pt },
      ar: { translation: ar },
      fr: { translation: fr },
      it: { translation: it },
      zh: { translation: zh },
    },
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "pepo_lang",
    },
    interpolation: { escapeValue: false },
  } as any);

export default i18n;
