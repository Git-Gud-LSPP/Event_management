import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import EventPicker, { useEventSelection } from "../../components/EventPicker";
import DashboardHeader from "../../components/DashboardHeader";
import IncidentList from "./components/IncidentList";
import IncidentFormModal from "./IncidentFormModal";
import IncidentDetailModal from "./IncidentDetailModal";
import { getStoredUser } from "../../services/authApi";
import {
  listIncidents,
  type IncidentRecord,
  type IncidentStatus,
} from "./api";

const FILTERS = ["All", "Open", "In Progress", "Resolved"] as const;
type Filter = (typeof FILTERS)[number];

export default function IncidentsPage() {
  const {
    events,
    selected,
    selectedId,
    setSelectedId,
    loading: eventsLoading,
    error: eventsError,
  } = useEventSelection();

  const [items, setItems] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedIncident, setSelectedIncident] =
    useState<IncidentRecord | null>(null);

  const user = getStoredUser();
  const isOrganizer = user?.role === "organizer";

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    let cancelled = false;

    const loadIncidents = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await listIncidents(selectedId);

        if (!cancelled) {
          setItems(result.items);
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadIncidents();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const counts: Record<string, number> = {
    All: items.length,
    Open: items.filter((i) => i.status === "Open").length,
    "In Progress": items.filter((i) => i.status === "In Progress").length,
    Resolved: items.filter((i) => i.status === "Resolved").length,
  };

  const visible = items
    .filter((i) => filter === "All" || i.status === (filter as IncidentStatus))
    .filter(
      (i) =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        (i.location ?? "").toLowerCase().includes(search.toLowerCase())
    );

  const upsert = (saved: IncidentRecord) =>
    setItems((prev) =>
      prev.some((i) => i._id === saved._id)
        ? prev.map((i) => (i._id === saved._id ? saved : i))
        : [...prev, saved]
    );

  return (
    <div className="min-h-screen bg-[#FBFBF9]">
      <div className="mb-6">
        <EventPicker
          events={events}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      <DashboardHeader
        title="Incidents"
        subtitle={
          selected
            ? `${items.length} incidents on ${selected.title}`
            : "Pick an event to see its incidents"
        }
        label="Report Incident"
        categoriesList={[...FILTERS]}
        counts={counts}
        activeCategory={filter}
        onCategoryChange={(c) => setFilter(c as Filter)}
        onAction={
          isOrganizer && selectedId ? () => setShowForm(true) : undefined
        }
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search incidents..."
      />

      {(error || eventsError) && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error || eventsError}
        </p>
      )}

      {eventsLoading || loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Loading incidents…
        </div>
      ) : !selectedId ? (
        <p className="py-16 text-center text-sm text-gray-400">
          No events yet — create one on the Events page first.
        </p>
      ) : (
        <IncidentList incidents={visible} onOpen={setSelectedIncident} />
      )}

      {showForm && selectedId && (
        <IncidentFormModal
          eventId={selectedId}
          staff={selected?.staff ?? []}
          onClose={() => setShowForm(false)}
          onSaved={upsert}
        />
      )}

      {selectedIncident && selectedId && (
        <IncidentDetailModal
          eventId={selectedId}
          incident={selectedIncident}
          staff={selected?.staff ?? []}
          onClose={() => setSelectedIncident(null)}
          onUpdated={(updated) => {
            upsert(updated);
            setSelectedIncident(updated);
          }}
          onDeleted={(id) => {
            setItems((prev) => prev.filter((i) => i._id !== id));
            setSelectedIncident(null);
          }}
        />
      )}
    </div>
  );
}
