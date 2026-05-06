import { useState } from "react";
import { Link } from "wouter";
import { OrcidLoginButton } from "@/components/OrcidLoginButton";
import { PrivyLoginButton } from "@/components/PrivyLoginButton";
import { FileverseWorkspacePanel } from "@/components/FileverseWorkspacePanel";
import { MetaMaskIcon, CopyIcon, LoginArrowIcon, OrcidIcon } from "@/components/icons";
import { PRIVY_ENABLED } from "@/lib/privy";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useOrcidAuth } from "@/hooks/use-orcid-auth";

const NAV_LINKS = [
  { label: "MesoReef DAO", href: "https://mesoreefdao.org/" },
  { label: "ReefRegen",    href: "https://reefregen.org/" },
  { label: "Workspace",   href: "/workspace", internal: true },
  { label: "bio",         href: "https://app.bio.xyz/launchpad", badge: "soon" },
  { label: "Join",        href: "https://linktr.ee/mesoreefdao" },
];

// ── Mobile wallet section (Privy-authenticated) ───────────────────────────────
function MobileWalletSection() {
  const { linkWallet } = usePrivy();
  const { wallets } = useWallets();
  const [copied, setCopied] = useState<string | null>(null);

  function copyAddr(addr: string) {
    navigator.clipboard.writeText(addr).catch(() => {});
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  }

  const embedded = wallets.filter(w => w.walletClientType === "privy");
  const external  = wallets.filter(w => w.walletClientType !== "privy");

  return (
    <div className="flex flex-col gap-2">
      <p className="[font-family:'Inter',Helvetica] text-[#d4e9f350] text-xs px-1 uppercase tracking-wider">Wallet</p>

      <div className="flex flex-col gap-2 px-1 py-3 rounded-2xl bg-[#0a293366] border border-[#83eef01a]">
        {wallets.length === 0 && (
          <p className="[font-family:'Inter',Helvetica] text-[#9aaeb8] text-xs px-2 leading-5">
            No wallet connected. Add one to participate in DAO governance.
          </p>
        )}

        {embedded.length > 0 && (
          <div className="flex flex-col gap-1.5 px-1">
            <span className="[font-family:'Inter',Helvetica] text-[#d4e9f340] text-[9px] uppercase tracking-widest px-1">Embedded</span>
            {embedded.map(w => (
              <button
                key={w.address}
                onClick={() => copyAddr(w.address)}
                data-testid={`wallet-copy-mobile-${w.address.slice(-4)}`}
                className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[#83eef008] border border-[#83eef020] active:bg-[#83eef015] transition-colors text-left w-full"
              >
                <span className="[font-family:'Inter',Helvetica] text-[#83eef0] text-sm font-mono tracking-tight">
                  {w.address.slice(0, 8)}…{w.address.slice(-6)}
                </span>
                <span className="text-[#83eef0b2] flex-shrink-0">
                  {copied === w.address
                    ? <span className="text-[#83eef0] text-xs">Copied!</span>
                    : <CopyIcon size={12} />}
                </span>
              </button>
            ))}
          </div>
        )}

        {external.length > 0 && (
          <div className="flex flex-col gap-1.5 px-1">
            <span className="[font-family:'Inter',Helvetica] text-[#d4e9f340] text-[9px] uppercase tracking-widest px-1">External</span>
            {external.map(w => {
              const wct = w.walletClientType;
              const isMM = wct === "metamask";
              const bgCls = isMM
                ? "bg-[#E2761B0a] border-[#E2761B25] active:bg-[#E2761B18]"
                : "bg-[#ffffff08] border-[#ffffff12] active:bg-[#ffffff10]";
              const label = isMM ? "MetaMask" : "Wallet";

              return (
                <button
                  key={w.address}
                  onClick={() => copyAddr(w.address)}
                  data-testid={`wallet-external-mobile-${w.address.slice(-4)}`}
                  className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border transition-colors text-left w-full ${bgCls}`}
                >
                  <div className="flex items-center gap-2">
                    {isMM && <MetaMaskIcon size={14} />}
                    <div className="flex flex-col">
                      <span className="[font-family:'Inter',Helvetica] text-[#d4e9f380] text-[9px] uppercase tracking-wider leading-none mb-0.5">{label}</span>
                      <span className="[font-family:'Inter',Helvetica] text-[#d4e9f3b2] text-sm font-mono tracking-tight">
                        {w.address.slice(0, 6)}…{w.address.slice(-4)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[#d4e9f380] flex-shrink-0">
                    {copied === w.address
                      ? <span className="text-[#83eef0] text-xs">Copied!</span>
                      : <CopyIcon size={12} />}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="px-1">
          <button
            onClick={() => linkWallet()}
            data-testid="button-connect-wallet-mobile"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-[#83eef01a] border border-[#83eef033] text-[#83eef0] [font-family:'Inter',Helvetica] text-sm font-medium active:bg-[#83eef033] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mobile overlay auth section ───────────────────────────────────────────────
function MobileOverlayAuthSection({ onClose }: { onClose: () => void }) {
  const { authenticated: privyAuthenticated, user, login, logout: privyLogout } = usePrivy();
  const { orcidAuthenticated, orcidName, orcidId, logout: orcidLogout } = useOrcidAuth();

  const linked = user?.linkedAccounts ?? [];
  const emailAcct   = linked.find((a: any) => a.type === "email") as any;
  const googleAcct  = linked.find((a: any) => a.type === "google_oauth") as any;
  const twitterAcct = linked.find((a: any) => a.type === "twitter_oauth") as any;
  const walletAddr  = user?.wallet?.address;

  const privyDisplayName = twitterAcct?.username
    ? `@${twitterAcct.username}`
    : emailAcct?.address
    ?? googleAcct?.email?.split("@")[0]
    ?? (walletAddr ? `${walletAddr.slice(0, 6)}…${walletAddr.slice(-4)}` : "Explorer");

  // ── Privy-authenticated state ─────────────────────────────────────────────
  if (privyAuthenticated) {
    return (
      <div className="flex flex-col gap-4">
        {/* Identity row */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#83eef008] border border-[#83eef018]">
          <div className="w-9 h-9 rounded-full bg-[linear-gradient(135deg,rgba(131,238,240,0.25)_0%,rgba(63,176,179,0.15)_100%)] border border-[#83eef040] flex items-center justify-center flex-shrink-0">
            <span className="[font-family:'Inter',Helvetica] font-semibold text-[#83eef0] text-sm leading-none">
              {privyDisplayName.replace("@", "").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="[font-family:'Inter',Helvetica] text-[#d4e9f3] text-sm font-medium truncate">{privyDisplayName}</span>
            <span className="[font-family:'Inter',Helvetica] text-[#83eef080] text-xs">MesoReef DAO member</span>
          </div>
        </div>

        <MobileWalletSection />
        <FileverseWorkspacePanel variant="overlay" />

        <button
          onClick={() => { onClose(); privyLogout().catch(() => {}); }}
          data-testid="button-sign-out-mobile"
          className="flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-2xl bg-[#ff4a4a0d] border border-[#ff4a4a20] text-[#ff8a8a] [font-family:'Inter',Helvetica] text-sm font-medium active:bg-[#ff4a4a18] transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // ── ORCID-authenticated state ─────────────────────────────────────────────
  if (orcidAuthenticated) {
    return (
      <div className="flex flex-col gap-3">
        {/* Identity row */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#a6ce3908] border border-[#a6ce3920]">
          <div className="w-9 h-9 rounded-full bg-[#a6ce3920] border border-[#a6ce3940] flex items-center justify-center flex-shrink-0">
            <OrcidIcon size={18} />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="[font-family:'Inter',Helvetica] text-[#d4e9f3] text-sm font-medium truncate">
              {orcidName || "Researcher"}
            </span>
            <span className="[font-family:'Inter',Helvetica] text-[#a6ce39] text-[10px] font-mono truncate">{orcidId}</span>
          </div>
        </div>

        {/* Workspace access */}
        <FileverseWorkspacePanel variant="overlay" />

        {/* Connect wallet nudge */}
        {PRIVY_ENABLED && (
          <button
            onClick={() => { onClose(); setTimeout(() => { try { login(); } catch {} }, 150); }}
            data-testid="button-connect-wallet-orcid-mobile"
            className="flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-2xl bg-[#83eef00a] border border-[#83eef020] text-[#83eef0cc] [font-family:'Inter',Helvetica] text-sm font-medium active:bg-[#83eef018] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.89 6 10 6.9 10 8V16C10 17.1 10.89 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z" fill="currentColor"/>
            </svg>
            Connect Wallet
          </button>
        )}

        <button
          onClick={() => { onClose(); orcidLogout(); }}
          data-testid="button-sign-out-orcid-mobile"
          className="flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-2xl bg-[#ff4a4a0d] border border-[#ff4a4a20] text-[#ff8a8a] [font-family:'Inter',Helvetica] text-sm font-medium active:bg-[#ff4a4a18] transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // ── Unauthenticated state ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      {PRIVY_ENABLED && (
        <button
          onClick={() => { onClose(); setTimeout(() => { try { login(); } catch {} }, 150); }}
          data-testid="button-login-mobile-overlay"
          className="flex items-center justify-center gap-2 w-full px-5 py-3.5 min-h-[52px] rounded-2xl bg-[linear-gradient(170deg,rgba(131,238,240,1)_0%,rgba(63,176,179,1)_100%)] text-[#00585a] [font-family:'Inter',Helvetica] text-base font-semibold active:opacity-80 transition-opacity shadow-[0_4px_20px_rgba(131,238,240,0.2)]"
        >
          <LoginArrowIcon size={18} color="#00585a" />
          Log in to MesoReef DAO
        </button>
      )}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#ffffff10]" />
        <span className="[font-family:'Inter',Helvetica] text-[#d4e9f330] text-xs">or</span>
        <div className="flex-1 h-px bg-[#ffffff10]" />
      </div>
      <OrcidLoginButton className="w-full" label="Sign in with ORCID iD" size="md" />
    </div>
  );
}

// ── Main header ───────────────────────────────────────────────────────────────
export const ApplicationHeaderSection = (): JSX.Element => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="flex w-full items-center justify-between px-4 md:px-6 py-2 md:py-2.5 border-b border-[#ffffff0d] backdrop-blur-[20px] [-webkit-backdrop-filter:blur(20px)_brightness(100%)] bg-[linear-gradient(180deg,rgba(0,22,30,1)_0%,rgba(0,16,23,0.4)_100%),linear-gradient(0deg,rgba(0,8,12,0.8)_0%,rgba(0,8,12,0.8)_100%)] relative z-20">
        {/* Logo */}
        <img
          src="/figmaAssets/mesoreef-dao-logo-new.png"
          alt="MesoReef DAO"
          className="h-8 md:h-9 w-auto flex-shrink-0 object-contain"
        />

        {/* Desktop nav links */}
        <nav className="hidden md:inline-flex items-center gap-6">
          {NAV_LINKS.map(link =>
            link.internal ? (
              <Link
                key={link.label}
                href={link.href}
                data-testid={`nav-header-${link.label.toLowerCase()}`}
                className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-normal text-[#d4e9f3b2] text-sm tracking-[-0.20px] leading-5 whitespace-nowrap hover:text-[#d4e9f3] transition-colors no-underline"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                data-testid={`nav-header-${link.label.toLowerCase()}`}
                rel="noopener noreferrer"
                target="_blank"
                className="relative flex items-center gap-1.5 [font-family:'Plus_Jakarta_Sans',Helvetica] font-normal text-[#d4e9f3b2] text-sm tracking-[-0.20px] leading-5 whitespace-nowrap hover:text-[#d4e9f3] transition-colors no-underline"
              >
                {link.label}
                {link.badge && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#83eef020] border border-[#83eef040] text-[#83eef0] text-[9px] font-semibold [font-family:'Inter',Helvetica] leading-none uppercase tracking-wide">
                    {link.badge}
                  </span>
                )}
              </a>
            )
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Desktop auth button */}
          <div className="hidden md:block">
            {PRIVY_ENABLED ? <PrivyLoginButton /> : <OrcidLoginButton label="Sign in" size="sm" />}
          </div>

          {/* Mobile: compact auth + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {PRIVY_ENABLED && (
              <PrivyLoginButton compact onOpenMenu={() => setMobileMenuOpen(true)} />
            )}
            <button
              onClick={() => setMobileMenuOpen(true)}
              data-testid="button-mobile-menu"
              aria-label="Open menu"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ffffff08] border border-[#ffffff12] text-[#d4e9f3b2] active:bg-[#ffffff18] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col"
          style={{ background: "rgba(0,8,12,0.97)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
        >
          {/* Overlay header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#ffffff0d] flex-shrink-0">
            <img src="/figmaAssets/mesoreef-dao-logo-new.png" alt="MesoReef DAO" className="h-11 w-auto object-contain" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ffffff08] border border-[#ffffff12] text-[#d4e9f3b2] active:bg-[#ffffff18] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex flex-col gap-3 px-4 py-6 flex-1 overflow-y-auto">
            {/* Nav links */}
            {NAV_LINKS.map(link =>
              link.internal ? (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-5 py-4 min-h-[56px] rounded-2xl bg-[#ffffff06] border border-[#ffffff0d] text-[#d4e9f3b2] hover:bg-[#83eef00a] hover:border-[#83eef01a] hover:text-[#d4e9f3] active:bg-[#83eef00f] transition-colors no-underline"
                >
                  <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-semibold text-base">{link.label}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  rel="noopener noreferrer"
                  target="_blank"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-5 py-4 min-h-[56px] rounded-2xl bg-[#ffffff06] border border-[#ffffff0d] text-[#d4e9f3b2] hover:bg-[#83eef00a] hover:border-[#83eef01a] hover:text-[#d4e9f3] active:bg-[#83eef00f] transition-colors no-underline"
                >
                  <span className="flex items-center gap-2 [font-family:'Plus_Jakarta_Sans',Helvetica] font-semibold text-base">
                    {link.label}
                    {link.badge && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#83eef020] border border-[#83eef040] text-[#83eef0] text-[9px] font-semibold [font-family:'Inter',Helvetica] leading-none uppercase tracking-wide">
                        {link.badge}
                      </span>
                    )}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              )
            )}

            <div className="border-t border-[#ffffff08] my-1" />

            {/* Account section */}
            <div className="flex flex-col gap-3">
              <p className="[font-family:'Inter',Helvetica] text-[#d4e9f350] text-xs px-1 uppercase tracking-wider">Account</p>
              <MobileOverlayAuthSection onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
