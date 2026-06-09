/** Frontend helpers for IPFS (self-hosted on the server — bytes stored in our DB). */

// Public gateways are only a best-effort fallback for legacy/networked CIDs.
export const IPFS_GATEWAYS = [
  "/api/ipfs/cat",
  "https://ipfs.io/ipfs",
  "https://dweb.link/ipfs",
];

/** Resolve a CID to a displayable image URL served by our own gateway. */
export function ipfsImageUrl(cid: string): string {
  if (!cid) return "";
  return `/api/ipfs/cat/${cid}`;
}

/** Public gateway URL (best-effort fallback for legacy/networked content). */
export function ipfsPublicUrl(cid: string): string {
  if (!cid) return "";
  return `https://ipfs.io/ipfs/${cid}`;
}

export function isIpfsCid(value: string): boolean {
  return value.startsWith("bafy") || value.startsWith("Qm") || value.startsWith("bafk");
}

/** Upload an image File to IPFS via the local server endpoint (stored in our DB) */
export async function uploadImageToIPFS(file: File): Promise<{
  cid: string;
  url: string;
  localUrl: string;
  gateways: string[];
  size: number;
  mimeType: string;
}> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/ipfs/upload", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "IPFS upload failed");
  }
  return res.json();
}
