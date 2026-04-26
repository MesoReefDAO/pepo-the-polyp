import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useOrcidAuth } from "@/hooks/use-orcid-auth";
import { ArrowLeft, Vote, Plus, Clock, CheckCircle2, XCircle, Loader2, Users, BarChart2, Calendar, ChevronDown, ChevronUp, AlertCircle, ExternalLink } from "lucide-react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import coralBg from "@assets/coral_micro_1777060394505.jpg";

// ─── Vocdoni API config ──────────────────────────────────────────────────────
const VOCDONI_ENV = (import.meta.env.VITE_VOCDONI_ENV as string) || "stg";
const VOCDONI_ORG = (import.meta.env.VITE_VOCDONI_ORG_ADDRESS as string) || "";
const VOCDONI_API =
  VOCDONI_ENV === "prod"
    ? "https://api.vocdoni.io/v2"
    : VOCDONI_ENV === "dev"
    ? "https://api-dev.vocdoni.net/v2"
    : "https://api-stg.vocdoni.net/v2";

// ─── Types ───────────────────────────────────────────────────────────────────
interface VocdoniChoice {
  title: Record<string, string> | string;
  value: number;
}
interface VocdoniQuestion {
  title: Record<string, string> | string;
  description?: Record<string, string> | string;
  choices: VocdoniChoice[];
}
interface VocdoniElection {
  electionId: string;
  organizationId: string;
  status: "ONGOING" | "ENDED" | "UPCOMING" | "PAUSED" | "CANCELED" | string;
  startDate: string;
  endDate: string;
  finalResults: boolean;
  voteCount: number;
  title: Record<string, string> | string;
  description?: Record<string, string> | string;
  header?: string;
  questions?: VocdoniQuestion[];
  results?: string[][];
  census?: { censusType: string; maxCensusSize?: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getText(val: Record<string, string> | string | undefined, fallback = ""): string {
  if (!val) return fallback;
  if (typeof val === "string") return val;
  return val.default ?? val.en ?? Object.values(val)[0] ?? fallback;
}

function statusStyle(status: string): { label: string; color: string; bg: string; border: string } {
  switch (status?.toUpperCase()) {
    case "ONGOING":  return { label: "Active",    color: "#83eef0", bg: "#83eef015", border: "#83eef030" };
    case "ENDED":    return { label: "Ended",     color: "#d4e9f366", bg: "#ffffff06", border: "#ffffff10" };
    case "UPCOMING": return { label: "Upcoming",  color: "#A6CE39",  bg: "#A6CE3915", border: "#A6CE3930" };
    case "PAUSED":   return { label: "Paused",    color: "#f59e0b",  bg: "#f59e0b15", border: "#f59e0b30" };
    case "CANCELED": return { label: "Canceled",  color: "#ff4a4a",  bg: "#ff4a4a15", border: "#ff4a4a30" };
    default:         return { label: status || "Unknown", color: "#d4e9f366", bg: "#ffffff06", border: "#ffffff10" };
  }
}

function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return dateStr; }
}

function totalVotes(results: string[][] | undefined, qi = 0): number {
  if (!results?.[qi]) return 0;
  return results[qi].reduce((s, v) => s + (parseInt(v) || 0), 0);
}

function pct(results: string[][] | undefined, qi: number, ci: number): number {
  const tot = totalVotes(results, qi);
  if (!tot || !results?.[qi]) return 0;
  return Math.round(((parseInt(results[qi][ci] || "0")) / tot) * 100);
}

