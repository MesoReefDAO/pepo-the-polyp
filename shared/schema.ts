import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, real, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Legacy users table (kept for compatibility) ──────────────────────────────
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── Profiles ─────────────────────────────────────────────────────────────────
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey(), // Privy user ID
  displayName: text("display_name").notNull().default("Explorer"),
  bio: text("bio").notNull().default(""),
  location: text("location").notNull().default(""),
  website: text("website").notNull().default(""),
  avatarUrl: text("avatar_url").notNull().default(""),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  points: integer("points").notNull().default(0),
  isPublic: boolean("is_public").notNull().default(true),
  orcidId: text("orcid_id").notNull().default(""),
  orcidName: text("orcid_name").notNull().default(""),
  // Social links
  twitterHandle: text("twitter_handle").notNull().default(""),
  linkedinUrl: text("linkedin_url").notNull().default(""),
  githubHandle: text("github_handle").notNull().default(""),
  instagramHandle: text("instagram_handle").notNull().default(""),
  // Wallet / Web3 identity
  walletAddress: text("wallet_address").notNull().default(""),
  // IPFS / Pinata decentralised storage — CID of the pinned profile JSON
  ipfsCid: text("ipfs_cid").default(""),
  // IPFS
  avatarCid: text("avatar_cid").default(""),
  ipfsImages: text("ipfs_images").array().notNull().default(sql`'{}'::text[]`),
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: integer("created_at").notNull().default(sql`extract(epoch from now())::int`),
  updatedAt: integer("updated_at").notNull().default(sql`extract(epoch from now())::int`),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

// ─── Contributions ────────────────────────────────────────────────────────────
export const contributions = pgTable("contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => profiles.id),
  type: text("type").notNull(), // 'question' | 'answer' | 'resource' | 'login'
  description: text("description").notNull().default(""),
  points: integer("points").notNull().default(10),
  createdAt: integer("created_at").notNull().default(sql`extract(epoch from now())::int`),
});

export const insertContributionSchema = createInsertSchema(contributions).omit({
  id: true,
  createdAt: true,
});
export type InsertContribution = z.infer<typeof insertContributionSchema>;
export type Contribution = typeof contributions.$inferSelect;

// ─── Reef Images (IPFS-pinned images with geo-coordinates) ────────────────────
export const reefImages = pgTable("reef_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cid: text("cid").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  title: text("title").notNull().default(""),
  author: text("author").notNull().default(""),
  description: text("description").notNull().default(""),
  // curation: 'pending' | 'approved' | 'rejected'
  status: text("status").notNull().default("pending"),
  curatedBy: varchar("curated_by"),   // profileId of the ORCID-verified curator
  curatedAt: integer("curated_at"),
  curatorNote: text("curator_note").notNull().default(""),
  profileId: varchar("profile_id"),
  createdAt: integer("created_at").notNull().default(sql`extract(epoch from now())::int`),
});

export const insertReefImageSchema = createInsertSchema(reefImages).omit({
  id: true,
  createdAt: true,
  status: true,
  curatedBy: true,
  curatedAt: true,
});
export type InsertReefImage = z.infer<typeof insertReefImageSchema>;
export type ReefImage = typeof reefImages.$inferSelect;

// ─── IPFS Blocks (DB-persisted content for production durability) ─────────────
export const ipfsBlocks = pgTable("ipfs_blocks", {
  cid: text("cid").primaryKey(),
  data: text("data").notNull(),           // base64-encoded raw bytes
  mimeType: text("mime_type").notNull().default("application/octet-stream"),
  uploadedAt: integer("uploaded_at").notNull().default(sql`extract(epoch from now())::int`),
});

export const insertIpfsBlockSchema = createInsertSchema(ipfsBlocks).omit({ uploadedAt: true });
export type InsertIpfsBlock = z.infer<typeof insertIpfsBlockSchema>;
export type IpfsBlock = typeof ipfsBlocks.$inferSelect;

