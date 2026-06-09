import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Profile, Contribution } from "@shared/schema";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PublicProfileView } from "@/components/PublicProfileView";
import { ArrowLeft, Users } from "lucide-react";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 md:px-8 py-8 max-w-2xl mx-auto w-full animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-[#ffffff08]" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-5 w-40 rounded-lg bg-[#ffffff08]" />
          <div className="h-3 w-24 rounded-lg bg-[#ffffff06]" />
        </div>
      </div>
      <div className="h-16 rounded-2xl bg-[#ffffff06]" />
      <div className="grid grid-cols-3 gap-3">
        {[0,1,2].map(i => <div key={i} className="h-20 rounded-2xl bg-[#ffffff06]" />)}
      </div>
      <div className="flex flex-col gap-3">
        {[0,1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-[#ffffff06]" />)}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function PublicProfile() {
  const params = useParams<{ id: string }>();
  const profileId = decodeURIComponent(params.id || "");

  const { data, isLoading, isError } = useQuery<{ profile: Profile; contributions: Contribution[] }>({
    queryKey: ["/api/profiles", profileId],
    queryFn: () =>
      fetch(`/api/profiles/${encodeURIComponent(profileId)}`).then(r => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      }),
    enabled: !!profileId,
    staleTime: 30_000,
    retry: false,
  });

  const profile = data?.profile;
  const contributions = data?.contributions ?? [];

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "linear-gradient(180deg, #00131c 0%, #00080c 100%)" }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-4 px-4 md:px-6 py-3 border-b border-[#ffffff08] sticky top-0 z-10"
        style={{ background: "rgba(0,8,12,0.85)", backdropFilter: "blur(12px)" }}
      >
        <Link
          href="/community"
          data-testid="link-back-community"
          className="flex items-center gap-2 text-[#d4e9f380] hover:text-[#d4e9f3] transition-colors no-underline min-h-[44px] px-1"
        >
          <ArrowLeft size={16} />
          <span className="[font-family:'Inter',Helvetica] text-sm">Community</span>
        </Link>
        <div className="flex-1" />
        <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f3] text-base">
          {profile ? profile.displayName : "Member Profile"}
        </span>
        <div className="flex-1" />
      </div>

      {isLoading && <Skeleton />}

      {isError && (
        <div className="flex flex-col items-center gap-4 py-24 text-center px-6">
          <Users size={40} className="text-[#d4e9f322]" />
          <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f366] text-lg">
            Profile not found
          </span>
          <p className="[font-family:'Inter',Helvetica] text-[#d4e9f344] text-sm max-w-xs">
            This member's profile is not public or doesn't exist.
          </p>
          <Link href="/community"
            className="mt-2 px-5 py-2 rounded-full bg-[#83eef015] border border-[#83eef033] text-[#83eef0] text-sm no-underline hover:bg-[#83eef025] transition-colors [font-family:'Inter',Helvetica]"
          >
            Back to Community
          </Link>
        </div>
      )}

      {profile && <PublicProfileView profile={profile} contributions={contributions} />}

      <MobileBottomNav />
    </div>
  );
}
