/**
 * Idempotent startup seed for the Coral Trait Database (coraltraits.org +
 * jmadinlab/coraltraits2).
 *
 * Mirrors the standalone scripts/seed-coraltraits.ts but is safe to call on
 * every server boot: it skips when the data is already present and runs the
 * destructive TRUNCATE + load inside a single transaction guarded by a
 * transaction-scoped Postgres advisory lock. That guarantees:
 *   - the lock, all seed writes, and the lock release all run on the SAME
 *     session (pooled connections would otherwise break advisory-lock
 *     mutual exclusion), and
 *   - concurrent autoscale instances cannot race / truncate each other - the
 *     loser simply skips, and readers never observe a partially-loaded table
 *     because the load is atomic.
 *
 * Lookup CSVs (species, locations, standards, traits) ship in the repo under
 * scripts/data/coraltraits/. Measurements (~148k rows) and the remaining
 * lookups are streamed from the coraltraits2 GitHub mirror.
 */
import { parse } from "csv-parse";
import { Readable } from "node:stream";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { db } from "./db";
import {
  ctSpecies, ctLocations, ctResources, ctStandards, ctMethodologies,
  ctTraits, ctValueTypes, ctPrecisionTypes, ctTraitEditors, ctContributors,
  ctMeasurements,
} from "@shared/schema";

const RAW = "https://raw.githubusercontent.com/jmadinlab/coraltraits2/main/db/database_v_1_july";

// Unique 32-bit key for the pg advisory lock (arbitrary, app-specific).
const SEED_LOCK_KEY = 778899;

type Db = typeof db;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Executor = Db | Tx;

export interface SeedCoralTraitsResult {
  skipped: boolean;
  reason?: string;
  species: number;
  measurements: number;
}

function toInt(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  if (!t) return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}
function toFloat(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  if (!t) return null;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}
function s(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

// Resolve the committed CSV directory across dev (tsx, cwd = repo root) and
// production (bundled dist/index.mjs, cwd = deploy root). Both keep the repo
// tree intact, so scripts/data/coraltraits is reachable from cwd.
function dataDir(): string {
  const candidates = [
    join(process.cwd(), "scripts", "data", "coraltraits"),
    join(process.cwd(), "..", "scripts", "data", "coraltraits"),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "species.csv"))) return c;
  }
  return candidates[0];
}

function parseCsvText(text: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    parse(
      text,
      { columns: true, skip_empty_lines: true, relax_column_count: true, trim: true, bom: true },
      (err, records) => (err ? reject(err) : resolve(records as any[])),
    );
  });
}

function readLocalCsv(dir: string, name: string): Promise<any[]> {
  return parseCsvText(readFileSync(join(dir, name), "utf8"));
}

async function fetchCsv(name: string): Promise<any[]> {
  const url = `${RAW}/${name}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return parseCsvText(await res.text());
}

async function streamCsv(name: string, onRow: (row: any) => Promise<void> | void): Promise<number> {
  const url = `${RAW}/${name}`;
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${url} -> HTTP ${res.status}`);
  const parser = parse({ columns: true, skip_empty_lines: true, relax_column_count: true, trim: true, bom: true });
  const stream = Readable.fromWeb(res.body as any).pipe(parser);
  let n = 0;
  for await (const row of stream) {
    await onRow(row);
    n++;
  }
  return n;
}

async function batchInsert<T>(tx: Executor, table: any, rows: T[], batchSize = 1000) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize);
    if (slice.length) await tx.insert(table).values(slice as any).onConflictDoNothing();
  }
}