// ─── GCRMN Benthic Monitoring Sites (geocoded, persisted) ─────────────────────
export const gcrmnSites = pgTable("gcrmn_sites", {
  id:       serial("id").primaryKey(),
  lat:      real("lat").notNull(),
  lon:      real("lon").notNull(),
  site:     text("site").notNull().default(""),
  location: text("location").notNull().default(""),
  country:  text("country").notNull().default(""),
});

export const insertGcrmnSiteSchema = createInsertSchema(gcrmnSites).omit({ id: true });
export type InsertGcrmnSite = z.infer<typeof insertGcrmnSiteSchema>;
export type GcrmnSite = typeof gcrmnSites.$inferSelect;

// ─── Reef Videos (IPFS-pinned video surveys with geo-coordinates) ─────────────
export const reefVideos = pgTable("reef_videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cid: text("cid").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  title: text("title").notNull().default(""),
  author: text("author").notNull().default(""),
  description: text("description").notNull().default(""),
  durationSecs: integer("duration_secs").default(0),
  depthM: real("depth_m").default(0),
  status: text("status").notNull().default("pending"),
  curatedBy: varchar("curated_by"),
  curatedAt: integer("curated_at"),
  curatorNote: text("curator_note").notNull().default(""),
  profileId: varchar("profile_id"),
  createdAt: integer("created_at").notNull().default(sql`extract(epoch from now())::int`),
});

export const insertReefVideoSchema = createInsertSchema(reefVideos).omit({
  id: true,
  createdAt: true,
  status: true,
  curatedBy: true,
  curatedAt: true,
});
export type InsertReefVideo = z.infer<typeof insertReefVideoSchema>;
export type ReefVideo = typeof reefVideos.$inferSelect;

// ─── Coral Traits (jmadinlab/coraltraits2 - https://www.coraltraits.org) ─────
// Three relational tables mirroring the CTDB v0.1.0 release:
//   * coral_taxa     - one row per Scleractinia species (taxonomy)
//   * coral_traits   - trait definitions (id maps to coraltraits.org/traits/{id})
//   * coral_trait_samples - individual observations linking taxon + trait + value
//                            + optional geo-location, source and DOI

export const coralTaxa = pgTable("coral_taxa", {
  id:             serial("id").primaryKey(),
  scientificName: text("scientific_name").notNull().unique(),
  genus:          text("genus").notNull().default(""),
  species:        text("species").notNull().default(""),
  family:         text("family").notNull().default(""),
  authority:      text("authority").notNull().default(""),
  commonName:     text("common_name").notNull().default(""),
  iucnStatus:     text("iucn_status").notNull().default(""),
  sampleCount:    integer("sample_count").notNull().default(0),
});
export const insertCoralTaxonSchema = createInsertSchema(coralTaxa).omit({ id: true, sampleCount: true });
export type InsertCoralTaxon = z.infer<typeof insertCoralTaxonSchema>;
export type CoralTaxon = typeof coralTaxa.$inferSelect;

// ─── Corals of the World species catalog (full 831-species fact-sheet index) ──
// One row per species in coralsoftheworld.org/species_factsheets/ - sourced from
// the public <select> on that page (cotw_id + binomial + genus). Family is left
// blank because CoTW currently lists "All families are currently under review".
// Seeder is idempotent (onConflictDoNothing on cotw_id + slug).
export const cotwSpecies = pgTable("cotw_species", {
  id:             serial("id").primaryKey(),
  cotwId:         integer("cotw_id").notNull().unique(),
  scientificName: text("scientific_name").notNull().unique(),
  genus:          text("genus").notNull().default(""),
  speciesEpithet: text("species_epithet").notNull().default(""),
  slug:           text("slug").notNull().unique(),
  factsheetUrl:   text("factsheet_url").notNull().default(""),
});
export const insertCotwSpeciesSchema = createInsertSchema(cotwSpecies).omit({ id: true });
export type InsertCotwSpecies = z.infer<typeof insertCotwSpeciesSchema>;
export type CotwSpecies = typeof cotwSpecies.$inferSelect;

