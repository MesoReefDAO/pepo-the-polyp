import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Profile, Contribution, LeaderboardEntry } from "@shared/schema";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { OrcidIcon } from "@/components/OrcidLoginButton";
import {
  ArrowLeft, MapPin, Globe, Star, MessageCircle,
  Award, Calendar, Activity, Users, Microscope,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(epoch: number) {
  return new Date(epoch * 1000).toLocaleDateString("en-US", {
    month: "short", year: "numeric",
  });
}

function formatRelative(epoch: number) {
  const diff = Date.now() - epoch * 1000;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(epoch);
}

function rankBadge(rank: number) {
  if (rank === 1) return { emoji: "🥇", color: "#FFD700", label: "Gold" };
  if (rank === 2) return { emoji: "🥈", color: "#C0C0C0", label: "Silver" };
  if (rank === 3) return { emoji: "🥉", color: "#CD7F32", label: "Bronze" };
  return { emoji: `#${rank}`, color: "#d4e9f366", label: `Rank #${rank}` };
}

function contribColor(type: string) {
  if (type === "question") return "#83eef0";
  if (type === "answer") return "#a78bfa";
  if (type === "resource") return "#34d399";
  if (type === "verification") return "#f59e0b";
  return "#d4e9f366";
}

function contribIcon(type: string) {
  if (type === "question") return <MessageCircle size={12} />;
  if (type === "answer") return <Activity size={12} />;
  if (type === "resource") return <Microscope size={12} />;
  if (type === "verification") return <Award size={12} />;
  return <Star size={12} />;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ url, name, size = 80 }: { url?: string; name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const fontSize = Math.round(size * 0.35);
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        data-testid="img-member-avatar"
        style={{ width: size, height: size, fontSize }}
        className="rounded-full object-cover border-2 border-[#83eef033] flex-shrink-0"
      />
    );
  }
  return (
    <div
      data-testid="img-member-avatar-placeholder"
      style={{ width: size, height: size }}
      className="rounded-full bg-[#0a293380] border-2 border-[#83eef033] flex items-center justify-center flex-shrink-0"
    >
      <span style={{ fontSize }} className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#83eef0]">
        {initials}
      </span>
    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────
function StatTile({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-[#83eef008] border border-[#83eef012]">
      <div className="text-[#83eef080]">{icon}</div>
      <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f3] text-lg leading-none">
        {value}
      </span>
      <span className="[font-family:'Inter',Helvetica] text-[#d4e9f355] text-[10px] uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

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

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
    staleTime: 30_000,
  });

  const profile = data?.profile;
  const contributions = (data?.contributions ?? []).slice().sort((a, b) => b.createdAt - a.createdAt);
  const rankIndex = leaderboard.findIndex(e => e.id === profileId);
  const rank = rankIndex >= 0 ? rankIndex + 1 : null;
  const badge = rank ? rankBadge(rank) : null;
  const questionCount = contributions.filter(c => c.type === "question").length;
  const isOrcid = profileId.startsWith("orcid:");

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

      {profile && (
        <div className="flex flex-col gap-6 px-4 md:px-8 py-8 max-w-2xl mx-auto w-full pb-28 md:pb-16">

          {/* ── Hero card ──────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-5 p-6 rounded-3xl bg-[#00080c80] border border-[#ffffff0a]"
            style={{ boxShadow: "inset 0 2px 12px rgba(0,0,0,0.4)" }}
          >
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar url={profile.avatarUrl} name={profile.displayName} size={80} />
                {rank && rank <= 3 && (
                  <span className="absolute -bottom-1 -right-1 text-xl leading-none" title={badge!.label}>
                    {badge!.emoji}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    data-testid="text-member-name"
                    className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-extrabold text-[#d4e9f3] text-xl leading-tight"
                  >
                    {profile.displayName}
                  </h1>
                  {rank && (
                    <span
                      className="text-[10px] [font-family:'Inter',Helvetica] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0"
                      style={{ color: badge!.color, borderColor: `${badge!.color}40`, background: `${badge!.color}10` }}
                    >
                      {rank <= 3 ? badge!.label : `Rank #${rank}`}
                    </span>
                  )}
                </div>

                {/* ORCID */}
                {profile.orcidId && (
                  <a
                    href={`https://orcid.org/${profile.orcidId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-orcid-profile"
                    className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full no-underline hover:opacity-80 transition-opacity"
                    style={{ background: "#a6ce3918", border: "1px solid #a6ce3940" }}
                  >
                    <OrcidIcon size={14} />
                    <span className="[font-family:'Inter',Helvetica] text-[11px] font-semibold" style={{ color: "#a6ce39" }}>
                      {profile.orcidName || profile.orcidId}
                    </span>
                  </a>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  {profile.location && (
                    <span className="flex items-center gap-1 [font-family:'Inter',Helvetica] text-xs text-[#d4e9f366]">
                      <MapPin size={11} className="text-[#d4e9f344]" />
                      {profile.location}
                    </span>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="link-member-website"
                      className="flex items-center gap-1 [font-family:'Inter',Helvetica] text-xs text-[#83eef0] no-underline hover:text-[#83eef0cc] transition-colors"
                    >
                      <Globe size={11} />
                      {profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  )}
                  <span className="flex items-center gap-1 [font-family:'Inter',Helvetica] text-[11px] text-[#d4e9f344]">
                    <Calendar size={11} />
                    Joined {formatDate(profile.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p
                data-testid="text-member-bio"
                className="[font-family:'Inter',Helvetica] text-sm text-[#9aaeb8] leading-relaxed"
              >
                {profile.bio}
              </p>
            )}

            {/* Tags */}
            {profile.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5" data-testid="tags-member-expertise">
                {profile.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="[font-family:'Inter',Helvetica] text-[10px] text-[#83eef0] bg-[#83eef010] border border-[#83eef025] px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Stats ──────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile icon={<Star size={16} />} value={profile.points} label="Reef Points" />
            <StatTile icon={<MessageCircle size={16} />} value={questionCount} label="Questions" />
            <StatTile
              icon={<Award size={16} />}
              value={rank ? `#${rank}` : "—"}
              label="Rank"
            />
          </div>

          {/* ── ORCID iD card ──────────────────────────────────────────────── */}
          {profile.orcidId && (
            <div
              className="flex items-center gap-4 p-4 rounded-2xl border"
              style={{ background: "#a6ce3908", borderColor: "#a6ce3930" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "#a6ce3920" }}>
                <OrcidIcon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-semibold text-sm"
                  style={{ color: "#a6ce39" }}>
                  Verified Researcher
                </p>
                <p className="[font-family:'Inter',Helvetica] text-[11px] text-[#d4e9f366] mt-0.5 truncate">
                  ORCID iD: {profile.orcidId}
                </p>
              </div>
              <a
                href={`https://orcid.org/${profile.orcidId}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-orcid-external"
                className="text-[10px] [font-family:'Inter',Helvetica] font-semibold px-3 py-1.5 rounded-full no-underline hover:opacity-80 transition-opacity flex-shrink-0"
                style={{ background: "#a6ce3920", color: "#a6ce39", border: "1px solid #a6ce3940" }}
              >
                View profile ↗
              </a>
            </div>
          )}

          {/* ── Activity feed ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <Activity size={14} className="text-[#d4e9f366]" />
              <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-semibold text-[#d4e9f3] text-sm">
                Recent Activity
              </span>
              <span className="ml-auto [font-family:'Inter',Helvetica] text-[#d4e9f344] text-xs">
                {contributions.length} contributions
              </span>
            </div>

            {contributions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center rounded-2xl border border-[#ffffff06] bg-[#00080c60]">
                <Activity size={24} className="text-[#d4e9f322]" />
                <span className="[font-family:'Inter',Helvetica] text-[#d4e9f355] text-sm">
                  No activity yet
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {contributions.slice(0, 20).map((c: Contribution) => (
                  <div
                    key={c.id}
                    data-testid={`activity-item-${c.id}`}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#00080c60] border border-[#ffffff07] hover:border-[#83eef015] transition-colors"
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${contribColor(c.type)}15`, color: contribColor(c.type) }}
                    >
                      {contribIcon(c.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="[font-family:'Inter',Helvetica] text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded-full"
                          style={{
                            color: contribColor(c.type),
                            background: `${contribColor(c.type)}15`,
                          }}
                        >
                          {c.type}
                        </span>
                        <span className="ml-auto [font-family:'Inter',Helvetica] text-[10px] text-[#d4e9f344] flex-shrink-0">
                          {formatRelative(c.createdAt)}
                        </span>
                      </div>
                      {c.description && (
                        <p className="[font-family:'Inter',Helvetica] text-xs text-[#9aaeb8] mt-1 leading-relaxed line-clamp-2">
                          {c.description}
                        </p>
                      )}
                    </div>
                    <span
                      className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-xs flex-shrink-0 mt-0.5"
                      style={{ color: contribColor(c.type) }}
                    >
                      +{c.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Footer note ────────────────────────────────────────────────── */}
          <div className="flex justify-center pt-2">
            <Link
              href="/community"
              data-testid="link-all-members"
              className="flex items-center gap-2 text-[#d4e9f355] hover:text-[#d4e9f3] transition-colors no-underline text-xs [font-family:'Inter',Helvetica]"
            >
              <Users size={12} />
              View all community members
            </Link>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
}
