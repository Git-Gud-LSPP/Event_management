import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import EventCard from "./EventCard";
import EventFormModal from "./EventFormModal";
import DashboardHeader from "../../components/DashboardHeader";
import { listEvents, type EventRecord } from "./api";

const FILTERS = ["All", "Live", "Upcoming", "Draft", "Completed", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];

// Derived from the dates/status the backend already stores — no extra fields needed.
const bucketOf = (ev: EventRecord): Filter => {
  if (ev.status === "cancelled") return "Cancelled";
  if (ev.status === "draft") return "Draft";
  const now = Date.now();
  const start = new Date(ev.startsAt).getTime();
  const end = ev.endsAt ? new Date(ev.endsAt).getTime() : start;
  if (now < start) return "Upcoming";
  if (now > end) return "Completed";
  return "Live";
};

const progressOf = (ev: EventRecord): number => {
  const start = new Date(ev.startsAt).getTime();
  const end = ev.endsAt ? new Date(ev.endsAt).getTime() : start;
  if (end <= start) return Date.now() >= start ? 100 : 0;
  return Math.round(Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100)));
};

const EventsDashboard = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    listEvents()
      .then(({ items }) => setEvents(items))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const result: Record<string, number> = { All: events.length };
    for (const ev of events) {
      const bucket = bucketOf(ev);
      result[bucket] = (result[bucket] ?? 0) + 1;
    }
    return result;
  }, [events]);

  const visible = useMemo(
    () =>
      events.filter(
        (ev) =>
          (filter === "All" || bucketOf(ev) === filter) &&
          (ev.title.toLowerCase().includes(search.toLowerCase()) ||
            (ev.location ?? "").toLowerCase().includes(search.toLowerCase()))
      ),
    [events, filter, search]
  );

  return (
    <div className="p-8 bg-[#FBFBF9] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader
          title="Event Operations"
          subtitle={loading ? "Loading events…" : `${events.length} events across all status`}
          label="Create Event"
          categoriesList={[...FILTERS]}
          counts={counts}
          activeCategory={filter}
          onCategoryChange={(c) => setFilter(c as Filter)}
          onAction={() => setShowForm(true)}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search for events..."
        />

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" /> Loading events…
          </div>
        ) : visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">
            {events.length === 0
              ? "No events yet — hit Create Event to add your first one."
              : "No events match this filter."}
          </p>
        ) : (
          <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {visible.map((ev) => (
              <EventCard
                key={ev._id}
                event={ev}
                category={bucketOf(ev)}
                progress={progressOf(ev)}
                staffCount={ev.staff?.length ?? 0}
                onClick={() => navigate(`/events/${ev._id}`)}
              />
            ))}
          </main>
        )}
      </div>

      {showForm && (
        <EventFormModal
          onClose={() => setShowForm(false)}
          onSaved={(saved) => setEvents((prev) => [...prev, saved])}
        />
      )}
    </div>
  );
};

export default EventsDashboard;
