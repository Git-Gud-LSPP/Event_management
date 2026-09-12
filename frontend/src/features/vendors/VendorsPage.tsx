import { useState, useRef, useEffect, type ElementType } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  CakeSlice,
  Utensils,
  Flower2,
  Music,
  Palette,
  Hotel,
  Search,
  MapPin,
  ChevronDown,
  Navigation,
  X,
  Loader2,
} from "lucide-react";

const categories = [
  { name: "Photographers", value: "photographer", icon: Camera },
  { name: "Bakeries",      value: "bakery",       icon: CakeSlice },
  { name: "Catering",      value: "catering",     icon: Utensils },
  { name: "Florists",      value: "florist",      icon: Flower2 },
  { name: "Entertainment", value: "entertainment",icon: Music },
  { name: "Decoration",    value: "decoration",   icon: Palette },
  { name: "Hotels",        value: "hotel",        icon: Hotel },
];

type Vendor = {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  website?: string;
  image?: string;
  distance: number;
};

/* ------------------------------------------------------------------ */
/*  VendorImage                                                         */
/* ------------------------------------------------------------------ */
type VendorImageProps = { src: string | null; name: string; Icon: ElementType };

const NoImageFallback = ({ Icon }: { Icon: ElementType }) => (
  <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
    <Icon size={32} />
    <span className="text-xs font-medium">No image available</span>
  </div>
);

const VendorImage = ({ src, name, Icon }: VendorImageProps) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="mb-5 h-32 overflow-hidden rounded-lg bg-slate-100">
        <NoImageFallback Icon={Icon} />
      </div>
    );
  }
  return (
    <div className="mb-5 h-32 overflow-hidden rounded-lg bg-slate-100">
      <img src={src} alt={name} className="h-full w-full object-cover" onError={() => setFailed(true)} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Session-storage snapshot                                            */
/* ------------------------------------------------------------------ */
const SESSION_KEY = "vendorsPage_snapshot";

type VendorsSnapshot = {
  selectedCategory: string;
  searchText: string;
  location: { latitude: number; longitude: number; label?: string } | null;
  vendors: Vendor[];
  visibleCount: number;
};

function saveSnapshot(snapshot: VendorsSnapshot) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot)); } catch { /* ignore */ }
}
function loadSnapshot(): VendorsSnapshot | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as VendorsSnapshot) : null;
  } catch { return null; }
}
function clearSnapshot() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/*  Nominatim geocoding (address -> coordinates)                        */
/* ------------------------------------------------------------------ */
type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

async function geocodeAddress(query: string): Promise<NominatimResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
  const resp = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!resp.ok) throw new Error("Geocoding failed");
  return resp.json();
}

/* ------------------------------------------------------------------ */
/*  Location picker modal                                               */
/* ------------------------------------------------------------------ */
type LocationPickerProps = {
  onClose: () => void;
  onSelect: (loc: { latitude: number; longitude: number; label?: string }) => void;
};

