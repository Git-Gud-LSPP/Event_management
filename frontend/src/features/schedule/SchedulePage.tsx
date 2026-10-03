import { useCallback, useEffect, useState } from "react";
import { List, Grid2X2, Search, Loader2, Plus } from "lucide-react";

import ScheduleList from "./components/ScheduleList";
import Gantt from "./components/GanttView";
import TaskFormModal from "./TaskFormModal";
import EventPicker, { useEventSelection } from "../../components/EventPicker";
import { assignTask, deleteTask, listSchedule, toTask, type ScheduleItem } from "./api";
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

  const tasks = items.map(toTask);
  const filteredTasks = tasks.filter(
    (task) =>
      task.name.toLowerCase().includes(search.toLowerCase()) ||
      task.owner.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FBFBF9]">

      {/* =====================================================
          TOP BAR
      ===================================================== */}
      <header className="mb-8 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 -mx-6 -mt-6">

        {/* LEFT */}
        <div className="flex items-center gap-4">
          <EventPicker events={events} selectedId={selectedId} onSelect={setSelectedId} />
          <span className="text-sm text-gray-500">Schedule</span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-5">

          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52 rounded-full border border-gray-200 bg-[#F7F7F5] py-2 pl-9 pr-4 text-sm outline-none focus:border-gray-400"
            />
          </div>

          {/* User */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-800">
                {user.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase())
                  .join("")}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs capitalize text-gray-500">{user.role}</p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}
      <div className="mb-8 flex items-start justify-between">

        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Schedule
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {tasks.length} tasks · {tasks.filter((task) => task.delayed).length} delayed
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isOrganizer && selectedId && (
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#002F2B] px-5 py-2 text-sm font-medium text-white"
            >
              <Plus size={15} /> New task
            </button>
          )}

          {/* LIST / GANTT */}
          <div className="flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${
                view === "list"
                  ? "bg-[#002F2B] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <List size={15} />
              List
            </button>

            <button
              onClick={() => setView("gantt")}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${
                view === "gantt"
                  ? "bg-[#002F2B] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Grid2X2 size={14} />
              Gantt
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      {(error || eventsError) && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error || eventsError}
        </p>
      )}

      {eventsLoading || loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Loading schedule…
        </div>
      ) : !selectedId ? (
        <p className="py-16 text-center text-sm text-gray-400">
          No events yet — create one on the Events page to build a schedule.
        </p>
      ) : view === "list" ? (
        <ScheduleList
          tasks={filteredTasks}
          staff={selected?.staff ?? []}
          onAssign={isOrganizer ? handleAssign : undefined}
          onEdit={
            isOrganizer
              ? (id) => {
                  setEditing(items.find((i) => i._id === id) ?? null);
                  setShowForm(true);
                }
              : undefined
          }
          onDelete={isOrganizer ? handleDelete : undefined}
        />
      ) : (
        <Gantt tasks={filteredTasks} />
      )}

      {showForm && selectedId && (
        <TaskFormModal
          eventId={selectedId}
          task={editing ?? undefined}
          staff={selected?.staff ?? []}
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
