/**
 * Given a raw value that may be a full URL (https://github.com/user)
 * or an already-clean handle (user / @user), returns just the handle.
 * Strips leading @, protocols, domains, and trailing slashes.
 *
 * Examples:
 *   "https://github.com/StefanoMastella"      → "StefanoMastella"
 *   "https://www.instagram.com/eng.foo/"      → "eng.foo"
 *   "@https://www.instagram.com/eng.foo/"     → "eng.foo"
 *   "https://linkedin.com/in/someone"         → "someone"
 *   "StefanoMastella"                         → "StefanoMastella"
 *   "@StefanoMastella"                        → "StefanoMastella"
 */
export function extractHandle(raw: string): string {
  if (!raw) return "";
  let s = raw.trim().replace(/^@+/, "");
  if (s.includes("://") || s.startsWith("www.")) {
    try {
      const url = new URL(s.startsWith("www.") ? `https://${s}` : s);
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length) return parts[parts.length - 1];
    } catch {
      // fall through to raw
    }
  }
  return s;
}

/**
 * Build the correct href for a social link.
 * If the raw value is already a full URL, return it directly.
 * Otherwise build it from the base URL + handle.
 */
export function buildSocialHref(base: string, raw: string): string {
  if (!raw) return "#";
  const s = raw.trim().replace(/^@+/, "");
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("www.")) return `https://${s}`;
  return `${base}${extractHandle(s)}`;
}
