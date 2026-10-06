import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import StaffCard, { type StaffLoad } from "./StaffCard";
import AddStaffModal from "./AddStaffModal";
import Button from "../../components/Button";
import SearchBar from "../../components/SearchBar";
import { FilterChips, PageHeader } from "../../components/DashboardHeader";
import EventPicker, { useEventSelection } from "../../components/EventPicker";
import { removeStaff, type EventRecord } from "../events/api";
import { listSchedule, type ScheduleItem } from "../schedule/api";
import { getStoredUser } from "../../services/authApi";

const FILTERS = ["All", "On task", "Blocked", "Available"] as const;

// What each person is doing right now comes from the schedule, where owners live.
const loadOf = (staffId: string, items: ScheduleItem[]): StaffLoad => {
  const mine = items.filter((i) => i.owner?._id === staffId);
  const blocked = mine.find((i) => i.status === "Blocked");
  const active = mine.find((i) => i.status === "In Progress");
  return {
    status: blocked ? "Blocked" : active ? "On task" : "Available",
    now: (blocked ?? active)?.name,
    total: mine.length,
    done: mine.filter((i) => i.status === "Done").length,
  };
};

const StaffDashboard = (): React.JSX.Element => {
  const { events, selected, selectedId, setSelectedId, loading, error, setEvents } = useEventSelection();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [showAdd, setShowAdd] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  const isOrganizer = getStoredUser()?.role === "organizer";

  useEffect(() => {
    if (!selectedId) return;
    listSchedule(selectedId)
      .then(({ items }) => setSchedule(items))
      .catch(() => setSchedule([]));
  }, [selectedId]);

  const replaceEvent = (updated: EventRecord) => setEvents((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));

  const drop = async (staffId: string, name: string) => {
    if (!selectedId) return;
    const open = schedule.filter((i) => i.owner?._id === staffId && i.status !== "Done").length;
    const note = open ? ` They still own ${open} unfinished task${open === 1 ? "" : "s"}; reassign them on the Schedule page.` : "";
    if (!confirm(`Remove ${name} from ${selected?.title ?? "this event"}?${note}`)) return;
    setActionError(null);
    try {
      replaceEvent(await removeStaff(selectedId, staffId));
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const roster = useMemo(
    () => (selected?.staff ?? []).map((member) => ({ member, load: loadOf(member._id, schedule) })),
    [selected, schedule]
  );
  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === "All" ? roster.length : roster.filter((r) => r.load.status === f).length]));
  const q = search.toLowerCase();
  const visible = roster.filter(
    (r) => (filter === "All" || r.load.status === filter) && (r.member.name.toLowerCase().includes(q) || r.member.email.toLowerCase().includes(q))
  );

  return (
    <div>
      <PageHeader
        eyebrow={`Staff${selected ? ` · ${selected.title}` : ""}`}
        title="Staff management"
        subtitle={selected ? `${roster.length} people · ${counts["On task"]} on a task right now` : "Pick an event to see its crew"}
      >
        <EventPicker events={events} selectedId={selectedId} onSelect={setSelectedId} />
        {isOrganizer && selected && <Button label="Add staff" onClick={() => setShowAdd(true)} />}
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterChips options={[...FILTERS]} counts={counts} active={filter} onChange={setFilter} />
        <SearchBar placeholder="Search staff…" value={search} onChange={setSearch} />
      </div>

      {(error || actionError) && (
        <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error || actionError}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-ink-3">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : !selected ? (
        <p className="py-16 text-center text-sm text-ink-3">No events yet. Create one on the Events page first.</p>
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-3">
          {roster.length === 0 ? "Nobody on this event yet. Use Add staff." : "No staff match this filter."}
        </p>
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
          {visible.map(({ member, load }) => (
            <StaffCard key={member._id} member={member} load={load} onRemove={isOrganizer ? () => drop(member._id, member.name) : undefined} />
          ))}
        </div>
      )}

      {showAdd && selected && <AddStaffModal event={selected} onClose={() => setShowAdd(false)} onAdded={replaceEvent} />}
    </div>
  );
};

export default StaffDashboard;
