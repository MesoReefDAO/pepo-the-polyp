import { eq, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users, profiles, contributions, reefImages, reefVideos, ipfsBlocks, gcrmnSites,
  coralTaxa, coralTraits, coralTraitSamples, cotwSpecies,
  type User, type InsertUser,
  type Profile, type InsertProfile,
  type Contribution, type InsertContribution,
  type LeaderboardEntry,
  type ReefImage, type InsertReefImage,
  type ReefVideo, type InsertReefVideo,
  type IpfsBlock,
  type GcrmnSite, type InsertGcrmnSite,
  type CoralTaxon, type InsertCoralTaxon,
  type CoralTraitDef, type InsertCoralTrait,
  type CoralTraitSample, type InsertCoralTraitSample,
  type CotwSpecies,
} from "@shared/schema";
import { randomUUID } from "crypto";

// Aggregated geolocated coral-trait observations for the reef-map layer: one
// row per distinct coordinate, summarising every CoralTraits.org measurement
// recorded there (full ct_measurements dataset, not the GBIF fallback).
export interface CoralTraitMapLocation {
  latitude: number;
  longitude: number;
  locationName: string;
  obsCount: number;
  speciesCount: number;
  traitCount: number;
  topSpecies: string[];
  categories: string[];
}

// ─── Interface ─────────────────────────────────────────────────────────────────
export interface IStorage {
  // legacy
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // profiles
  getProfile(id: string): Promise<Profile | undefined>;
  upsertProfile(profile: InsertProfile): Promise<Profile>;
  getAllProfiles(): Promise<Profile[]>;

  // contributions
  getContributions(profileId: string): Promise<Contribution[]>;
  addContribution(contribution: InsertContribution): Promise<Contribution>;
  hasContributionToday(profileId: string, type: string): Promise<boolean>;
  hasContribution(profileId: string, type: string): Promise<boolean>;
  syncAllUserPoints(): Promise<{ synced: number; pointsAdded: number }>;

  // leaderboard
  getLeaderboard(): Promise<LeaderboardEntry[]>;

  // ORCID
  saveOrcid(profileId: string, orcidId: string, orcidName: string): Promise<Profile>;
  clearOrcid(profileId: string): Promise<Profile>;

  // IPFS / Pinata
  saveIpfsCid(profileId: string, ipfsCid: string): Promise<Profile>;
  saveWalletAddress(profileId: string, walletAddress: string): Promise<Profile>;
  getAllProfilesRaw(): Promise<Profile[]>;

  // Geolocation
  saveLocation(profileId: string, latitude: number, longitude: number): Promise<Profile>;
  getMapMarkers(): Promise<{ id: string; displayName: string; avatarUrl: string; latitude: number; longitude: number; orcidId: string; points: number }[]>;

  // Reef Images
  createReefImage(data: InsertReefImage): Promise<ReefImage>;
  getReefImages(status?: string): Promise<ReefImage[]>;
  getReefImagesByProfile(profileId: string): Promise<ReefImage[]>;
  getCurationQueue(): Promise<ReefImage[]>;
  curateReefImage(id: string, status: "approved" | "rejected", curatedBy: string, curatorNote?: string): Promise<ReefImage | undefined>;

  // Reef Videos
  createReefVideo(data: InsertReefVideo): Promise<ReefVideo>;
  getReefVideos(status?: string): Promise<ReefVideo[]>;
  getReefVideosByProfile(profileId: string): Promise<ReefVideo[]>;
  getVideoCurationQueue(): Promise<ReefVideo[]>;
  curateReefVideo(id: string, status: "approved" | "rejected", curatedBy: string, curatorNote?: string): Promise<ReefVideo | undefined>;

  // IPFS Blocks (DB-persisted content store)
  saveIpfsBlock(cid: string, data: string, mimeType: string): Promise<IpfsBlock>;
  getIpfsBlock(cid: string): Promise<IpfsBlock | undefined>;

  // GCRMN Benthic Sites (geocoded, persisted)
  getGcrmnSiteCount(): Promise<number>;
  getAllGcrmnSites(): Promise<GcrmnSite[]>;
  bulkInsertGcrmnSites(sites: InsertGcrmnSite[]): Promise<void>;

