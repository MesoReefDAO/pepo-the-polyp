/**
 * Self-hosted IPFS storage (no external pinning service).
 *
 * CIDs are computed locally with the canonical UnixFS importer (the same
 * algorithm `ipfs add --cid-version=1` uses), so every identifier is a real,
 * content-addressed IPFS CIDv1. The bytes themselves are persisted in the
 * PostgreSQL `ipfs_blocks` table and served back through our own gateway
 * (`/api/ipfs/cat/:cid`). This removes any dependency on Pinata (and its plan
 * limits) while keeping content-addressing intact.
 *
 * Trade-off: content is not announced to the public IPFS DHT, so third-party
 * gateways (ipfs.io, dweb.link, …) cannot independently resolve newly created
 * CIDs — only this app serves them. They remain valid CIDs should the content
 * ever be re-pinned to a networked node.
 */

import { importer } from "ipfs-unixfs-importer";
import { MemoryBlockstore } from "blockstore-core/memory";

// Public gateways used only as a best-effort fallback for legacy CIDs whose
// bytes are not (yet) in our local DB cache.
const PUBLIC_GATEWAYS = ["https://ipfs.io/ipfs", "https://dweb.link/ipfs"];

/**
 * Compute the canonical UnixFS CIDv1 for a buffer without touching the network.
 * Matches the CID produced by `ipfs add --cid-version=1` (raw leaves).
 */
export async function computeCid(bytes: Uint8Array): Promise<string> {
  const blockstore = new MemoryBlockstore();
  let cid: string | undefined;
  for await (const entry of importer([{ content: bytes }], blockstore, {
    cidVersion: 1,
    rawLeaves: true,
  })) {
    cid = entry.cid.toString();
  }
  if (!cid) throw new Error("Failed to compute IPFS CID");
  return cid;
}

/**
 * "Upload" a Buffer: compute its CID locally and return it. The caller is
 * responsible for persisting the bytes (via storage.saveIpfsBlock).
 */
export async function uploadToIPFS(buffer: Buffer, _filename?: string): Promise<string> {
  const cid = await computeCid(new Uint8Array(buffer));
  return cid;
}

/**
 * Build a URL to serve a CID. Primary path is our own gateway proxy, which
 * serves the bytes straight from PostgreSQL.
 */
export function gatewayUrl(cid: string): string {
  return `/api/ipfs/cat/${cid}`;
}

/**
 * Gateway candidates for the frontend: our own proxy first, then public
 * gateways as a best-effort fallback for legacy/networked content.
 */
export function gatewayUrls(cid: string): string[] {
  return [gatewayUrl(cid), ...PUBLIC_GATEWAYS.map((g) => `${g}/${cid}`)];
}

/** The primary URL we expose on the frontend (our own gateway proxy). */
export function primaryGatewayUrl(cid: string): string {
  return gatewayUrl(cid);
}

/** A public gateway URL, used only as a fallback for CIDs missing locally. */
export function publicGatewayUrl(cid: string): string {
  return `${PUBLIC_GATEWAYS[0]}/${cid}`;
}
