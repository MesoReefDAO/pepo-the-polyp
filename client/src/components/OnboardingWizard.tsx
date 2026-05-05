import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { useOrcidAuth } from "@/hooks/use-orcid-auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import pepoPng from "@assets/MesoReefDAO_Pepo_The_Polyp_1776218616437.png";

const STORAGE_KEY = "pepo_onboarded_v1";

const STEP_IDS = ["welcome", "profile", "orcid", "action", "explore"] as const;
type StepId = typeof STEP_IDS[number];

// ── Dot progress bar ─────────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            background: i <= current ? "#83eef0" : "rgba(131,238,240,0.2)",
          }}
        />
      ))}
    </div>
  );
}

// ── Feature nav card ─────────────────────────────────────────────────────────
function FeatureCard({
  icon, title, desc, href, onClick,
}: {
  icon: string;
  title: string;
  desc: string;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <div
      className="flex flex-col gap-1.5 p-4 rounded-2xl border border-[#83eef01a] hover:border-[#83eef040] hover:bg-[#83eef008] transition-all cursor-pointer"
      style={{ background: "rgba(0,8,12,0.5)" }}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-bold text-[#d4e9f3] text-sm [font-family:'Plus_Jakarta_Sans',Helvetica]">{title}</span>
      <span className="text-[#d4e9f366] text-xs [font-family:'Inter',Helvetica] leading-relaxed">{desc}</span>
    </div>
  );
  if (href) {
    return <a href={href} className="no-underline">{inner}</a>;
  }
  return <div onClick={onClick}>{inner}</div>;
}

// ── Main wizard ───────────────────────────────────────────────────────────────
interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const { t } = useTranslation();

  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [coralClaimed, setCoralClaimed] = useState(false);
  const [coralLoading, setCoralLoading] = useState(false);
  const [coralPoints, setCoralPoints] = useState(0);

  const { getAccessToken, authenticated: privyAuthenticated } = usePrivy();
  const { orcidAuthenticated } = useOrcidAuth();
  const [, navigate] = useLocation();

  const stepId = STEP_IDS[stepIndex] as StepId;

  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (privyAuthenticated) {
      const token = await getAccessToken();
      if (token) h["x-privy-token"] = token;
    }
    return h;
  }, [privyAuthenticated, getAccessToken]);

  const next = useCallback(() => {
    if (stepIndex < STEP_IDS.length - 1) {
      setDir(1);
      setStepIndex((s) => s + 1);
    } else {
      finish();
    }
  }, [stepIndex]);

  const prev = () => {
    if (stepIndex > 0) {
      setDir(-1);
      setStepIndex((s) => s - 1);
    }
  };

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    onComplete();
  };

  const saveName = async () => {
    if (!displayName.trim() || savingName) return;
    setSavingName(true);
    try {
      const h = await authHeaders();
      await fetch("/api/profiles/update", {
        method: "POST",
        headers: h,
        credentials: "include",
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      setNameSaved(true);
    } catch {}
    finally { setSavingName(false); }
  };

  const handleClaimCoral = async () => {
    if (coralClaimed || coralLoading) return;
    setCoralLoading(true);
    try {
      const h = await authHeaders();
      const res = await fetch("/api/daily-clean", {
        method: "POST",
        headers: h,
        credentials: "include",
      });
      const data = await res.json();
      setCoralClaimed(true);
      setCoralPoints(data.pointsAwarded ?? 10);
    } catch { setCoralClaimed(true); }
    finally { setCoralLoading(false); }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,4,8,0.88)", backdropFilter: "blur(12px)" }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md rounded-[28px] overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(160deg, #001a22 0%, #00080c 100%)",
          border: "1px solid rgba(131,238,240,0.15)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 4px 20px rgba(131,238,240,0.08)",
          maxHeight: "90vh",
        }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
          <StepDots current={stepIndex} total={STEP_IDS.length} />
          <button
            onClick={finish}
            className="text-[#d4e9f340] hover:text-[#d4e9f380] text-xs [font-family:'Inter',Helvetica] transition-colors"
          >
            {t("onboarding.skip")}
          </button>
        </div>

        {/* Animated step content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={stepId}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="px-6 py-6"
            >

              {/* ── Step 1: Welcome ─────────────────────────────────────── */}
              {stepId === "welcome" && (
                <div className="flex flex-col items-center text-center gap-5">
                  <div className="relative">
                    <div
                      className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#83eef040]"
                      style={{ boxShadow: "0 0 32px rgba(131,238,240,0.2)" }}
                    >
                      <img src={pepoPng} alt="Pepo" className="w-full h-full object-cover object-center" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 text-2xl">🪸</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f3] text-2xl">
                      {t("onboarding.welcomeTitle")}
                    </h2>
                    <p className="text-[#d4e9f380] text-sm [font-family:'Inter',Helvetica] leading-relaxed">
                      {t("onboarding.welcomeIntro")}{" "}
                      <span className="text-[#83eef0] font-semibold">{t("onboarding.welcomeDesci")}</span>{" "}
                      {t("onboarding.welcomeMid")}{" "}
                      <span className="text-[#A6CE39] font-semibold">{t("onboarding.welcomeRegen")}</span>{" "}
                      {t("onboarding.welcomeEnd")}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 w-full">
                    {[
                      { icon: "🔬", label: t("onboarding.desci"),         sub: t("onboarding.openScience") },
                      { icon: "🪸", label: t("onboarding.mesoamerica"),   sub: t("onboarding.worldwide") },
                      { icon: "🗳️", label: t("onboarding.governanceLabel"), sub: t("onboarding.daoVoting") },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex flex-col items-center gap-1 py-3 rounded-xl border border-[#83eef015]"
                        style={{ background: "rgba(131,238,240,0.04)" }}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-[#d4e9f3aa] text-[10px] [font-family:'Inter',Helvetica] font-semibold">{item.label}</span>
                        <span className="text-[#d4e9f344] text-[9px] [font-family:'Inter',Helvetica]">{item.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 2: Profile ─────────────────────────────────────── */}
              {stepId === "profile" && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f3] text-xl">
                      {t("onboarding.profileTitle")}
                    </h2>
                    <p className="text-[#d4e9f380] text-sm [font-family:'Inter',Helvetica] leading-relaxed">
                      {t("onboarding.profileDesc")}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => { setDisplayName(e.target.value); setNameSaved(false); }}
                      placeholder={t("onboarding.profilePlaceholder")}
                      maxLength={40}
                      data-testid="input-onboarding-name"
                      className="w-full px-4 py-3 rounded-xl border border-[#83eef030] bg-[#83eef00a] text-[#d4e9f3] text-sm [font-family:'Inter',Helvetica] placeholder-[#d4e9f330] focus:outline-none focus:border-[#83eef060] transition-colors"
                    />
                    <button
                      onClick={saveName}
                      disabled={!displayName.trim() || savingName || nameSaved}
                      data-testid="button-save-onboarding-name"
                      className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm [font-family:'Plus_Jakarta_Sans',Helvetica] transition-all disabled:opacity-40"
                      style={{
                        background: nameSaved
                          ? "rgba(131,238,240,0.12)"
                          : "linear-gradient(135deg,#83eef0 0%,#3fb0b3 100%)",
                        color: nameSaved ? "#83eef0" : "#003c3e",
                      }}
                    >
                      {savingName ? (
                        <><span className="w-4 h-4 rounded-full border-2 border-[#003c3e] border-t-transparent animate-spin" /> {t("onboarding.saving")}</>
                      ) : nameSaved ? t("onboarding.nameSaved") : t("onboarding.saveName")}
                    </button>
                  </div>
                  {nameSaved && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#83eef030]"
                      style={{ background: "rgba(131,238,240,0.06)" }}
                    >
                      <span className="text-lg">🎉</span>
                      <p className="text-[#83eef0] text-xs [font-family:'Inter',Helvetica]">
                        {t("onboarding.nameGreeting", { name: displayName })}
                      </p>
                    </motion.div>
                  )}
                  <p className="text-[#d4e9f330] text-[11px] text-center [font-family:'Inter',Helvetica]">
                    {t("onboarding.profileSkip")}
                  </p>
                </div>
              )}

              {/* ── Step 3: ORCID ───────────────────────────────────────── */}
              {stepId === "orcid" && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f3] text-xl">
                      {t("onboarding.orcidTitle")}
                    </h2>
                    <p className="text-[#d4e9f380] text-sm [font-family:'Inter',Helvetica] leading-relaxed">
                      {t("onboarding.orcidDesc")} <span className="text-[#A6CE39] font-semibold">{t("onboarding.orcidPts")}</span>.
                    </p>
                  </div>

                  <div
                    className="flex flex-col gap-3 p-4 rounded-2xl border border-[#A6CE3930]"
                    style={{ background: "rgba(166,206,57,0.05)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#A6CE3920" }}>
                        <span className="text-[#A6CE39] font-black text-xs">iD</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#d4e9f3] text-sm [font-family:'Plus_Jakarta_Sans',Helvetica]">ORCID iD</span>
                        <span className="text-[#d4e9f360] text-xs [font-family:'Inter',Helvetica]">{t("onboarding.orcidFree")}</span>
                      </div>
                      <div className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: "#A6CE3920", border: "1px solid #A6CE3940" }}>
                        <span className="text-[#A6CE39] text-xs font-bold [font-family:'Plus_Jakarta_Sans',Helvetica]">+25 pts</span>
                      </div>
                    </div>
                    {orcidAuthenticated ? (
                      <div className="flex items-center gap-2 text-[#A6CE39] text-sm [font-family:'Inter',Helvetica]">
                        <span>✓</span> {t("onboarding.orcidAlreadyLinked")}
                      </div>
                    ) : (
                      <a
                        href="/api/auth/orcid?mode=auth"
                        data-testid="button-onboarding-orcid"
                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm [font-family:'Plus_Jakarta_Sans',Helvetica] no-underline transition-opacity hover:opacity-90 active:opacity-75"
                        style={{ background: "#A6CE39", color: "#1a2800" }}
                      >
                        {t("onboarding.connectOrcid")}
                      </a>
                    )}
                  </div>

                  <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-[#ffffff08]">
                    <span className="text-base shrink-0 mt-0.5">💡</span>
                    <p className="text-[#d4e9f350] text-[11px] [font-family:'Inter',Helvetica] leading-relaxed">
                      {t("onboarding.orcidTip")} <a href="https://orcid.org" target="_blank" rel="noopener noreferrer" className="text-[#A6CE39] underline">orcid.org</a>{t("onboarding.orcidTipEnd")}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Step 4: Reef Action ─────────────────────────────────── */}
              {stepId === "action" && (
                <div className="flex flex-col items-center gap-5 text-center">
                  <div className="flex flex-col gap-2">
                    <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f3] text-xl">
                      {t("onboarding.coralTitle")}
                    </h2>
                    <p className="text-[#d4e9f380] text-sm [font-family:'Inter',Helvetica] leading-relaxed">
                      {t("onboarding.coralDesc")} <span className="text-[#83eef0] font-semibold">{t("onboarding.coralPts")}</span>{t("onboarding.coralDescEnd")}
                    </p>
                  </div>

                  <button
                    onClick={handleClaimCoral}
                    disabled={coralClaimed || coralLoading}
                    data-testid="button-onboarding-clean"
                    className="relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{
                      background: coralClaimed
                        ? "rgba(131,238,240,0.1)"
                        : "linear-gradient(135deg, rgba(131,238,240,0.15) 0%, rgba(63,176,179,0.15) 100%)",
                      border: coralClaimed ? "2px solid rgba(131,238,240,0.3)" : "2px solid rgba(131,238,240,0.2)",
                      boxShadow: coralClaimed ? "0 0 32px rgba(131,238,240,0.15)" : "0 0 20px rgba(131,238,240,0.08)",
                      cursor: coralClaimed ? "default" : coralLoading ? "wait" : "pointer",
                    }}
                  >
                    {coralLoading ? (
                      <div className="w-8 h-8 rounded-full border-2 border-[#83eef0] border-t-transparent animate-spin" />
                    ) : (
                      <span className="text-5xl">{coralClaimed ? "✨" : "🪸"}</span>
                    )}
                  </button>

                  {coralClaimed ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "#83eef020", border: "1px solid #83eef040" }}>
                        <span className="text-[#83eef0] font-bold text-sm [font-family:'Plus_Jakarta_Sans',Helvetica]">
                          {t("onboarding.ptsEarned", { pts: coralPoints || 10 })}
                        </span>
                      </div>
                      <p className="text-[#d4e9f366] text-xs [font-family:'Inter',Helvetica]">
                        {t("onboarding.coralTomorrow")}
                      </p>
                    </motion.div>
                  ) : (
                    <p className="text-[#d4e9f350] text-xs [font-family:'Inter',Helvetica]">{t("onboarding.tapCoral")}</p>
                  )}
                </div>
              )}

              {/* ── Step 5: Explore ─────────────────────────────────────── */}
              {stepId === "explore" && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f3] text-xl">
                      {t("onboarding.exploreTitle")}
                    </h2>
                    <p className="text-[#d4e9f380] text-sm [font-family:'Inter',Helvetica] leading-relaxed">
                      {t("onboarding.exploreDesc")}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FeatureCard icon="🧠" title={t("onboarding.knowledgeGraphTitle")} desc={t("onboarding.knowledgeGraphDesc")} onClick={finish} />
                    <FeatureCard icon="🗳️" title={t("onboarding.governanceTitle")} desc={t("onboarding.governanceDesc")} href="/governance" />
                    <FeatureCard icon="👥" title={t("onboarding.communityTitle")} desc={t("onboarding.communityDesc")} href="/community" />
                    <FeatureCard icon="🗺️" title={t("onboarding.reefMapTitle")} desc={t("onboarding.reefMapDesc")} href="/map" />
                    <FeatureCard icon="📁" title={t("onboarding.workspaceTitle")} desc={t("onboarding.workspaceDesc")} href="/workspace" />
                    <FeatureCard icon="👤" title={t("onboarding.myProfileTitle")} desc={t("onboarding.myProfileDesc")} href="/profile" />
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div className="shrink-0 flex items-center justify-between px-6 pb-6 pt-2 gap-3">
          {stepIndex > 0 ? (
            <button
              onClick={prev}
              className="px-4 py-2.5 rounded-xl text-sm [font-family:'Inter',Helvetica] text-[#d4e9f366] hover:text-[#d4e9f3] border border-[#ffffff0d] hover:border-[#ffffff1a] transition-colors"
            >
              {t("onboarding.back")}
            </button>
          ) : <div />}
          <button
            onClick={stepIndex === STEP_IDS.length - 1 ? finish : next}
            data-testid={stepIndex === STEP_IDS.length - 1 ? "button-onboarding-finish" : "button-onboarding-next"}
            className="flex-1 py-3 rounded-xl font-bold text-sm [font-family:'Plus_Jakarta_Sans',Helvetica] transition-all hover:opacity-95 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg,#83eef0 0%,#3fb0b3 100%)",
              color: "#003c3e",
              boxShadow: "0 4px 16px rgba(131,238,240,0.25)",
            }}
          >
            {stepIndex === STEP_IDS.length - 1 ? t("onboarding.enterMesoReef") : t("onboarding.continue")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Hook: should we show the wizard? ─────────────────────────────────────────
export function useOnboarding() {
  const [show, setShow] = useState(false);
  const { authenticated: privyAuthenticated } = usePrivy();
  const { orcidAuthenticated } = useOrcidAuth();
  const isAuthed = privyAuthenticated || orcidAuthenticated;

  useEffect(() => {
    if (!isAuthed) return;
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setShow(true);
    } catch {}
  }, [isAuthed]);

  const dismiss = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setShow(false);
  }, []);

  return { show, dismiss };
}
