import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, WMSTileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Fix Leaflet default icon paths broken by Vite ────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── NOAA NCRMP Atlantic Monitoring Regions ───────────────────────────────────
// Source: MSE-NCCOS-NOAA/NCRMP_benthics (Atlantic regions, 2013-2025)
const NCRMP_REGIONS = [
  {
    id: "FLK",
    name: "Florida Keys",
    lat: 24.55, lng: -81.39,
    years: "2014–2024",
    jurisdiction: "FL, USA",
    metrics: ["benthic cover", "coral density", "disease & bleaching prevalence", "old/recent mortality", "ESA corals"],
  },
  {
    id: "SEFCRI",
    name: "SE Florida (SEFCRI)",
    lat: 26.02, lng: -80.09,
    years: "2014–2024",
    jurisdiction: "FL, USA",
    metrics: ["benthic cover", "coral density", "disease & bleaching prevalence", "old/recent mortality", "ESA corals"],
  },
  {
    id: "Tort",
    name: "Tortugas",
    lat: 24.62, lng: -82.87,
    years: "2014–2024",
    jurisdiction: "FL, USA",
    metrics: ["benthic cover", "coral density", "disease prevalence", "old/recent mortality"],
  },
  {
    id: "FGBNMS",
    name: "Flower Garden Banks NMS",
    lat: 27.91, lng: -93.60,
    years: "2013–2024",
    jurisdiction: "TX, USA (Gulf of Mexico)",
    metrics: ["benthic cover", "coral density", "species richness / diversity", "disease & bleaching prevalence", "old/recent mortality", "invertebrate density", "rugosity"],
  },
  {
    id: "PRICO",
    name: "Puerto Rico",
    lat: 18.20, lng: -66.50,
    years: "2014–2025",
    jurisdiction: "Puerto Rico, USA",
    metrics: ["benthic cover", "coral density", "disease & bleaching prevalence", "old/recent mortality", "ESA corals", "invertebrate density"],
  },
  {
    id: "STTSTJ",
    name: "USVI — St. Thomas / St. John",
    lat: 18.33, lng: -64.97,
    years: "2013–2024",
    jurisdiction: "US Virgin Islands",
    metrics: ["benthic cover", "coral density", "disease & bleaching prevalence", "old/recent mortality", "ESA corals", "invertebrate density"],
  },
  {
    id: "STX",
    name: "USVI — St. Croix",
    lat: 17.73, lng: -64.73,
    years: "2013–2024",
    jurisdiction: "US Virgin Islands",
    metrics: ["benthic cover", "coral density", "disease & bleaching prevalence", "old/recent mortality", "ESA corals", "invertebrate density"],
  },
  {
    id: "MIR",
    name: "Martin-Reefs / Marquesas",
    lat: 24.55, lng: -82.12,
    years: "2022–2024",
    jurisdiction: "FL, USA",
    metrics: ["benthic cover", "coral demographics", "invertebrate density", "rugosity"],
  },
] as const;

// ─── NCRMP station icon — hexagonal science pin (NOAA amber) ──────────────────
const NCRMP_ICON = L.divIcon({
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -13],
  html: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <polygon points="10,1 18.66,5.5 18.66,14.5 10,19 1.34,14.5 1.34,5.5"
      fill="#FFA040" stroke="#fff" stroke-width="1.5"/>
    <text x="10" y="13.5" text-anchor="middle" font-size="9" fill="#fff" font-weight="bold" font-family="sans-serif">N</text>
  </svg>`,
});

// ─── Custom coral-teal member pin ─────────────────────────────────────────────
function makePin(hasOrcid = false) {
  const border = hasOrcid ? "#A6CE39" : "#83eef0";
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:#83eef0;
      border:2.5px solid ${border};
      box-shadow:0 0 6px #83eef088, 0 2px 6px #00000055;
    "></div>`,
  });
}

