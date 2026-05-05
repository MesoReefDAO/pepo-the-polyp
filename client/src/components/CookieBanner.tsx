import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const COOKIE_KEY = "pepo_cookies_v1";

export function CookieBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const pref = localStorage.getItem(COOKIE_KEY);
      if (!pref) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try { localStorage.setItem(COOKIE_KEY, "accepted"); } catch {}
    setVisible(false);
  }

  function decline() {
    try { localStorage.setItem(COOKIE_KEY, "declined"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-[4.5rem] md:bottom-4 left-3 right-3 md:left-auto md:right-auto md:max-w-sm md:left-4 z-[55] rounded-2xl border border-[#83eef020] px-4 py-3 flex items-start gap-3 shadow-2xl"
      style={{
        background: "rgba(0,8,15,0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(131,238,240,0.06)",
      }}
      role="dialog"
      aria-label="Cookie consent"
      data-testid="cookie-banner"
    >
      {/* Cookie icon */}
      <span className="text-xl shrink-0 mt-0.5">🍪</span>

      {/* Text + buttons */}
      <div className="flex flex-col gap-2.5 flex-1 min-w-0">
        <p className="text-[11px] [font-family:'Inter',Helvetica] text-[#d4e9f380] leading-relaxed">
          {t("cookies.message")}{" "}
          <a
            href="https://mesoreefdao.gitbook.io/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#83eef066] hover:text-[#83eef0] underline underline-offset-2 transition-colors"
          >
            {t("cookies.learnMore")}
          </a>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={accept}
            data-testid="button-cookie-accept"
            className="flex-1 py-1.5 rounded-xl text-[11px] [font-family:'Inter',Helvetica] font-semibold transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg,#83eef0 0%,#3fb0b3 100%)",
              color: "#003c3e",
            }}
          >
            {t("cookies.accept")}
          </button>
          <button
            onClick={decline}
            data-testid="button-cookie-decline"
            className="flex-1 py-1.5 rounded-xl text-[11px] [font-family:'Inter',Helvetica] font-medium text-[#d4e9f350] border border-[#ffffff0d] hover:border-[#ffffff1a] hover:text-[#d4e9f380] transition-all active:scale-95"
          >
            {t("cookies.decline")}
          </button>
        </div>
      </div>
    </div>
  );
}