  // Coral Traits (taxa / trait definitions / samples)
  getCoralTaxaCount(): Promise<number>;
  getCoralTraitSamplesCount(): Promise<number>;
  listCoralTaxa(opts?: { search?: string; family?: string; limit?: number; offset?: number }): Promise<CoralTaxon[]>;
  getCoralTaxonByName(scientificName: string): Promise<CoralTaxon | undefined>;
  getCoralTaxon(id: number): Promise<CoralTaxon | undefined>;
  listCoralTraitDefs(): Promise<CoralTraitDef[]>;
  getCoralSamplesForTaxon(taxonId: number, limit?: number): Promise<CoralTraitSample[]>;
  getGeolocatedCoralSamples(limit?: number): Promise<(CoralTraitSample & { scientificName: string })[]>;
  getCoralTraitMapLocations(): Promise<CoralTraitMapLocation[]>;
  bulkInsertCoralTaxa(rows: InsertCoralTaxon[]): Promise<void>;
  bulkInsertCoralTraitDefs(rows: InsertCoralTrait[]): Promise<void>;
  bulkInsertCoralTraitSamples(rows: InsertCoralTraitSample[]): Promise<void>;
  recomputeCoralSampleCounts(): Promise<void>;
  listCoralFamilies(): Promise<string[]>;
}

// ─── Database-backed storage ───────────────────────────────────────────────────
export class DbStorage implements IStorage {

