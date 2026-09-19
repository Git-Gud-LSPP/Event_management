import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Globe,
  Camera,
  CakeSlice,
  Utensils,
  Flower2,
  Music,
  Palette,
  Hotel,
  Navigation,
  Star,
  ExternalLink,
} from "lucide-react";

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


const categories = [
  { name: "Photographers", value: "photographer", icon: Camera },
  { name: "Bakeries",      value: "bakery",        icon: CakeSlice },
  { name: "Catering",      value: "catering",      icon: Utensils },
  { name: "Florists",      value: "florist",       icon: Flower2 },
  { name: "Entertainment", value: "entertainment", icon: Music },
  { name: "Decoration",    value: "decoration",    icon: Palette },
  { name: "Hotels",        value: "hotel",         icon: Hotel },
];

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

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(2)} km`;
}

function formatRoadDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

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
        zoomControl: true,
      });

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
            background: #4f46e5;
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
           <div style="color:#6b7280;font-size:12px;">${vendor.address || ""}</div>`,
          { maxWidth: 200 }
        );

      // User marker + route line
      if (userLatLng) {
        const userIcon = L.divIcon({
          html: `
            <div style="
              background: #10b981;
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
          color: "#a5b4fc",
          weight: 2,
          opacity: 0.55,
          dashArray: "6, 8",
        }).addTo(map);

        // Fetch the real road route via our backend -> OSRM
        try {
          const [uLat, uLon] = userLatLng;
          const [vLat, vLon] = vendorLatLng;
          const resp = await fetch(
            `/api/vendors/route?fromLat=${uLat}&fromLon=${uLon}&toLat=${vLat}&toLon=${vLon}`
          );

          if (resp.ok) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = await resp.json() as { distance_m: number; duration_s: number; geometry: any };

            // Remove placeholder and draw solid road-following polyline
            placeholder.remove();
            L.geoJSON(data.geometry, {
              style: {
                color: "#4f46e5",
                weight: 4,
                opacity: 0.85,
              },
            }).addTo(map);

            // Inform parent with real road stats
            onRouteLoaded({ distance_m: data.distance_m, duration_s: data.duration_s });
          } else {
            // OSRM returned an error -- solidify the placeholder, fall back to Haversine
            placeholder.setStyle({ color: "#4f46e5", opacity: 0.7 });
            onRouteLoaded(null);
          }
        } catch {
          // Network error -- solidify the placeholder, fall back to Haversine
          placeholder.setStyle({ color: "#4f46e5", opacity: 0.7 });
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

const InfoRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="py-4 border-b border-slate-100 last:border-0">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
      {label}
    </p>
    <div className="text-slate-800">{children}</div>
  </div>
);

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

  // Guard: if someone navigates directly without state, go back
  if (!vendor) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <MapPin size={40} className="text-slate-300" />
        <h2 className="text-lg font-bold text-slate-700">Vendor not found</h2>
        <p className="text-sm text-slate-500">
          Please go back and select a vendor from the list.
        </p>
        <button
          onClick={() => navigate("/vendors")}
          className="mt-2 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <ArrowLeft size={16} />
          Back to Vendors
        </button>
      </div>
    );
  }

  // Haversine distance -- used as initial display value until OSRM responds
  const distanceKm =
    userLocation != null
      ? haversineKm(
          userLocation.latitude,
          userLocation.longitude,
          vendor.latitude,
          vendor.longitude
        )
      : vendor.distance;

  const category = categories.find((c) => c.value === vendor.type);
  const Icon = category?.icon ?? Camera;

  // Validate website URL before rendering
  let validWebsite: string | null = null;
  if (vendor.website) {
    try {
      const parsed = new URL(vendor.website);
      if (["http:", "https:"].includes(parsed.protocol)) {
        validWebsite = parsed.href;
      }
    } catch {
      // Not a valid URL
    }
  }

  // Road-route state:
  //   undefined  = still loading (map not yet called back)
  //   null       = OSRM failed -- show Haversine fallback
  //   RouteInfo  = real road distance + duration
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null | undefined>(undefined);
  const routeLoading = routeInfo === undefined;

  const [mapError] = useState(false);
  const hasCoordinates =
    typeof vendor.latitude === "number" &&
    typeof vendor.longitude === "number" &&
    !isNaN(vendor.latitude) &&
    !isNaN(vendor.longitude);

  return (
    <div className="p-8 bg-[#FBFBF9] min-h-screen">
      <div className="max-w-7xl mx-auto">
      {/* -- Back button -- */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Vendors
      </button>

      {/* -- Page title badge -- */}
      <div className="mb-3 inline-block rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-bold tracking-wide text-indigo-700">
        VENDOR DETAILS
      </div>

      {/* -- Two-column layout -- */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* LEFT -- Info */}
        <div className="w-full lg:w-[420px] lg:shrink-0">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

            {/* Category pill + icon header */}
            <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Icon size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  {category?.name ?? vendor.type}
                </p>
                <h1 className="text-xl font-black tracking-tight text-slate-950 leading-snug">
                  {vendor.name}
                </h1>
              </div>
            </div>

            {/* Info rows */}
            <div className="px-6">
              {/* Address */}
              <InfoRow label="Address">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                  <span className="text-sm leading-relaxed">
                    {vendor.address || "Address not available"}
                  </span>
                </div>
              </InfoRow>

              {/* Phone */}
              <InfoRow label="Contact Number">
                {vendor.phone ? (
                  <a
                    href={`tel:${vendor.phone}`}
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <Phone size={15} />
                    {vendor.phone}
                  </a>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-slate-400">
                    <Phone size={15} />
                    Phone number not available
                  </span>
                )}
              </InfoRow>

              {/* Website */}
              <InfoRow label="Website">
                {validWebsite ? (
                  <a
                    href={validWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <ExternalLink size={15} />
                    Visit Website
                  </a>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-slate-400">
                    <Globe size={15} />
                    No website available
                  </span>
                )}
              </InfoRow>

              {/* Rating -- only if the backend returns a real value */}
              <InfoRow label="Rating">
                {typeof vendor.rating === "number" && vendor.rating > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <Star
                      size={16}
                      className="fill-amber-400 text-amber-400"
                    />
                    <span className="text-sm font-semibold text-slate-800">
                      {vendor.rating.toFixed(1)}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">Not available</span>
                )}
              </InfoRow>

              {/* Distance -- updates once OSRM responds */}
              <InfoRow label="Distance from You">
                <div className="flex items-center gap-2">
                  <Navigation size={16} className="shrink-0 text-indigo-500" />
                  {!userLocation ? (
                    <span className="text-lg font-bold text-slate-950">
                      {formatDistance(distanceKm)}
                      <span className="ml-1 text-xs font-normal text-slate-400">(location unavailable)</span>
                    </span>
                  ) : routeLoading ? (
                    <span className="text-sm text-slate-400 animate-pulse">Calculating road distance...</span>
                  ) : routeInfo ? (
                    <span className="text-lg font-bold text-slate-950">
                      {formatRoadDistance(routeInfo.distance_m)}
                      <span className="ml-2 text-sm font-medium text-slate-500">
                        ~{Math.round(routeInfo.duration_s / 60)} min drive
                      </span>
                    </span>
                  ) : (
                    <span className="text-lg font-bold text-slate-950">
                      {formatDistance(distanceKm)}
                      <span className="ml-1 text-xs font-normal text-slate-400">(straight-line)</span>
                    </span>
                  )}
                </div>
              </InfoRow>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              {vendor.phone && (
                <a
                  href={`tel:${vendor.phone}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  <Phone size={15} />
                  Call
                </a>
              )}
              {validWebsite && (
                <a
                  href={validWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ExternalLink size={15} />
                  Website
                </a>
              )}
              {!vendor.phone && !validWebsite && (
                <p className="w-full text-center text-sm text-slate-400 py-1">
                  No contact information available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT -- Map */}
        <div className="flex-1">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

            {/* Map header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-indigo-600" />
                <span className="font-semibold text-slate-800">Location</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow" />
                  Your Location
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-3 w-3 rounded-full border-2 border-white shadow"
                    style={{ background: "#4f46e5" }}
                  />
                  {vendor.name}
                </span>
              </div>
            </div>

            {/* Map body */}
            <div className="relative" style={{ height: "440px" }}>
              {!hasCoordinates || mapError ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center p-8">
                  <MapPin size={36} className="text-slate-300" />
                  <p className="font-semibold text-slate-600">
                    Location unavailable
                  </p>
                  <p className="text-sm text-slate-400">
                    This vendor's coordinates could not be loaded.
                  </p>
                </div>
              ) : (
                <VendorMap
                  userLocation={userLocation}
                  vendor={vendor}
                  key={vendor.id}
                  onRouteLoaded={(info) => setRouteInfo(info ?? null)}
                />
              )}

              {!userLocation && hasCoordinates && (
                <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700 shadow">
                  Your location is unavailable -- only the vendor is shown.
                </div>
              )}
            </div>

            {/* Distance / route banner below map */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
              {!userLocation ? (
                <span className="text-sm text-slate-500">Straight-line distance</span>
              ) : routeLoading ? (
                <span className="flex items-center gap-2 text-sm text-slate-400">
                  <svg className="h-4 w-4 animate-spin text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Calculating road distance...
                </span>
              ) : routeInfo ? (
                <span className="text-sm font-medium text-emerald-600">Road distance</span>
              ) : (
                <span className="text-sm text-slate-500">Straight-line distance</span>
              )}

              <span className="flex items-center gap-1.5 font-bold text-slate-950">
                <Navigation size={15} className="text-indigo-500" />
                {routeInfo
                  ? `${formatRoadDistance(routeInfo.distance_m)}  /  ~${Math.round(routeInfo.duration_s / 60)} min`
                  : formatDistance(distanceKm)}
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default VendorDetailPage;
