import "leaflet/dist/leaflet.css"; // only this page renders a map
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../../services/api";
import { getStoredUser } from "../../services/authApi";
import { useEventSelection } from "../../components/EventPicker";
import { addEventVendor } from "../documents/api";
import { Camera, CakeSlice, Utensils, Flower2, Music, Palette, Hotel } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type Vendor = {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  image?: string | null;
  distance: number;
  rating?: number | null;
};

type UserLocation = {
  latitude: number;
  longitude: number;
};

type RouteInfo = {
  distance_m: number;
  duration_s: number;
};

/* ------------------------------------------------------------------ */
/*  Category metadata (same as VendorsPage)                            */
/* ------------------------------------------------------------------ */

const categories = [
  { name: "Photographers", value: "photographer", icon: Camera },
  { name: "Bakeries",      value: "bakery",        icon: CakeSlice },
  { name: "Catering",      value: "catering",      icon: Utensils },
  { name: "Florists",      value: "florist",       icon: Flower2 },
  { name: "Entertainment", value: "entertainment", icon: Music },
  { name: "Decoration",    value: "decoration",    icon: Palette },
  { name: "Hotels",        value: "hotel",         icon: Hotel },
];

/* ------------------------------------------------------------------ */
/*  Haversine distance (km) - used as initial / fallback value         */
/* ------------------------------------------------------------------ */

