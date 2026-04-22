import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useState } from "react";
import { ExternalLink, FileText, Table2, Plus, CheckCircle2, Images } from "lucide-react";
import { PRIVY_ENABLED } from "@/lib/privy";

function dDocsIcon(size = 16) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8L14 2z" stroke="#48dbfb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#48dbfb" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function dSheetsIcon(size = 16) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#1dd1a1" strokeWidth="1.8"/>
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke="#1dd1a1" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function FileverseIcon(size = 14) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="#48dbfb" strokeWidth="1.7"/>
      <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="#1dd1a1" strokeWidth="1.7"/>
      <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="#1dd1a1" strokeWidth="1.7"/>
      <rect x="3" y="16" width="7" height="5" rx="1.5" stroke="#48dbfb" strokeWidth="1.7"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M5 15H4C2.9 15 2 14.1 2 13V4C2 2.9 2.9 2 4 2H13C14.1 2 15 2.9 15 4V5" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

interface FileverseWorkspacePanelProps {
  /**
   * sidebar  — compact, fits the left sidebar (no title, small buttons)
   * overlay  — medium, for the mobile hamburger overlay
   * page     — full width banner on the Workspace page
   */
  variant?: "sidebar" | "overlay" | "page";
  /** called when user taps "Log in" from sidebar/overlay variant */
  onLogin?: () => void;
}