const LocationPicker = ({ onClose, onSelect }: LocationPickerProps) => {
  const [tab, setTab] = useState<"gps" | "search">("gps");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searchError, setSearchError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tab === "search") inputRef.current?.focus();
  }, [tab]);

  const handleGps = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSelect({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, label: "Your current location" });
        setGpsLoading(false);
        onClose();
      },
      () => {
        setGpsError("Could not get your location. Please allow location access in your browser.");
        setGpsLoading(false);
      }
    );
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    setResults([]);
    try {
      const r = await geocodeAddress(query.trim());
      if (r.length === 0) setSearchError("No locations found. Try a different search.");
      setResults(r);
    } catch {
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-indigo-600" />
            <span className="font-bold text-slate-900">Set Location</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setTab("gps")}
            className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
              tab === "gps"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Navigation size={15} />
            Use My Location
          </button>
          <button
            onClick={() => setTab("search")}
            className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
              tab === "search"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Search size={15} />
            Search a Location
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {tab === "gps" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                <Navigation size={28} className="text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Use your device GPS</p>
                <p className="mt-1 text-sm text-slate-500">
                  Allow location access to automatically detect where you are.
                </p>
              </div>
              {gpsError && (
                <p className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {gpsError}
                </p>
              )}
              <button
                onClick={handleGps}
                disabled={gpsLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {gpsLoading ? <><Loader2 size={16} className="animate-spin" /> Detecting…</> : <><Navigation size={16} /> Detect My Location</>}
              </button>
            </div>
          )}

          {tab === "search" && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
                  <Search size={16} className="shrink-0 text-slate-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="e.g. Kathmandu, Nepal"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                    className="flex-1 bg-transparent py-3 pl-2 text-sm outline-none"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching || !query.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {searching ? <Loader2 size={15} className="animate-spin" /> : "Search"}
                </button>
              </div>

              {searchError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {searchError}
                </p>
              )}

              {results.length > 0 && (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  {results.map((r) => (
                    <button
                      key={r.place_id}
                      onClick={() => {
                        onSelect({
                          latitude: parseFloat(r.lat),
                          longitude: parseFloat(r.lon),
                          label: r.display_name,
                        });
                        onClose();
                      }}
                      className="flex w-full items-start gap-2.5 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-indigo-50"
                    >
                      <MapPin size={14} className="mt-0.5 shrink-0 text-indigo-400" />
                      <span className="text-sm text-slate-700 leading-snug">{r.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Page size                                                           */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 10;

/* ------------------------------------------------------------------ */
/*  VendorsPage                                                         */
/* ------------------------------------------------------------------ */
const VendorsPage = () => {
  const navigate = useNavigate();

  const snapshot = loadSnapshot();

  const [selectedCategory, setSelectedCategory] = useState(snapshot?.selectedCategory ?? "");
  const [searchText, setSearchText]             = useState(snapshot?.searchText ?? "");
  const [location, setLocation]                 = useState<{ latitude: number; longitude: number; label?: string } | null>(snapshot?.location ?? null);
  const [vendors, setVendors]                   = useState<Vendor[]>(snapshot?.vendors ?? []);
  const [visibleCount, setVisibleCount]         = useState(snapshot?.visibleCount ?? PAGE_SIZE);

  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [vendorLoading, setVendorLoading]            = useState(false);
  const [error, setError]                            = useState("");

  // Filtered + paginated slice
  const filtered = vendors.filter((v) => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      (v.address ?? "").toLowerCase().includes(q)
    );
  });

  const visible   = filtered.slice(0, visibleCount);
  const hasMore   = visibleCount < filtered.length;

  // Fetch nearby vendors from backend
  const handleSearch = async () => {
    if (!selectedCategory) { setError("Please select a vendor category."); return; }
    if (!location)          { setError("Please set your location first."); return; }

    clearSnapshot();
    setVendorLoading(true);
    setError("");
    setVisibleCount(PAGE_SIZE);

    try {
      const response = await fetch(
        `http://localhost:5000/api/vendors/nearby?type=${selectedCategory}&latitude=${location.latitude}&longitude=${location.longitude}`
      );
      if (!response.ok) throw new Error("Failed to fetch vendors");
      const data = await response.json();
      setVendors(data.items || []);
    } catch {
      setError("Unable to find vendors right now. Please try again.");
      setVendors([]);
    } finally {
      setVendorLoading(false);
    }
  };

  // Navigate to detail page, persisting snapshot
  const handleViewVendor = (vendor: Vendor) => {
    saveSnapshot({ selectedCategory, searchText, location, vendors, visibleCount });
    navigate(`/vendors/${vendor.id}`, { state: { vendor, userLocation: location } });
  };

  return (
    <div className="p-8 bg-[#FBFBF9] min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Location picker modal */}
        {locationPickerOpen && (
          <LocationPicker
            onClose={() => setLocationPickerOpen(false)}
            onSelect={(loc) => { setLocation(loc); setError(""); }}
          />
        )}

        {/* ── Header ── */}
        <div className="mb-3 inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold tracking-wide text-emerald-700">
          VENDOR MANAGEMENT
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-950">Find Vendors</h1>
        <p className="mt-2 text-slate-500">Discover vendors and services for your events.</p>

        {/* ── Search bar ── */}
        <div className="mt-8 flex gap-3 flex-wrap">

          {/* Category + keyword input */}
          <div className="flex flex-1 min-w-0 items-center rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400">
            {/* Category dropdown */}
            <div className="relative flex items-center border-r border-slate-200 pl-4 pr-2 shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setError(""); }}
                className="cursor-pointer appearance-none bg-transparent py-4 pr-8 text-center text-sm font-medium text-slate-700 outline-none [text-align-last:center]"
              >
                <option value="" className="text-center">All Categories</option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value} className="text-center">{c.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 text-slate-400" />
            </div>

            {/* Search input */}
            <div className="flex flex-1 items-center px-4 min-w-0">
              <Search size={18} className="shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Search vendors…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full bg-transparent py-4 pl-3 text-sm outline-none"
              />
            </div>
          </div>

          {/* Set Location button */}
          <button
            onClick={() => setLocationPickerOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <MapPin size={16} className={location ? "text-emerald-500" : "text-slate-400"} />
            {location ? "Change Location" : "Set Location"}
          </button>

          {/* Find Vendors button */}
          <button
            onClick={handleSearch}
            disabled={vendorLoading}
            className="shrink-0 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {vendorLoading ? "Searching…" : "Find Vendors"}
          </button>
        </div>

        {/* ── Location status ── */}
        {location && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <MapPin size={15} className="shrink-0" />
              <span className="font-semibold">
                {location.label ?? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
              </span>
            </div>
            <button
              onClick={() => setLocationPickerOpen(true)}
              className="text-xs font-medium text-emerald-600 underline hover:text-emerald-800"
            >
              Change
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ── Vendors section ── */}
        <div className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-950">
              {vendors.length > 0 ? `Nearby Vendors (${filtered.length})` : "Find Nearby Vendors"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {vendors.length > 0
                ? `Showing ${visible.length} of ${filtered.length} vendors near your selected location.`
                : "Select a category, set your location, and find vendors near you."}
            </p>
          </div>

          {/* Loading */}
          {vendorLoading && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 gap-3">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
              <p className="font-semibold text-slate-700">Finding nearby vendors…</p>
              <p className="text-sm text-slate-500">Searching OpenStreetMap for vendors near you.</p>
            </div>
          )}

          {/* Empty state */}
          {!vendorLoading && vendors.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <MapPin size={36} className="mx-auto text-slate-300" />
              <h3 className="mt-3 font-bold text-slate-700">No vendors to show yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Choose a category, set your location, and click "Find Vendors".
              </p>
            </div>
          )}

          {/* Vendor grid */}
          {!vendorLoading && visible.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((vendor) => {
                  const category = categories.find((c) => c.value === vendor.type);
                  const Icon = category?.icon || Camera;

                  return (
                    <div
                      key={vendor.id}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <VendorImage src={vendor.image ?? null} name={vendor.name} Icon={Icon} />

                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                        {category?.name || vendor.type}
                      </p>

                      <h3 className="mt-2 text-lg font-bold text-slate-950 leading-snug">
                        {vendor.name}
                      </h3>

                      <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
                        <MapPin size={15} className="mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{vendor.address || "Address not available"}</span>
                      </div>

                      <p className="mt-2 text-sm font-medium text-slate-500">
                        {vendor.distance} km away
                      </p>

                      <button
                        onClick={() => handleViewVendor(vendor)}
                        className="mt-5 w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        View Vendor
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="mt-8 flex flex-col items-center gap-2">
                  <p className="text-sm text-slate-400">
                    Showing {visible.length} of {filtered.length} vendors
                  </p>
                  <button
                    onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more vendors
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}

              {/* All loaded indicator */}
              {!hasMore && filtered.length > PAGE_SIZE && (
                <p className="mt-8 text-center text-sm text-slate-400">
                  All {filtered.length} vendors shown.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorsPage;
