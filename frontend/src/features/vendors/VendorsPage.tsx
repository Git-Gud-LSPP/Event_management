import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, LocateFixed } from "lucide-react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import { API_BASE } from "../../services/api";
import { PageHeader } from "../../components/DashboardHeader";
import EventPicker, { useEventSelection } from "../../components/EventPicker";
import { card, mono, pillOf, tableHead } from "../../components/ui";
import { listEventVendors, type EventVendor } from "../documents/api";
import type { Vendor } from "./vendorTypes";

const categories = [
  { name: "Catering", value: "catering" },
  { name: "Photographers", value: "photographer" },
  { name: "Bakeries", value: "bakery" },
  { name: "Florists", value: "florist" },
  { name: "Entertainment", value: "entertainment" },
  { name: "Decoration", value: "decoration" },
  { name: "Hotels", value: "hotel" },
  { name: "Restaurants", value: "restaurant" },
];
const labelOf = (type: string) => categories.find((c) => c.value === type)?.name ?? type;

type Loc = { latitude: number; longitude: number; label?: string };

// Restored when coming back from a vendor's detail page.
const SESSION_KEY = "vendorsPage_snapshot";
type Snapshot = { category: string; near: string; location: Loc | null; vendors: Vendor[] };
const loadSnapshot = (): Snapshot | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Snapshot) : null;
  } catch {
    return null;
  }
};
const saveSnapshot = (s: Snapshot) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked: the page still works, it just won't restore */
  }
};

async function geocode(query: string): Promise<Loc> {
  const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`, {
    headers: { "Accept-Language": "en" },
  });
  if (!resp.ok) throw new Error("Location search failed. Try again.");
  const [hit] = (await resp.json()) as { lat: string; lon: string; display_name: string }[];
  if (!hit) throw new Error(`No location found for "${query}".`);
  return { latitude: parseFloat(hit.lat), longitude: parseFloat(hit.lon), label: hit.display_name };
}

const pin = (active: boolean) =>
  L.divIcon({
    className: "",
    html: `<span style="display:block;width:100%;height:100%;border-radius:50%;background:${active ? "#16231C" : "#8A75D1"};box-shadow:0 0 0 3px #fff,0 6px 14px -4px rgba(0,0,0,.35)"></span>`,
    iconSize: active ? [18, 18] : [12, 12],
  });
const venuePin = L.divIcon({
  className: "",
  html: `<span style="display:block;width:14px;height:14px;border-radius:3px;background:#3F8A64;box-shadow:0 0 0 3px #fff"></span>`,
  iconSize: [14, 14],
});

