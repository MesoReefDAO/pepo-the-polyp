import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { X, AlertCircle } from "lucide-react";
import { OrcidIcon } from "./OrcidLoginButton";

// ─── Wallet definitions ───────────────────────────────────────────────────────

interface WalletDef {
  id: string;
  name: string;
  desc: string;
  accent: string;
  icon: React.ReactNode;
}

const FEATURED_WALLETS: WalletDef[] = [
  {
    id: "metamask",
    name: "MetaMask",
    desc: "The most popular Ethereum wallet",
    accent: "#F6851B",
    icon: (
      <svg width="34" height="32" viewBox="0 0 318 318" fill="none">
        <polygon points="274.1,35.5 174.6,109.4 193,65.8" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="43.4,35.5 141.5,110.1 124.5,65.8" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="238,206.8 211.8,247.4 268.5,263 284.8,207.7" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="32.7,207.7 48.9,263 105.6,247.4 79.4,206.8" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="102.3,138.2 86.5,162.1 142.7,164.6 140.8,104.3" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="215.3,138.2 176.6,103.6 174.6,164.6 230.9,162.1" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="105.6,247.4 139.2,230.9 110,208.1" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="178.3,230.9 211.8,247.4 207.5,208.1" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="211.8,247.4 178.3,230.9 181,254.5 180.6,262.3" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="105.6,247.4 136.9,262.3 136.6,254.5 139.2,230.9" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="137.4,200.6 109.2,192.1 128.8,182.8" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="180.1,200.6 188.7,182.8 208.4,192.1" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="105.6,247.4 110.2,206.8 79.4,207.7" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="207.3,206.8 211.8,247.4 238,207.7" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="230.9,162.1 174.6,164.6 180.1,200.6 188.7,182.8 208.4,192.1" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="109.2,192.1 128.8,182.8 137.4,200.6 142.7,164.6 86.5,162.1" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="86.5,162.1 110,208.1 109.2,192.1" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="208.4,192.1 207.5,208.1 230.9,162.1" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="142.7,164.6 137.4,200.6 144.1,235.6 145.6,186.1" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="174.6,164.6 171.9,186 178.3,235.6 185.4,200.6" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="185.4,200.6 178.3,235.6 183.1,238.7 207.5,208.1 208.4,192.1" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="109.2,192.1 110,208.1 134.4,238.7 139.2,235.6 142.7,200.6 137.4,200.6" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="185.9,262.3 186.1,254.5 183.7,252.3 134,252.3 131.8,254.5 136.9,262.3" fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="180.6,262.3 181,254.5 178.3,230.9 139.2,230.9 136.6,254.5 136.9,262.3" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="274.1,35.5 193,65.8 206.3,103.3 230.9,162.1 215.3,138.2 193,112.1" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="43.4,35.5 124.5,112.1 102.3,138.2 86.5,162.1 110.5,103.3 124.5,65.8" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="139.2,230.9 134.4,238.7 131.8,254.5 134,252.3 183.7,252.3 186.1,254.5 183.1,238.7 178.3,230.9" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="174.6,109.4 193,65.8 206.3,103.3" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="110.5,103.3 124.5,65.8 141.5,110.1" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "rabby",
    name: "Rabby Wallet",
    desc: "Multi-chain DeFi browser wallet",
    accent: "#8697FF",
    icon: (
      <svg width="34" height="34" viewBox="0 0 80 80" fill="none">
        <rect width="80" height="80" rx="18" fill="#8697FF"/>
        <path d="M59.2 30.6c0-10.3-8.6-18.6-19.2-18.6S20.8 20.3 20.8 30.6c0 6.3 3.2 11.8 8.1 15.2L25 55h30l-3.9-9.2c4.9-3.4 8.1-8.9 8.1-15.2z" fill="white" fillOpacity="0.95"/>
        <ellipse cx="33" cy="30" rx="4" ry="5" fill="#8697FF"/>
        <ellipse cx="47" cy="30" rx="4" ry="5" fill="#8697FF"/>
        <circle cx="33" cy="30" r="2" fill="#1a1a2e"/>
        <circle cx="47" cy="30" r="2" fill="#1a1a2e"/>
        <path d="M35 37c0 2.8 10 2.8 10 0" stroke="#8697FF" strokeWidth="1.8" strokeLinecap="round"/>
        <rect x="28" y="53" width="24" height="8" rx="4" fill="white" fillOpacity="0.9"/>
        <path d="M28 57c-4 0-7 2-7 5s3 5 7 5h2v-10h-2z" fill="white" fillOpacity="0.7"/>
        <path d="M52 57c4 0 7 2 7 5s-3 5-7 5h-2v-10h2z" fill="white" fillOpacity="0.7"/>
      </svg>
    ),
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    desc: "Simple & secure self-custody",
    accent: "#0052FF",
    icon: (
      <svg width="34" height="34" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="42" fill="#0052FF"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M100 15C53.6 15 16 52.6 16 99S53.6 183 100 183s84-37.6 84-84S146.4 15 100 15zm-20.8 60.2h41.6c3.1 0 5.6 2.5 5.6 5.6v38.4c0 3.1-2.5 5.6-5.6 5.6H79.2c-3.1 0-5.6-2.5-5.6-5.6V80.8c0-3.1 2.5-5.6 5.6-5.6z" fill="white"/>
      </svg>
    ),
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

interface WalletPickerModalProps {
  onClose: () => void;
}

export function WalletPickerModal({ onClose }: WalletPickerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const { login } = usePrivy();

  // All wallet buttons route through Privy's native modal
  const openPrivy = () => {
    setError(null);
    onClose();
    setTimeout(() => {
      try { login(); } catch { /* ignore */ }
    }, 80);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        data-testid="wallet-picker-modal"
        className="relative z-10 w-full sm:max-w-sm bg-[#060f12] border border-[#83eef018] rounded-t-3xl sm:rounded-3xl shadow-[0_-8px_60px_rgba(0,0,0,0.8)] overflow-hidden max-h-[92svh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <div>
            <h2 className="[font-family:'Inter',Helvetica] font-bold text-[#d4e9f3] text-lg">
              Connect Wallet
            </h2>
            <p className="[font-family:'Inter',Helvetica] text-[#d4e9f350] text-xs mt-0.5">
              MesoReef DAO · Coral Knowledge Network
            </p>
          </div>
          <button
            onClick={onClose}
            data-testid="wallet-picker-close"
            className="w-8 h-8 rounded-full bg-[#ffffff0a] hover:bg-[#ffffff14] flex items-center justify-center transition-colors"
          >
            <X size={15} className="text-[#d4e9f380]" />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl bg-[#ff4a4a0d] border border-[#ff4a4a30] flex items-start gap-2 flex-shrink-0">
            <AlertCircle size={13} className="text-[#ff8080] mt-0.5 flex-shrink-0" />
            <p className="[font-family:'Inter',Helvetica] text-[#ff9090] text-xs leading-relaxed">{error}</p>
          </div>
        )}

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 pb-6">

          {/* ── Browser wallets ── */}
          <div className="flex flex-col gap-2.5 mb-5">
            {FEATURED_WALLETS.map((w) => (
              <button
                key={w.id}
                onClick={openPrivy}
                data-testid={`wallet-option-${w.id}`}
                className="flex items-center gap-3.5 w-full px-4 py-3.5 rounded-2xl border transition-all text-left hover:opacity-90 active:scale-[0.99]"
                style={{ background: `${w.accent}08`, borderColor: `${w.accent}28` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${w.accent}16` }}
                >
                  {w.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="[font-family:'Inter',Helvetica] font-semibold text-[#d4e9f3] text-sm leading-snug">
                    {w.name}
                  </div>
                  <div className="[font-family:'Inter',Helvetica] text-[#d4e9f348] text-xs mt-0.5">
                    {w.desc}
                  </div>
                </div>
                <ChevronRight color={`${w.accent}80`} />
              </button>
            ))}
          </div>

          {/* ── WalletConnect ── */}
          <div className="mb-5">
            <SectionDivider label="Mobile wallets" />
            <button
              onClick={openPrivy}
              data-testid="wallet-option-walletconnect"
              className="mt-2.5 flex items-center gap-3.5 w-full px-4 py-3.5 rounded-2xl border transition-all text-left hover:opacity-90 active:scale-[0.99]"
              style={{ background: "#3b99fc08", borderColor: "#3b99fc28" }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#3b99fc16" }}>
                <WalletConnectIcon />
              </div>
              <div className="flex-1 min-w-0">
                <div className="[font-family:'Inter',Helvetica] font-semibold text-[#d4e9f3] text-sm leading-snug">
                  WalletConnect
                </div>
                <div className="[font-family:'Inter',Helvetica] text-[#d4e9f348] text-xs mt-0.5">
                  Scan QR with Trust, Rainbow & more
                </div>
              </div>
              <ChevronRight color="#3b99fc80" />
            </button>
          </div>

          {/* ── ORCID ── */}
          <div className="mb-5">
            <SectionDivider label="Research identity" />
            <button
              onClick={() => { window.location.href = "/api/auth/orcid"; }}
              data-testid="wallet-option-orcid"
              className="mt-2.5 flex items-center gap-3 w-full px-4 py-3 rounded-2xl border border-[#A6CE3922] bg-[#A6CE3908] hover:bg-[#A6CE3914] transition-colors text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-[#A6CE3918] flex items-center justify-center flex-shrink-0">
                <OrcidIcon size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="[font-family:'Inter',Helvetica] font-semibold text-[#d4e9f3] text-sm">ORCID iD</div>
                <div className="[font-family:'Inter',Helvetica] text-[#d4e9f350] text-xs mt-0.5">Researcher & scientist identity</div>
              </div>
              <ChevronRight />
            </button>
          </div>

          {/* ── Social / email ── */}
          <div>
            <div className="grid grid-cols-2 gap-2 mt-2.5">
              {OTHER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={openPrivy}
                  data-testid={`wallet-option-${opt.id}`}
                  className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border border-[#ffffff0a] bg-[#ffffff04] hover:bg-[#ffffff0a] transition-colors"
                >
                  <span style={{ color: opt.color }}>{opt.icon}</span>
                  <span className="[font-family:'Inter',Helvetica] text-[#d4e9f370] text-[10px] font-medium">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#ffffff08] flex-shrink-0">
          <p className="[font-family:'Inter',Helvetica] text-[#d4e9f328] text-[10px] text-center">
            By connecting you agree to MesoReef DAO terms of service
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ChevronRight({ color = "#d4e9f320" }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
      <path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-px flex-1 bg-[#ffffff0a]" />
      <span className="[font-family:'Inter',Helvetica] text-[#d4e9f328] text-[10px] uppercase tracking-widest">
        {label}
      </span>
      <div className="h-px flex-1 bg-[#ffffff0a]" />
    </div>
  );
}

function WalletConnectIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="10" fill="#3b99fc"/>
      <path d="M9.58 12.76c3.54-3.47 9.28-3.47 12.82 0l.43.42a.44.44 0 010 .63l-1.46 1.43a.23.23 0 01-.32 0l-.59-.58c-2.47-2.42-6.47-2.42-8.94 0l-.63.62a.23.23 0 01-.32 0L9.11 13.85a.44.44 0 010-.63l.47-.46zm15.84 2.95l1.3 1.27a.44.44 0 010 .63l-5.86 5.74a.46.46 0 01-.64 0l-4.16-4.08a.12.12 0 00-.16 0l-4.16 4.08a.46.46 0 01-.64 0L5.24 17.61a.44.44 0 010-.63l1.3-1.27a.46.46 0 01.64 0l4.16 4.08a.12.12 0 00.16 0l4.16-4.08a.46.46 0 01.64 0l4.16 4.08a.12.12 0 00.16 0l4.16-4.08a.46.46 0 01.64 0z" fill="white"/>
    </svg>
  );
}

// ─── Social / email pill options ──────────────────────────────────────────────

const OTHER_OPTIONS = [
  { id: "google",   label: "Google",   color: "#4285F4",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> },
  { id: "email",    label: "Email",    color: "#83eef0",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#83eef0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="22,6 12,13 2,6" stroke="#83eef0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: "github",   label: "GitHub",   color: "#d4e9f3",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg> },
  { id: "twitter",  label: "X",        color: "#d4e9f3",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.743l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
];
