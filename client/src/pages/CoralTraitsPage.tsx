import { useEffect, useMemo, useState } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ExplorerNavigationSidebarSection } from "@/pages/sections/ExplorerNavigationSidebarSection";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import type { CtSpecies, CtMeasurement, CtTrait } from "@shared/schema";

interface Summary {
  species: number;
  locations: number;
  resources: number;
  traits: number;
  standards: number;
  methodologies: number;
  measurements: number;
}

export function CoralTraitsPage() {
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [traitFilter, setTraitFilter] = useState<string>("");
  const [openMobile, setOpenMobile] = useState(false);

  const { data: summary } = useQuery<Summary>({
    queryKey: ["/api/coraltraits/summary"],
    staleTime: 60 * 60 * 1000,
  });

  const PAGE_SIZE = 200;
  const {
    data: speciesPages,
    isLoading: speciesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<CtSpecies[]>({
    queryKey: ["/api/coraltraits/species", { q: search, family }],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (family) params.set("family", family);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(pageParam));
      const res = await fetch(`/api/coraltraits/species?${params.toString()}`);
      if (!res.ok) throw new Error("species fetch failed");
      return res.json();
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    staleTime: 5 * 60 * 1000,
  });

  const species = useMemo(
    () => (speciesPages?.pages ?? []).flat(),
    [speciesPages]
  );

  const { data: familyOptions } = useQuery<string[]>({
    queryKey: ["/api/coraltraits/families"],
    staleTime: 60 * 60 * 1000,
  });

  const selectedName = useMemo(
    () => (species ?? []).find(s => s.id === selectedId)?.masterSpecies ?? null,
    [species, selectedId]
  );

  const { data: measurements, isLoading: measLoading } = useQuery<CtMeasurement[]>({
    queryKey: ["/api/coraltraits/measurements", { species_name: selectedName }],
    enabled: selectedName != null && selectedName !== "",
    queryFn: async () => {
      const res = await fetch(`/api/coraltraits/measurements?species_name=${encodeURIComponent(selectedName!)}&limit=1000`);
      if (!res.ok) throw new Error("measurements fetch failed");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: traits } = useQuery<CtTrait[]>({
    queryKey: ["/api/coraltraits/traits"],
    staleTime: 60 * 60 * 1000,
  });

  const families = familyOptions ?? [];

  // Family filtering happens server-side, so the loaded pages are already scoped.
  const filteredSpecies = species ?? [];

  const selected = useMemo(
    () => (species ?? []).find(s => s.id === selectedId) ?? null,
    [species, selectedId]
  );

  // Auto-select first species once the list arrives / changes
  useEffect(() => {
    if (filteredSpecies.length === 0) return;
    if (selectedId == null || !filteredSpecies.some(s => s.id === selectedId)) {
      setSelectedId(filteredSpecies[0].id);
      setTraitFilter("");
    }
  }, [filteredSpecies, selectedId]);

  // Trait names present in the selected species' measurements (for the filter)
  const measTraitNames = useMemo(() => {
    const set = new Set<string>();
    (measurements ?? []).forEach(m => { if (m.traitName) set.add(m.traitName); });
    return Array.from(set).sort();
  }, [measurements]);

  const visibleMeasurements = useMemo(() => {
    if (!traitFilter) return measurements ?? [];
    return (measurements ?? []).filter(m => m.traitName === traitFilter);
  }, [measurements, traitFilter]);

  // Trait reference grouped by class for the right-hand panel
  const traitsByClass = useMemo(() => {
    const acc: Record<string, CtTrait[]> = {};
    (traits ?? []).forEach(t => {
      const c = t.traitClassId || "Other";
      (acc[c] ??= []).push(t);
    });
    Object.values(acc).forEach(list => list.sort((a, b) => a.name.localeCompare(b.name)));
    return acc;
  }, [traits]);

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
              <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                  href="https://coraltraits.org"
                  target="_blank" rel="noopener noreferrer"
                  data-testid="link-coraltraits-repo"
                  className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-[#a6ce3933] text-[#a6ce39] hover:bg-[#a6ce390f] no-underline"
                >
                  coraltraits.org
                </a>
              </div>
              <p className="text-xs md:text-sm text-[#d4e9f380] max-w-2xl leading-relaxed">
                The Coral Trait Database - <a href="https://coraltraits.org" target="_blank" rel="noopener noreferrer" className="text-[#83eef0] no-underline hover:underline">coraltraits.org</a> full
                {" "}{(summary?.species ?? 0).toLocaleString()}-species catalogue (Octocorallia and Hexacorallia), with
                {" "}{(summary?.measurements ?? 0).toLocaleString()} trait measurements geolocated on the{" "}
                <Link href="/reef-map" data-testid="link-reef-map-inline" className="text-[#83eef0] no-underline hover:underline">Reef Map</Link>.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <Stat label="Species"      value={summary?.species ?? "..."}      testId="stat-species" color="#83eef0" />
              <Stat label="Measurements" value={summary?.measurements ?? "..."} testId="stat-measurements" color="#f9ca24" />
              <Stat label="Traits"       value={summary?.traits ?? "..."}       testId="stat-traits" color="#a6ce39" />
              <Stat label="Locations"    value={summary?.locations ?? "..."}    testId="stat-locations" color="#26de81" />
            </div>
          </div>
        </header>

        {/* Filter bar */}
        <div className="px-4 md:px-8 py-3 flex items-center gap-2 border-b border-[#ffffff08] flex-wrap">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search species (e.g. Annella mollis)"
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
            {families.map(f => <option key={f} value={f}>{f}</option>)}
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
          {/* Pane 1: Species list */}
          <aside
            data-testid="pane-coral-taxa"
            className={`${openMobile ? "hidden" : "block"} md:block border-r border-[#ffffff08] overflow-y-auto`}
          >
            {speciesLoading && (
              <div className="p-4 text-xs text-[#d4e9f380]">Loading species...</div>
            )}
            {!speciesLoading && filteredSpecies.length === 0 && (
              <div className="p-4 text-xs text-[#d4e9f380]">No species match your search.</div>
            )}
            <ul className="py-1">
              {filteredSpecies.map(t => {
                const active = t.id === selectedId;
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => { setSelectedId(t.id); setTraitFilter(""); setOpenMobile(true); }}
                      data-testid={`row-coral-taxon-${t.id}`}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors border-l-2 ${
                        active
                          ? "bg-[#83eef00f] border-[#83eef0] text-[#d4e9f3]"
                          : "border-transparent text-[#d4e9f3aa] hover:bg-[#ffffff05] hover:text-[#d4e9f3]"
                      }`}
                    >
                      <div className="italic font-medium leading-tight">{t.masterSpecies || t.id}</div>
                      <div className="text-[10px] mt-0.5 flex gap-2 text-[#d4e9f366]">
                        {t.familyMolecules && <span>{t.familyMolecules}</span>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {hasNextPage && (
              <div className="px-4 py-3">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  data-testid="button-load-more-species"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#83eef012] border border-[#83eef033] text-[#83eef0] hover:bg-[#83eef01f] disabled:opacity-50"
                >
                  {isFetchingNextPage ? "Loading..." : `Load more species (${filteredSpecies.length} of ${(summary?.species ?? 0).toLocaleString()})`}
                </button>
              </div>
            )}
          </aside>

          {/* Pane 2: Selected species detail (measurements) */}
          <section
            data-testid="pane-coral-detail"
            className={`${openMobile ? "block" : "hidden"} md:block overflow-y-auto p-4 md:p-6`}
          >
            {!selected && (
              <div className="text-xs text-[#d4e9f380]">Select a species to view its trait measurements.</div>
            )}
            {selected && (
              <>
                <h2 className="italic font-bold text-lg md:text-xl text-[#d4e9f3]" data-testid="text-taxon-name">
                  {selected.masterSpecies || selected.id}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2 mb-3 text-[10px]">
                  {selected.speciesClass && <Tag label={selected.speciesClass} color="#f9ca24" />}
                  {selected.familyMolecules && <Tag label={`Family: ${selected.familyMolecules}`} color="#83eef0" />}
                  {selected.familyMorphology && selected.familyMorphology !== selected.familyMolecules && (
                    <Tag label={`Morphology: ${selected.familyMorphology}`} color="#26de81" />
                  )}
                  {selected.synonymSpecies && (
                    <span
                      className="px-2 py-0.5 rounded-full border [font-family:'Inter',Helvetica]"
                      style={{ borderColor: "#d4e9f36633", color: "#d4e9f366", background: "#d4e9f3660a" }}
                    >
                      Syn: <span className="italic">{selected.synonymSpecies}</span>
                    </span>
                  )}
                  <a
                    href={`https://coraltraits.org/species/${encodeURIComponent(selected.masterSpecies || "")}`}
                    target="_blank" rel="noopener noreferrer"
                    data-testid="link-coraltraits-species"
                    className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-[#83eef033] text-[#83eef0] hover:bg-[#83eef00f] no-underline"
                  >
                    CoralTraits.org
                  </a>
                  <a
                    href={`https://www.coralsoftheworld.org/species_factsheet/${(selected.masterSpecies || "").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")}/`}
                    target="_blank" rel="noopener noreferrer"
                    data-testid="link-cotw-species"
                    className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-[#a6ce3933] text-[#a6ce39] hover:bg-[#a6ce390f] no-underline"
                  >
                    Corals of the World
                  </a>
                </div>

                {selected.description && (
                  <p className="text-xs md:text-sm text-[#d4e9f3aa] leading-relaxed mb-2 max-w-3xl" data-testid="text-species-description">
                    {selected.description}
                  </p>
                )}

                {/* Trait filter + count */}
                <div className="flex items-center gap-2 mt-4 mb-2 flex-wrap">
                  <h3 className="text-xs uppercase tracking-widest text-[#d4e9f366]">
                    Measurements ({visibleMeasurements.length}{traitFilter ? ` of ${measurements?.length ?? 0}` : ""})
                  </h3>
                  {measTraitNames.length > 0 && (
                    <select
                      value={traitFilter}
                      onChange={e => setTraitFilter(e.target.value)}
                      data-testid="select-trait-filter"
                      className="ml-auto px-2 py-1 text-[11px] rounded-md bg-[#0a293366] border border-[#83eef022] text-[#d4e9f3] focus:outline-none focus:border-[#83eef066]"
                    >
                      <option value="">All traits ({measTraitNames.length})</option>
                      {measTraitNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  )}
                </div>

                {measLoading ? (
                  <div className="text-xs text-[#d4e9f380] py-4">Loading measurements...</div>
                ) : visibleMeasurements.length === 0 ? (
                  <div className="text-xs text-[#d4e9f380] py-4">No trait measurements recorded for this species.</div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-[#ffffff08]">
                    <table className="w-full text-xs" data-testid="table-coral-samples">
                      <thead>
                        <tr className="bg-[#0a293366] text-[#d4e9f380] text-left uppercase tracking-widest text-[9px]">
                          <th className="px-2 py-2">Trait</th>
                          <th className="px-2 py-2">Value</th>
                          <th className="px-2 py-2">Unit</th>
                          <th className="px-2 py-2">Location</th>
                          <th className="px-2 py-2">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleMeasurements.slice(0, 300).map(m => (
                          <tr key={m.id} className="border-t border-[#ffffff05] hover:bg-[#ffffff04] align-top" data-testid={`row-coral-sample-${m.id}`}>
                            <td className="px-2 py-1.5 text-[#d4e9f3]">
                              {m.traitName || "-"}
                              {m.traitCategory && <div className="text-[9px] text-[#d4e9f366]">{m.traitCategory}</div>}
                            </td>
                            <td className="px-2 py-1.5 text-[#83eef0] font-mono">{m.value || "-"}</td>
                            <td className="px-2 py-1.5 text-[#d4e9f380]">{m.standardUnit || "-"}</td>
                            <td className="px-2 py-1.5 text-[#d4e9f380]">
                              {m.locationName || "-"}
                              {m.latitude != null && m.longitude != null && (
                                <span className="ml-1 text-[9px] text-[#83eef088]">
                                  ({m.latitude.toFixed(2)}, {m.longitude.toFixed(2)})
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-[#d4e9f366]">{m.methodologyName || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {visibleMeasurements.length > 300 && (
                      <div className="px-2 py-2 text-[10px] text-[#d4e9f366] text-center">
                        Showing 300 of {visibleMeasurements.length} measurements.
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
              {(traits?.length ?? 0)} traits in the database, grouped by class.
            </p>
            <div className="space-y-3">
              {Object.entries(traitsByClass)
                .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
                .map(([cls, list]) => (
                  <details key={cls} className="text-xs">
                    <summary className="cursor-pointer text-[#d4e9f3] font-semibold py-1 hover:text-[#83eef0]" data-testid={`summary-trait-class-${cls}`}>
                      Class {cls} <span className="text-[#d4e9f366] font-normal">({list.length})</span>
                    </summary>
                    <ul className="pl-2 mt-1 space-y-0.5">
                      {list.map(t => (
                        <li key={t.id}>
                          <button
                            onClick={() => { if (measTraitNames.includes(t.name)) setTraitFilter(t.name); }}
                            data-testid={`button-trait-${t.id}`}
                            title={t.description || t.name}
                            className="text-left text-[#d4e9f3aa] hover:text-[#83eef0] no-underline text-[11px]"
                          >
                            {t.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
            </div>
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
