import { Link } from "wouter";
import { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink, FileText, Table2, Lock, Globe, Zap, Users, ImageIcon } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { IPFSImageUpload } from "@/components/IPFSImageUpload";
import { ipfsPublicUrl } from "@/lib/ipfs";
import { FileverseWorkspacePanel } from "@/components/FileverseWorkspacePanel";
import coralBg from "@assets/coral_polmicro_1777059731544.jpg";

const TOOLS = [
  {
    id: "ddocs",
    name: "dDocs",
    tagline: "Decentralized Document Editor",
    description:
      "Create, collaborate and share research documents. End-to-end encrypted, stored on IPFS — like Google Docs but fully self-sovereign. Ideal for field reports, species assessments, and DAO proposals.",
    href: "https://ddocs.new",
    color: "#48dbfb",
    icon: <FileText size={26} strokeWidth={1.5} />,
    useCases: ["Field research reports", "Species monitoring logs", "DAO proposals", "Reef restoration protocols"],
  },
  {
    id: "dsheets",
    name: "dSheets",
    tagline: "Decentralized Spreadsheet",
    description:
      "Query and manipulate data with a no-code interface, built on the same privacy-first infrastructure as dDocs. Ideal for coral monitoring datasets, biodiversity records, and on-chain treasury data.",
    href: "https://dsheets.new",
    color: "#1dd1a1",
    icon: <Table2 size={26} strokeWidth={1.5} />,
    useCases: ["Coral health datasets", "Biodiversity species counts", "Reef monitoring time-series", "DAO treasury data"],
  },
];

const PRINCIPLES = [
  { icon: <Lock size={14} />, label: "End-to-end encrypted" },
  { icon: <Globe size={14} />, label: "Stored on IPFS" },
  { icon: <Zap size={14} />, label: "No account required" },
  { icon: <Users size={14} />, label: "Real-time collaboration" },
];

