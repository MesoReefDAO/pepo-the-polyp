/**
 * Seed the Coral Trait Database (jmadinlab/coraltraits2) into Postgres.
 *
 * Streams CSV files straight from GitHub raw so we don't commit ~35 MB of
 * data into this repo. Safe to re-run: every table is TRUNCATEd first.
 *
 * Run with:  npx tsx scripts/seed-coraltraits.ts
 */
import { parse } from "csv-parse";
import { Readable } from "node:stream";
import { sql } from "drizzle-orm";
import { db, pool } from "../server/db";
import {
  ctSpecies, ctLocations, ctResources, ctStandards, ctMethodologies,
  ctTraits, ctValueTypes, ctPrecisionTypes, ctTraitEditors, ctContributors,
  ctMeasurements,
} from "../shared/schema";

const RAW = "https://raw.githubusercontent.com/jmadinlab/coraltraits2/main/db/database_v_1_july";

function toInt(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}
function toFloat(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}
function s(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

async function fetchCsv(name: string): Promise<any[]> {
  const url = `${RAW}/${name}`;
  console.log(`  fetching ${name}…`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const text = await res.text();
  return new Promise((resolve, reject) => {
    parse(text, { columns: true, skip_empty_lines: true, relax_column_count: true, trim: true, bom: true }, (err, records) => {
      if (err) return reject(err);
      resolve(records as any[]);
    });
  });
}

async function streamCsv(name: string, onRow: (row: any) => Promise<void> | void): Promise<number> {
  const url = `${RAW}/${name}`;
  console.log(`  streaming ${name}…`);
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

async function batchInsert<T>(table: any, rows: T[], batchSize = 1000) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize);
    if (slice.length) await db.insert(table).values(slice as any).onConflictDoNothing();
  }
}

async function main() {
  console.log("Coral Traits seed — start");

  console.log("Truncating ct_* tables…");
  await db.execute(sql`TRUNCATE TABLE
    ct_measurements,
    ct_species, ct_locations, ct_resources, ct_standards, ct_methodologies,
    ct_traits, ct_value_types, ct_precision_types, ct_trait_editors, ct_contributors
    RESTART IDENTITY CASCADE`);

  // ─── Lookups ──────────────────────────────────────────────────────────────
  console.log("Lookups:");

  const speciesRows = await fetchCsv("species_id.csv");
  await batchInsert(ctSpecies, speciesRows.map(r => ({
    id: s(r.specie_id),
    masterSpecies: s(r.master_species),
    familyMolecules: s(r.family_molecules),
    synonymSpecies: s(r.synonym_species),
    aphiaId: toInt(r.aphia_ID),
  })).filter(r => r.id));
  console.log(`  ct_species: ${speciesRows.length}`);

  const locationRows = await fetchCsv("location_id.csv");
  await batchInsert(ctLocations, locationRows.map(r => ({
    id: s(r.location_id),
    name: s(r.location_name),
    latitude: toFloat(r.latitude),
    longitude: toFloat(r.longitude),
  })).filter(r => r.id));
  console.log(`  ct_locations: ${locationRows.length}`);

  const resourceRows = await fetchCsv("resource_id.csv");
  await batchInsert(ctResources, resourceRows.map(r => ({
    id: s(r.resource_id),
    primarySecondary: s(r.primary_secondary),
    author: s(r.author),
    year: toInt(r.year),
    title: s(r.title),
    resourceType: s(r.resource_type),
    doiIsbn: s(r.doi_ISBN),
    journal: s(r.resource_journal),
    volumePages: s(r.resource_volume_pages),
  })).filter(r => r.id));
  console.log(`  ct_resources: ${resourceRows.length}`);

  // Lookup IDs in the source are bare integers (e.g. 10, 15, 8) but
  // ct_measurements references them with sigils (e.g. "st10", "mt15",
  // "t8"). We re-prefix on insert so joinability is restored without
  // touching the (much larger) measurements table on each read.
  const standardRows = await fetchCsv("standard_id.csv");
  const stdMapped = standardRows.map(r => {
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
  await batchInsert(ctStandards, stdMapped);
  console.log(`  ct_standards: ${stdMapped.length} (of ${standardRows.length} source rows)`);

  const methRows = await fetchCsv("methodology_id.csv");
  const methMapped = methRows.map(r => {
    const raw = String(r.method_id ?? "").trim();
    if (!raw) return null;
    return {
      id: /^\d+$/.test(raw) ? `mt${raw}` : raw,
      name: s(r.method_name),
      description: s(r.method_description),
      userId: toInt(r.user_id),
    };
  }).filter(Boolean) as any[];
  await batchInsert(ctMethodologies, methMapped);
  console.log(`  ct_methodologies: ${methMapped.length} (of ${methRows.length} source rows)`);

  const traitRows = await fetchCsv("trait_id.csv");
  const traitMapped = traitRows.map(r => {
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
  await batchInsert(ctTraits, traitMapped);
  console.log(`  ct_traits: ${traitMapped.length} (of ${traitRows.length} source rows)`);

  const vtRows = await fetchCsv("value_type_id.csv");
  await batchInsert(ctValueTypes, vtRows.map(r => ({
    id: toInt(r.value_type_id) as number,
    name: s(r.value_type_name),
  })).filter(r => r.id !== null));
  console.log(`  ct_value_types: ${vtRows.length}`);

  const ptRows = await fetchCsv("precision_type_id.csv");
  await batchInsert(ctPrecisionTypes, ptRows.map(r => ({
    id: toInt(r.precision_type_id) as number,
    name: s(r.precision_type),
  })).filter(r => r.id !== null));
  console.log(`  ct_precision_types: ${ptRows.length}`);

  const teRows = await fetchCsv("trait_editor_id.csv");
  await batchInsert(ctTraitEditors, teRows.map(r => ({
    id: toInt(r.trait_editor_id) as number,
    name: s(r.editor_name),
  })).filter(r => r.id !== null));
  console.log(`  ct_trait_editors: ${teRows.length}`);

  const uRows = await fetchCsv("user_id.csv");
  await batchInsert(ctContributors, uRows.map(r => ({
    id: toInt(r.user_id) as number,
    name: s(r.user_name),
  })).filter(r => r.id !== null));
  console.log(`  ct_contributors: ${uRows.length}`);

  // ─── Measurements (148k rows, streamed) ───────────────────────────────────
  console.log("Measurements (streaming):");
  let buf: any[] = [];
  const flush = async () => {
    if (!buf.length) return;
    await batchInsert(ctMeasurements, buf, buf.length);
    buf = [];
  };
  let seen = 0;
  const total = await streamCsv("database_v_1_july.csv", async (r) => {
    seen++;
    // The measurements CSV uses mixed ID encodings for the same column
    // (e.g. trait_id is "t2" on most rows but a bare integer "60" on
    // others). Lookup tables are sigil-prefixed (t/st/mt) so we
    // normalise bare integers to the same shape before insert.
    const sig = (v: unknown, prefix: string): string | null => {
      const t = s(v).trim();
      if (!t) return null;
      return /^\d+$/.test(t) ? `${prefix}${t}` : t;
    };
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
    if (buf.length >= 2000) {
      await flush();
      if (seen % 20000 === 0) process.stdout.write(`.${seen} `);
    }
  });
  await flush();
  console.log(`\n  ct_measurements: ${total}`);

  console.log("Done.");
  await pool.end();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  await pool.end();
  process.exit(1);
});
