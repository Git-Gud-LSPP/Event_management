import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { PageHeader, Segmented } from "../../components/DashboardHeader";
import SearchBar from "../../components/SearchBar";

import ScheduleList from "./components/ScheduleList";
import TimelineView from "./components/TimelineView";
import TaskFormModal from "./TaskFormModal";
import EventPicker, { useEventSelection } from "../../components/EventPicker";
import { assignTask, clashFor, deleteTask, listSchedule, toTask, updateTask, type ScheduleItem } from "./api";
import { getStoredUser } from "../../services/authApi";

export default function SchedulePage() {
  const [view, setView] = useState<"list" | "gantt">("list");
  const [search, setSearch] = useState("");
  const { events, selected, selectedId, setSelectedId, loading: eventsLoading, error: eventsError } =
    useEventSelection();

  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const user = getStoredUser();
  const isOrganizer = user?.role === "organizer";

  const load = useCallback(() => {
    if (!selectedId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    listSchedule(selectedId)
      .then((r) => setItems(r.items))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedId]);

  useEffect(load, [load]);

  const handleAssign = async (taskId: string, staffId: string) => {
    try {
      const updated = await assignTask(selectedId, taskId, staffId);
      setItems((prev) => prev.map((i) => (i._id === taskId ? updated : i)));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(selectedId, taskId);
      setItems((prev) => prev.filter((i) => i._id !== taskId));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // Timeline drag. Applied optimistically so the bar stays where it was dropped; on failure reload,
  // so it snaps back to the saved time.
  const handleReschedule = async (taskId: string, change: { startsAt: string; endsAt?: string }) => {
    setItems((prev) => prev.map((i) => (i._id === taskId ? { ...i, ...change } : i)));
    try {
      const updated = await updateTask(selectedId, taskId, change);
      setItems((prev) => prev.map((i) => (i._id === taskId ? updated : i)));
    } catch (e) {
      setError((e as Error).message);
      load();
    }
  };

  const openEdit = (id: string) => {
    setEditing(items.find((i) => i._id === id) ?? null);
    setShowForm(true);
  };

  // The organizer can take tasks too, so they head the assignee list.
  const staff = selected?.staff ?? [];
  const assignees =
    user && selected?.organizer === user.id
      ? [{ _id: user.id, name: `${user.name} (me)`, email: user.email }, ...staff.filter((s) => s._id !== user.id)]
      : staff;
  const busyFor = (taskId: string, staffId: string) => {
    const task = items.find((i) => i._id === taskId);
    return task ? clashFor(items, staffId, task)?.name : undefined;
  };

  const tasks = items.map(toTask);
  const filteredTasks = tasks.filter(
    (task) =>
      task.name.toLowerCase().includes(search.toLowerCase()) ||
      task.owner.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="">

      <PageHeader
        eyebrow={`Schedule${selected ? ` · ${selected.title} · ${new Date(selected.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}`}
        title="Run-of-show"
        subtitle={`${tasks.length} tasks · ${tasks.filter((task) => task.delayed).length} delayed`}
      >
        <EventPicker events={events} selectedId={selectedId} onSelect={setSelectedId} />
        <Segmented options={["Timeline", "List"] as const} value={view === "gantt" ? "Timeline" : "List"} onChange={(v) => setView(v === "Timeline" ? "gantt" : "list")} />
        {isOrganizer && selectedId && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm text-paper hover:bg-ink-hover"
          >
            <Plus size={15} aria-hidden="true" /> Add task
          </button>
        )}
      </PageHeader>
      <div className="mb-4 flex justify-end">
        <SearchBar placeholder="Search tasks or owners…" value={search} onChange={setSearch} />
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      {(error || eventsError) && (
        <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error || eventsError}
        </p>
      )}

      {eventsLoading || loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-ink-3">
          <Loader2 size={16} className="animate-spin" /> Loading schedule…
        </div>
      ) : !selectedId ? (
        <p className="py-16 text-center text-sm text-ink-3">
          No events yet — create one on the Events page to build a schedule.
        </p>
      ) : view === "list" ? (
        <ScheduleList
          tasks={filteredTasks}
          staff={assignees}
          busyFor={busyFor}
          onAssign={isOrganizer ? handleAssign : undefined}
          onEdit={isOrganizer ? openEdit : undefined}
          onDelete={isOrganizer ? handleDelete : undefined}
        />
      ) : (
        <TimelineView
          items={items.filter((i) => filteredTasks.some((t) => t.id === i._id))}
          onReschedule={isOrganizer ? handleReschedule : undefined}
          onEdit={isOrganizer ? openEdit : undefined}
        />
      )}

      {showForm && selectedId && (
        <TaskFormModal
          eventId={selectedId}
          task={editing ?? undefined}
          staff={assignees}
          siblings={items}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={(saved) =>
            setItems((prev) =>
              prev.some((i) => i._id === saved._id)
                ? prev.map((i) => (i._id === saved._id ? saved : i))
                : [...prev, saved]
            )
          }
        />
      )}
    </div>
  );
}
