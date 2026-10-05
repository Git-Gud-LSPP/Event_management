import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import EventPicker, { useEventSelection } from "../../components/EventPicker";
import Button from "../../components/Button";
import SearchBar from "../../components/SearchBar";
import { FilterChips, PageHeader } from "../../components/DashboardHeader";
import IncidentList from "./components/IncidentList";
import IncidentFormModal from "./IncidentFormModal";
import IncidentDetail from "./IncidentDetail";
import { getStoredUser } from "../../services/authApi";
import { listIncidents, type IncidentRecord } from "./api";

const FILTERS = ["All", "Open", "In Progress", "Resolved"] as const;

export default function IncidentsPage() {
  const { events, selected, selectedId, setSelectedId, loading: eventsLoading, error: eventsError } = useEventSelection();

  const [items, setItems] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const isOrganizer = getStoredUser()?.role === "organizer";

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    listIncidents(selectedId)
      .then((r) => !cancelled && setItems(r.items))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === "All" ? items.length : items.filter((i) => i.status === f).length]));
  const q = search.toLowerCase();
  const visible = items.filter(
    (i) => (filter === "All" || i.status === filter) && (i.title.toLowerCase().includes(q) || (i.location ?? "").toLowerCase().includes(q))
  );
  // Duty-manager order: unresolved first, then most severe, then newest.
  const rank = { Critical: 0, Medium: 1, Low: 2 };
  visible.sort(
    (a, b) =>
      Number(a.status === "Resolved") - Number(b.status === "Resolved") ||
      rank[a.priority] - rank[b.priority] ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
  const current = visible.find((i) => i._id === openId) ?? visible[0];

  const upsert = (saved: IncidentRecord) =>
    setItems((prev) => (prev.some((i) => i._id === saved._id) ? prev.map((i) => (i._id === saved._id ? saved : i)) : [...prev, saved]));

  const open = counts.Open + counts["In Progress"];

  return (
    <div>
      <PageHeader
        eyebrow={`Incidents${selected ? ` · ${selected.title}` : ""}`}
        title="Incidents"
        subtitle={selected ? `${open} open · ${counts.Resolved} resolved on ${selected.title}` : "Pick an event to see its incidents"}
      >
        <EventPicker events={events} selectedId={selectedId} onSelect={setSelectedId} />
        {isOrganizer && selectedId && <Button label="Report incident" onClick={() => setShowForm(true)} />}
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterChips options={[...FILTERS]} counts={counts} active={filter} onChange={setFilter} />
        <SearchBar placeholder="Search incidents or locations…" value={search} onChange={setSearch} />
      </div>

      {(error || eventsError) && (
        <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error || eventsError}</p>
      )}

      {eventsLoading || loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-ink-3">
          <Loader2 size={16} className="animate-spin" /> Loading incidents…
        </div>
      ) : !selectedId ? (
        <p className="py-16 text-center text-sm text-ink-3">No events yet. Create one on the Events page first.</p>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-3">No incidents reported for this event. Good.</p>
      ) : (
        <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr))]">
          <IncidentList incidents={visible} selectedId={current?._id} onOpen={(i) => setOpenId(i._id)} />
          {current && (
            <IncidentDetail
              key={current._id}
              eventId={selectedId}
              incident={current}
              staff={selected?.staff ?? []}
              onUpdated={upsert}
              onDeleted={(id) => setItems((prev) => prev.filter((i) => i._id !== id))}
            />
          )}
        </div>
      )}

      {showForm && selectedId && (
        <IncidentFormModal
          eventId={selectedId}
          staff={selected?.staff ?? []}
          onClose={() => setShowForm(false)}
          onSaved={(saved) => {
            upsert(saved);
            setOpenId(saved._id);
          }}
        />
      )}
    </div>
  );
}
