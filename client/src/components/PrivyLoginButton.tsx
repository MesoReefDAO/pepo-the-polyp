import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { ChevronDown, LogOut } from "lucide-react";


interface PrivyLoginButtonProps {
  /**
   * compact - 36×36 circle for tight mobile headers.
   * When authenticated, tapping calls `onOpenMenu` (if provided) instead of logging out.
   */
  compact?: boolean;
  /** Called when the compact authenticated avatar is tapped - use to open the mobile menu */
  onOpenMenu?: () => void;
}

export function PrivyLoginButton({ compact = false, onOpenMenu }: PrivyLoginButtonProps) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const doLogin = () => { try { login(); } catch { /* ignore */ } };

  /* ── Loading ── */
  if (!ready) {
    if (compact) {
      return (
        <div
          data-testid="button-login-loading"
          className="w-9 h-9 rounded-full bg-[#83eef018] border border-[#83eef030] animate-pulse flex-shrink-0"
        />
      );
    }
    return (
      <div
        data-testid="button-login-loading"
        className="h-10 w-24 rounded-full bg-[#83eef018] border border-[#83eef030] animate-pulse"
      />
    );
  }

  /* ── Authenticated ── */
  if (authenticated) {
    const linked = user?.linkedAccounts ?? [];
    const emailAcct   = linked.find((a: any) => a.type === "email") as any;
    const googleAcct  = linked.find((a: any) => a.type === "google_oauth") as any;
    const twitterAcct = linked.find((a: any) => a.type === "twitter_oauth") as any;
    const walletAddr  = user?.wallet?.address;

    const displayName =
      twitterAcct?.username
        ? `@${twitterAcct.username}`
        : emailAcct?.address
        ?? googleAcct?.email?.split("@")[0]
        ?? (walletAddr ? walletAddr.slice(0, 6) + "…" + walletAddr.slice(-4) : "Explorer");

    const initial = displayName.replace("@", "").charAt(0).toUpperCase();

    /* compact: 36px circle avatar - opens menu instead of logging out */
    if (compact) {
      return (
        <button
          onClick={onOpenMenu ?? (() => logout().catch(() => {}))}
          data-testid="button-account-compact"
          aria-label={`Account: ${displayName}`}
          className="w-9 h-9 rounded-full bg-[linear-gradient(135deg,#83eef040_0%,#3fb0b328_100%)] border border-[#83eef050] flex items-center justify-center flex-shrink-0 active:opacity-70 transition-opacity"
        >
          <span className="[font-family:'Inter',Helvetica] font-bold text-[#83eef0] text-xs leading-none">
            {initial}
          </span>
        </button>
      );
    }

    /* desktop: account pill - provider icon + name + sign-out */
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenMenu}
          data-testid="button-account-desktop"
          aria-label={`Account: ${displayName}`}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#83eef00f] border border-[#83eef025] hover:bg-[#83eef01a] transition-colors"
        >
          {/* Avatar circle */}
          <div className="w-7 h-7 rounded-full bg-[linear-gradient(135deg,#83eef040_0%,#3fb0b328_100%)] border border-[#83eef050] flex items-center justify-center flex-shrink-0">
            <span className="[font-family:'Inter',Helvetica] font-bold text-[#83eef0] text-[10px] leading-none">
              {initial}
            </span>
          </div>
          {/* Display name */}
          <div className="flex items-center gap-1.5">
            <span
              data-testid="text-user-display-name"
              className="[font-family:'Inter',Helvetica] font-medium text-[#d4e9f3cc] text-sm max-w-[120px] truncate"
            >
              {displayName}
            </span>
          </div>
          <ChevronDown size={13} className="text-[#83eef080] flex-shrink-0" />
        </button>

        <Button
          onClick={() => logout().catch(() => {})}
          data-testid="button-sign-out"
          title="Sign out"
          className="w-9 h-9 rounded-full bg-[#ff4a4a0d] border border-[#ff4a4a20] hover:bg-[#ff4a4a1a] transition-colors flex items-center justify-center p-0 shadow-none"
        >
          <LogOut size={14} className="text-[#ff8a8a]" />
        </Button>
      </div>
    );
  }

  /* ── Not authenticated - compact ── */
  if (compact) {
    return (
      <button
        onClick={doLogin}
        data-testid="button-login-compact"
        aria-label="Log in"
        className="w-9 h-9 rounded-full bg-[linear-gradient(135deg,rgba(131,238,240,0.92)_0%,rgba(63,176,179,0.92)_100%)] border-none shadow-[0_2px_12px_rgba(131,238,240,0.28)] flex items-center justify-center flex-shrink-0 active:opacity-80 transition-opacity"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="#00585a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    );
  }

  /* ── Not authenticated - full desktop ── */
  return (
    <button
      onClick={doLogin}
      data-testid="button-login-toggle"
      className="relative inline-flex items-center justify-center gap-2 px-5 md:px-6 py-2.5 h-auto rounded-full bg-[linear-gradient(170deg,#83eef0_0%,#3fb0b3_100%)] border-none shadow-[0_4px_20px_rgba(131,238,240,0.25)] hover:shadow-[0_4px_24px_rgba(131,238,240,0.4)] hover:opacity-95 transition-all"
    >
      <span className="[font-family:'Inter',Helvetica] font-semibold text-[#00585a] text-sm md:text-base leading-6 whitespace-nowrap">
        Log in
      </span>
      <ChevronDown size={14} className="text-[#006b6d]" />
    </button>
  );
}
