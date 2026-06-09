import { usePrivy } from "@privy-io/react-auth";
import { useOrcidAuth } from "@/hooks/use-orcid-auth";

// Account types Privy only stores AFTER it has verified them (OTP for email/phone,
// OAuth for socials). A wallet on its own proves key ownership but not a real-world
// identity, so it does NOT count toward verification.
const VERIFIED_IDENTITY_TYPES = [
  "email",
  "google_oauth",
  "twitter_oauth",
  "linkedin_oauth",
  "github_oauth",
  "phone",
];

export interface VerificationState {
  /** True once both auth providers have settled, so flags below are trustworthy. */
  ready: boolean;
  /** User has at least one strong identity proof (ORCID, verified email, or social). */
  isVerified: boolean;
  hasOrcid: boolean;
  hasVerifiedEmail: boolean;
  hasVerifiedSocial: boolean;
  /** Signed in, but only via a wallet — no verified identity yet. */
  walletOnly: boolean;
}

export function useVerification(): VerificationState {
  const { ready: privyReady, authenticated, user } = usePrivy();
  const { orcidAuthenticated, isLoading: orcidLoading } = useOrcidAuth();

  const linked: any[] = user?.linkedAccounts ?? [];
  const hasType = (type: string) => linked.some((a: any) => a?.type === type);

  const hasOrcid = !!orcidAuthenticated;
  const hasVerifiedEmail = hasType("email");
  const hasVerifiedSocial = ["google_oauth", "twitter_oauth", "linkedin_oauth", "github_oauth"]
    .some(hasType);

  const hasWallet = hasType("wallet");
  const hasAnyVerifiedIdentity =
    hasOrcid || linked.some((a: any) => VERIFIED_IDENTITY_TYPES.includes(a?.type));

  return {
    ready: privyReady && !orcidLoading,
    isVerified: hasAnyVerifiedIdentity,
    hasOrcid,
    hasVerifiedEmail,
    hasVerifiedSocial,
    walletOnly: (authenticated && hasWallet && !hasAnyVerifiedIdentity) || false,
  };
}
