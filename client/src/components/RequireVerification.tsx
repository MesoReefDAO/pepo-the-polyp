import { Link } from "wouter";
import { usePrivy } from "@privy-io/react-auth";
import { useVerification } from "@/hooks/use-verification";

function ShieldCheck() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 7v5c0 4.55 3.84 8.74 9 10 5.16-1.26 9-5.45 9-10V7l-9-5z" stroke="#83eef0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke="#83eef0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/**
 * Gates a feature behind identity verification. A signed-in wallet-only user can
 * browse the app, but features wrapped in this component require a verified
 * identity (ORCID, or a verified email / social linked through Privy).
 */
export function RequireVerification({
  feature,
  children,
}: {
  feature: string;
  children: React.ReactNode;
}) {
  const { ready, isVerified } = useVerification();
  const { linkEmail } = usePrivy();

  if (!ready) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center" style={{ background: "#00080c" }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#83eef0] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isVerified) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16" style={{ background: "#00080c" }}>
      <div className="w-full max-w-md flex flex-col items-center text-center gap-5 p-8 rounded-3xl bg-[#0b1519] border border-[#83eef01a]">
        <div className="w-16 h-16 rounded-full bg-[#83eef010] border border-[#83eef033] flex items-center justify-center">
          <ShieldCheck />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f3] text-2xl">
            Verify your identity
          </h1>
          <p className="[font-family:'Inter',Helvetica] text-[#d4e9f380] text-sm leading-6">
            {feature} is reserved for verified members. Confirm an email or link your
            ORCID iD to unlock it. A wallet alone isn&apos;t enough to verify who you are.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => { try { linkEmail(); } catch { /* ignore */ } }}
            data-testid="button-verify-email"
            className="w-full px-6 py-3 rounded-xl bg-[#83eef0] hover:opacity-90 transition-opacity [font-family:'Inter',Helvetica] font-semibold text-[#00585a] text-sm"
          >
            Verify with email
          </button>
          <a
            href="/api/auth/orcid"
            data-testid="link-verify-orcid-gate"
            className="w-full px-6 py-3 rounded-xl bg-[#A6CE39] hover:bg-[#95bc2e] transition-colors [font-family:'Inter',Helvetica] font-semibold text-white text-sm no-underline"
          >
            Verify with ORCID iD
          </a>
          <Link
            href="/profile"
            data-testid="link-back-to-profile"
            className="w-full px-6 py-2.5 rounded-xl bg-transparent border border-[#ffffff14] hover:bg-[#ffffff08] transition-colors [font-family:'Inter',Helvetica] font-medium text-[#d4e9f3b2] text-sm no-underline"
          >
            Manage Identity &amp; Accounts
          </Link>
        </div>
      </div>
    </div>
  );
}