// ─── Proposal card ───────────────────────────────────────────────────────────
function ProposalCard({
  election,
  onVote,
  voted,
}: {
  election: VocdoniElection;
  onVote: (election: VocdoniElection) => void;
  voted: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const s = statusStyle(election.status);
  const isActive = election.status?.toUpperCase() === "ONGOING";
  const title = getText(election.title, "Untitled Proposal");
  const desc = getText(election.description);
  const q0 = election.questions?.[0];
  const choices = q0?.choices ?? [];
  const results = election.results;
  const tot = totalVotes(results);

  return (
    <div
      data-testid={`card-proposal-${election.electionId}`}
      className="rounded-[24px] border overflow-hidden transition-all"
      style={{ background: "#00080ca0", borderColor: "#ffffff0d", backdropFilter: "blur(12px)" }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full [font-family:'Inter',Helvetica]"
            style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
          >
            {s.label}
          </span>
          <div className="flex items-center gap-1.5 text-[#d4e9f344]" title={`Ends ${fmtDate(election.endDate)}`}>
            <Calendar size={11} />
            <span className="[font-family:'Inter',Helvetica] text-[10px]">{fmtDate(election.endDate)}</span>
          </div>
        </div>

        <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f3] text-base leading-snug mb-1.5">
          {title}
        </h3>
        {desc && (
          <p className="[font-family:'Inter',Helvetica] text-[#9aaeb8] text-xs leading-relaxed line-clamp-2">
            {desc}
          </p>
        )}
      </div>

      {/* Options / Results */}
      {choices.length > 0 && (
        <div className="px-5 pb-4 flex flex-col gap-2">
          {choices.slice(0, expanded ? choices.length : 4).map((choice, ci) => {
            const p = pct(results, 0, ci);
            return (
              <div key={ci} className="flex flex-col gap-0.5">
                <div className="flex justify-between items-center">
                  <span className="[font-family:'Inter',Helvetica] text-xs text-[#d4e9f3cc]">
                    {getText(choice.title)}
                  </span>
                  {results && (
                    <span className="[font-family:'Inter',Helvetica] text-[10px] text-[#d4e9f366]">{p}%</span>
                  )}
                </div>
                {results && (
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#ffffff0a" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${p}%`, background: "linear-gradient(90deg, #83eef0 0%, #3fb0b3 100%)" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {choices.length > 4 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[#83eef066] hover:text-[#83eef0] text-[10px] [font-family:'Inter',Helvetica] transition-colors mt-0.5 self-start"
            >
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {expanded ? "Show less" : `+${choices.length - 4} more options`}
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-3 border-t"
        style={{ borderColor: "#ffffff09" }}
      >
        <div className="flex items-center gap-1.5">
          <Users size={11} className="text-[#d4e9f344]" />
          <span className="[font-family:'Inter',Helvetica] text-[10px] text-[#d4e9f344]">
            {tot.toLocaleString()} {tot === 1 ? "vote" : "votes"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://app.vocdoni.io/processes/show/#/${election.electionId}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`link-vocdoni-explorer-${election.electionId}`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] [font-family:'Inter',Helvetica] font-medium transition-colors no-underline"
            style={{ color: "#d4e9f366", border: "1px solid #ffffff0d" }}
          >
            <ExternalLink size={9} />
            Explorer
          </a>
          {isActive && !voted && (
            <button
              onClick={() => onVote(election)}
              data-testid={`button-vote-${election.electionId}`}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] [font-family:'Inter',Helvetica] font-semibold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #83eef0 0%, #3fb0b3 100%)", color: "#00585a" }}
            >
              <Vote size={11} />
              Vote
            </button>
          )}
          {voted && (
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] [font-family:'Inter',Helvetica] font-medium"
              style={{ color: "#83eef0", background: "#83eef015", border: "1px solid #83eef030" }}
            >
              <CheckCircle2 size={11} />
              Voted
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Vote modal ───────────────────────────────────────────────────────────────
function VoteModal({
  election,
  onClose,
  onSuccess,
}: {
  election: VocdoniElection;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { wallets } = useWallets();
  const [choices, setChoices] = useState<Record<number, number>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const questions = election.questions ?? [];
  const allAnswered = questions.every((_, qi) => choices[qi] !== undefined);

  async function handleVote() {
    if (!allAnswered) return;
    const wallet = wallets[0];
    if (!wallet) { setErrorMsg("No wallet connected."); setStatus("error"); return; }

    setStatus("loading");
    setErrorMsg("");
    try {
      const { VocdoniSDKClient, EnvOptions, Vote } = await import("@vocdoni/sdk");
      const provider = await (wallet as any).getEthersProvider();
      const signer = provider.getSigner();
      const env =
        VOCDONI_ENV === "prod" ? EnvOptions.PROD :
        VOCDONI_ENV === "dev"  ? EnvOptions.DEV  : EnvOptions.STG;

      const client = new VocdoniSDKClient({ env, wallet: signer });
      await client.createAccount();
      client.setElectionId(election.electionId);

      const voteValues = questions.map((_, qi) => choices[qi]);
      await client.submitVote(new Vote(voteValues));

      setStatus("success");
      setTimeout(() => { onSuccess(); onClose(); }, 1800);
    } catch (err: any) {
      console.error("[governance vote]", err);
      const msg = err?.message || String(err);
      if (msg.includes("already voted") || msg.includes("vote already"))
        setErrorMsg("You have already voted on this proposal.");
      else if (msg.includes("census") || msg.includes("not in census"))
        setErrorMsg("Your wallet is not in the voting census for this proposal.");
      else
        setErrorMsg(msg.length < 160 ? msg : "Vote submission failed. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,8,12,0.82)" }} />
      <div
        className="relative w-full max-w-md rounded-[28px] border p-6 flex flex-col gap-5"
        style={{ background: "#00131a", borderColor: "#83eef030", backdropFilter: "blur(20px)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f3] text-lg leading-snug">
            {getText(election.title, "Untitled Proposal")}
          </h2>
          <button onClick={onClose} className="text-[#d4e9f344] hover:text-[#d4e9f3] transition-colors flex-shrink-0 mt-0.5">
            <XCircle size={20} />
          </button>
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="flex flex-col gap-2">
            <p className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-semibold text-[#d4e9f3] text-sm">
              {getText(q.title, `Question ${qi + 1}`)}
            </p>
            <div className="flex flex-col gap-1.5">
              {q.choices.map((c, ci) => {
                const selected = choices[qi] === c.value;
                return (
                  <button
                    key={ci}
                    data-testid={`button-choice-q${qi}-c${ci}`}
                    onClick={() => setChoices(prev => ({ ...prev, [qi]: c.value }))}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all"
                    style={{
                      background: selected ? "#83eef018" : "#ffffff06",
                      borderColor: selected ? "#83eef050" : "#ffffff0d",
                      color: selected ? "#83eef0" : "#d4e9f3cc",
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                      style={{ borderColor: selected ? "#83eef0" : "#ffffff25" }}
                    >
                      {selected && <div className="w-2 h-2 rounded-full" style={{ background: "#83eef0" }} />}
                    </div>
                    <span className="[font-family:'Inter',Helvetica] text-sm">{getText(c.title)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {status === "error" && (
          <div
            className="flex items-start gap-2 p-3 rounded-xl text-xs [font-family:'Inter',Helvetica]"
            style={{ background: "#ff4a4a15", border: "1px solid #ff4a4a30", color: "#ff8a8a" }}
          >
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            {errorMsg}
          </div>
        )}
        {status === "success" && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-xs [font-family:'Inter',Helvetica] font-semibold"
            style={{ background: "#83eef018", border: "1px solid #83eef033", color: "#83eef0" }}
          >
            <CheckCircle2 size={14} />
            Vote submitted successfully!
          </div>
        )}

        <button
          onClick={handleVote}
          disabled={!allAnswered || status === "loading" || status === "success"}
          data-testid="button-submit-vote"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm [font-family:'Inter',Helvetica] transition-all disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #83eef0 0%, #3fb0b3 100%)", color: "#00585a" }}
        >
          {status === "loading" ? (
            <><Loader2 size={15} className="animate-spin" /> Submitting…</>
          ) : status === "success" ? (
            <><CheckCircle2 size={15} /> Submitted!</>
          ) : (
            <><Vote size={15} /> Submit Vote</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Create proposal modal ────────────────────────────────────────────────────
function CreateModal({
  onClose,
  orgAddress,
  onCreated,
}: {
  onClose: () => void;
  orgAddress: string;
  onCreated: () => void;
}) {
  const { wallets } = useWallets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["Yes", "No", "Abstain"]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function setOption(i: number, val: string) {
    setOptions(prev => prev.map((o, idx) => idx === i ? val : o));
  }
  function addOption() { if (options.length < 10) setOptions(prev => [...prev, ""]); }
  function removeOption(i: number) { if (options.length > 2) setOptions(prev => prev.filter((_, idx) => idx !== i)); }

  async function handleCreate() {
    if (!title.trim() || options.filter(o => o.trim()).length < 2) return;
    const wallet = wallets[0];
    if (!wallet) { setErrorMsg("No wallet connected."); setStatus("error"); return; }

    setStatus("loading");
    setErrorMsg("");
    try {
      const { VocdoniSDKClient, EnvOptions, Election, PlainCensus, Vote } = await import("@vocdoni/sdk");
      const { Wallet } = await import("@ethersproject/wallet");

      const provider = await (wallet as any).getEthersProvider();
      const signer = provider.getSigner();
      const env =
        VOCDONI_ENV === "prod" ? EnvOptions.PROD :
        VOCDONI_ENV === "dev"  ? EnvOptions.DEV  : EnvOptions.STG;

      const client = new VocdoniSDKClient({ env, wallet: signer });
      const accountInfo = await client.createAccount();
      if (accountInfo.balance === 0) {
        await client.collectFaucetTokens();
      }

      const census = new PlainCensus();
      census.add(await signer.getAddress());

      const election = Election.from({
        title: title.trim(),
        description: description.trim(),
        endDate: new Date(endDate),
        census,
        electionType: { interruptible: true },
      });

      election.addQuestion(
        title.trim(),
        description.trim(),
        options.filter(o => o.trim()).map((o, idx) => ({ title: o.trim(), value: idx }))
      );

      await client.createElection(election);
      setStatus("success");
      setTimeout(() => { onCreated(); onClose(); }, 2000);
    } catch (err: any) {
      console.error("[governance create]", err);
      setErrorMsg(err?.message?.slice(0, 200) || "Failed to create proposal.");
      setStatus("error");
    }
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,8,12,0.82)" }} />
      <div
        className="relative w-full max-w-lg rounded-[28px] border p-6 flex flex-col gap-5 my-auto"
        style={{ background: "#00131a", borderColor: "#83eef030" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f3] text-lg">
            New Proposal
          </h2>
          <button onClick={onClose} className="text-[#d4e9f344] hover:text-[#d4e9f3] transition-colors">
            <XCircle size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="[font-family:'Inter',Helvetica] text-xs font-semibold text-[#d4e9f380]">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Proposal title…"
            data-testid="input-proposal-title"
            maxLength={200}
            className="px-4 py-2.5 rounded-xl text-sm [font-family:'Inter',Helvetica] text-[#d4e9f3] placeholder-[#d4e9f333] outline-none"
            style={{ background: "#ffffff08", border: "1px solid #ffffff12" }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="[font-family:'Inter',Helvetica] text-xs font-semibold text-[#d4e9f380]">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the proposal…"
            data-testid="input-proposal-description"
            rows={3}
            maxLength={2000}
            className="px-4 py-2.5 rounded-xl text-sm [font-family:'Inter',Helvetica] text-[#d4e9f3] placeholder-[#d4e9f333] outline-none resize-none"
            style={{ background: "#ffffff08", border: "1px solid #ffffff12" }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="[font-family:'Inter',Helvetica] text-xs font-semibold text-[#d4e9f380]">
            Voting Options
          </label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={opt}
                onChange={e => setOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                data-testid={`input-option-${i}`}
                maxLength={100}
                className="flex-1 px-4 py-2 rounded-xl text-sm [font-family:'Inter',Helvetica] text-[#d4e9f3] placeholder-[#d4e9f333] outline-none"
                style={{ background: "#ffffff08", border: "1px solid #ffffff12" }}
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(i)}
                  data-testid={`button-remove-option-${i}`}
                  className="text-[#ff4a4a66] hover:text-[#ff4a4a] transition-colors"
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>
          ))}
          {options.length < 10 && (
            <button
              onClick={addOption}
              data-testid="button-add-option"
              className="flex items-center gap-1.5 text-xs [font-family:'Inter',Helvetica] text-[#83eef066] hover:text-[#83eef0] transition-colors self-start"
            >
              <Plus size={12} /> Add option
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="[font-family:'Inter',Helvetica] text-xs font-semibold text-[#d4e9f380]">End Date</label>
          <input
            type="datetime-local"
            value={endDate}
            min={tomorrow.toISOString().slice(0, 16)}
            onChange={e => setEndDate(e.target.value)}
            data-testid="input-end-date"
            className="px-4 py-2.5 rounded-xl text-sm [font-family:'Inter',Helvetica] text-[#d4e9f3] outline-none"
            style={{ background: "#ffffff08", border: "1px solid #ffffff12", colorScheme: "dark" }}
          />
        </div>

        <div
          className="flex items-start gap-2 p-3 rounded-xl text-xs [font-family:'Inter',Helvetica]"
          style={{ background: "#A6CE3910", border: "1px solid #A6CE3925", color: "#A6CE39cc" }}
        >
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          <span>
            Creating a proposal requires Vocdoni tokens. On the staging network, tokens are dispensed automatically from the faucet.
          </span>
        </div>

        {status === "error" && (
          <div
            className="flex items-start gap-2 p-3 rounded-xl text-xs [font-family:'Inter',Helvetica]"
            style={{ background: "#ff4a4a15", border: "1px solid #ff4a4a30", color: "#ff8a8a" }}
          >
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            {errorMsg}
          </div>
        )}
        {status === "success" && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-xs [font-family:'Inter',Helvetica] font-semibold"
            style={{ background: "#83eef018", border: "1px solid #83eef033", color: "#83eef0" }}
          >
            <CheckCircle2 size={13} />
            Proposal created! It will appear shortly on the governance board.
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={!title.trim() || options.filter(o => o.trim()).length < 2 || status === "loading" || status === "success"}
          data-testid="button-create-proposal"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm [font-family:'Inter',Helvetica] transition-all disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #83eef0 0%, #3fb0b3 100%)", color: "#00585a" }}
        >
          {status === "loading" ? (
            <><Loader2 size={15} className="animate-spin" /> Creating…</>
          ) : status === "success" ? (
            <><CheckCircle2 size={15} /> Created!</>
          ) : (
            <><Plus size={15} /> Create Proposal</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function Governance() {
  const { authenticated } = usePrivy();
  const { orcidAuthenticated } = useOrcidAuth();
  const { wallets } = useWallets();
  const isAuthed = authenticated || orcidAuthenticated;

  const [elections, setElections] = useState<VocdoniElection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "ended">("all");
  const [voteTarget, setVoteTarget] = useState<VocdoniElection | null>(null);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const orgAddress = VOCDONI_ORG;

  const fetchElections = useCallback(async (pageNum = 0) => {
    if (!orgAddress) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `${VOCDONI_API}/elections?organizationId=${orgAddress}&page=${pageNum}&limit=20`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const list: VocdoniElection[] = data.elections ?? [];

      // Fetch full details for each (includes questions + results)
      const detailed = await Promise.allSettled(
        list.map(async (e) => {
          const r = await fetch(`${VOCDONI_API}/elections/${e.electionId}`);
          return r.ok ? (r.json() as Promise<VocdoniElection>) : e;
        })
      );
      const full = detailed.map((r, i) => r.status === "fulfilled" ? r.value : list[i]);

      setElections(prev => pageNum === 0 ? full : [...prev, ...full]);
      setHasMore(list.length === 20);
    } catch (err: any) {
      console.error("[governance fetch]", err);
      setError(err.message || "Failed to load proposals.");
    } finally {
      setLoading(false);
    }
  }, [orgAddress]);

  useEffect(() => {
    fetchElections(0);
  }, [fetchElections]);

  const filtered = elections.filter(e => {
    if (filter === "active") return e.status?.toUpperCase() === "ONGOING";
    if (filter === "ended") return e.status?.toUpperCase() === "ENDED";
    return true;
  });

  const FILTER_TABS = [
    { key: "all" as const, label: "All" },
    { key: "active" as const, label: "Active" },
    { key: "ended" as const, label: "Ended" },
  ];

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundImage: `url(${coralBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        position: "relative",
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,8,12,0.86) 0%, rgba(0,19,28,0.78) 40%, rgba(0,8,12,0.92) 100%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Top bar */}
        <div className="flex items-center gap-4 px-4 md:px-6 py-3 md:py-4 border-b border-[#ffffff08]">
          <Link
            href="/"
            data-testid="link-back-home-governance"
            className="flex items-center gap-2 text-[#d4e9f380] hover:text-[#d4e9f3] transition-colors no-underline min-h-[44px] px-1"
          >
            <ArrowLeft size={16} />
            <span className="[font-family:'Inter',Helvetica] text-sm">Back</span>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Vote size={16} className="text-[#83eef0]" />
            <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f3] text-base">
              Governance
            </span>
          </div>
          <div className="flex-1" />
          {authenticated && wallets.length > 0 && (
            <button
              onClick={() => setCreateOpen(true)}
              data-testid="button-new-proposal"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs [font-family:'Inter',Helvetica] font-semibold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #83eef0 0%, #3fb0b3 100%)", color: "#00585a" }}
            >
              <Plus size={13} />
              New Proposal
            </button>
          )}
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center gap-2 px-6 pt-8 pb-5 text-center">
          <div className="flex items-center gap-2.5">
            <Vote size={22} className="text-[#83eef0]" />
            <h1 className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-extrabold text-[#d4e9f3] text-2xl">
              MesoReef DAO Governance
            </h1>
          </div>
          <p className="[font-family:'Inter',Helvetica] text-[#9aaeb8] text-sm max-w-md">
            Vote on proposals shaping the future of reef conservation and the MesoReef DAO.
          </p>
          {!isAuthed && (
            <div className="mt-2 px-4 py-2 rounded-full bg-[#83eef010] border border-[#83eef033]">
              <span className="[font-family:'Inter',Helvetica] text-[#83eef0] text-xs">
                Sign in and connect a wallet to participate in governance
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 pb-28 md:pb-16">

          {/* No org configured */}
          {!orgAddress ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#83eef015", border: "1px solid #83eef030" }}
              >
                <Vote size={28} className="text-[#83eef050]" />
              </div>
              <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f3] text-lg">
                Governance Not Configured
              </h2>
              <p className="[font-family:'Inter',Helvetica] text-[#9aaeb8] text-sm max-w-sm">
                Set the <code className="px-1 rounded" style={{ background: "#ffffff10", color: "#83eef0" }}>VITE_VOCDONI_ORG_ADDRESS</code> environment variable to your Vocdoni organization address to load proposals.
              </p>
              <a
                href="https://developer.vocdoni.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs [font-family:'Inter',Helvetica] font-semibold no-underline"
                style={{ color: "#83eef0" }}
              >
                <ExternalLink size={12} />
                Vocdoni Developer Docs
              </a>
            </div>
          ) : (
            <>
              {/* Filter tabs */}
              <div className="flex items-center gap-2 mb-6">
                {FILTER_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    data-testid={`button-filter-${tab.key}`}
                    className="px-4 py-1.5 rounded-full text-xs [font-family:'Inter',Helvetica] font-semibold transition-all"
                    style={{
                      background: filter === tab.key ? "#83eef020" : "transparent",
                      border: `1px solid ${filter === tab.key ? "#83eef050" : "#ffffff15"}`,
                      color: filter === tab.key ? "#83eef0" : "#d4e9f366",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
                <div className="flex-1" />
                {!loading && (
                  <span className="[font-family:'Inter',Helvetica] text-[#d4e9f344] text-xs">
                    {filtered.length} proposal{filtered.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Loading */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-52 rounded-[24px] animate-pulse" style={{ background: "#00080c80", border: "1px solid #ffffff06" }} />
                  ))}
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <AlertCircle size={32} className="text-[#ff4a4a50]" />
                  <p className="[font-family:'Inter',Helvetica] text-[#ff8a8a] text-sm">{error}</p>
                  <button
                    onClick={() => fetchElections(0)}
                    className="text-[#83eef0] text-xs [font-family:'Inter',Helvetica] underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Empty */}
              {!loading && !error && filtered.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-20 text-center">
                  <BarChart2 size={40} className="text-[#d4e9f322]" />
                  <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f366] text-lg">
                    No proposals yet
                  </span>
                  <span className="[font-family:'Inter',Helvetica] text-[#d4e9f344] text-sm max-w-xs">
                    {filter === "active"
                      ? "No active proposals at this time. Check back later."
                      : filter === "ended"
                      ? "No ended proposals found."
                      : "No governance proposals have been created yet. Connect a wallet to create the first one."}
                  </span>
                </div>
              )}

              {/* Proposals grid */}
              {!loading && !error && filtered.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map(e => (
                    <ProposalCard
                      key={e.electionId}
                      election={e}
                      onVote={setVoteTarget}
                      voted={!!voted[e.electionId]}
                    />
                  ))}
                </div>
              )}

              {/* Load more */}
              {hasMore && !loading && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => {
                      const next = page + 1;
                      setPage(next);
                      fetchElections(next);
                    }}
                    data-testid="button-load-more"
                    className="px-6 py-2 rounded-full text-xs [font-family:'Inter',Helvetica] font-semibold transition-all"
                    style={{ border: "1px solid #83eef030", color: "#83eef0", background: "#83eef010" }}
                  >
                    Load more
                  </button>
                </div>
              )}

              {/* Vocdoni attribution */}
              <div className="flex items-center justify-center gap-2 mt-8 opacity-40">
                <span className="[font-family:'Inter',Helvetica] text-[#d4e9f3] text-[10px]">Powered by</span>
                <a
                  href="https://vocdoni.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="[font-family:'Inter',Helvetica] text-[#83eef0] text-[10px] font-semibold no-underline hover:opacity-80"
                >
                  Vocdoni
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {voteTarget && (
        <VoteModal
          election={voteTarget}
          onClose={() => setVoteTarget(null)}
          onSuccess={() => {
            setVoted(prev => ({ ...prev, [voteTarget.electionId]: true }));
            fetchElections(0);
          }}
        />
      )}
      {createOpen && (
        <CreateModal
          orgAddress={orgAddress}
          onClose={() => setCreateOpen(false)}
          onCreated={() => fetchElections(0)}
        />
      )}

      <MobileBottomNav />
    </div>
  );
}