export function WorkspacePage() {
  const [archivedImages, setArchivedImages] = useState<{ cid: string; localUrl: string; mimeType: string }[]>([]);
  const [privyToken, setPrivyToken] = useState<string | undefined>(undefined);
  const { authenticated, getAccessToken } = usePrivy();

  useEffect(() => {
    if (!authenticated) return;
    getAccessToken().then((t) => { if (t) setPrivyToken(t); }).catch(() => {});
  }, [authenticated]);

  function handleArchiveUpload(result: { cid: string; localUrl: string; mimeType: string }) {
    setArchivedImages(prev => {
      if (prev.some(img => img.cid === result.cid)) return prev;
      return [result, ...prev];
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${coralBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        fontFamily: "Inter, sans-serif",
        color: "#d4e9f3",
        position: "relative",
      }}
    >
      {/* Overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "linear-gradient(180deg, rgba(0,8,12,0.82) 0%, rgba(0,19,28,0.75) 40%, rgba(0,8,12,0.88) 100%)",
      }} />

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 24px",
        background: "rgba(0,19,28,0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(131,238,240,0.12)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <Link href="/">
          <button
            data-testid="workspace-back"
            style={{
              background: "rgba(131,238,240,0.08)", border: "1px solid rgba(131,238,240,0.18)",
              borderRadius: 10, padding: "8px 14px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              color: "#83eef0cc", fontSize: 12, fontWeight: 600,
            }}
          >
            <ArrowLeft size={14} color="#83eef0" /> Back
          </button>
        </Link>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#83eef0", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Regen Reef Workspace
          </div>
          <div style={{ fontSize: 9.5, color: "#d4e9f344", marginTop: 1 }}>
            Powered by Fileverse · Decentralised collaboration tools
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 20px 80px", position: "relative", zIndex: 1 }}>

        {/* ── Principles chips ── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", marginBottom: 28 }}>
          {PRINCIPLES.map(({ icon, label }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(131,238,240,0.05)", border: "1px solid rgba(131,238,240,0.12)",
              borderRadius: 20, padding: "5px 12px",
            }}>
              <span style={{ color: "#83eef0" }}>{icon}</span>
              <span style={{ fontSize: 11, color: "#83eef0aa" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── Wallet / Fileverse connection status ── */}
        <FileverseWorkspacePanel variant="page" />

        {/* ── Tool Cards ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
          {TOOLS.map((tool) => (
            <div
              key={tool.id}
              data-testid={`workspace-card-${tool.id}`}
              style={{
                background: `${tool.color}08`,
                border: `1px solid ${tool.color}25`,
                borderRadius: 18,
                padding: "20px 22px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                  background: `${tool.color}15`, border: `1px solid ${tool.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: tool.color,
                }}>
                  {tool.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "#d4e9f3", margin: 0 }}>{tool.name}</h2>
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: tool.color,
                      background: `${tool.color}18`, border: `1px solid ${tool.color}33`,
                      borderRadius: 20, padding: "2px 8px", letterSpacing: "0.04em",
                    }}>
                      Public Beta
                    </span>
                  </div>
                  <p style={{ fontSize: 11.5, color: `${tool.color}99`, margin: 0, fontWeight: 600 }}>{tool.tagline}</p>
                </div>
              </div>

              <p style={{ fontSize: 13, color: "#9aaeb8", lineHeight: 1.7, margin: "0 0 14px" }}>
                {tool.description}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
                {tool.useCases.map((uc) => (
                  <span key={uc} style={{
                    fontSize: 11, color: `${tool.color}bb`,
                    background: `${tool.color}0d`, border: `1px solid ${tool.color}22`,
                    borderRadius: 20, padding: "3px 10px",
                  }}>{uc}</span>
                ))}
              </div>

              <a
                href={tool.href}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`launch-${tool.id}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  background: `linear-gradient(135deg, ${tool.color}cc, ${tool.color}88)`,
                  color: "#00131c",
                  fontWeight: 700, fontSize: 12.5,
                  borderRadius: 11, padding: "10px 20px",
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <ExternalLink size={13} />
                Open {tool.name}
              </a>
            </div>
          ))}
        </div>

        {/* ── Coral Reef Image Archive ── */}
        <div
          data-testid="workspace-image-archive"
          style={{
            background: "rgba(131,238,240,0.03)", border: "1px solid rgba(131,238,240,0.12)",
            borderRadius: 18, padding: "22px", marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: "rgba(255,190,105,0.1)", border: "1px solid rgba(255,190,105,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#ffbe69",
            }}>
              <ImageIcon size={18} strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#d4e9f3", margin: 0 }}>
                  Coral Reef Image Archive
                </h2>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: "#ffbe69",
                  background: "rgba(255,190,105,0.12)", border: "1px solid rgba(255,190,105,0.25)",
                  borderRadius: 20, padding: "2px 8px", letterSpacing: "0.04em",
                }}>
                  IPFS · Helia
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: "#9aaeb8", margin: "2px 0 0" }}>
                Pin field photos and reef imagery to IPFS — permanently addressable and censorship-resistant.
              </p>
            </div>
          </div>

          <IPFSImageUpload
            label="Add reef image to IPFS"
            onUpload={handleArchiveUpload}
            showMapPin={true}
            privyToken={privyToken}
          />

          {archivedImages.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: "#ffbe6955", letterSpacing: "0.1em",
                textTransform: "uppercase", marginBottom: 10,
              }}>
                Session archive — {archivedImages.length} image{archivedImages.length !== 1 ? "s" : ""}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
                {archivedImages.map((img) => (
                  <a
                    key={img.cid}
                    href={ipfsPublicUrl(img.cid)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`archive-img-${img.cid.slice(-6)}`}
                    style={{
                      display: "block", textDecoration: "none",
                      borderRadius: 9, overflow: "hidden",
                      border: "1px solid rgba(255,190,105,0.15)",
                    }}
                    title={img.cid}
                  >
                    <img
                      src={img.localUrl}
                      alt="Archived reef image"
                      style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
                    />
                    <div style={{
                      padding: "4px 6px", background: "rgba(0,8,12,0.6)",
                      fontSize: 8, color: "#ffbe6977", fontFamily: "monospace",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {img.cid.slice(0, 16)}…
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── About Fileverse ── */}
        <div style={{
          background: "rgba(131,238,240,0.04)", border: "1px solid rgba(131,238,240,0.1)",
          borderRadius: 14, padding: "16px 20px",
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#83eef055", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            About Fileverse
          </div>
          <p style={{ fontSize: 12, color: "#9aaeb8", lineHeight: 1.7, margin: "0 0 12px" }}>
            Fileverse is an end-to-end encrypted, decentralised alternative to Google Workspace. Built on IPFS and Ethereum, it guarantees data sovereignty and privacy by design.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "GitHub", href: "https://github.com/fileverse" },
              { label: "fileverse.io", href: "https://fileverse.io" },
              { label: "ddocs.new", href: "https://ddocs.new" },
              { label: "dsheets.new", href: "https://dsheets.new" },
            ].map(({ label, href }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: "#83eef077", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#83eef0")}
                onMouseLeave={e => (e.currentTarget.style.color = "#83eef077")}
              >
                ↗ {label}
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