function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ------------------------------------------------------------------ */
/*  Format distance for display                                         */
/* ------------------------------------------------------------------ */

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(2)} km`;
}

function formatRoadDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

/* ------------------------------------------------------------------ */
/*  Map component (uses Leaflet directly via useEffect)                 */
/*                                                                      */
/*  We load Leaflet imperatively to avoid SSR / import-order issues.    */
/* ------------------------------------------------------------------ */

type MapProps = {
  userLocation: UserLocation | null;
  vendor: Vendor;
  onRouteLoaded: (info: RouteInfo | null) => void;
};

const VendorMap = ({ userLocation, vendor, onRouteLoaded }: MapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof import("leaflet")["map"]> | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Leaflet must only be initialised once per container
    if (mapRef.current) return;

    import("leaflet").then(async (L) => {
      // Fix default marker icon paths broken by bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const vendorLatLng: [number, number] = [vendor.latitude, vendor.longitude];
      const userLatLng: [number, number] | null = userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : null;

      // Initialise map
      const map = L.map(mapContainerRef.current!, {
        scrollWheelZoom: true,
        zoomControl: false,
      });
      L.control.zoom({ position: "topright" }).addTo(map);

      mapRef.current = map;

      // OpenStreetMap tiles (free, no API key)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Vendor marker
      const vendorIcon = L.divIcon({
        html: `
          <div style="
            background: #16231C;
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            width: 28px;
            height: 28px;
            transform: rotate(-45deg);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>
        `,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -30],
      });

      L.marker(vendorLatLng, { icon: vendorIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-weight:600;font-size:13px;">${vendor.name}</div>
           <div style="color:#5C6A62;font-size:12px;">${vendor.address || ""}</div>`,
          { maxWidth: 200 }
        );

      // User marker + route line
      if (userLatLng) {
        const userIcon = L.divIcon({
          html: `
            <div style="
              background: #3F8A64;
              border: 3px solid white;
              border-radius: 50%;
              width: 22px;
              height: 22px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>
          `,
          className: "",
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          popupAnchor: [0, -14],
        });

        L.marker(userLatLng, { icon: userIcon })
          .addTo(map)
          .bindPopup(
            `<div style="font-weight:600;font-size:13px;">Your Location</div>`,
            { maxWidth: 200 }
          );

        // Fit map to show both markers while route loads
        const bounds = L.latLngBounds([userLatLng, vendorLatLng]);
        map.fitBounds(bounds, { padding: [50, 50] });

        // Draw a light dashed placeholder line immediately
        const placeholder = L.polyline([userLatLng, vendorLatLng], {
          color: "#9C8BDB",
          weight: 2,
          opacity: 0.7,
          dashArray: "6, 8",
        }).addTo(map);

        // Fetch the real road route via our backend -> OSRM
        try {
          const [uLat, uLon] = userLatLng;
          const [vLat, vLon] = vendorLatLng;
          const resp = await fetch(
            `${API_BASE}/vendors/route?fromLat=${uLat}&fromLon=${uLon}&toLat=${vLat}&toLon=${vLon}`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("authToken") || ""}` } }
          );

          if (resp.ok) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = await resp.json() as { distance_m: number; duration_s: number; geometry: any };

            // Remove placeholder and draw solid road-following polyline
            placeholder.remove();
            L.geoJSON(data.geometry, {
              style: {
                color: "#16231C",
                weight: 4,
                opacity: 0.85,
              },
            }).addTo(map);

            // Inform parent with real road stats
            onRouteLoaded({ distance_m: data.distance_m, duration_s: data.duration_s });
          } else {
            // OSRM returned an error -- solidify the placeholder, fall back to Haversine
            placeholder.setStyle({ color: "#16231C", opacity: 0.7 });
            onRouteLoaded(null);
          }
        } catch {
          // Network error -- solidify the placeholder, fall back to Haversine
          placeholder.setStyle({ color: "#16231C", opacity: 0.7 });
          onRouteLoaded(null);
        }
      } else {
        // No user location -- just centre on the vendor
        map.setView(vendorLatLng, 15);
        onRouteLoaded(null);
      }
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mapContainerRef}
      className="h-full w-full rounded-xl"
      style={{ minHeight: "100%" }}
    />
  );
};

/* ------------------------------------------------------------------ */
/*  Main VendorDetailPage                                               */
/* ------------------------------------------------------------------ */

const mono = "font-mono text-[10.5px] tracking-[.05em]";

// Puts this search result on the selected event's procurement pipeline (Documents page),
// where documents and the assistant can use its details.
function AddToEventButton({ vendor }: { vendor: Vendor }) {
  const { selected } = useEventSelection();
  const [state, setState] = useState<"idle" | "saving" | "added" | string>("idle");

  const add = async () => {
    if (!selected) return;
    setState("saving");
    try {
      await addEventVendor(selected._id, {
        name: vendor.name,
        type: vendor.type,
        phone: vendor.phone ?? undefined,
        website: vendor.website ?? undefined,
        address: vendor.address ?? undefined,
        latitude: vendor.latitude,
        longitude: vendor.longitude,
        sourceId: vendor.id,
      });
      setState("added");
    } catch (e) {
      const msg = (e as Error).message;
      setState(/already/i.test(msg) ? "added" : msg);
    }
  };

  if (!selected) return null;
  const added = state === "added";
  const failed = !["idle", "saving", "added"].includes(state);
  return (
    <button
      onClick={add}
      disabled={state === "saving" || added}
      title={failed ? state : `Add to ${selected.title}`}
      className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm transition-colors ${
        added ? "bg-accent-soft text-accent" : failed ? "bg-surface text-danger ring-1 ring-inset ring-danger/30" : "bg-surface text-ink hover:bg-accent-soft"
      }`}
    >
      <span className="font-mono text-[13px]">{added ? "✓" : failed ? "↻" : "+"}</span>
      {added ? `On ${selected.title}` : state === "saving" ? "Adding…" : failed ? "Retry add" : `Add to ${selected.title}`}
    </button>
  );
}

