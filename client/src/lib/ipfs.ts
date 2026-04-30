/** Frontend helpers for IPFS (powered by Pinata on the server) */

const PINATA_GATEWAY = "teal-advisory-zebra-284.mypinata.cloud";

export const IPFS_GATEWAYS = [
  `https://${PINATA_GATEWAY}/ipfs`,
  "https://ipfs.io/ipfs",
  "https://cloudflare-ipfs.com/ipfs",
];

/** Resolve a CID to a displayable image URL.
 *  Tries local server cache first (fastest), then Pinata dedicated gateway. */
export function ipfsImageUrl(cid: string): string {
  if (!cid) return "";
  return `/api/ipfs/cat/${cid}`;
}

/** Direct Pinata dedicated gateway URL — bypasses local server */
export function ipfsPublicUrl(cid: string): string {
  if (!cid) return "";
  return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
}

export function isIpfsCid(value: string): boolean {
  return value.startsWith("bafy") || value.startsWith("Qm") || value.startsWith("bafk");
}

/** Upload an image File to IPFS via the local server endpoint (pins to Pinata) */
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