export function FileverseWorkspacePanel({
  variant = "sidebar",
  onLogin,
}: FileverseWorkspacePanelProps) {
  const { authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const [copied, setCopied] = useState(false);

  const primaryWallet = wallets[0];
  const walletAddr = primaryWallet?.address ?? user?.wallet?.address;
  const shortAddr = walletAddr
    ? `${walletAddr.slice(0, 6)}…${walletAddr.slice(-4)}`
    : null;

  function copyAddr() {
    if (!walletAddr) return;
    navigator.clipboard.writeText(walletAddr).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* ────────────────── SIDEBAR VARIANT ───────────────────────────────── */
  if (variant === "sidebar") {
    if (!PRIVY_ENABLED || !authenticated) {
      return (
        <div className="flex gap-1.5">
          <a
            href="https://ddocs.new"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-ddocs-sidebar"
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-[10px] no-underline transition-colors"
            style={{ background: "rgba(72,219,251,0.06)", border: "1px solid rgba(72,219,251,0.2)" }}
          >
            {dDocsIcon(15)}
            <span style={{ fontSize: 9, fontWeight: 700, color: "#48dbfbbb", fontFamily: "Inter,sans-serif", letterSpacing: "0.04em" }}>dDocs</span>
          </a>
          <a
            href="https://dsheets.new"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-dsheets-sidebar"
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-[10px] no-underline transition-colors"
            style={{ background: "rgba(29,209,161,0.06)", border: "1px solid rgba(29,209,161,0.2)" }}
          >
            {dSheetsIcon(15)}
            <span style={{ fontSize: 9, fontWeight: 700, color: "#1dd1a1bb", fontFamily: "Inter,sans-serif", letterSpacing: "0.04em" }}>dSheets</span>
          </a>
          <a
            href="/workspace"
            data-testid="link-reef-image-repo-sidebar"
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-[10px] no-underline transition-colors"
            style={{ background: "rgba(255,159,67,0.06)", border: "1px solid rgba(255,159,67,0.2)" }}
          >
            <Images size={15} color="#ff9f43bb" strokeWidth={1.8} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "#ff9f43bb", fontFamily: "Inter,sans-serif", letterSpacing: "0.04em" }}>Reef Imgs</span>
          </a>
          <button
            onClick={onLogin ?? (() => { try { login(); } catch {} })}
            data-testid="button-workspace-login-sidebar"
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-[10px] transition-colors cursor-pointer"
            style={{ background: "rgba(131,238,240,0.05)", border: "1px solid rgba(131,238,240,0.14)", outline: "none" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="#83eef066" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#83eef055", fontFamily: "Inter,sans-serif", letterSpacing: "0.04em" }}>Log in</span>
          </button>
        </div>
      );
    }

    /* Authenticated sidebar — connected panel */
    return (
      <div
        className="flex flex-col gap-2 p-2.5 rounded-[14px]"
        style={{ background: "rgba(29,209,161,0.05)", border: "1px solid rgba(29,209,161,0.18)" }}
      >
        {/* Connected badge */}
        <div className="flex items-center gap-1.5 px-0.5">
          <CheckCircle2 size={10} className="text-[#1dd1a1] flex-shrink-0" />
          <span style={{ fontSize: 8.5, fontWeight: 700, color: "#1dd1a1aa", fontFamily: "Inter,sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Fileverse Connected
          </span>
        </div>

        {/* Wallet chip */}
        {shortAddr && (
          <button
            onClick={copyAddr}
            data-testid="button-copy-wallet-workspace"
            className="flex items-center justify-between gap-1 px-2 py-1 rounded-full text-left transition-colors"
            style={{ background: "rgba(131,238,240,0.07)", border: "1px solid rgba(131,238,240,0.18)" }}
          >
            <span style={{ fontSize: 9.5, fontFamily: "monospace", color: "#83eef0cc" }}>{shortAddr}</span>
            <span className="text-[#83eef070]">
              {copied ? <span style={{ fontSize: 8, color: "#1dd1a1" }}>Copied!</span> : <CopyIcon />}
            </span>
          </button>
        )}

        {/* Launch buttons */}
        <div className="flex gap-1.5">
          <a
            href="https://ddocs.new"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-ddocs-sidebar-auth"
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-[10px] no-underline transition-colors"
            style={{ background: "rgba(72,219,251,0.08)", border: "1px solid rgba(72,219,251,0.28)" }}
          >
            {dDocsIcon(15)}
            <span style={{ fontSize: 9, fontWeight: 700, color: "#48dbfb", fontFamily: "Inter,sans-serif" }}>dDocs</span>
          </a>
          <a
            href="https://dsheets.new"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-dsheets-sidebar-auth"
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-[10px] no-underline transition-colors"
            style={{ background: "rgba(29,209,161,0.08)", border: "1px solid rgba(29,209,161,0.28)" }}
          >
            {dSheetsIcon(15)}
            <span style={{ fontSize: 9, fontWeight: 700, color: "#1dd1a1", fontFamily: "Inter,sans-serif" }}>dSheets</span>
          </a>
          <a
            href="/workspace"
            data-testid="link-reef-image-repo-sidebar-auth"
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-[10px] no-underline transition-colors"
            style={{ background: "rgba(255,159,67,0.08)", border: "1px solid rgba(255,159,67,0.28)" }}
          >
            <Images size={15} color="#ff9f43" strokeWidth={1.8} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "#ff9f43", fontFamily: "Inter,sans-serif" }}>Reef Imgs</span>
          </a>
          <a
            href="https://fileverse.io"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-fileverse-portal"
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-[10px] no-underline transition-colors"
            style={{ background: "rgba(131,238,240,0.05)", border: "1px solid rgba(131,238,240,0.18)" }}
          >
            {FileverseIcon(15)}
            <span style={{ fontSize: 9, fontWeight: 700, color: "#83eef077", fontFamily: "Inter,sans-serif" }}>Portal</span>
          </a>
        </div>
      </div>
    );
  }

  /* ────────────────── OVERLAY VARIANT (mobile hamburger) ─────────────── */
  if (variant === "overlay") {
    if (!PRIVY_ENABLED || !authenticated) return null;

    return (
      <div className="flex flex-col gap-2">
        {/* Section label */}
        <p className="[font-family:'Inter',Helvetica] text-[#d4e9f350] text-xs px-1 uppercase tracking-wider">
          Reef Workspace
        </p>

        <div
          className="flex flex-col gap-3 px-3 py-3 rounded-2xl"
          style={{ background: "rgba(29,209,161,0.05)", border: "1px solid rgba(29,209,161,0.18)" }}
        >
          {/* Connected + wallet */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#1dd1a1]" />
              <span className="[font-family:'Inter',Helvetica] text-[#1dd1a1] text-xs font-semibold">
                Fileverse connected
              </span>
            </div>
            {shortAddr && (
              <button
                onClick={copyAddr}
                data-testid="button-copy-wallet-workspace-mobile"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-left transition-colors"
                style={{ background: "rgba(131,238,240,0.07)", border: "1px solid rgba(131,238,240,0.18)" }}
              >
                <span className="[font-family:'Inter',Helvetica] text-[#83eef0cc] text-[10px] font-mono">{shortAddr}</span>
                <span className="text-[#83eef070]">
                  {copied ? <span className="text-[#1dd1a1] text-[9px]">✓</span> : <CopyIcon />}
                </span>
              </button>
            )}
          </div>

          <p className="[font-family:'Inter',Helvetica] text-[#9aaeb8] text-[11px] leading-5 px-0.5">
            Your Privy wallet is your Fileverse identity. Tap below to open your decentralised workspace.
          </p>

          {/* dDocs + dSheets + Reef Image Repo */}
          <div className="flex gap-2">
            <a
              href="https://ddocs.new"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-ddocs-mobile-overlay"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl no-underline transition-colors"
              style={{ background: "rgba(72,219,251,0.08)", border: "1px solid rgba(72,219,251,0.28)" }}
            >
              <FileText size={16} color="#48dbfb" strokeWidth={1.8} />
              <div className="flex flex-col">
                <span className="[font-family:'Inter',Helvetica] text-[#48dbfb] text-[13px] font-bold leading-4">dDocs</span>
                <span className="[font-family:'Inter',Helvetica] text-[#48dbfb88] text-[9px]">New document</span>
              </div>
            </a>
            <a
              href="https://dsheets.new"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-dsheets-mobile-overlay"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl no-underline transition-colors"
              style={{ background: "rgba(29,209,161,0.08)", border: "1px solid rgba(29,209,161,0.28)" }}
            >
              <Table2 size={16} color="#1dd1a1" strokeWidth={1.8} />
              <div className="flex flex-col">
                <span className="[font-family:'Inter',Helvetica] text-[#1dd1a1] text-[13px] font-bold leading-4">dSheets</span>
                <span className="[font-family:'Inter',Helvetica] text-[#1dd1a188] text-[9px]">New spreadsheet</span>
              </div>
            </a>
            <a
              href="/workspace"
              data-testid="link-reef-image-repo-mobile-overlay"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl no-underline transition-colors"
              style={{ background: "rgba(255,159,67,0.08)", border: "1px solid rgba(255,159,67,0.28)" }}
            >
              <Images size={16} color="#ff9f43" strokeWidth={1.8} />
              <div className="flex flex-col">
                <span className="[font-family:'Inter',Helvetica] text-[#ff9f43] text-[13px] font-bold leading-4">Reef Imgs</span>
                <span className="[font-family:'Inter',Helvetica] text-[#ff9f4388] text-[9px]">Image archive</span>
              </div>
            </a>
          </div>

          {/* Portal link */}
          <a
            href="https://fileverse.io"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-fileverse-portal-mobile"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl no-underline transition-colors"
            style={{ background: "rgba(131,238,240,0.05)", border: "1px solid rgba(131,238,240,0.15)" }}
          >
            <ExternalLink size={13} color="#83eef066" />
            <span className="[font-family:'Inter',Helvetica] text-[#83eef088] text-xs font-medium">
              Open Fileverse Portal
            </span>
          </a>
        </div>
      </div>
    );
  }

  /* ────────────────── PAGE VARIANT (WorkspacePage) ───────────────────── */
  if (!PRIVY_ENABLED || !authenticated) {
    return (
      <div
        className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl px-5 py-4 mb-6"
        style={{ background: "rgba(131,238,240,0.04)", border: "1px solid rgba(131,238,240,0.14)" }}
      >
        <div>
          <p className="[font-family:'Inter',Helvetica] text-[#d4e9f3cc] text-sm font-semibold mb-0.5">
            Connect your wallet to access your workspace
          </p>
          <p className="[font-family:'Inter',Helvetica] text-[#9aaeb8] text-xs leading-5">
            Your Privy wallet is your Fileverse identity — no separate account needed.
          </p>
        </div>
        <button
          onClick={onLogin ?? (() => { try { login(); } catch {} })}
          data-testid="button-workspace-login-page"
          className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#83eef0,#3fb0b3)", color: "#00585a" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="#00585a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Log in with Privy
        </button>
      </div>
    );
  }

  /* Authenticated page banner */
  return (
    <div
      className="w-full rounded-2xl px-5 py-4 mb-6 flex flex-col gap-4"
      style={{ background: "rgba(29,209,161,0.05)", border: "1px solid rgba(29,209,161,0.2)" }}
    >
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(29,209,161,0.12)", border: "1px solid rgba(29,209,161,0.3)" }}
          >
            <CheckCircle2 size={16} className="text-[#1dd1a1]" />
          </div>
          <div>
            <p className="[font-family:'Inter',Helvetica] text-[#1dd1a1] text-sm font-bold leading-4">
              Fileverse workspace connected
            </p>
            <p className="[font-family:'Inter',Helvetica] text-[#9aaeb8] text-xs leading-4 mt-0.5">
              Your Privy wallet is your Fileverse identity. No separate login needed.
            </p>
          </div>
        </div>

        {/* Wallet chip */}
        {shortAddr && (
          <button
            onClick={copyAddr}
            data-testid="button-copy-wallet-workspace-page"
            className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors"
            style={{ background: "rgba(131,238,240,0.07)", border: "1px solid rgba(131,238,240,0.2)" }}
          >
            <span className="[font-family:'Inter',Helvetica] text-[#83eef0cc] text-xs font-mono">{shortAddr}</span>
            <span className="text-[#83eef070]">
              {copied
                ? <span className="[font-family:'Inter',Helvetica] text-[#1dd1a1] text-xs">Copied!</span>
                : <CopyIcon />}
            </span>
          </button>
        )}
      </div>

      {/* Quick-launch row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="https://ddocs.new"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-ddocs-page-auth"
          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl no-underline group transition-colors"
          style={{ background: "rgba(72,219,251,0.07)", border: "1px solid rgba(72,219,251,0.25)" }}
        >
          <FileText size={20} color="#48dbfb" strokeWidth={1.6} />
          <div className="flex-1">
            <p className="[font-family:'Inter',Helvetica] text-[#48dbfb] text-sm font-bold leading-4">dDocs</p>
            <p className="[font-family:'Inter',Helvetica] text-[#48dbfb88] text-xs leading-4">Create a new decentralised document</p>
          </div>
          <Plus size={14} color="#48dbfb88" />
        </a>
        <a
          href="https://dsheets.new"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-dsheets-page-auth"
          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl no-underline group transition-colors"
          style={{ background: "rgba(29,209,161,0.07)", border: "1px solid rgba(29,209,161,0.25)" }}
        >
          <Table2 size={20} color="#1dd1a1" strokeWidth={1.6} />
          <div className="flex-1">
            <p className="[font-family:'Inter',Helvetica] text-[#1dd1a1] text-sm font-bold leading-4">dSheets</p>
            <p className="[font-family:'Inter',Helvetica] text-[#1dd1a188] text-xs leading-4">Create a new decentralised spreadsheet</p>
          </div>
          <Plus size={14} color="#1dd1a188" />
        </a>
        <a
          href="/workspace"
          data-testid="link-reef-image-repo-page"
          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl no-underline group transition-colors"
          style={{ background: "rgba(255,159,67,0.07)", border: "1px solid rgba(255,159,67,0.25)" }}
        >
          <Images size={20} color="#ff9f43" strokeWidth={1.6} />
          <div className="flex-1">
            <p className="[font-family:'Inter',Helvetica] text-[#ff9f43] text-sm font-bold leading-4">Reef Image Repo</p>
            <p className="[font-family:'Inter',Helvetica] text-[#ff9f4388] text-xs leading-4">Community coral reef image archive</p>
          </div>
          <Plus size={14} color="#ff9f4388" />
        </a>
        <a
          href="https://fileverse.io"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-fileverse-portal-page"
          className="sm:w-auto flex items-center gap-2 px-4 py-3 rounded-xl no-underline transition-colors"
          style={{ background: "rgba(131,238,240,0.05)", border: "1px solid rgba(131,238,240,0.16)" }}
        >
          {FileverseIcon(18)}
          <div>
            <p className="[font-family:'Inter',Helvetica] text-[#83eef0cc] text-sm font-bold leading-4">Portal</p>
            <p className="[font-family:'Inter',Helvetica] text-[#83eef066] text-xs leading-4">fileverse.io</p>
          </div>
          <ExternalLink size={12} color="#83eef044" className="ml-1" />
        </a>
      </div>
    </div>
  );
}
