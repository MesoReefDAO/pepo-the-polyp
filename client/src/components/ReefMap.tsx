import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, WMSTileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Fix Leaflet default icon paths broken by Vite ────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Custom coral-teal pin icon ───────────────────────────────────────────────
function makePin(color = "#83eef0", hasOrcid = false) {
  const border = hasOrcid ? "#A6CE39" : color;
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:${color};
      border:2.5px solid ${border};
      box-shadow:0 0 6px ${color}88, 0 2px 6px #00000055;
    "></div>`,
  });
}

// ─── Fit map to show all markers ──────────────────────────────────────────────
function FitBounds({ markers }: { markers: { latitude: number; longitude: number }[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (markers.length === 0 || fitted.current) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.latitude, m.longitude]));
    map.fitBounds(bounds.pad(0.5), { maxZoom: 6 });
    fitted.current = true;
  }, [markers, map]);
  return null;
}

// ─── Marker type ──────────────────────────────────────────────────────────────
interface MapMarker {
  id: string;
  displayName: string;
  avatarUrl: string;
  latitude: number;
  longitude: number;
  orcidId: string;
}

// ─── Main map component ───────────────────────────────────────────────────────
export function ReefMap({ compact = false }: { compact?: boolean }) {
  const { data: markers = [] } = useQuery<MapMarker[]>({
    queryKey: ["/api/map/markers"],
    refetchInterval: 60_000,
  });

  return (
    <div
      data-testid="reef-map"
      className="relative w-full overflow-hidden"
      style={{
        height: compact ? 180 : 260,
        borderRadius: 16,
        border: "1px solid rgba(131,238,240,0.12)",
      }}
    >
      <MapContainer
        center={[12, -80]}
        zoom={2}
        zoomControl={false}
        scrollWheelZoom={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%", background: "#00131c" }}
      >
        {/* ── Esri Ocean basemap ── */}
        <TileLayer
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
          attribution="© Esri"
          maxZoom={10}
        />

        {/* ── Allen Coral Atlas — benthic map overlay (WMS) ── */}
        <WMSTileLayer
          url="https://allencoralatlas.org/geoserver/ows"
          layers="coral-atlas:benthic_map"
          format="image/png"
          transparent={true}
          opacity={0.55}
          version="1.1.1"
          attribution="© Allen Coral Atlas"
        />

        {/* ── User location pins ── */}
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.latitude, m.longitude]}
            icon={makePin("#83eef0", !!m.orcidId)}
          >
            <Popup>
              <div style={{ fontFamily: "Inter, sans-serif", minWidth: 120 }}>
                <div style={{ fontWeight: 700, color: "#00131c", fontSize: 13 }}>
                  {m.displayName || "Reef Explorer"}
                </div>
                {m.orcidId && (
                  <div style={{ fontSize: 10, color: "#A6CE39", marginTop: 2 }}>
                    ✓ Verified Researcher
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {markers.length > 0 && <FitBounds markers={markers} />}
      </MapContainer>

      {/* ── Legend ── */}
      <div
        className="absolute bottom-2 left-2 flex flex-col gap-1 pointer-events-none"
        style={{ zIndex: 500 }}
      >
        <div className="flex items-center gap-1.5">
          <span
            style={{
              width: 10, height: 10, borderRadius: "50%",
              background: "#83eef0", border: "2px solid #83eef0",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 9, color: "#d4e9f3aa", fontFamily: "Inter,sans-serif" }}>
            Reef member
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            style={{
              width: 10, height: 10, borderRadius: "50%",
              background: "#83eef0", border: "2px solid #A6CE39",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 9, color: "#d4e9f3aa", fontFamily: "Inter,sans-serif" }}>
            ORCID verified
          </span>
        </div>
      </div>

      {/* ── Marker count badge ── */}
      {markers.length > 0 && (
        <div
          className="absolute top-2 right-2 pointer-events-none"
          style={{ zIndex: 500 }}
        >
          <div
            style={{
              background: "rgba(0,19,28,0.8)",
              border: "1px solid rgba(131,238,240,0.25)",
              borderRadius: 8,
              padding: "2px 7px",
              fontSize: 10,
              color: "#83eef0",
              fontFamily: "Inter,sans-serif",
              fontWeight: 600,
            }}
          >
            {markers.length} {markers.length === 1 ? "member" : "members"}
          </div>
        </div>
      )}
    </div>
  );
}
