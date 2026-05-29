import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ExplorerNavigationSidebarSection } from "@/pages/sections/ExplorerNavigationSidebarSection";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import type { CotwSpecies } from "@shared/schema";

const COTW_BASE = "https://www.coralsoftheworld.org";
const COTW_FACTSHEETS = `${COTW_BASE}/species_factsheets/`;

interface CotwStats { species: number; genera: string[] }

export function CoralFactSheetsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [genus, setGenus] = useState<string>("");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const { data: stats } = useQuery<CotwStats>({
    queryKey: ["/api/cotw/stats"],
    staleTime: 60 * 60 * 1000,
  });

  const speciesKey = useMemo(() => ["/api/cotw/species", { search, genus, limit: 1000 }], [search, genus]);
  const { data: species, isLoading } = useQuery<CotwSpecies[]>({
    queryKey: speciesKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (genus) params.set("genus", genus);
      params.set("limit", "1000");
      const res = await fetch(`/api/cotw/species?${params.toString()}`);
      if (!res.ok) throw new Error("CoTW species fetch failed");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const cards = useMemo(() => {
    return (species ?? []).map(s => ({
      sp: s,
      slug: s.slug,
      factsheetUrl: s.factsheetUrl || `${COTW_BASE}/species_factsheet/${s.slug}/`,
    }));
  }, [species]);

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
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#d4e9f3]" data-testid="text-factsheets-title">{t("coralFactSheets.title")}</h1>
              </div>
              <p className="text-xs text-[#d4e9f399] max-w-2xl">
                {t("coralFactSheets.introPre")} <a href={COTW_FACTSHEETS} target="_blank" rel="noopener noreferrer" className="text-[#83eef0] hover:underline" data-testid="link-cotw-factsheets-source">{t("coralFactSheets.cotwLink")}</a> {t("coralFactSheets.introPost")}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Stat label={t("coralFactSheets.statSpecies")} value={stats?.species ?? 0} color="#83eef0" testId="stat-fs-species" />
              <Stat label={t("coralFactSheets.statGenera")} value={stats?.genera.length ?? 0} color="#a6ce39" testId="stat-fs-genera" />
              <Stat label={t("coralFactSheets.statSource")} value="CoTW v0.01" color="#26de81" testId="stat-fs-source" />
            </div>
          </div>
        </header>

        <div className="px-4 md:px-8 py-3 border-b border-[#ffffff0d] flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("coralFactSheets.searchPlaceholder")}
            data-testid="input-factsheet-search"
            className="flex-1 min-w-[200px] bg-[#0a293344] border border-[#ffffff14] rounded-md px-3 py-1.5 text-sm text-[#d4e9f3] placeholder:text-[#d4e9f366] focus:outline-none focus:border-[#83eef066]"
          />
          <select
            value={genus}
            onChange={e => setGenus(e.target.value)}
            data-testid="select-factsheet-genus"
            className="bg-[#0a293344] border border-[#ffffff14] rounded-md px-3 py-1.5 text-sm text-[#d4e9f3] focus:outline-none focus:border-[#83eef066] max-w-[180px]"
          >
            <option value="">{t("coralFactSheets.allGenera")}</option>
            {(stats?.genera ?? []).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <span className="text-[10px] text-[#d4e9f366] ml-auto">
            {isLoading ? t("coralFactSheets.loading") : t("coralFactSheets.speciesCount", { count: cards.length })}
          </span>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_640px] overflow-hidden">
          {/* Cards grid */}
          <section className="overflow-y-auto p-4 md:p-6">
            {cards.length === 0 && !isLoading && (
              <div className="text-sm text-[#d4e9f380] py-12 text-center">
                {t("coralFactSheets.noMatch")}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {cards.map(({ sp, slug, factsheetUrl }) => {
                const isActive = activeSlug === slug;
                return (
                  <article
                    key={sp.id}
                    data-testid={`card-factsheet-${sp.cotwId}`}
                    className={`rounded-lg border p-3 transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#83eef00f] border-[#83eef066]"
                        : "bg-[#0a293322] border-[#ffffff0d] hover:bg-[#0a293344] hover:border-[#83eef033]"
                    }`}
                    onClick={() => setActiveSlug(slug)}
                  >
                    <h3 className="italic font-semibold text-sm text-[#d4e9f3] leading-tight" data-testid={`text-factsheet-name-${sp.cotwId}`}>
                      {sp.scientificName}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-[#d4e9f377]">
                      {sp.genus && <span className="px-1.5 py-0.5 rounded bg-[#a6ce3910] border border-[#a6ce3933] text-[#a6ce39cc]">{sp.genus}</span>}
                      <span className="text-[#d4e9f355]">CoTW #{sp.cotwId}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <a
                        href={factsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        data-testid={`link-factsheet-external-${sp.cotwId}`}
                        className="text-[#83eef0] hover:underline no-underline"
                      >
                        {t("coralFactSheets.openFactSheet")} ↗
                      </a>
                      <button
                        onClick={e => { e.stopPropagation(); setActiveSlug(slug); }}
                        data-testid={`button-factsheet-preview-${sp.cotwId}`}
                        className="px-2 py-0.5 rounded border border-[#83eef033] text-[#83eef0] hover:bg-[#83eef00f]"
                      >
                        {t("coralFactSheets.details")}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Detail pane */}
          <aside className="hidden lg:flex flex-col border-l border-[#ffffff08] overflow-y-auto">
            {!activeSlug ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#d4e9f366] mb-2">{t("coralFactSheets.factSheet")}</div>
                  <p className="text-sm text-[#d4e9f399] max-w-xs">{t("coralFactSheets.selectPrompt")}</p>
                </div>
              </div>
            ) : (() => {
              const active = cards.find(c => c.slug === activeSlug);
              if (!active) return null;
              const sp = active.sp;
              return (
                <div className="p-5 md:p-6 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="italic font-bold text-xl text-[#d4e9f3] leading-tight" data-testid="text-preview-name">
                        {sp.scientificName}
                      </h2>
                      <div className="text-[11px] text-[#d4e9f377] mt-1">{t("coralFactSheets.speciesNum", { id: sp.cotwId })}</div>
                    </div>
                    <button
                      onClick={() => setActiveSlug(null)}
                      data-testid="button-preview-close"
                      className="text-[10px] px-2 py-0.5 rounded border border-[#ffffff14] text-[#d4e9f399] hover:bg-[#ffffff08] flex-shrink-0"
                    >
                      {t("coralFactSheets.close")}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    {sp.genus && <span className="px-2 py-0.5 rounded-full border border-[#a6ce3933] bg-[#a6ce390f] text-[#a6ce39]">{t("coralFactSheets.genus", { name: sp.genus })}</span>}
                    {sp.speciesEpithet && <span className="px-2 py-0.5 rounded-full border border-[#83eef033] bg-[#83eef00f] text-[#83eef0]">{t("coralFactSheets.species", { name: sp.speciesEpithet })}</span>}
                    <span className="px-2 py-0.5 rounded-full border border-[#ffffff14] bg-[#ffffff05] text-[#d4e9f399]">{t("coralFactSheets.familyUnderReview")}</span>
                  </div>

                  <a
                    href={active.factsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-preview-open-external"
                    className="block text-center px-4 py-3 rounded-lg bg-gradient-to-r from-[#83eef0] to-[#26de81] text-[#00080c] font-bold text-sm hover:opacity-90 no-underline"
                  >
                    {t("coralFactSheets.openFull")} ↗
                  </a>

                  <div className="rounded-lg border border-[#ffffff0d] bg-[#0a293322] p-3 text-[11px] text-[#d4e9f399] leading-relaxed">
                    <div className="text-[10px] uppercase tracking-widest text-[#d4e9f366] mb-1">{t("coralFactSheets.whyNewTab")}</div>
                    {t("coralFactSheets.whyNewTabBody")}
                  </div>

                  <div className="rounded-lg border border-[#ffffff0d] bg-[#0a293322] p-3 text-[11px] text-[#d4e9f399]">
                    <div className="text-[10px] uppercase tracking-widest text-[#d4e9f366] mb-1">{t("coralFactSheets.relatedViews")}</div>
                    <ul className="space-y-1">
                      <li>
                        <a
                          href={`https://coraltraits.org/species/${encodeURIComponent(sp.scientificName)}`}
                          target="_blank" rel="noopener noreferrer"
                          data-testid="link-preview-coraltraits"
                          className="text-[#f9ca24] hover:underline no-underline"
                        >
                          {t("coralFactSheets.traitObs")} ↗
                        </a>
                      </li>
                      <li>
                        <a
                          href={`https://www.gbif.org/species/search?q=${encodeURIComponent(sp.scientificName)}`}
                          target="_blank" rel="noopener noreferrer"
                          data-testid="link-preview-gbif"
                          className="text-[#a6ce39] hover:underline no-underline"
                        >
                          {t("coralFactSheets.gbifOcc")} ↗
                        </a>
                      </li>
                      <li>
                        <a
                          href={`https://en.wikipedia.org/wiki/${encodeURIComponent(sp.scientificName.replace(/\s+/g, "_"))}`}
                          target="_blank" rel="noopener noreferrer"
                          data-testid="link-preview-wikipedia"
                          className="text-[#83eef0] hover:underline no-underline"
                        >
                          {t("coralFactSheets.wikipedia")} ↗
                        </a>
                      </li>
                    </ul>
                  </div>

                  <div className="text-[10px] text-[#d4e9f355] italic">
                    {t("coralFactSheets.slugNote")}
                  </div>
                </div>
              );
            })()}
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