  // ── Legacy users ──────────────────────────────────────────────────────────
  async getUser(id: string): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return row;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.username, username));
    return row;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [row] = await db.insert(users).values({ ...insertUser, id: randomUUID() }).returning();
    return row;
  }

  // ── Profiles ──────────────────────────────────────────────────────────────
  async getProfile(id: string): Promise<Profile | undefined> {
    const [row] = await db.select().from(profiles).where(eq(profiles.id, id));
    return row;
  }

  async upsertProfile(profile: InsertProfile): Promise<Profile> {
    const now = Math.floor(Date.now() / 1000);
    const [row] = await db
      .insert(profiles)
      .values({ ...profile, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          displayName: profile.displayName,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          avatarUrl: profile.avatarUrl,
          avatarCid: profile.avatarCid,
          ipfsImages: profile.ipfsImages,
          tags: profile.tags,
          isPublic: profile.isPublic,
          orcidId: profile.orcidId,
          orcidName: profile.orcidName,
          ipfsCid: profile.ipfsCid,
          twitterHandle: profile.twitterHandle,
          linkedinUrl: profile.linkedinUrl,
          githubHandle: profile.githubHandle,
          instagramHandle: profile.instagramHandle,
          walletAddress: profile.walletAddress,
          updatedAt: now,
        },
      })
      .returning();
    return row;
  }

  async getAllProfiles(): Promise<Profile[]> {
    const rows = await db.select().from(profiles).where(eq(profiles.isPublic, true)).orderBy(desc(profiles.points));
    // Deduplicate: if a privy profile and an orcid-prefixed profile share the same
    // orcidId, suppress the orcid-prefixed one - the user linked their accounts.
    const linkedOrcids = new Set(
      rows.filter(r => !r.id.startsWith("orcid:") && r.orcidId).map(r => r.orcidId)
    );
    return rows.filter(r => !(r.id.startsWith("orcid:") && linkedOrcids.has(r.orcidId)));
  }

  // ── Contributions ─────────────────────────────────────────────────────────
  async getContributions(profileId: string): Promise<Contribution[]> {
    return db
      .select()
      .from(contributions)
      .where(eq(contributions.profileId, profileId))
      .orderBy(desc(contributions.createdAt));
  }

  async addContribution(contribution: InsertContribution): Promise<Contribution> {
    const now = Math.floor(Date.now() / 1000);
    const [row] = await db
      .insert(contributions)
      .values({ ...contribution, id: randomUUID(), createdAt: now })
      .returning();
    // Increment the profile's cached points total
    await db
      .update(profiles)
      .set({ points: sql`${profiles.points} + ${contribution.points}`, updatedAt: now })
      .where(eq(profiles.id, contribution.profileId));
    return row;
  }

  async hasContributionToday(profileId: string, type: string): Promise<boolean> {
    const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const rows = await db
      .select()
      .from(contributions)
      .where(
        sql`${contributions.profileId} = ${profileId}
          AND ${contributions.type} = ${type}
          AND ${contributions.createdAt} >= ${startOfDay}`
      );
    return rows.length > 0;
  }

  async hasContribution(profileId: string, type: string): Promise<boolean> {
    const rows = await db
      .select({ id: contributions.id })
      .from(contributions)
      .where(
        sql`${contributions.profileId} = ${profileId}
          AND ${contributions.type} = ${type}`
      )
      .limit(1);
    return rows.length > 0;
  }

  // ── ORCID ─────────────────────────────────────────────────────────────────
  async saveOrcid(profileId: string, orcidId: string, orcidName: string): Promise<Profile> {
    const now = Math.floor(Date.now() / 1000);
    const [row] = await db
      .update(profiles)
      .set({ orcidId, orcidName, updatedAt: now })
      .where(eq(profiles.id, profileId))
      .returning();
    return row;
  }

  async clearOrcid(profileId: string): Promise<Profile> {
    const now = Math.floor(Date.now() / 1000);
    const [row] = await db
      .update(profiles)
      .set({ orcidId: undefined, orcidName: undefined, updatedAt: now })
      .where(eq(profiles.id, profileId))
      .returning();
    return row;
  }

  // ── IPFS / Pinata ─────────────────────────────────────────────────────────
  async saveIpfsCid(profileId: string, ipfsCid: string): Promise<Profile> {
    const now = Math.floor(Date.now() / 1000);
    const existing = await this.getProfile(profileId);
    if (!existing) {
      const [row] = await db
        .insert(profiles)
        .values({ id: profileId, ipfsCid, createdAt: now, updatedAt: now })
        .returning();
      return row;
    }
    const [row] = await db
      .update(profiles)
      .set({ ipfsCid, updatedAt: now })
      .where(eq(profiles.id, profileId))
      .returning();
    return row;
  }

  async saveWalletAddress(profileId: string, walletAddress: string): Promise<Profile> {
    const now = Math.floor(Date.now() / 1000);
    const [row] = await db
      .update(profiles)
      .set({ walletAddress, updatedAt: now })
      .where(eq(profiles.id, profileId))
      .returning();
    return row;
  }

  async getAllProfilesRaw(): Promise<Profile[]> {
    return db.select().from(profiles).orderBy(desc(profiles.points));
  }

  // ── Geolocation ───────────────────────────────────────────────────────────
  async saveLocation(profileId: string, latitude: number, longitude: number): Promise<Profile> {
    const now = Math.floor(Date.now() / 1000);
    const [row] = await db
      .update(profiles)
      .set({ latitude, longitude, updatedAt: now })
      .where(eq(profiles.id, profileId))
      .returning();
    return row;
  }

  async getMapMarkers(): Promise<{ id: string; displayName: string; avatarUrl: string; latitude: number; longitude: number; orcidId: string; points: number }[]> {
    const rows = await db
      .select({
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
        latitude: profiles.latitude,
        longitude: profiles.longitude,
        orcidId: profiles.orcidId,
        points: profiles.points,
      })
      .from(profiles)
      .where(eq(profiles.isPublic, true));

    return rows
      .filter((r) => r.latitude != null && r.longitude != null)
      .map((r) => ({
        id: r.id,
        displayName: r.displayName,
        avatarUrl: r.avatarUrl,
        latitude: r.latitude as number,
        longitude: r.longitude as number,
        orcidId: r.orcidId,
        points: r.points,
      }));
  }

  // ── Reef Images ───────────────────────────────────────────────────────────
  async createReefImage(data: InsertReefImage): Promise<ReefImage> {
    const now = Math.floor(Date.now() / 1000);
    const [row] = await db
      .insert(reefImages)
      .values({ ...data, id: randomUUID(), createdAt: now })
      .returning();
    return row;
  }

  async getReefImages(status = "approved"): Promise<ReefImage[]> {
    return db.select().from(reefImages)
      .where(eq(reefImages.status, status))
      .orderBy(desc(reefImages.createdAt));
  }

  async getReefImagesByProfile(profileId: string): Promise<ReefImage[]> {
    return db.select().from(reefImages)
      .where(eq(reefImages.profileId, profileId))
      .orderBy(desc(reefImages.createdAt));
  }

  async getCurationQueue(): Promise<ReefImage[]> {
    return db.select().from(reefImages)
      .where(eq(reefImages.status, "pending"))
      .orderBy(reefImages.createdAt);
  }

  async curateReefImage(id: string, status: "approved" | "rejected", curatedBy: string, curatorNote?: string): Promise<ReefImage | undefined> {
    const now = Math.floor(Date.now() / 1000);
    const [row] = await db
      .update(reefImages)
      .set({ status, curatedBy, curatedAt: now, curatorNote: curatorNote ?? "" })
      .where(eq(reefImages.id, id))
      .returning();
    return row;
  }

  // ── Reef Videos ──────────────────────────────────────────────────────────
  async createReefVideo(data: InsertReefVideo): Promise<ReefVideo> {
    const id = randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const [row] = await db
      .insert(reefVideos)
      .values({ ...data, id, status: "pending", createdAt: now })
      .returning();
    return row;
  }

  async getReefVideos(status?: string): Promise<ReefVideo[]> {
    if (status) {
      return db.select().from(reefVideos).where(eq(reefVideos.status, status)).orderBy(desc(reefVideos.createdAt));
    }
    return db.select().from(reefVideos).orderBy(desc(reefVideos.createdAt));
  }

  async getReefVideosByProfile(profileId: string): Promise<ReefVideo[]> {
    return db.select().from(reefVideos).where(eq(reefVideos.profileId, profileId)).orderBy(desc(reefVideos.createdAt));
  }

  async getVideoCurationQueue(): Promise<ReefVideo[]> {
    return db.select().from(reefVideos).where(eq(reefVideos.status, "pending")).orderBy(desc(reefVideos.createdAt));
  }

  async curateReefVideo(id: string, status: "approved" | "rejected", curatedBy: string, curatorNote?: string): Promise<ReefVideo | undefined> {
    const now = Math.floor(Date.now() / 1000);
    const [row] = await db
      .update(reefVideos)
      .set({ status, curatedBy, curatedAt: now, curatorNote: curatorNote ?? "" })
      .where(eq(reefVideos.id, id))
      .returning();
    return row;
  }

  // ── IPFS Blocks ───────────────────────────────────────────────────────────
  async saveIpfsBlock(cid: string, data: string, mimeType: string): Promise<IpfsBlock> {
    const now = Math.floor(Date.now() / 1000);
    const [row] = await db
      .insert(ipfsBlocks)
      .values({ cid, data, mimeType, uploadedAt: now })
      .onConflictDoUpdate({ target: ipfsBlocks.cid, set: { data, mimeType, uploadedAt: now } })
      .returning();
    return row;
  }

  async getIpfsBlock(cid: string): Promise<IpfsBlock | undefined> {
    const [row] = await db.select().from(ipfsBlocks).where(eq(ipfsBlocks.cid, cid));
    return row;
  }

  // ── Points sync ───────────────────────────────────────────────────────────
  // Backfills any one-time contribution records that existing users should have
  // earned (profile_name, profile_bio, profile_avatar, orcid) then recalculates
  // profiles.points = SUM(contributions.points) for every profile.
  async syncAllUserPoints(): Promise<{ synced: number; pointsAdded: number }> {
    const allProfiles = await db.select().from(profiles);
    const now = Math.floor(Date.now() / 1000);
    let synced = 0;
    let pointsAdded = 0;

    const ONE_TIME: Array<{
      type: string;
      description: string;
      points: number;
      check: (p: typeof allProfiles[0]) => boolean;
    }> = [
      {
        type: "profile_name",
        description: "Set display name",
        points: 10,
        check: (p) => !!(p.displayName && p.displayName.trim() && p.displayName !== "Explorer"),
      },
      {
        type: "profile_bio",
        description: "Wrote a bio",
        points: 10,
        check: (p) => !!(p.bio && p.bio.trim().length >= 10),
      },
      {
        type: "profile_avatar",
        description: "Uploaded a profile photo",
        points: 15,
        check: (p) => !!(p.avatarCid || p.avatarUrl),
      },
      {
        type: "orcid",
        description: "Linked ORCID iD",
        points: 20,
        check: (p) => !!(p.orcidId),
      },
    ];

    for (const profile of allProfiles) {
      // Backfill any missing one-time contributions
      for (const task of ONE_TIME) {
        if (!task.check(profile)) continue;
        const has = await this.hasContribution(profile.id, task.type);
        if (!has) {
          await db.insert(contributions).values({
            id: randomUUID(),
            profileId: profile.id,
            type: task.type,
            description: task.description,
            points: task.points,
            createdAt: now,
          });
          pointsAdded += task.points;
        }
      }

      // Recalculate cached points total from the source of truth
      const [result] = await db
        .select({ total: sql<number>`coalesce(sum(${contributions.points}), 0)` })
        .from(contributions)
        .where(eq(contributions.profileId, profile.id));
      const total = Number(result?.total ?? 0);
      await db
        .update(profiles)
        .set({ points: total, updatedAt: now })
        .where(eq(profiles.id, profile.id));

      synced++;
    }

    return { synced, pointsAdded };
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const rows = await db
      .select({
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
        avatarCid: profiles.avatarCid,
        tags: profiles.tags,
        points: profiles.points,
        createdAt: profiles.createdAt,
        orcidId: profiles.orcidId,
        orcidName: profiles.orcidName,
        ipfsCid: profiles.ipfsCid,
        walletAddress: profiles.walletAddress,
        twitterHandle: profiles.twitterHandle,
        githubHandle: profiles.githubHandle,
        linkedinUrl: profiles.linkedinUrl,
        instagramHandle: profiles.instagramHandle,
        bio: profiles.bio,
        location: profiles.location,
        website: profiles.website,
        questionCount: sql<number>`count(${contributions.id}) filter (where ${contributions.type} = 'question')`,
      })
      .from(profiles)
      .leftJoin(contributions, eq(contributions.profileId, profiles.id))
      .where(eq(profiles.isPublic, true))
      .groupBy(profiles.id)
      .orderBy(desc(profiles.points));

    // Deduplicate: suppress orcid-prefixed profiles when a linked privy profile
    // exists with the same orcidId - the user connected their accounts.
    const linkedOrcids = new Set(
      rows.filter(r => !r.id.startsWith("orcid:") && r.orcidId).map(r => r.orcidId)
    );
    const deduped = rows.filter(r => !(r.id.startsWith("orcid:") && linkedOrcids.has(r.orcidId)));

    return deduped.map((r) => ({
      id: r.id,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl,
      avatarCid: r.avatarCid ?? "",
      tags: r.tags,
      points: r.points,
      questionCount: Number(r.questionCount),
      createdAt: r.createdAt,
      orcidId: r.orcidId ?? "",
      orcidName: r.orcidName ?? "",
      ipfsCid: r.ipfsCid ?? "",
      walletAddress: r.walletAddress ?? "",
      twitterHandle: r.twitterHandle ?? "",
      githubHandle: r.githubHandle ?? "",
      linkedinUrl: r.linkedinUrl ?? "",
      instagramHandle: r.instagramHandle ?? "",
      bio: r.bio ?? "",
      location: r.location ?? "",
      website: r.website ?? "",
    }));
  }

  // ── GCRMN Benthic Sites ────────────────────────────────────────────────────
  async getGcrmnSiteCount(): Promise<number> {
    const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(gcrmnSites);
    return row?.count ?? 0;
  }

  async getAllGcrmnSites(): Promise<GcrmnSite[]> {
    return db.select().from(gcrmnSites);
  }

  async bulkInsertGcrmnSites(sites: InsertGcrmnSite[]): Promise<void> {
    const BATCH = 500;
    for (let i = 0; i < sites.length; i += BATCH) {
      await db.insert(gcrmnSites).values(sites.slice(i, i + BATCH));
    }
  }

  // ── Coral Traits (taxa / trait defs / samples) ───────────────────────────
  async getCoralTaxaCount(): Promise<number> {
    const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(coralTaxa);
    return r?.c ?? 0;
  }
  async getCoralTraitSamplesCount(): Promise<number> {
    const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(coralTraitSamples);
    return r?.c ?? 0;
  }
  async listCoralTaxa(opts: { search?: string; family?: string; limit?: number; offset?: number } = {}): Promise<CoralTaxon[]> {
    const lim = Math.min(opts.limit ?? 200, 1000);
    const off = opts.offset ?? 0;
    const where: any[] = [];
    if (opts.search && opts.search.trim()) {
      const q = `%${opts.search.trim().toLowerCase()}%`;
      where.push(sql`lower(${coralTaxa.scientificName}) like ${q}`);
    }
    if (opts.family && opts.family.trim()) {
      where.push(sql`${coralTaxa.family} = ${opts.family}`);
    }
    const whereSql = where.length ? sql`${sql.join(where, sql` and `)}` : sql`true`;
    return db.select().from(coralTaxa).where(whereSql).orderBy(desc(coralTaxa.sampleCount), coralTaxa.scientificName).limit(lim).offset(off);
  }
  async getCoralTaxonByName(scientificName: string): Promise<CoralTaxon | undefined> {
    const [r] = await db.select().from(coralTaxa).where(eq(coralTaxa.scientificName, scientificName));
    return r;
  }
  async getCoralTaxon(id: number): Promise<CoralTaxon | undefined> {
    const [r] = await db.select().from(coralTaxa).where(eq(coralTaxa.id, id));
    return r;
  }
  async listCoralTraitDefs(): Promise<CoralTraitDef[]> {
    return db.select().from(coralTraits).orderBy(coralTraits.category, coralTraits.name);
  }
  async getCoralSamplesForTaxon(taxonId: number, limit = 500): Promise<CoralTraitSample[]> {
    return db.select().from(coralTraitSamples).where(eq(coralTraitSamples.taxonId, taxonId)).limit(limit);
  }
  async getGeolocatedCoralSamples(limit = 2000): Promise<(CoralTraitSample & { scientificName: string })[]> {
    const rows = await db
      .select({
        id: coralTraitSamples.id,
        taxonId: coralTraitSamples.taxonId,
        traitId: coralTraitSamples.traitId,
        traitName: coralTraitSamples.traitName,
        value: coralTraitSamples.value,
        valueType: coralTraitSamples.valueType,
        unit: coralTraitSamples.unit,
        resource: coralTraitSamples.resource,
        doi: coralTraitSamples.doi,
        location: coralTraitSamples.location,
        country: coralTraitSamples.country,
        latitude: coralTraitSamples.latitude,
        longitude: coralTraitSamples.longitude,
        notes: coralTraitSamples.notes,
        source: coralTraitSamples.source,
        scientificName: coralTaxa.scientificName,
      })
      .from(coralTraitSamples)
      .innerJoin(coralTaxa, eq(coralTaxa.id, coralTraitSamples.taxonId))
      .where(sql`${coralTraitSamples.latitude} is not null and ${coralTraitSamples.longitude} is not null`)
      .limit(limit);
    return rows as any;
  }
  // Aggregate the full geolocated CoralTraits measurement set (ct_measurements,
  // ~28k geolocated rows) into one feature per distinct coordinate so the whole
  // database can be mapped without rendering tens of thousands of stacked markers.
  async getCoralTraitMapLocations(): Promise<CoralTraitMapLocation[]> {
    const result = await db.execute(sql`
      SELECT
        latitude::float8                                                           AS latitude,
        longitude::float8                                                          AS longitude,
        max(location_name)                                                         AS location_name,
        count(*)::int                                                              AS obs_count,
        count(DISTINCT species_name)::int                                          AS species_count,
        count(DISTINCT NULLIF(trait_name, ''))::int                               AS trait_count,
        (array_agg(DISTINCT species_name) FILTER (WHERE species_name <> ''))[1:6] AS top_species,
        (array_agg(DISTINCT trait_category) FILTER (WHERE trait_category <> ''))   AS categories
      FROM ct_measurements
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      GROUP BY latitude, longitude
      ORDER BY count(*) DESC
    `);
    const rows = (result as any).rows ?? (result as any);
    return (rows as any[]).map(r => ({
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      locationName: r.location_name ?? "",
      obsCount: Number(r.obs_count),
      speciesCount: Number(r.species_count),
      traitCount: Number(r.trait_count),
      topSpecies: (r.top_species ?? []) as string[],
      categories: (r.categories ?? []) as string[],
    }));
  }
  async bulkInsertCoralTaxa(rows: InsertCoralTaxon[]): Promise<void> {
    if (!rows.length) return;
    const BATCH = 500;
    for (let i = 0; i < rows.length; i += BATCH) {
      await db.insert(coralTaxa).values(rows.slice(i, i + BATCH)).onConflictDoNothing({ target: coralTaxa.scientificName });
    }
  }

  // ── Corals of the World species catalog (831 species fact-sheet index) ────
  async getCotwSpeciesCount(): Promise<number> {
    const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(cotwSpecies);
    return r?.c ?? 0;
  }
  async listCotwSpecies(opts: { search?: string; genus?: string; limit?: number; offset?: number } = {}): Promise<CotwSpecies[]> {
    const lim = Math.min(opts.limit ?? 1000, 2000);
    const off = opts.offset ?? 0;
    const where: any[] = [];
    if (opts.search && opts.search.trim()) {
      const q = `%${opts.search.trim().toLowerCase()}%`;
      where.push(sql`lower(${cotwSpecies.scientificName}) like ${q}`);
    }
    if (opts.genus && opts.genus.trim()) {
      where.push(sql`${cotwSpecies.genus} = ${opts.genus}`);
    }
    const whereSql = where.length ? sql`${sql.join(where, sql` and `)}` : sql`true`;
    return db.select().from(cotwSpecies).where(whereSql).orderBy(cotwSpecies.scientificName).limit(lim).offset(off);
  }
  async listCotwGenera(): Promise<string[]> {
    const rows = await db.select({ genus: cotwSpecies.genus }).from(cotwSpecies).where(sql`${cotwSpecies.genus} <> ''`).groupBy(cotwSpecies.genus).orderBy(cotwSpecies.genus);
    return rows.map(r => r.genus);
  }
  async bulkInsertCoralTraitDefs(rows: InsertCoralTrait[]): Promise<void> {
    if (!rows.length) return;
    const BATCH = 200;
    for (let i = 0; i < rows.length; i += BATCH) {
      await db.insert(coralTraits).values(rows.slice(i, i + BATCH)).onConflictDoNothing({ target: coralTraits.id });
    }
  }
  async bulkInsertCoralTraitSamples(rows: InsertCoralTraitSample[]): Promise<void> {
    if (!rows.length) return;
    const BATCH = 500;
    for (let i = 0; i < rows.length; i += BATCH) {
      await db.insert(coralTraitSamples).values(rows.slice(i, i + BATCH))
        .onConflictDoNothing({ target: coralTraitSamples.dedupeKey });
    }
  }
  async recomputeCoralSampleCounts(): Promise<void> {
    await db.execute(sql`
      update coral_taxa t set sample_count = sub.c from (
        select taxon_id, count(*)::int as c from coral_trait_samples group by taxon_id
      ) sub where sub.taxon_id = t.id
    `);
    await db.execute(sql`
      update coral_traits t set sample_count = sub.c from (
        select trait_id, count(*)::int as c from coral_trait_samples where trait_id is not null group by trait_id
      ) sub where sub.trait_id = t.id
    `);
  }
  async listCoralFamilies(): Promise<string[]> {
    const rows = await db
      .select({ family: coralTaxa.family })
      .from(coralTaxa)
      .where(sql`${coralTaxa.family} <> ''`)
      .groupBy(coralTaxa.family)
      .orderBy(coralTaxa.family);
    return rows.map(r => r.family);
  }
}

export const storage = new DbStorage();
