// Seed the cotw_species table from the public Corals of the World
// fact-sheets index page. A single GET to /species_factsheets/ returns
// every species (~831) embedded as <option value="cotw_id">Binomial</option>
// grouped under <optgroup label="Genus">. We parse, normalise into rows
// and batch-insert with onConflictDoNothing so it is idempotent + safe to
// run on every boot.
//
// Source: https://www.coralsoftheworld.org/species_factsheets/
// Authors: J.E.N. Veron, M. Stafford-Smith, E. Turak, L.M. DeVantier (2024).
import { db } from "./db";
import { cotwSpecies, type InsertCotwSpecies } from "@shared/schema";
import { sql } from "drizzle-orm";

const INDEX_URL = "https://www.coralsoftheworld.org/species_factsheets/";
const UA = "PepoThePolyp-Bot/1.0 (+https://meso-reef-dao.replit.app; marine conservation research)";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function parseCotwIndex(html: string): InsertCotwSpecies[] {
  const rows: InsertCotwSpecies[] = [];
  const seen = new Set<number>();
  const optgroupRe = /<optgroup\s+label="([^"]+)">([\s\S]*?)<\/optgroup>/g;
  const optionRe = /<option\s+value="(\d+)">([^<]+)<\/option>/g;
  let g: RegExpExecArray | null;
  while ((g = optgroupRe.exec(html)) !== null) {
    const genus = g[1].trim();
    const body = g[2];
    let o: RegExpExecArray | null;
    optionRe.lastIndex = 0;
    while ((o = optionRe.exec(body)) !== null) {
      const cotwId = Number(o[1]);
      const name = o[2].trim();
      if (seen.has(cotwId)) continue;
      const parts = name.split(/\s+/);
      if (parts.length < 2) continue;
      const epithet = parts.slice(1).join(" ");
      if (epithet === "sp." || epithet === "spp.") continue;
      const slug = slugify(name);
      if (!slug) continue;
      seen.add(cotwId);
      rows.push({
        cotwId,
        scientificName: name,
        genus,
        speciesEpithet: epithet,
        slug,
        factsheetUrl: `https://www.coralsoftheworld.org/species_factsheet/${slug}/`,
      });
    }
  }
  return rows;
}

export async function seedCotwSpecies(opts: { force?: boolean } = {}): Promise<{ fetched: number; inserted: number; total: number }> {
  const [{ c: have }] = await db.execute(sql`SELECT COUNT(*)::int AS c FROM cotw_species`).then(r => r.rows as { c: number }[]);
  if (!opts.force && have >= 800) {
    return { fetched: 0, inserted: 0, total: have };
  }

  const res = await fetch(INDEX_URL, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`CoTW index fetch failed: HTTP ${res.status}`);
  const html = await res.text();
  const rows = parseCotwIndex(html);
  if (rows.length === 0) throw new Error("CoTW index parsed zero species");

  const CHUNK = 200;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const ret = await db
      .insert(cotwSpecies)
      .values(slice)
      .onConflictDoNothing({ target: cotwSpecies.cotwId })
      .returning({ id: cotwSpecies.id });
    inserted += ret.length;
  }

  const [{ c: total }] = await db.execute(sql`SELECT COUNT(*)::int AS c FROM cotw_species`).then(r => r.rows as { c: number }[]);
  return { fetched: rows.length, inserted, total };
}