const VendorDetailPage = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();

  // Data passed via React Router state from VendorsPage
  const state = routerLocation.state as {
    vendor: Vendor;
    userLocation: UserLocation | null;
  } | null;

  const vendor = state?.vendor ?? null;
  const userLocation = state?.userLocation ?? null;

  // Road-route state:
  //   undefined  = still loading (map not yet called back)
  //   null       = OSRM failed -- show Haversine fallback
  //   RouteInfo  = real road distance + duration
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null | undefined>(undefined);

  // Guard: if someone navigates directly without state, go back
  if (!vendor) {
    return (
      <div className="grid min-h-[70vh] place-items-center p-8">
        <div className="flex max-w-[380px] flex-col items-center gap-2.5 text-center">
          <div className="font-mono text-xs tracking-[.04em] text-ink-3">VENDOR · 404</div>
          <h1 className="text-[32px] font-medium leading-[1.05] tracking-[-0.04em] text-ink">Vendor not found</h1>
          <p className="text-[15px] leading-normal text-ink-2 text-pretty">
            This link has expired or was opened directly. Pick the vendor again from your search results.
          </p>
          <button
            onClick={() => navigate("/vendors")}
            className="mt-2.5 rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-ink-hover"
          >
            ← Back to vendors
          </button>
        </div>
      </div>
    );
  }

  // Haversine distance -- used as initial display value until OSRM responds
  const distanceKm =
    userLocation != null
      ? haversineKm(userLocation.latitude, userLocation.longitude, vendor.latitude, vendor.longitude)
      : vendor.distance;

  const category = categories.find((c) => c.value === vendor.type);
  const typeLabel = category?.name ?? vendor.type;

  // Validate website URL before rendering
  let validWebsite: string | null = null;
  if (vendor.website) {
    try {
      const parsed = new URL(vendor.website);
      if (["http:", "https:"].includes(parsed.protocol)) validWebsite = parsed.href;
    } catch {
      // Not a valid URL
    }
  }

  const hasCoordinates =
    typeof vendor.latitude === "number" &&
    typeof vendor.longitude === "number" &&
    !isNaN(vendor.latitude) &&
    !isNaN(vendor.longitude);

  const telHref = vendor.phone ? `tel:${vendor.phone.replace(/[^\d+]/g, "")}` : "";
  const hasRating = typeof vendor.rating === "number" && vendor.rating > 0;

  // One place decides every distance label on the page
  const rs = !userLocation ? "noLocation" : routeInfo === undefined ? "loading" : routeInfo ? "road" : "straight";
  const straight = formatDistance(distanceKm);
  const road = routeInfo ? formatRoadDistance(routeInfo.distance_m) : "";
  const mins = routeInfo ? `~${Math.round(routeInfo.duration_s / 60)} min drive` : "";
  const route = {
    road:       { tag: "ROAD DISTANCE · OSRM", dot: "bg-live", line: `${road} · ${mins}`, label: "DISTANCE FROM YOU · BY ROAD", big: road, sub: mins },
    loading:    { tag: "CALCULATING ROUTE", dot: "bg-ai animate-pulse", line: `${straight} straight-line`, label: "DISTANCE FROM YOU", big: "", sub: "" },
    straight:   { tag: "STRAIGHT-LINE · ROUTE UNAVAILABLE", dot: "bg-line-strong", line: straight, label: "DISTANCE FROM YOU · STRAIGHT-LINE", big: straight, sub: "as the crow flies" },
    noLocation: { tag: "STRAIGHT-LINE · FROM SEARCH POINT", dot: "bg-line-strong", line: straight, label: "DISTANCE FROM SEARCH POINT", big: straight, sub: "your location is off" },
  }[rs];

  const rows: { k: string; v: string; href?: string; external?: boolean }[] = [
    { k: "TYPE", v: typeLabel },
    { k: "ADDRESS", v: vendor.address || "Not listed" },
    vendor.phone ? { k: "PHONE", v: vendor.phone, href: telHref } : { k: "PHONE", v: "Not listed" },
    validWebsite
      ? { k: "WEBSITE", v: validWebsite.replace(/^https?:\/\//, "").replace(/\/$/, ""), href: validWebsite, external: true }
      : { k: "WEBSITE", v: "Not listed" },
    { k: "RATING", v: hasRating ? `★ ${vendor.rating!.toFixed(1)}` : "Not available" },
  ];
  const muted = (v: string) => v === "Not listed" || v === "Not available";

  return (
    <div className="mx-auto max-w-[1320px]">
      <button onClick={() => navigate(-1)} className="mb-[18px] text-[13px] text-ink-3 hover:text-ink">
        ← Back to vendors
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div className="flex min-w-0 items-end gap-4">
          {vendor.image ? (
            <img src={vendor.image} alt="" className="h-[72px] w-[72px] flex-none rounded-[14px] object-cover" />
          ) : (
            <span
              className="grid h-[72px] w-[72px] flex-none place-items-center rounded-[14px] font-mono text-[9px] tracking-[.04em] text-ink-3"
              style={{ background: "repeating-linear-gradient(135deg,var(--color-sunken) 0 6px,var(--color-surface) 6px 12px)" }}
            >
              {typeLabel.slice(0, 5).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="font-mono text-xs tracking-[.04em] text-ink-3">VENDOR · {typeLabel.toUpperCase()}</div>
            <h1 className="mb-1.5 mt-2.5 text-[clamp(30px,3.4vw,44px)] font-medium leading-none tracking-[-0.045em] text-ink">
              {vendor.name}
            </h1>
            {vendor.address && <div className="text-[15px] text-ink-2">{vendor.address}</div>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {validWebsite && (
            <a
              href={validWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-[7px] whitespace-nowrap rounded-full bg-surface px-4 py-2.5 text-sm text-ink hover:bg-accent-soft"
            >
              Website <span className="text-xs text-ink-3">↗</span>
            </a>
          )}
          {getStoredUser()?.role === "organizer" && <AddToEventButton vendor={vendor} />}
          {vendor.phone && (
            <a href={telHref} className="whitespace-nowrap rounded-full bg-ink px-[18px] py-2.5 text-sm text-paper hover:bg-ink-hover">
              Call {vendor.phone}
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-stretch gap-3">
        {/* Map */}
        <div className="flex min-w-0 flex-[1_1_520px] flex-col overflow-hidden rounded-2xl bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-[18px] py-3.5">
            <span className="text-[15px] font-medium text-ink">Location</span>
            <div className="flex flex-wrap gap-3.5 text-xs text-ink-3">
              {userLocation && (
                <span className="flex items-center gap-1.5"><span className="h-[9px] w-[9px] rounded-full bg-live" />You</span>
              )}
              <span className="flex items-center gap-1.5"><span className="h-[9px] w-[9px] rounded-full bg-ink" />{vendor.name}</span>
            </div>
          </div>

          <div className="relative min-h-[440px] flex-1">
            {hasCoordinates ? (
              <div className="absolute inset-0">
                <VendorMap
                  userLocation={userLocation}
                  vendor={vendor}
                  key={vendor.id}
                  onRouteLoaded={(info) => setRouteInfo(info ?? null)}
                />
              </div>
            ) : (
              <div className="grid h-full min-h-[440px] place-items-center p-8 text-center text-sm text-ink-3">
                This vendor's coordinates could not be loaded.
              </div>
            )}
            {!userLocation && hasCoordinates && (
              <div className="absolute inset-x-3 bottom-3 z-[1000] flex items-center gap-2.5 rounded-xl bg-warn-soft px-3.5 py-2.5 text-[13px] text-warn">
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-warn" />
                Your location is off — only the vendor is shown.
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft bg-soft px-[18px] py-3.5">
            <span className={`flex items-center gap-2 ${mono} ${rs === "road" ? "text-accent" : "text-ink-3"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${route.dot}`} />
              {route.tag}
            </span>
            <span className="whitespace-nowrap font-mono text-[13px] text-ink">{route.line}</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex min-w-[min(100%,320px)] max-w-full flex-[1_1_340px] flex-col gap-3">
          <div className="rounded-2xl bg-ink px-[18px] pb-4 pt-[18px] text-paper">
            <div className={`${mono} opacity-70`}>{route.label}</div>
            {rs === "loading" ? (
              <div className="mt-3 animate-pulse text-[15px] opacity-80">Calculating road distance…</div>
            ) : (
              <div className="mt-2.5 flex flex-wrap items-baseline gap-2.5">
                <span className="text-[40px] font-medium leading-none tracking-[-0.045em]">{route.big}</span>
                <span className="text-sm opacity-80">{route.sub}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden rounded-2xl bg-surface">
            <div className="border-b border-line-soft px-[18px] py-3.5 text-[15px] font-medium text-ink">Details</div>
            {rows.map((r) => (
              <div key={r.k} className="grid grid-cols-[92px_minmax(0,1fr)] items-baseline gap-3 border-b border-line-soft px-[18px] py-3.5">
                <span className={`${mono} text-ink-3`}>{r.k}</span>
                {r.href ? (
                  <a
                    href={r.href}
                    {...(r.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="text-sm leading-[1.45] text-accent [overflow-wrap:anywhere] hover:text-ink"
                  >
                    {r.v}
                  </a>
                ) : (
                  <span className={`text-sm leading-[1.45] [overflow-wrap:anywhere] ${muted(r.v) ? "text-ink-3" : "text-ink"}`}>{r.v}</span>
                )}
              </div>
            ))}
            {!vendor.phone && !validWebsite && (
              <div className="px-[18px] py-3.5 text-[13px] leading-normal text-ink-3">
                No phone or website listed. Add it to an event and the assistant can look for contact details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDetailPage;