export const coralTraits = pgTable("coral_traits", {
  id:           integer("id").primaryKey(),                 // upstream trait id
  name:         text("name").notNull().unique(),
  category:     text("category").notNull().default(""),     // Morphological, Reproductive, ...
  unit:         text("unit").notNull().default(""),
  description:  text("description").notNull().default(""),
  sampleCount:  integer("sample_count").notNull().default(0),
});
export const insertCoralTraitSchema = createInsertSchema(coralTraits).omit({ sampleCount: true });
export type InsertCoralTrait = z.infer<typeof insertCoralTraitSchema>;
export type CoralTraitDef = typeof coralTraits.$inferSelect;

// Deterministic dedupe key: same taxon+trait+value+location+coord
// triple is treated as the same observation across re-seeds. Used with
// onConflictDoNothing so the seeder is fully idempotent and race-safe.
export const coralTraitSamples = pgTable("coral_trait_samples", {
  id:            serial("id").primaryKey(),
  taxonId:       integer("taxon_id").notNull().references(() => coralTaxa.id),
  traitId:       integer("trait_id"),                       // nullable - upstream sometimes lacks it
  traitName:     text("trait_name").notNull().default(""),  // denormalised for fast filter
  value:         text("value").notNull().default(""),
  valueType:     text("value_type").notNull().default(""),
  unit:          text("unit").notNull().default(""),
  resource:      text("resource").notNull().default(""),
  doi:           text("doi").notNull().default(""),
  location:      text("location").notNull().default(""),
  country:       text("country").notNull().default(""),
  latitude:      real("latitude"),
  longitude:     real("longitude"),
  notes:         text("notes").notNull().default(""),
  source:        text("source").notNull().default(""),      // 'coraltraits-release' | 'gbif-scleractinia' | ...
  dedupeKey:     text("dedupe_key").notNull().unique(),     // sha-ish concat of dedupe cols
});
export const insertCoralTraitSampleSchema = createInsertSchema(coralTraitSamples).omit({ id: true });
export type InsertCoralTraitSample = z.infer<typeof insertCoralTraitSampleSchema>;
export type CoralTraitSample = typeof coralTraitSamples.$inferSelect;

// ─── Leaderboard (aggregated view) ────────────────────────────────────────────
export interface LeaderboardEntry {
  id: string;
  displayName: string;
  avatarUrl: string;
  avatarCid: string;
  tags: string[];
  points: number;
  questionCount: number;
  createdAt: number;
  orcidId: string;
  orcidName: string;
  // Extended community visibility fields
  ipfsCid: string;
  walletAddress: string;
  twitterHandle: string;
  githubHandle: string;
  linkedinUrl: string;
  instagramHandle: string;
  bio: string;
  location: string;
  website: string;
}

// ─── Coral Trait Database (jmadinlab/coraltraits2) ────────────────────────────
// Imported from https://github.com/jmadinlab/coraltraits2 (database_v_1_july).
// Source IDs (s1, l3, r5, integers) are preserved as primary keys for stable
// cross-reference with the upstream dataset.

export const ctSpecies = pgTable("ct_species", {
  id: text("id").primaryKey(),
  masterSpecies: text("master_species").notNull().default(""),
  familyMolecules: text("family_molecules").notNull().default(""),
  familyMorphology: text("family_morphology").notNull().default(""),
  speciesClass: text("species_class").notNull().default(""),
  synonymSpecies: text("synonym_species").notNull().default(""),
  description: text("description").notNull().default(""),
  aphiaId: integer("aphia_id"),
});
export type CtSpecies = typeof ctSpecies.$inferSelect;

export const ctLocations = pgTable("ct_locations", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  latitude: real("latitude"),
  longitude: real("longitude"),
  description: text("description").notNull().default(""),
});
export type CtLocation = typeof ctLocations.$inferSelect;

