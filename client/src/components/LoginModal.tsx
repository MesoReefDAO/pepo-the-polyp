import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";

interface LoginModalProps {
  onClose: () => void;
}

function OrcidLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="128" cy="128" r="128" fill="#A6CE39"/>
      <path d="M86.3 186.2H70.9V79.1h15.4v107.1zM108.9 79.1h41.6c39.6 0 57 28.3 57 53.6 0 27.5-21.5 53.6-56.8 53.6h-41.8V79.1zm15.4 93.3h24.5c34.9 0 42.9-26.5 42.9-39.7C191.7 111.2 178 93 148 93h-23.7v79.4zM88.7 56.8c0 5.5-4.5 10.1-10.1 10.1s-10.1-4.6-10.1-10.1c0-5.6 4.5-10.1 10.1-10.1s10.1 4.5 10.1 10.1z" fill="white"/>
    </svg>
  );
}

function WalletIcon() {
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="14" rx="3" stroke="#aab" strokeWidth="1.8"/>
        <path d="M16 13a1 1 0 110 2 1 1 0 010-2z" fill="#aab"/>
        <path d="M2 10h20" stroke="#aab" strokeWidth="1.8"/>
      </svg>
    </div>
  );
}

function SocialsIcon() {
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="#aab" strokeWidth="1.8"/>
        <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="#aab" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function MetaMaskIcon() {
  return (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
      alt="MetaMask"
      className="w-9 h-9 rounded-xl object-contain"
      style={{ background: "#fff1" }}
    />
  );
}

function CoinbaseIcon() {
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#0052FF" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="white" opacity="0.15"/>
        <rect x="8" y="10" width="8" height="4" rx="2" fill="white"/>
      </svg>
    </div>
  );
}

function RainbowIcon() {
  return (
    <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: "linear-gradient(135deg,#ff6b6b,#feca57,#48dbfb,#ff9ff3,#54a0ff)" }}>
      <svg width="20" height="12" viewBox="0 0 40 24" fill="none">
        <path d="M2 22C2 22 2 10 20 10C38 10 38 22 38 22" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none"/>
      </svg>
    </div>
  );
}

export function LoginModal({ onClose }: LoginModalProps) {
  const { login } = usePrivy();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const openPrivy = () => {
    onClose();
    setTimeout(() => { try { login(); } catch { /* ignore */ } }, 80);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-[380px] rounded-2xl p-6 pb-5 flex flex-col gap-3"
        style={{
          background: "#0d1117",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          data-testid="button-login-modal-close"
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-[#888] hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-1">
          <h2 className="text-white font-bold text-xl leading-tight mb-1.5" style={{ fontFamily: "Inter, sans-serif" }}>
            Sign in to MesoReef DAO
          </h2>
          <p className="text-sm" style={{ color: "#8b949e", fontFamily: "Inter, sans-serif" }}>
            Access the Coral Reef Knowledge Network
          </p>
        </div>

        {/* ORCID — primary research option */}
        <a
          href="/api/auth/orcid"
          data-testid="link-orcid-modal"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
          style={{
            background: "rgba(166,206,57,0.07)",
            border: "1px solid rgba(166,206,57,0.28)",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(166,206,57,0.13)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(166,206,57,0.07)")}
        >
          <OrcidLogo size={36} />
          <div className="flex flex-col">
            <span className="text-white font-semibold text-sm leading-none mb-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
              Sign in with ORCID iD
            </span>
            <span className="text-xs" style={{ color: "#A6CE39bb", fontFamily: "Inter, sans-serif" }}>
              For researchers & scientists
            </span>
          </div>
        </a>

        {/* Divider */}
        <div className="flex items-center gap-3 my-0.5">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
          <span className="text-xs" style={{ color: "#484f58", fontFamily: "Inter, sans-serif" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
        </div>

        {/* Wallet options → open Privy */}
        {[
          { icon: <MetaMaskIcon />, label: "MetaMask" },
          { icon: <CoinbaseIcon />, label: "Coinbase Wallet" },
          { icon: <RainbowIcon />, label: "Rainbow" },
          { icon: <WalletIcon />, label: "Other wallets" },
          { icon: <SocialsIcon />, label: "Log in with email or socials" },
        ].map(({ icon, label }) => (
          <button
            key={label}
            onClick={openPrivy}
            data-testid={`button-login-${label.toLowerCase().replace(/\s+/g, "-")}`}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all w-full"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
          >
            {icon}
            <span className="text-white text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
              {label}
            </span>
          </button>
        ))}

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <div className="w-2 h-2 rounded-full" style={{ background: "#30363d" }} />
          <span className="text-xs" style={{ color: "#484f58", fontFamily: "Inter, sans-serif" }}>
            Protected by privy
          </span>
        </div>
      </div>
    </div>
  );
}
