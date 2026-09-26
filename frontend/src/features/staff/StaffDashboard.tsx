import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import StaffCard from "./StaffCard";
import AddStaffModal from "./AddStaffModal";
import DashboardHeader from "../../components/DashboardHeader";
import EventPicker, { useEventSelection } from "../../components/EventPicker";
import { removeStaff, type EventRecord } from "../events/api";
import { listSchedule } from "../schedule/api";
import { getStoredUser } from "../../services/authApi";

const StaffDashboard = (): React.JSX.Element => {
  const { events, selected, selectedId, setSelectedId, loading, error, setEvents } =
    useEventSelection();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});

  const isOrganizer = getStoredUser()?.role === "organizer";

  // "How busy is each person" comes from the schedule, where owners live.
  useEffect(() => {
    if (!selectedId) return;
    listSchedule(selectedId)
      .then(({ items }) => {
        const counts: Record<string, number> = {};
        for (const item of items) {
          if (item.owner?._id) counts[item.owner._id] = (counts[item.owner._id] ?? 0) + 1;
        }
        setTaskCounts(counts);
      })
      .catch(() => setTaskCounts({}));
  }, [selectedId]);

  const replaceEvent = (updated: EventRecord) =>
    setEvents((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));

  const drop = async (staffId: string) => {
    if (!selectedId) return;
    setActionError(null);
    try {
      replaceEvent(await removeStaff(selectedId, staffId));
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const roster = selected?.staff ?? [];
  const visible = useMemo(
    () =>
      roster.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase())
      ),
    [roster, search]
  );

  return (
    <div className="p-8 bg-[#FBFBF9] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <EventPicker events={events} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        <DashboardHeader
          title="Staff Management"
          subtitle={
            selected
              ? `${roster.length} people on ${selected.title}`
              : "Pick an event to see its crew"
          }
          label="Add Staff"
          categoriesList={["All"]}
          counts={{ All: roster.length }}
          activeCategory="All"
          onAction={() => setShowAdd(true)}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search staff..."
        />

        {(error || actionError) && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error || actionError}
          </p>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : !selected ? (
          <p className="py-16 text-center text-sm text-gray-400">
            No events yet — create one on the Events page first.
          </p>
        ) : visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">
            {roster.length === 0
              ? "Nobody on this event yet — use Add Staff."
              : "No staff match that search."}
          </p>
        ) : (
          <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {visible.map((member) => (
              <StaffCard
                key={member._id}
                member={member}
                taskCount={taskCounts[member._id] ?? 0}
                onRemove={isOrganizer ? () => drop(member._id) : undefined}
              />
            ))}
          </main>
        )}
      </div>

      {showAdd && selected && (
        <AddStaffModal
          event={selected}
          onClose={() => setShowAdd(false)}
          onAdded={replaceEvent}
        />
      )}
    </div>
  );
};

export default StaffDashboard;