function FitTo({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = JSON.stringify(points);
  useEffect(() => {
    if (points.length) map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit only when the set of points changes
  }, [key]);
  return null;
}

const money = (v: EventVendor) =>
  v.quoteAmount == null ? "—" : new Intl.NumberFormat([], { style: "currency", currency: v.currency || "USD", maximumFractionDigits: 0 }).format(v.quoteAmount);

const VendorsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { events, selected, selectedId, setSelectedId } = useEventSelection();
  const [snapshot] = useState(loadSnapshot);

  const [category, setCategory] = useState(snapshot?.category ?? "catering");
  const [near, setNear] = useState(snapshot?.near ?? "");
  const [location, setLocation] = useState<Loc | null>(snapshot?.location ?? null);
  const [vendors, setVendors] = useState<Vendor[]>(snapshot?.vendors ?? []);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booked, setBooked] = useState<EventVendor[]>([]);

  useEffect(() => {
    if (!selectedId) return;
    listEventVendors(selectedId).then(setBooked).catch(() => setBooked([]));
  }, [selectedId]);

  const runSearch = async (type: string, loc: Loc) => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`${API_BASE}/vendors/nearby?type=${encodeURIComponent(type)}&latitude=${loc.latitude}&longitude=${loc.longitude}`);
      if (!resp.ok) throw new Error();
      setVendors(((await resp.json()).items as Vendor[]) ?? []);
    } catch {
      setError("Unable to find vendors right now. Please try again.");
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  // Geocode the NEAR text, then search. Used by the form, the event's venue and assistant links.
  const searchNear = async (type: string, text: string) => {
    if (!text.trim()) return setError("Type a venue or address to search near.");
    setLoading(true);
    setError("");
    try {
      const loc = await geocode(text.trim());
      setLocation(loc);
      await runSearch(type, loc);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  // First visit: search near the selected event's venue. The assistant links /vendors?type=…&near=…
  const started = useRef(false); // StrictMode runs effects twice; search once
  useEffect(() => {
    if (started.current) return;
    const linkedType = searchParams.get("type");
    const linkedNear = searchParams.get("near");
    if (linkedType && linkedNear) {
      started.current = true;
      setSearchParams({}, { replace: true }); // a reload shouldn't search again
      setCategory(linkedType);
      setNear(linkedNear);
      searchNear(linkedType, linkedNear);
    } else if (!snapshot && selected?.location) {
      started.current = true;
      setNear(selected.location);
      searchNear(category, selected.location);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot on first data
  }, [selected, searchParams]);

  const useGps = () => {
    if (!navigator.geolocation) return setError("Geolocation is not supported by this browser.");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, label: "Your location" };
        setNear("Your location");
        setLocation(loc);
        runSearch(category, loc);
      },
      () => {
        setLoading(false);
        setError("Could not get your location. Allow location access, or type an address.");
      }
    );
  };

  const pickCategory = (value: string) => {
    setCategory(value);
    if (location) runSearch(value, location);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    searchNear(category, near);
  };

  const openVendor = (vendor: Vendor) => {
    saveSnapshot({ category, near, location, vendors });
    navigate(`/vendors/${vendor.id}`, { state: { vendor, userLocation: location } });
  };

  const committed = booked.filter((v) => v.stage === "Booked" || v.stage === "Paid").length;
  const chip = (on: boolean) =>
    `cursor-pointer rounded-full border px-[13px] py-2 text-[13px] ${on ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink-2 hover:border-ink"}`;

  return (
    <div>
      <PageHeader eyebrow="Vendors" title="Find vendors" subtitle="Search suppliers near your venue, then track every booking against the event.">
        <EventPicker events={events} selectedId={selectedId} onSelect={setSelectedId} />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-2xl bg-surface p-3">
        <form onSubmit={onSubmit} className="flex h-10 min-w-60 flex-1 items-center gap-2 rounded-full bg-paper pr-1.5 pl-3.5">
          <label htmlFor="vendor-near" className={`${mono} text-[#6E7C73]`}>NEAR</label>
          <input
            id="vendor-near"
            value={near}
            onChange={(e) => setNear(e.target.value)}
            placeholder="Venue, address or city"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          <button type="button" onClick={useGps} aria-label="Use my location" title="Use my location" className="cursor-pointer rounded-full p-1.5 text-ink-3 hover:bg-surface hover:text-ink">
            <LocateFixed size={15} />
          </button>
          <button type="submit" className="cursor-pointer rounded-full bg-ink px-3 py-1 text-[13px] text-paper hover:bg-ink-hover">Search</button>
        </form>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Vendor type">
          {categories.map((c) => (
            <button key={c.value} type="button" aria-pressed={category === c.value} onClick={() => pickCategory(c.value)} className={chip(category === c.value)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error}</p>}

      <div className="mb-10 grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
        <div className="relative isolate h-[440px] overflow-hidden rounded-2xl bg-[repeating-linear-gradient(135deg,#E9EFE8_0_10px,#F2F5F1_10px_20px)]">
          {location ? (
            <MapContainer center={[location.latitude, location.longitude]} zoom={14} scrollWheelZoom={false} className="h-full w-full">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FitTo points={[[location.latitude, location.longitude], ...vendors.map((v) => [v.latitude, v.longitude] as [number, number])]} />
              <Marker position={[location.latitude, location.longitude]} icon={venuePin}>
                <Tooltip direction="right" offset={[10, 0]} permanent>{near || "Search point"}</Tooltip>
              </Marker>
              {vendors.map((v) => (
                <Marker key={v.id} position={[v.latitude, v.longitude]} icon={pin(v.id === active)} eventHandlers={{ click: () => setActive(v.id) }}>
                  <Tooltip>{v.name}</Tooltip>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <span className={`${mono} absolute top-3.5 left-4 text-[11px] text-[#6E7C73]`}>MAP · SEARCH A LOCATION</span>
          )}
        </div>

        <div className={card}>
          <div className="flex items-center justify-between border-b border-line-soft px-[18px] py-3.5">
            <span className="text-[15px] font-medium">{loading ? "Searching…" : `${vendors.length} ${labelOf(category).toLowerCase()} nearby`}</span>
            <span className={`${mono} text-accent`}>SORTED BY DISTANCE</span>
          </div>
          <div className="max-h-[384px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-3">
                <Loader2 size={16} className="animate-spin" /> Searching OpenStreetMap…
              </div>
            ) : vendors.length === 0 ? (
              <p className="px-6 py-16 text-center text-sm text-ink-3">
                {location ? "No vendors of this type nearby. Try another type." : "Type a venue or address above and press Search."}
              </p>
            ) : (
              vendors.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => openVendor(v)}
                  onMouseEnter={() => setActive(v.id)}
                  onFocus={() => setActive(v.id)}
                  className={`grid w-full cursor-pointer grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line-soft px-[18px] py-3 text-left last:border-0 hover:bg-soft ${v.id === active ? "bg-soft" : ""}`}
                >
                  {v.image ? (
                    <img src={v.image} alt="" className="size-11 rounded-[10px] object-cover" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                  ) : (
                    <span className="size-11 rounded-[10px] bg-[repeating-linear-gradient(135deg,#E6ECE5_0_5px,#F2F5F1_5px_10px)]" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{v.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-[#6E7C73]">
                      {labelOf(v.type)} · {v.address || "Address not listed"}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-mono text-xs text-ink">{v.distance} km</span>
                    {v.phone && <span className="mt-0.5 block text-xs text-ink-3">has phone</span>}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[22px] font-medium tracking-[-0.03em]">Booked vendors</h2>
        <span className="flex items-baseline gap-4">
          <span className={`${mono} text-[11px] text-[#6E7C73]`}>{committed} COMMITTED · {booked.length} TRACKED</span>
          <Link to="/documents" className="text-[12.5px] text-ink-3 hover:text-ink">Manage in Documents →</Link>
        </span>
      </div>
      <div className={`${card} overflow-x-auto`}>
        <div className="min-w-[720px]">
          <div className={`grid grid-cols-[1.6fr_1fr_1.8fr_.8fr_.9fr] gap-2 ${tableHead}`}>
            <span>VENDOR</span>
            <span>SERVICE</span>
            <span>SCOPE</span>
            <span>AMOUNT</span>
            <span>STAGE</span>
          </div>
          {booked.map((v) => (
            <div key={v._id} className="grid grid-cols-[1.6fr_1fr_1.8fr_.8fr_.9fr] items-center gap-2 border-b border-line-soft px-[18px] py-3 text-[13px] last:border-0">
              <div className="min-w-0">
                <div className="truncate">{v.name}</div>
                <div className="truncate text-[11.5px] text-[#6E7C73]">{v.contactName || v.email || v.phone || "No contact yet"}</div>
              </div>
              <span className="text-ink-2">{v.type ? labelOf(v.type) : "—"}</span>
              <span className="truncate text-[12.5px] text-ink-3">{v.scope || "—"}</span>
              <span className="font-mono text-xs">{money(v)}</span>
              <span><span className={pillOf(v.stage)}>{v.stage}</span></span>
            </div>
          ))}
          {booked.length === 0 && (
            <p className="py-10 text-center text-sm text-ink-3">
              {selected ? `No vendors tracked on ${selected.title} yet. Open a vendor above and add it to the event.` : "Pick an event to see its vendors."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorsPage;
