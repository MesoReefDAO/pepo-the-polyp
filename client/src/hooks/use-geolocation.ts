import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";

const GEO_SAVED_KEY = "pepo_geo_saved";

/**
 * On first mount after login, requests the browser's geolocation (with user
 * permission), then POSTs lat/lng to the backend. Runs at most once per session.
 */
export function useGeolocation(
  isAuthenticated: boolean,
  getToken: (() => Promise<string | null>) | null,
  useOrcidSession: boolean
) {
  const attempted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (attempted.current) return;
    if (!navigator.geolocation) return;
    // Only ask once per browser session to avoid repeated prompts
    if (sessionStorage.getItem(GEO_SAVED_KEY)) return;

    attempted.current = true;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (getToken && !useOrcidSession) {
            const token = await getToken();
            if (token) headers["x-privy-token"] = token;
          }
          const res = await fetch("/api/profiles/location", {
            method: "POST",
            headers,
            body: JSON.stringify({ latitude, longitude }),
            credentials: "include",
          });
          if (res.ok) {
            sessionStorage.setItem(GEO_SAVED_KEY, "1");
            queryClient.invalidateQueries({ queryKey: ["/api/map/markers"] });
          }
        } catch {
          // non-blocking
        }
      },
      () => {
        // user denied — silently skip
      },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, [isAuthenticated]);
}
