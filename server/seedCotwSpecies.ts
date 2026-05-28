// Seed the cotw_species table from the public Corals of the World
// fact-sheets index page. A single GET to /species_factsheets/ returns
// every species (~831) embedded inside the genus-grouped <select> filter
// on that page. We parse, dedupe across every unique constraint and
// batch-insert with onConflictDoNothing so it is idempotent + race-safe.
//
// Source: https://www.coralsoftheworld.org/species_factsheets/
// Authors: J.E.N. Veron, M. Stafford-Smith, E. Turak, L.M. DeVantier (2024).
import { db } from "./db";
import { cotwSpecies, type InsertCotwSpecies } from "@shared/schema";
import { sql } from "drizzle-orm";

const INDEX_URL = "https://www.coralsoftheworld.org/species_factsheets/";
const UA = "PepoThePolyp-Bot/1.0 (+https://meso-reef-dao.replit.app; marine conservation research)";

// Sanity bounds. CoTW has ~831 published fact sheets; flag if we ever
// drift outside this range so a silent upstream HTML change is visible.
export const EXPECTED_MIN = 700;
export const EXPECTED_MAX = 1000;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

// Pull out attribute value by name, tolerant of attribute order and
// single/double quoting. Returns "" when missing.
function attr(tag: string, name: string): string {
  const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i");
  const m = tag.match(re);
  return m ? (m[2] ?? m[3] ?? "") : "";
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// Robust parser that tolerates attribute reordering and whitespace
// variation. Walks every <optgroup ...>...</optgroup> block, then walks
// every <option ...>label</option> inside it.
export function parseCotwIndex(html: string): InsertCotwSpecies[] {
  const out: InsertCotwSpecies[] = [];
  const seenId = new Set<number>();
  const seenName = new Set<string>();
  const seenSlug = new Set<string>();

  const ogRe = /<optgroup\b([^>]*)>([\s\S]*?)<\/optgroup>/gi;
  const opRe = /<option\b([^>]*)>([\s\S]*?)<\/option>/gi;
  let g: RegExpExecArray | null;
  while ((g = ogRe.exec(html)) !== null) {
    const genus = decodeHtmlEntities(attr(g[1], "label")).trim();
    if (!genus) continue;
    const body = g[2];
    opRe.lastIndex = 0;
    let o: RegExpExecArray | null;
    while ((o = opRe.exec(body)) !== null) {
      const rawId = attr(o[1], "value").trim();
      if (!/^\d+$/.test(rawId)) continue;
      const cotwId = Number(rawId);
      const name = decodeHtmlEntities(o[2]).replace(/\s+/g, " ").trim();
      const parts = name.split(/\s+/);
      if (parts.length < 2) continue;
      const epithet = parts.slice(1).join(" ");
      if (epithet === "sp." || epithet === "spp." || epithet === "cf." || epithet === "aff.") continue;
      const slug = slugify(name);
      if (!slug) continue;
      if (seenId.has(cotwId) || seenName.has(name) || seenSlug.has(slug)) continue;
      seenId.add(cotwId);
      seenName.add(name);
      seenSlug.add(slug);
      out.push({
        cotwId,
        scientificName: name,
        genus,
        speciesEpithet: epithet,
        slug,
        factsheetUrl: `https://www.coralsoftheworld.org/species_factsheet/${slug}/`,
      });
    }
  }
  return out;
}

export interface SeedResult {
  fetched: number;
  inserted: number;
  total: number;
  skipped: boolean;
  warning?: string;
}

async function countRows(): Promise<number> {
  const r = await db.execute(sql`SELECT COUNT(*)::int AS c FROM cotw_species`);
  return Number(((r.rows as any[])[0]?.c) ?? 0);
}

export async function seedCotwSpecies(opts: { force?: boolean } = {}): Promise<SeedResult> {
  const have = await countRows();
  if (!opts.force && have >= EXPECTED_MIN) {
    return { fetched: 0, inserted: 0, total: have, skipped: true };
  }

  const res = await fetch(INDEX_URL, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`CoTW index fetch failed: HTTP ${res.status}`);
  const html = await res.text();
  const rows = parseCotwIndex(html);
  if (rows.length === 0) throw new Error("CoTW index parsed zero species - upstream HTML may have changed");

  const CHUNK = 200;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    // Try the common case first (conflict on cotw_id). If a row happens
    // to also collide on slug or scientific_name with a *different*
    // cotw_id, retry that one row with the generic ON CONFLICT DO NOTHING
    // so the whole batch still lands.
    try {
      const ret = await db
        .insert(cotwSpecies)
        .values(slice)
        .onConflictDoNothing({ target: cotwSpecies.cotwId })
        .returning({ id: cotwSpecies.id });
      inserted += ret.length;
    } catch {
      for (const row of slice) {
        try {
          const ret = await db
            .insert(cotwSpecies)
            .values(row)
            .onConflictDoNothing()
            .returning({ id: cotwSpecies.id });
          inserted += ret.length;
        } catch (rowErr) {
          console.warn("[cotw-seed] skipped row", row.scientificName, rowErr);
        }
      }
    }
  }

  const total = await countRows();
  let warning: string | undefined;
  if (total < EXPECTED_MIN) warning = `cotw_species count ${total} below expected min ${EXPECTED_MIN}`;
  else if (total > EXPECTED_MAX) warning = `cotw_species count ${total} above expected max ${EXPECTED_MAX}`;

  return { fetched: rows.length, inserted, total, skipped: false, warning };
}
