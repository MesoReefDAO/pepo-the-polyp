import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ExplorerNavigationSidebarSection } from "@/pages/sections/ExplorerNavigationSidebarSection";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { CORAL_TRAIT_CATEGORIES, CORAL_TRAITS_TOTAL, CORAL_TRAITS_URL } from "@/data/coralTraits";
import type { CoralTaxon, CoralTraitDef, CoralTraitSample } from "@shared/schema";

interface Stats { taxa: number; samples: number; traits: number; families: string[] }

export function CoralTraitsPage() {
  const [search, setSearch]   = useState("");
  const [family, setFamily]   = useState<string>("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [openMobile, setOpenMobile] = useState(false);

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/coral-traits/stats"],
    staleTime: 60 * 60 * 1000,
    refetchInterval: 30 * 1000, // keep counters live while seeding runs
  });

  const taxaKey = useMemo(() => ["/api/coral-traits/taxa", { search, family }], [search, family]);
  const { data: taxa, isLoading: taxaLoading } = useQuery<CoralTaxon[]>({
    queryKey: taxaKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (family) params.set("family", family);
      params.set("limit", "300");
      const res = await fetch(`/api/coral-traits/taxa?${params.toString()}`);
      if (!res.ok) throw new Error("taxa fetch failed");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: detail } = useQuery<{ taxon: CoralTaxon; samples: CoralTraitSample[] }>({
    queryKey: ["/api/coral-traits/taxa", selectedId],
    enabled: selectedId != null,
    staleTime: 5 * 60 * 1000,
  });

  const { data: defs } = useQuery<CoralTraitDef[]>({
    queryKey: ["/api/coral-traits/definitions"],
    staleTime: 60 * 60 * 1000,
  });

  // Auto-select first taxon once the list arrives
  useEffect(() => {
    if (selectedId == null && taxa && taxa.length > 0) setSelectedId(taxa[0].id);
  }, [taxa, selectedId]);

  // Group trait definitions by category for the right-hand reference panel
  const defsByCategory = useMemo(() => {
    const acc: Record<string, CoralTraitDef[]> = {};
    (defs ?? []).forEach(d => {
      const c = d.category || "Other";
      (acc[c] ??= []).push(d);
    });
    return acc;
  }, [defs]);

  return (
    <div className="flex h-screen w-screen bg-[#00080c] text-[#d4e9f3] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <ExplorerNavigationSidebarSection />
      </div>

      {/* Main area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-4 md:px-8 py-4 md:py-6 border-b border-[#ffffff0d]">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f9ca24 0%,#e58e26 100%)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v4M5 6l3 3M19 6l-3 3M3 14h4M21 14h-4M8 21l1-6h6l1 6" stroke="#00080c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="#00080c" strokeWidth="2"/>
                  </svg>
                </div>
                <h1 className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-xl md:text-2xl text-[#d4e9f3]" data-testid="text-coral-traits-title">
                  Coral Traits
                </h1>
                <a
                  href="https://www.coraltraits.org"
                  target="_blank" rel="noopener noreferrer"
                  data-testid="link-coral-traits-org"
                  className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-[#83eef033] text-[#83eef0] hover:bg-[#83eef00f] no-underline"
                >
                  CoralTraits.org
                </a>
                <a
                  href="https://github.com/jmadinlab/coraltraits2"
                  target="_blank" rel="noopener noreferrer"
                  data-testid="link-coraltraits2-repo"
                  className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-[#a6ce3933] text-[#a6ce39] hover:bg-[#a6ce390f] no-underline"
                >
                  coraltraits2
                </a>
              </div>
              <p className="text-xs md:text-sm text-[#d4e9f380] max-w-2xl leading-relaxed">
                Browse the Coral Trait Database (CTDB) - {CORAL_TRAITS_TOTAL} traits across Scleractinia species,
                with sample observations geolocated on the <Link href="/reef-map" data-testid="link-reef-map-inline" className="text-[#83eef0] no-underline hover:underline">Reef Map</Link>.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <Stat label="Taxa"        value={stats?.taxa    ?? "..."} testId="stat-taxa" color="#83eef0" />
              <Stat label="Samples"     value={stats?.samples ?? "..."} testId="stat-samples" color="#f9ca24" />
              <Stat label="Trait defs"  value={stats?.traits  ?? CORAL_TRAITS_TOTAL} testId="stat-traits" color="#a6ce39" />
            </div>
          </div>
        </header>

        {/* Filter bar */}
        <div className="px-4 md:px-8 py-3 flex items-center gap-2 border-b border-[#ffffff08] flex-wrap">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search species (e.g. Acropora millepora)"
            data-testid="input-coral-search"
            className="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg bg-[#0a293366] border border-[#83eef022] text-[#d4e9f3] placeholder:text-[#d4e9f344] focus:outline-none focus:border-[#83eef066]"
          />
          <select
            value={family}
            onChange={e => setFamily(e.target.value)}
            data-testid="select-coral-family"
            className="px-3 py-2 text-sm rounded-lg bg-[#0a293366] border border-[#83eef022] text-[#d4e9f3] focus:outline-none focus:border-[#83eef066]"
          >
            <option value="">All families</option>
            {(stats?.families ?? []).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <button
            onClick={() => setOpenMobile(o => !o)}
            data-testid="button-toggle-mobile-detail"
            className="md:hidden px-3 py-2 text-xs rounded-lg bg-[#83eef018] border border-[#83eef033] text-[#83eef0]"
          >
            {openMobile ? "Show list" : "Show detail"}
          </button>
        </div>

        {/* Body: 3-pane on desktop, single-pane on mobile */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr_320px] overflow-hidden">
          {/* Pane 1: Taxa list */}
          <aside
            data-testid="pane-coral-taxa"
            className={`${openMobile ? "hidden" : "block"} md:block border-r border-[#ffffff08] overflow-y-auto`}
          >
            {taxaLoading && (
              <div className="p-4 text-xs text-[#d4e9f380]">Loading species...</div>
            )}
            {!taxaLoading && (taxa?.length ?? 0) === 0 && (
              <div className="p-4 text-xs text-[#d4e9f380]">
                No species in the database yet. The reef-map layer is hydrating it from CoralTraits.org now - refresh in a moment.
              </div>
            )}
            <ul className="py-1">
              {(taxa ?? []).map(t => {
                const active = t.id === selectedId;
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => { setSelectedId(t.id); setOpenMobile(true); }}
                      data-testid={`row-coral-taxon-${t.id}`}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors border-l-2 ${
                        active
                          ? "bg-[#83eef00f] border-[#83eef0] text-[#d4e9f3]"
                          : "border-transparent text-[#d4e9f3aa] hover:bg-[#ffffff05] hover:text-[#d4e9f3]"
                      }`}
                    >
                      <div className="italic font-medium leading-tight">{t.scientificName}</div>
                      <div className="text-[10px] mt-0.5 flex gap-2 text-[#d4e9f366]">
                        {t.family && <span>{t.family}</span>}
                        {t.sampleCount > 0 && <span>{t.sampleCount} samples</span>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Pane 2: Selected taxon detail (samples + traits) */}
          <section
            data-testid="pane-coral-detail"
            className={`${openMobile ? "block" : "hidden"} md:block overflow-y-auto p-4 md:p-6`}
          >
            {!detail && selectedId != null && (
              <div className="text-xs text-[#d4e9f380]">Loading taxon...</div>
            )}
            {detail && (
              <>
                <h2 className="italic font-bold text-lg md:text-xl text-[#d4e9f3]" data-testid="text-taxon-name">
                  {detail.taxon.scientificName}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2 mb-4 text-[10px]">
                  {detail.taxon.family && <Tag label={`Family: ${detail.taxon.family}`} color="#83eef0" />}
                  {detail.taxon.genus && <Tag label={`Genus: ${detail.taxon.genus}`} color="#a6ce39" />}
                  {detail.taxon.authority && <Tag label={detail.taxon.authority} color="#d4e9f366" />}
                  {detail.taxon.iucnStatus && <Tag label={`IUCN: ${detail.taxon.iucnStatus}`} color="#f9ca24" />}
                  <a
                    href={`https://coraltraits.org/species/${encodeURIComponent(detail.taxon.scientificName)}`}
                    target="_blank" rel="noopener noreferrer"
                    data-testid="link-coraltraits-species"
                    className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-[#83eef033] text-[#83eef0] hover:bg-[#83eef00f] no-underline"
                  >
                    View on CoralTraits.org
                  </a>
                  <a
                    href={`https://www.coralsoftheworld.org/species_factsheet/${detail.taxon.scientificName.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")}/`}
                    target="_blank" rel="noopener noreferrer"
                    data-testid="link-cotw-species"
                    className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-[#a6ce3933] text-[#a6ce39] hover:bg-[#a6ce390f] no-underline"
                  >
                    Corals of the World fact sheet
                  </a>
                </div>

                {/* Samples table */}
                <h3 className="text-xs uppercase tracking-widest text-[#d4e9f366] mt-4 mb-2">
                  Samples ({detail.samples.length})
                </h3>
                {detail.samples.length === 0 ? (
                  <div className="text-xs text-[#d4e9f380] py-4">
                    No trait observations recorded for this species yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-[#ffffff08]">
                    <table className="w-full text-xs" data-testid="table-coral-samples">
                      <thead>
                        <tr className="bg-[#0a293366] text-[#d4e9f380] text-left uppercase tracking-widest text-[9px]">
                          <th className="px-2 py-2">Trait</th>
                          <th className="px-2 py-2">Value</th>
                          <th className="px-2 py-2">Unit</th>
                          <th className="px-2 py-2">Location</th>
                          <th className="px-2 py-2">Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.samples.slice(0, 200).map(s => (
                          <tr key={s.id} className="border-t border-[#ffffff05] hover:bg-[#ffffff04]" data-testid={`row-coral-sample-${s.id}`}>
                            <td className="px-2 py-1.5 text-[#d4e9f3]">{s.traitName || "-"}</td>
                            <td className="px-2 py-1.5 text-[#83eef0] font-mono">{s.value || "-"}</td>
                            <td className="px-2 py-1.5 text-[#d4e9f380]">{s.unit || "-"}</td>
                            <td className="px-2 py-1.5 text-[#d4e9f380]">
                              {[s.location, s.country].filter(Boolean).join(", ") || "-"}
                              {s.latitude != null && s.longitude != null && (
                                <span className="ml-1 text-[9px] text-[#83eef088]">
                                  ({s.latitude.toFixed(2)}, {s.longitude.toFixed(2)})
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-[#d4e9f366]">
                              {s.doi ? (
                                <a href={`https://doi.org/${s.doi}`} target="_blank" rel="noopener noreferrer" className="text-[#a6ce39] no-underline hover:underline">{s.resource || s.doi}</a>
                              ) : (s.resource || s.source || "-")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {detail.samples.length > 200 && (
                      <div className="px-2 py-2 text-[10px] text-[#d4e9f366] text-center">
                        Showing 200 of {detail.samples.length} samples.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Pane 3: Trait reference (desktop only) */}
          <aside data-testid="pane-coral-trait-reference" className="hidden md:block border-l border-[#ffffff08] overflow-y-auto p-4">
            <h3 className="text-xs uppercase tracking-widest text-[#d4e9f366] mb-2">Trait reference</h3>
            <p className="text-[10px] text-[#d4e9f366] mb-3">
              All {CORAL_TRAITS_TOTAL} traits, grouped by category. Click to see the upstream page.
            </p>
            <div className="space-y-3">
              {CORAL_TRAIT_CATEGORIES.map(cat => (
                <details key={cat.name} className="text-xs" open={cat.name === "Morphological"}>
                  <summary className="cursor-pointer text-[#d4e9f3] font-semibold py-1 hover:text-[#83eef0]" data-testid={`summary-trait-category-${cat.name.toLowerCase()}`}>
                    {cat.name} <span className="text-[#d4e9f366] font-normal">({cat.traits.length})</span>
                  </summary>
                  <ul className="pl-2 mt-1 space-y-0.5">
                    {cat.traits.map(t => (
                      <li key={t.id}>
                        <a
                          href={`${CORAL_TRAITS_URL}/${t.id}`}
                          target="_blank" rel="noopener noreferrer"
                          data-testid={`link-trait-${t.id}`}
                          className="text-[#d4e9f3aa] hover:text-[#83eef0] no-underline text-[11px]"
                        >
                          {t.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>

            {defs && defs.length > 0 && (
              <>
                <h4 className="text-xs uppercase tracking-widest text-[#d4e9f366] mt-6 mb-2">In our DB</h4>
                <div className="text-[10px] text-[#d4e9f366] space-y-1">
                  {Object.entries(defsByCategory).map(([cat, list]) => (
                    <div key={cat} className="flex justify-between">
                      <span>{cat}</span>
                      <span>{list.reduce((n, d) => n + (d.sampleCount || 0), 0)} samples</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </aside>
        </div>
      </main>

      {/* Mobile bottom nav */}
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

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full border [font-family:'Inter',Helvetica]"
      style={{ borderColor: `${color}33`, color, background: `${color}0a` }}
    >
      {label}
    </span>
  );
}
