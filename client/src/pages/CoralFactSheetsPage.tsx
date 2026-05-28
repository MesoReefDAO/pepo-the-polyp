import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExplorerNavigationSidebarSection } from "@/pages/sections/ExplorerNavigationSidebarSection";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import type { CoralTaxon } from "@shared/schema";

const COTW_BASE = "https://www.coralsoftheworld.org";
const COTW_FACTSHEETS = `${COTW_BASE}/species_factsheets/`;

function slugifyForCotw(scientificName: string): string {
  return scientificName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

interface Stats { taxa: number; samples: number; traits: number; families: string[] }

export function CoralFactSheetsPage() {
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState<string>("");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/coral-traits/stats"],
    staleTime: 60 * 60 * 1000,
  });

  const taxaKey = useMemo(() => ["/api/coral-traits/taxa", { search, family, limit: 500 }], [search, family]);
  const { data: taxa, isLoading } = useQuery<CoralTaxon[]>({
    queryKey: taxaKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (family) params.set("family", family);
      params.set("limit", "500");
      const res = await fetch(`/api/coral-traits/taxa?${params.toString()}`);
      if (!res.ok) throw new Error("taxa fetch failed");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const cards = useMemo(() => {
    return (taxa ?? []).map(t => ({
      taxon: t,
      slug: slugifyForCotw(t.scientificName),
      factsheetUrl: `${COTW_BASE}/species_factsheet/${slugifyForCotw(t.scientificName)}/`,
    }));
  }, [taxa]);

  return (
    <div className="flex h-screen w-screen bg-[#00080c] text-[#d4e9f3] overflow-hidden">
      <div className="hidden md:flex flex-shrink-0">
        <ExplorerNavigationSidebarSection />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-4 md:px-8 py-4 md:py-6 border-b border-[#ffffff0d]">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#83eef0 0%,#26de81 100%)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M6 3h9l5 5v13H6z" stroke="#00080c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 3v5h5M9 13h6M9 17h6" stroke="#00080c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#d4e9f3]" data-testid="text-factsheets-title">Coral Species Fact Sheets</h1>
              </div>
              <p className="text-xs text-[#d4e9f399] max-w-2xl">
                Curated species fact sheets from <a href={COTW_FACTSHEETS} target="_blank" rel="noopener noreferrer" className="text-[#83eef0] hover:underline" data-testid="link-cotw-factsheets-source">Corals of the World</a> by J.E.N. Veron et al., the global reference atlas for hard coral taxonomy, biology and distribution. Click any species to open its full fact sheet in a side panel.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Stat label="Species" value={stats?.taxa ?? 0} color="#83eef0" testId="stat-fs-species" />
              <Stat label="Families" value={stats?.families.length ?? 0} color="#a6ce39" testId="stat-fs-families" />
              <Stat label="Source" value="CoTW v0.01" color="#26de81" testId="stat-fs-source" />
            </div>
          </div>
        </header>

        <div className="px-4 md:px-8 py-3 border-b border-[#ffffff0d] flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search species by name or genus..."
            data-testid="input-factsheet-search"
            className="flex-1 min-w-[200px] bg-[#0a293344] border border-[#ffffff14] rounded-md px-3 py-1.5 text-sm text-[#d4e9f3] placeholder:text-[#d4e9f366] focus:outline-none focus:border-[#83eef066]"
          />
          <select
            value={family}
            onChange={e => setFamily(e.target.value)}
            data-testid="select-factsheet-family"
            className="bg-[#0a293344] border border-[#ffffff14] rounded-md px-3 py-1.5 text-sm text-[#d4e9f3] focus:outline-none focus:border-[#83eef066]"
          >
            <option value="">All families</option>
            {(stats?.families ?? []).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <span className="text-[10px] text-[#d4e9f366] ml-auto">
            {isLoading ? "Loading..." : `${cards.length} species`}
          </span>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_640px] overflow-hidden">
          {/* Cards grid */}
          <section className="overflow-y-auto p-4 md:p-6">
            {cards.length === 0 && !isLoading && (
              <div className="text-sm text-[#d4e9f380] py-12 text-center">
                No species match your filters. Try clearing the search.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {cards.map(({ taxon, slug, factsheetUrl }) => {
                const isActive = activeSlug === slug;
                return (
                  <article
                    key={taxon.id}
                    data-testid={`card-factsheet-${taxon.id}`}
                    className={`rounded-lg border p-3 transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#83eef00f] border-[#83eef066]"
                        : "bg-[#0a293322] border-[#ffffff0d] hover:bg-[#0a293344] hover:border-[#83eef033]"
                    }`}
                    onClick={() => setActiveSlug(slug)}
                  >
                    <h3 className="italic font-semibold text-sm text-[#d4e9f3] leading-tight" data-testid={`text-factsheet-name-${taxon.id}`}>
                      {taxon.scientificName}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-[#d4e9f377]">
                      {taxon.family && <span className="px-1.5 py-0.5 rounded bg-[#83eef00f] border border-[#83eef033] text-[#83eef0cc]">{taxon.family}</span>}
                      {taxon.genus && <span className="px-1.5 py-0.5 rounded bg-[#a6ce3910] border border-[#a6ce3933] text-[#a6ce39cc]">{taxon.genus}</span>}
                      {taxon.authority && <span className="text-[#d4e9f355]">{taxon.authority}</span>}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <a
                        href={factsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        data-testid={`link-factsheet-external-${taxon.id}`}
                        className="text-[#83eef0] hover:underline no-underline"
                      >
                        Open on coralsoftheworld.org ↗
                      </a>
                      <button
                        onClick={e => { e.stopPropagation(); setActiveSlug(slug); }}
                        data-testid={`button-factsheet-preview-${taxon.id}`}
                        className="px-2 py-0.5 rounded border border-[#83eef033] text-[#83eef0] hover:bg-[#83eef00f]"
                      >
                        Preview
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Preview pane */}
          <aside className="hidden lg:flex flex-col border-l border-[#ffffff08] overflow-hidden">
            {!activeSlug ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#d4e9f366] mb-2">Fact sheet preview</div>
                  <p className="text-sm text-[#d4e9f399] max-w-xs">Select any species card to load its Corals of the World fact sheet here. Embedded view; click "Open on coralsoftheworld.org" for the full page.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#ffffff0d] flex-shrink-0">
                  <div className="italic text-sm font-medium text-[#d4e9f3]" data-testid="text-preview-name">
                    {cards.find(c => c.slug === activeSlug)?.taxon.scientificName}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`${COTW_BASE}/species_factsheet/${activeSlug}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="link-preview-open-external"
                      className="text-[10px] text-[#83eef0] hover:underline"
                    >
                      Open ↗
                    </a>
                    <button
                      onClick={() => setActiveSlug(null)}
                      data-testid="button-preview-close"
                      className="text-[10px] px-2 py-0.5 rounded border border-[#ffffff14] text-[#d4e9f399] hover:bg-[#ffffff08]"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <iframe
                  key={activeSlug}
                  src={`${COTW_BASE}/species_factsheet/${activeSlug}/`}
                  title={`Corals of the World fact sheet: ${activeSlug}`}
                  data-testid="iframe-factsheet-preview"
                  className="flex-1 w-full bg-white"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  referrerPolicy="no-referrer"
                />
              </>
            )}
          </aside>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}

function Stat({ label, value, color, testId }: { label: string; value: number | string; color: string; testId: string }) {
  return (
    <div
      data-testid={testId}
      className="px-3 py-1.5 rounded-lg border bg-[#0a293344] flex items-baseline gap-1.5"
      style={{ borderColor: `${color}33` }}
    >
      <span className="font-mono font-bold text-base tabular-nums" style={{ color }}>{typeof value === "number" ? value.toLocaleString() : value}</span>
      <span className="text-[9px] uppercase tracking-widest text-[#d4e9f380]">{label}</span>
    </div>
  );
}