export const ctResources = pgTable("ct_resources", {
  id: text("id").primaryKey(),
  primarySecondary: text("primary_secondary").notNull().default(""),
  author: text("author").notNull().default(""),
  year: integer("year"),
  title: text("title").notNull().default(""),
  resourceType: text("resource_type").notNull().default(""),
  doiIsbn: text("doi_isbn").notNull().default(""),
  journal: text("journal").notNull().default(""),
  volumePages: text("volume_pages").notNull().default(""),
});
export type CtResource = typeof ctResources.$inferSelect;

// IDs are stored with their upstream sigil so they join directly to the
// _id columns on ct_measurements (e.g. trait "Sexual system" is stored
// here as "t8" and ct_measurements.trait_id is "t8").
export const ctStandards = pgTable("ct_standards", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  units: text("units").notNull().default(""),
  standardClass: text("standard_class").notNull().default(""),
  description: text("description").notNull().default(""),
});
export type CtStandard = typeof ctStandards.$inferSelect;

export const ctMethodologies = pgTable("ct_methodologies", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  description: text("description").notNull().default(""),
  userId: integer("user_id"),
});
export type CtMethodology = typeof ctMethodologies.$inferSelect;

export const ctTraits = pgTable("ct_traits", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  standardId: text("standard_id"),
  traitClassId: text("trait_class_id").notNull().default(""),
  description: text("description").notNull().default(""),
  userId: integer("user_id"),
  editor: text("editor").notNull().default(""),
  traitEditorId: integer("trait_editor_id"),
});
export type CtTrait = typeof ctTraits.$inferSelect;

export const ctValueTypes = pgTable("ct_value_types", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().default(""),
});
export type CtValueType = typeof ctValueTypes.$inferSelect;

export const ctPrecisionTypes = pgTable("ct_precision_types", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().default(""),
});
export type CtPrecisionType = typeof ctPrecisionTypes.$inferSelect;

export const ctTraitEditors = pgTable("ct_trait_editors", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().default(""),
});
export type CtTraitEditor = typeof ctTraitEditors.$inferSelect;

export const ctContributors = pgTable("ct_contributors", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().default(""),
});
export type CtContributor = typeof ctContributors.$inferSelect;

// Denormalised measurement-level rows: one row per (observation × trait).
// Matches the shipped database_v_1_july.csv structure so a single SELECT
// can answer "give me trait X for species Y at location Z" without joins,
// while all *_id columns remain joinable to the lookup tables above.
export const ctMeasurements = pgTable("ct_measurements", {
  id: serial("id").primaryKey(),
  observationId: text("observation_id"),
  measurementId: integer("measurement_id"),
  access: text("access").notNull().default(""),
  userId: integer("user_id"),
  speciesId: text("species_id"),
  speciesName: text("species_name").notNull().default(""),
  familyMolecules: text("family_molecules").notNull().default(""),
  locationId: text("location_id"),
  locationName: text("location_name").notNull().default(""),
  latitude: real("latitude"),
  longitude: real("longitude"),
  resourceId: text("resource_id"),
  resourceSecondaryId: text("resource_secondary_id"),
  traitId: text("trait_id"),
  traitName: text("trait_name").notNull().default(""),
  traitCategory: text("trait_category").notNull().default(""),
  standardId: text("standard_id"),
  standardUnit: text("standard_unit").notNull().default(""),
  methodologyId: text("methodology_id"),
  methodologyName: text("methodology_name").notNull().default(""),
  value: text("value").notNull().default(""),
  valueTypeId: integer("value_type_id"),
  valueType: text("value_type").notNull().default(""),
  precision: text("precision").notNull().default(""),
  precisionTypeId: integer("precision_type_id"),
  precisionType: text("precision_type").notNull().default(""),
  precisionUpper: text("precision_upper").notNull().default(""),
  replicates: text("replicates").notNull().default(""),
  notes: text("notes").notNull().default(""),
  originalTaxa: text("original_taxa").notNull().default(""),
  originalTaxaStatus: text("original_taxa_status").notNull().default(""),
  originalAphiaId: integer("original_aphia_id"),
});
export type CtMeasurement = typeof ctMeasurements.$inferSelect;