// ─── Auto-fit to markers ──────────────────────────────────────────────────────
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface MapMarker {
  id: string;
  displayName: string;
  avatarUrl: string;
  latitude: number;
  longitude: number;
  orcidId: string;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ReefMap({ compact = false }: { compact?: boolean }) {
  const [showNcrmp, setShowNcrmp] = useState(true);
  const [showDhw, setShowDhw] = useState(false);

  const { data: markers = [] } = useQuery<MapMarker[]>({
    queryKey: ["/api/map/markers"],
    refetchInterval: 60_000,
  });

  return (
    <div
      data-testid="reef-map"
      className="relative w-full overflow-hidden"
      style={{
        height: compact ? 200 : 280,
        borderRadius: 16,
        border: "1px solid rgba(131,238,240,0.12)",
      }}
    >
      <MapContainer
        center={[22, -72]}
        zoom={3}
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

        {/* ── Allen Coral Atlas — benthic map overlay ── */}
        <WMSTileLayer
          url="https://allencoralatlas.org/geoserver/ows"
          layers="coral-atlas:benthic_map"
          format="image/png"
          transparent={true}
          opacity={0.5}
          version="1.1.1"
          attribution="© Allen Coral Atlas"
        />

        {/* ── NOAA Coral Reef Watch — Degree Heating Weeks (optional toggle) ── */}
        {showDhw && (
          <WMSTileLayer
            url="https://coastwatch.pfeg.noaa.gov/erddap/wms/NOAA_DHW/request"
            layers="NOAA_DHW:CRW_DHW"
            format="image/png"
            transparent={true}
            opacity={0.65}
            version="1.3.0"
            attribution="NOAA CRW"
          />
        )}

        {/* ── NCRMP monitoring region stations ── */}
        {showNcrmp &&
          NCRMP_REGIONS.map((r) => (
            <Marker key={r.id} position={[r.lat, r.lng]} icon={NCRMP_ICON}>
              <Popup maxWidth={260} minWidth={200}>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#0d2c3a", lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#0d2c3a", marginBottom: 3 }}>
                    🔬 NCRMP — {r.name}
                  </div>
                  <div style={{ color: "#5a7a8a", fontSize: 10, marginBottom: 6 }}>
                    {r.jurisdiction} · {r.years}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 10, color: "#3d6070", marginBottom: 3 }}>
                    Benthic metrics collected:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 14, color: "#3d6070", fontSize: 10 }}>
                    {r.metrics.map((m) => <li key={m}>{m}</li>)}
                  </ul>
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <a
                      href="https://ncrmp.coralreef.noaa.gov/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 10, color: "#FF7A1A", fontWeight: 600, textDecoration: "underline" }}
                    >
                      NOAA NCRMP Viz Tool ↗
                    </a>
                    <a
                      href="https://github.com/MSE-NCCOS-NOAA/NCRMP_benthics"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 10, color: "#888", fontWeight: 600, textDecoration: "underline" }}
                    >
                      GitHub Data ↗
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* ── Community member pins ── */}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.latitude, m.longitude]} icon={makePin(!!m.orcidId)}>
            <Popup>
              <div style={{ fontFamily: "Inter, sans-serif", minWidth: 120, fontSize: 12 }}>
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

      {/* ── Layer toggle controls ── */}
      <div
        className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-auto"
        style={{ zIndex: 500 }}
      >
        <button
          data-testid="toggle-ncrmp-layer"
          onClick={() => setShowNcrmp((v) => !v)}
          style={{
            background: showNcrmp ? "rgba(255,122,26,0.85)" : "rgba(0,19,28,0.75)",
            border: `1px solid ${showNcrmp ? "#FFA040" : "rgba(255,160,64,0.4)"}`,
            borderRadius: 6,
            padding: "2px 6px",
            fontSize: 9,
            color: showNcrmp ? "#fff" : "#FFA040cc",
            fontFamily: "Inter,sans-serif",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            letterSpacing: "0.04em",
          }}
        >
          <span style={{ fontSize: 9 }}>⬡</span> NCRMP
        </button>
        <button
          data-testid="toggle-dhw-layer"
          onClick={() => setShowDhw((v) => !v)}
          style={{
            background: showDhw ? "rgba(220,50,50,0.85)" : "rgba(0,19,28,0.75)",
            border: `1px solid ${showDhw ? "#e05555" : "rgba(220,80,80,0.4)"}`,
            borderRadius: 6,
            padding: "2px 6px",
            fontSize: 9,
            color: showDhw ? "#fff" : "#e05555cc",
            fontFamily: "Inter,sans-serif",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            letterSpacing: "0.04em",
          }}
        >
          <span>🌡</span> DHW
        </button>
      </div>

      {/* ── Legend ── */}
      <div
        className="absolute bottom-2 left-2 flex flex-col gap-1 pointer-events-none"
        style={{ zIndex: 500 }}
      >
        <div className="flex items-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 20 20">
            <polygon points="10,1 18.66,5.5 18.66,14.5 10,19 1.34,14.5 1.34,5.5" fill="#FFA040" stroke="#fff" strokeWidth="1.5"/>
          </svg>
          <span style={{ fontSize: 8.5, color: "#d4e9f3aa", fontFamily: "Inter,sans-serif" }}>
            NCRMP station
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ width:9,height:9,borderRadius:"50%",background:"#83eef0",border:"2px solid #83eef0",display:"inline-block" }}/>
          <span style={{ fontSize: 8.5, color: "#d4e9f3aa", fontFamily: "Inter,sans-serif" }}>Member</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ width:9,height:9,borderRadius:"50%",background:"#83eef0",border:"2px solid #A6CE39",display:"inline-block" }}/>
          <span style={{ fontSize: 8.5, color: "#d4e9f3aa", fontFamily: "Inter,sans-serif" }}>ORCID verified</span>
        </div>
      </div>

      {/* ── Badge ── */}
      <div
        className="absolute top-2 right-2 pointer-events-none"
        style={{ zIndex: 500 }}
      >
        <div
          style={{
            background: "rgba(0,19,28,0.8)",
            border: "1px solid rgba(255,160,64,0.35)",
            borderRadius: 8,
            padding: "2px 7px",
            fontSize: 9,
            color: "#FFA040",
            fontFamily: "Inter,sans-serif",
            fontWeight: 600,
          }}
        >
          {NCRMP_REGIONS.length} NCRMP sites
          {markers.length > 0 && (
            <span style={{ color: "#83eef0" }}> · {markers.length} member{markers.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </div>
  );
}