async function counts(tx: Executor): Promise<{ species: number; measurements: number }> {
  const r = await tx.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM ct_species)       AS species,
      (SELECT COUNT(*)::int FROM ct_measurements)  AS measurements
  `);
  const row = (r.rows?.[0] ?? {}) as { species?: number; measurements?: number };
  return { species: Number(row.species ?? 0), measurements: Number(row.measurements ?? 0) };
}

async function runSeed(tx: Executor): Promise<void> {
  const dir = dataDir();

  await tx.execute(sql`TRUNCATE TABLE
    ct_measurements,
    ct_species, ct_locations, ct_resources, ct_standards, ct_methodologies,
    ct_traits, ct_value_types, ct_precision_types, ct_trait_editors, ct_contributors
    RESTART IDENTITY CASCADE`);

  // Species + locations: full coraltraits.org export (local CSVs).
  const speciesRows = await readLocalCsv(dir, "species.csv");
  await batchInsert(tx, ctSpecies, speciesRows.map((r) => ({
    id: s(r.species_id),
    masterSpecies: s(r.specie_name),
    familyMolecules: s(r.family_molecules),
    familyMorphology: s(r.family_morphology),
    speciesClass: s(r.class),
    synonymSpecies: s(r.synonym_species),
    description: s(r.specie_description),
    aphiaId: null,
  })).filter((r) => r.id && r.masterSpecies));

  const locationRows = await readLocalCsv(dir, "locations.csv");
  await batchInsert(tx, ctLocations, locationRows.map((r) => ({
    id: s(r.id),
    name: s(r.location_name),
    latitude: toFloat(r.latitude),
    longitude: toFloat(r.longitude),
    description: s(r.location_description),
  })).filter((r) => r.id));

  const resourceRows = await fetchCsv("resource_id.csv");
  await batchInsert(tx, ctResources, resourceRows.map((r) => ({
    id: s(r.resource_id),
    primarySecondary: s(r.primary_secondary),
    author: s(r.author),
    year: toInt(r.year),
    title: s(r.title),
    resourceType: s(r.resource_type),
    doiIsbn: s(r.doi_ISBN),
    journal: s(r.resource_journal),
    volumePages: s(r.resource_volume_pages),
  })).filter((r) => r.id));

  const standardRows = await fetchCsv("standard_id.csv");
  const stdMapped = standardRows.map((r) => {
    const raw = String(r.standard_id ?? "").trim();
    if (!raw) return null;
    return {
      id: /^\d+$/.test(raw) ? `st${raw}` : raw,
      name: s(r.standard_name),
      units: s(r.units),
      standardClass: s(r.standard_class),
      description: s(r.standard_description),
    };
  }).filter(Boolean) as any[];
  await batchInsert(tx, ctStandards, stdMapped);

  const methRows = await fetchCsv("methodology_id.csv");
  const methMapped = methRows.map((r) => {
    const raw = String(r.method_id ?? "").trim();
    if (!raw) return null;
    return {
      id: /^\d+$/.test(raw) ? `mt${raw}` : raw,
      name: s(r.method_name),
      description: s(r.method_description),
      userId: toInt(r.user_id),
    };
  }).filter(Boolean) as any[];
  await batchInsert(tx, ctMethodologies, methMapped);

  const traitRows = await fetchCsv("trait_id.csv");
  const traitMapped = traitRows.map((r) => {
    const raw = String(r.id ?? "").trim();
    if (!raw) return null;
    const stdRaw = String(r.standard_id ?? "").trim();
    return {
      id: /^\d+$/.test(raw) ? `t${raw}` : raw,
      name: s(r.trait_name),
      standardId: stdRaw ? (/^\d+$/.test(stdRaw) ? `st${stdRaw}` : stdRaw) : null,
      traitClassId: s(r.traitclass_id),
      description: s(r.trait_description),
      userId: toInt(r.user_id),
      editor: s(r.Editor),
      traitEditorId: toInt(r.trait_editor_id),
    };
  }).filter(Boolean) as any[];
  await batchInsert(tx, ctTraits, traitMapped);

  const vtRows = await fetchCsv("value_type_id.csv");
  await batchInsert(tx, ctValueTypes, vtRows.map((r) => ({
    id: toInt(r.value_type_id) as number,
    name: s(r.value_type_name),
  })).filter((r) => r.id !== null));

  const ptRows = await fetchCsv("precision_type_id.csv");
  await batchInsert(tx, ctPrecisionTypes, ptRows.map((r) => ({
    id: toInt(r.precision_type_id) as number,
    name: s(r.precision_type),
  })).filter((r) => r.id !== null));

  const teRows = await fetchCsv("trait_editor_id.csv");
  await batchInsert(tx, ctTraitEditors, teRows.map((r) => ({
    id: toInt(r.trait_editor_id) as number,
    name: s(r.editor_name),
  })).filter((r) => r.id !== null));

  const uRows = await fetchCsv("user_id.csv");
  await batchInsert(tx, ctContributors, uRows.map((r) => ({
    id: toInt(r.user_id) as number,
    name: s(r.user_name),
  })).filter((r) => r.id !== null));

  // Measurements (~148k rows, streamed and inserted in batches).
  let buf: any[] = [];
  const flush = async () => {
    if (!buf.length) return;
    await batchInsert(tx, ctMeasurements, buf, buf.length);
    buf = [];
  };
  const sig = (v: unknown, prefix: string): string | null => {
    const t = s(v).trim();
    if (!t) return null;
    return /^\d+$/.test(t) ? `${prefix}${t}` : t;
  };
  await streamCsv("database_v_1_july.csv", async (r) => {
    buf.push({
      observationId: s(r.observation_id) || null,
      measurementId: toInt(r.measurement_id),
      access: s(r.access),
      userId: toInt(r.user_id),
      speciesId: s(r.specie_id) || null,
      speciesName: s(r.specie_name),
      familyMolecules: s(r.Family_molecules),
      locationId: s(r.location_id) || null,
      locationName: s(r.location_name),
      latitude: toFloat(r.latitude),
      longitude: toFloat(r.longitude),
      resourceId: s(r.resource_id) || null,
      resourceSecondaryId: s(r.resource_secondary_id) || null,
      traitId: sig(r.trait_id, "t"),
      traitName: s(r.trait_name),
      traitCategory: s(r.trait_category),
      standardId: sig(r.standard_id, "st"),
      standardUnit: s(r.standard_unit),
      methodologyId: sig(r.methodology_id, "mt"),
      methodologyName: s(r.methodology_name),
      value: s(r.value),
      valueTypeId: toInt(r.value_type_id),
      valueType: s(r.value_type),
      precision: s(r.precision),
      precisionTypeId: toInt(r.precision_type_id),
      precisionType: s(r.precision_type),
      precisionUpper: s(r.precision_upper),
      replicates: s(r.replicates),
      notes: s(r.notes),
      originalTaxa: s(r.original_taxa_used_to_code_trait_value),
      originalTaxaStatus: s(r.Status_of_original_taxa_name),
      originalAphiaId: toInt(r["Original Aphia ID in publication"]),
    });
    if (buf.length >= 2000) await flush();
  });
  await flush();
}

/**
 * Seed the Coral Trait Database if it is not already populated. Idempotent and
 * concurrency-safe. Returns whether seeding ran and the resulting row counts.
 */
export async function seedCoralTraits(): Promise<SeedCoralTraitsResult> {
  // Fast path: skip without opening a transaction when clearly populated.
  const pre = await counts(db);
  if (pre.species > 0 && pre.measurements > 0) {
    return { skipped: true, reason: "already populated", ...pre };
  }

  // Run the destructive load inside one transaction so the advisory lock, all
  // writes, and the lock release share a single session. pg_try_advisory_xact_lock
  // is released automatically on COMMIT/ROLLBACK and never leaks across the pool.
  return await db.transaction(async (tx) => {
    const lockRes = await tx.execute(sql`SELECT pg_try_advisory_xact_lock(${SEED_LOCK_KEY}) AS got`);
    const got = (lockRes.rows?.[0] as { got?: boolean })?.got === true;
    if (!got) {
      const after = await counts(tx);
      return { skipped: true, reason: "another instance is seeding", ...after };
    }

    // Re-check under the lock in case another instance just committed a seed.
    const recheck = await counts(tx);
    if (recheck.species > 0 && recheck.measurements > 0) {
      return { skipped: true, reason: "already populated", ...recheck };
    }

    await runSeed(tx);
    const after = await counts(tx);
    return { skipped: false, ...after };
  });
}
