import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, type LangCode } from "@/i18n";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0];

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  function select(code: LangCode) {
    i18n.changeLanguage(code);
    const lang = LANGUAGES.find(l => l.code === code);
    document.documentElement.dir  = lang?.dir ?? "ltr";
    document.documentElement.lang = code;
    setOpen(false);
  }

  return (
    <div
      ref={ref}
      className="fixed bottom-[4.5rem] md:bottom-5 right-3 md:right-5 z-[60] flex flex-col items-end gap-1"
    >
      {/* Dropdown */}
      {open && (
        <div
          className="flex flex-col overflow-hidden rounded-2xl border border-[#83eef020] shadow-2xl"
          style={{
            background: "rgba(0,8,15,0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(131,238,240,0.08)",
          }}
        >
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => select(lang.code)}
              data-testid={`lang-option-${lang.code}`}
              className={`flex items-center gap-3 px-4 py-2.5 text-left transition-colors w-full ${
                current.code === lang.code
                  ? "bg-[#83eef015] text-[#83eef0]"
                  : "text-[#d4e9f380] hover:bg-[#83eef00a] hover:text-[#d4e9f3]"
              }`}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="text-xs [font-family:'Inter',Helvetica] font-medium whitespace-nowrap">
                {lang.label}
              </span>
              {current.code === lang.code && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="ml-auto">
                  <path d="M20 6L9 17l-5-5" stroke="#83eef0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        data-testid="button-language-switcher"
        aria-label="Change language"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#83eef030] transition-all hover:border-[#83eef060] active:scale-95"
        style={{
          background: open ? "rgba(131,238,240,0.12)" : "rgba(0,8,15,0.88)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
        }}
      >
        <span className="text-sm leading-none">{current.flag}</span>
        <span className="text-[10px] [font-family:'Inter',Helvetica] font-semibold text-[#83eef0] uppercase tracking-wide">
          {current.code}
        </span>
        <svg
          width="8" height="8" viewBox="0 0 24 24" fill="none"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="#83eef0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
