import { useState, useEffect, useCallback } from "react";
import pepoPng from "@assets/MesoReefDAO_Pepo_The_Polyp_1776218616437.png";
import coralBg from "@assets/coral_textures_1776303814463.jpg";
import { usePrivy } from "@privy-io/react-auth";
import { useOrcidAuth } from "@/hooks/use-orcid-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const TELEGRAM_BOT_URL = "https://t.me/PepothePolyp_bot";
const BONFIRES_GRAPH_URL = "https://pepo.app.bonfires.ai/graph";

const FOOTER_LINK_HREFS = [
  { key: "privacy" as const,       href: "https://mesoreefdao.gitbook.io/privacy-policy" },
  { key: "terms" as const,         href: "https://mesoreefdao.gitbook.io/terms-and-conditions" },
  { key: "conservation" as const,  href: "https://mesoreefdao.org/science-ai" },
];

function TgIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.67l-2.948-.924c-.64-.203-.652-.64.136-.954l11.5-4.433c.536-.194 1.006.131.836.862z" fill="#229ED9" />
    </svg>
  );
}

function CoralSparkle({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {["✨", "🐠", "🌿", "💧", "🪸"].map((emoji, i) => (
        <span
          key={i}
          className="absolute text-lg animate-bounce"
          style={{
            animationDelay: `${i * 0.12}s`,
            animationDuration: "0.6s",
            top: `${20 + Math.sin(i * 72 * Math.PI / 180) * 38}%`,
            left: `${50 + Math.cos(i * 72 * Math.PI / 180) * 36}%`,
            opacity: 0.9,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}

function CleanCoralPanel({ onClose }: { onClose?: () => void }) {
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sparkle, setSparkle] = useState(false);
  const [ptsFlash, setPtsFlash] = useState(false);
  const { t } = useTranslation();

  const { getAccessToken, login, authenticated: privyAuthenticated } = usePrivy();
  const { orcidAuthenticated } = useOrcidAuth();
  const isAuthenticated = privyAuthenticated || orcidAuthenticated;
  const queryClient = useQueryClient();

  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (privyAuthenticated) {
      const token = await getAccessToken();
      if (token) h["x-privy-token"] = token;
    }
    return h;
  }, [privyAuthenticated, getAccessToken]);

  useEffect(() => {
    if (!isAuthenticated) { setChecking(false); return; }
    setChecking(true);
    (async () => {
      try {
        const h = await authHeaders();
        const res = await fetch("/api/daily-clean/status", { headers: h, credentials: "include" });
        const data = await res.json();
        setClaimed(data.alreadyClaimed ?? false);
      } catch { setClaimed(false); }
      finally { setChecking(false); }
    })();
  }, [isAuthenticated, authHeaders]);

  const handleClean = async () => {
    if (claimed || loading || !isAuthenticated) return;
    setLoading(true);
    try {
      const h = await authHeaders();
      const res = await fetch("/api/daily-clean", { method: "POST", headers: h, credentials: "include" });
      const data = await res.json();
      if (data.pointsAwarded > 0 || !data.alreadyClaimed) {
        setClaimed(true);
        setSparkle(true);
        setPtsFlash(true);
        setTimeout(() => setSparkle(false), 1800);
        setTimeout(() => setPtsFlash(false), 3200);
        queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/orcid/session"] });
      } else {
        setClaimed(true);
      }
    } catch { /* non-blocking */ }
    finally { setLoading(false); }
  };

  return (
    <div
      className="relative w-full flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg,#001a22 0%,#00080c 100%)", border: "1px solid rgba(131,238,240,0.15)", borderRadius: 20, boxShadow: "0 16px 48px rgba(0,0,0,0.7)" }}
    >
      <img src={coralBg} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none opacity-30" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg,rgba(0,8,12,0.6) 0%,rgba(0,8,12,0.45) 40%,rgba(0,8,12,0.72) 100%)" }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-[#83eef01a]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full overflow-hidden border border-[#83eef066] shrink-0">
            <img src={pepoPng} alt="Pepo" className="w-full h-full object-cover object-center" />
          </div>
          <div className="flex flex-col">
            <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#83eef0] text-sm leading-5">
              {t("dashboard.dailyReefAction")}
            </span>
            <span className="[font-family:'Inter',Helvetica] text-[#d4e9f366] text-[10px]">
              {t("dashboard.helpPepoRestore")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={TELEGRAM_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-[#229ED933] hover:bg-[#229ED926] transition-colors no-underline"
            style={{ background: "rgba(34,158,217,0.1)" }}
            data-testid="link-telegram-bot"
          >
            <TgIcon size={11} />
            <span className="[font-family:'Inter',Helvetica] text-[#229ED9] text-[10px] font-medium">{t("dashboard.telegram")}</span>
          </a>
          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-full text-[#d4e9f340] hover:text-[#d4e9f380] hover:bg-[#ffffff08] transition-colors"
              data-testid="button-coral-close"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-5 px-6 py-6">
        <CoralSparkle show={sparkle} />
        <div className="relative flex items-center justify-center">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
              claimed
                ? "bg-[#83eef015] border-2 border-[#83eef040]"
                : "bg-[#83eef010] border-2 border-[#83eef030] hover:border-[#83eef060] hover:bg-[#83eef020]"
            }`}
            style={{ boxShadow: claimed ? "0 0 32px rgba(131,238,240,0.18)" : "0 0 18px rgba(131,238,240,0.08)" }}
          >
            <span className="text-5xl select-none" role="img" aria-label="coral">🪸</span>
          </div>
          {ptsFlash && (
            <div className="absolute -top-2 -right-2 flex items-center px-2.5 py-1 bg-[#83eef0] rounded-full shadow-lg animate-bounce" data-testid="badge-clean-points">
              <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#003c3e] text-sm">+10 pts</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          {checking ? (
            <div className="w-5 h-5 rounded-full border-2 border-[#83eef0] border-t-transparent animate-spin" />
          ) : claimed ? (
            <>
              <p className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-semibold text-[#83eef0] text-sm">{t("dashboard.coralCleaned")}</p>
              <p className="[font-family:'Inter',Helvetica] text-[#d4e9f366] text-xs">{t("dashboard.doneForToday")}</p>
            </>
          ) : isAuthenticated ? (
            <>
              <p className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-semibold text-[#d4e9f3] text-sm">{t("dashboard.coralNeedsHelp")}</p>
              <p className="[font-family:'Inter',Helvetica] text-[#d4e9f366] text-xs">{t("dashboard.cleanCorals")}</p>
            </>
          ) : (
            <>
              <p className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-semibold text-[#d4e9f3] text-sm">{t("dashboard.helpRegenerate")}</p>
              <p className="[font-family:'Inter',Helvetica] text-[#d4e9f366] text-xs">
                {t("dashboard.signInToCleanDesc")} <span className="text-[#83eef0] font-semibold">{t("dashboard.reefPoints")}</span>.
              </p>
            </>
          )}
        </div>

        {checking ? null : isAuthenticated ? (
          <button
            onClick={handleClean}
            disabled={claimed || loading}
            data-testid="button-clean-coral"
            className={`px-7 py-3 rounded-2xl [font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-sm transition-all duration-300 ${
              claimed
                ? "bg-[#83eef015] border border-[#83eef030] text-[#83eef066] cursor-default"
                : loading
                ? "bg-[#83eef030] border border-[#83eef050] text-[#83eef0] opacity-60 cursor-wait"
                : "bg-[linear-gradient(160deg,rgba(131,238,240,1)_0%,rgba(63,176,179,1)_100%)] text-[#003c3e] hover:opacity-90 active:scale-95 shadow-[0_4px_20px_rgba(131,238,240,0.3)] hover:shadow-[0_6px_28px_rgba(131,238,240,0.45)]"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {t("dashboard.cleaning")}
              </span>
            ) : claimed ? t("dashboard.cleanedToday") : t("dashboard.cleanCoral")}
          </button>
        ) : (
          <button
            onClick={() => { try { login(); } catch { /* ignore */ } }}
            data-testid="button-sign-in-to-clean"
            className="px-7 py-3 rounded-2xl [font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-sm bg-[linear-gradient(160deg,rgba(131,238,240,1)_0%,rgba(63,176,179,1)_100%)] text-[#003c3e] hover:opacity-90 active:scale-95 shadow-[0_4px_20px_rgba(131,238,240,0.3)] transition-all duration-300"
          >
            {t("dashboard.signInToClean")}
          </button>
        )}

        {claimed && (
          <p className="[font-family:'Inter',Helvetica] text-[#d4e9f330] text-[10px]">{t("dashboard.resetsAtMidnight")}</p>
        )}
      </div>

      {isAuthenticated && !claimed && !checking && (
        <div className="relative z-10 shrink-0 px-4 py-2 border-t border-[#83eef01a] flex items-center justify-center gap-1.5">
          <span className="text-[9px] [font-family:'Inter',Helvetica] text-[#d4e9f344]">{t("dashboard.dailyAction")}</span>
          <span className="text-[9px] text-[#83eef066]">·</span>
          <span className="text-[9px] [font-family:'Inter',Helvetica] font-semibold text-[#83eef0]">{t("dashboard.reefPts")}</span>
          <span className="text-[9px] [font-family:'Inter',Helvetica] text-[#d4e9f344]">{t("dashboard.oncePerDay")}</span>
        </div>
      )}
    </div>
  );
}

// ── Graph loading shimmer ─────────────────────────────────────────────────────
function GraphLoadingShimmer({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#00080c] z-10 gap-4">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" className="animate-pulse">
        <circle cx="5" cy="12" r="2.5" fill="#83eef0" />
        <circle cx="12" cy="5" r="2.5" fill="#83eef066" />
        <circle cx="19" cy="12" r="2.5" fill="#83eef0" />
        <circle cx="12" cy="19" r="2.5" fill="#83eef066" />
        <line x1="5" y1="12" x2="12" y2="5" stroke="#83eef040" strokeWidth="1.2"/>
        <line x1="12" y1="5" x2="19" y2="12" stroke="#83eef040" strokeWidth="1.2"/>
        <line x1="5" y1="12" x2="12" y2="19" stroke="#83eef040" strokeWidth="1.2"/>
        <line x1="12" y1="19" x2="19" y2="12" stroke="#83eef040" strokeWidth="1.2"/>
        <line x1="5" y1="12" x2="19" y2="12" stroke="#83eef030" strokeWidth="1.2"/>
        <line x1="12" y1="5" x2="12" y2="19" stroke="#83eef030" strokeWidth="1.2"/>
      </svg>
      <span className="[font-family:'Inter',Helvetica] text-[#83eef0] text-sm opacity-70">Loading Knowledge Graph…</span>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────
export const ReefInsightDashboardSection = (): JSX.Element => {
  const [coralOpen, setCoralOpen] = useState(false);
  const [graphLoading, setGraphLoading] = useState(true);
  const { t } = useTranslation();

  return (
    <div className="flex flex-col flex-1 self-stretch min-h-0 overflow-hidden px-3 md:px-6 pt-3 md:pt-4 pb-20 md:pb-6 gap-0">

      {/* ── Full-height Knowledge Graph ─────────────────────────────────── */}
      <div className="relative flex-1 min-h-0 w-full rounded-[16px] md:rounded-[20px] overflow-hidden"
           style={{ border: "1px solid rgba(131,238,240,0.12)", minHeight: "calc(100vh - 200px)" }}>

        {/* Graph iframe — fills the full container */}
        <div className="absolute inset-0">
          <GraphLoadingShimmer visible={graphLoading} />
          <iframe
            src={BONFIRES_GRAPH_URL}
            title="Reef Knowledge Graph"
            className="w-full h-full border-0"
            style={{ background: "#00080c" }}
            allow="clipboard-write; clipboard-read; pointer-lock; fullscreen"
            loading="lazy"
            data-testid="iframe-knowledge-graph"
            onLoad={() => setGraphLoading(false)}
          />
        </div>

        {/* ── Floating Daily Coral Action ─────────────────────────────── */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-3">
          {coralOpen && (
            <div
              className="w-72"
              style={{
                animation: "fadeSlideUp 0.22s ease-out",
              }}
            >
              <CleanCoralPanel onClose={() => setCoralOpen(false)} />
            </div>
          )}
          <button
            onClick={() => setCoralOpen(o => !o)}
            data-testid="button-coral-toggle"
            className="flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full transition-all active:scale-95"
            style={{
              background: coralOpen
                ? "linear-gradient(135deg,rgba(131,238,240,0.18) 0%,rgba(63,176,179,0.18) 100%)"
                : "linear-gradient(135deg,rgba(0,26,34,0.95) 0%,rgba(0,8,12,0.95) 100%)",
              border: coralOpen
                ? "1px solid rgba(131,238,240,0.45)"
                : "1px solid rgba(131,238,240,0.25)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.5), 0 2px 8px rgba(131,238,240,0.1)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="text-xl leading-none">🪸</span>
            <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#83eef0] text-sm whitespace-nowrap">
              {t("dashboard.dailyReefAction")}
            </span>
          </button>
        </div>

      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-center gap-4 pt-3 flex-wrap">
        {FOOTER_LINK_HREFS.map(({ key, href }) => (
          <a
            key={key}
            href={href}
            rel="noopener noreferrer"
            target="_blank"
            className="[font-family:'Inter',Helvetica] text-[#d4e9f340] text-[9px] hover:text-[#d4e9f380] transition-colors tracking-wide"
          >
            {t(`footer.${key}`)}
          </a>
        ))}
        <span className="text-[#d4e9f320] text-[9px]">·</span>
        <a href="https://bonfires.ai/" target="_blank" rel="noopener noreferrer"
           className="[font-family:'Inter',Helvetica] text-[#d4e9f330] text-[9px] hover:text-[#d4e9f360] transition-colors">
          Powered by Bonfires.ai
        </a>
      </div>

    </div>
  );
};
