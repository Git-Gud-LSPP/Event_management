import { useEffect, useMemo, useState } from "react";
import { Hand, Inbox, Loader2 } from "lucide-react";

import { priorityOf, type Task, type TaskStatus } from "../schedule/data";
import { claimTask, listSchedule, toTask, updateTask } from "../schedule/api";
import { PageHeader, Segmented } from "../../components/DashboardHeader";
import EventPicker, { useEventSelection } from "../../components/EventPicker";
import { PRIORITY_TEXT, card, mono, pillOf } from "../../components/ui";
import { getStoredUser } from "../../services/authApi";

const DAY = 86_400_000;
const endOfToday = () => new Date().setHours(23, 59, 59, 999);

// List view: the design's day buckets, computed from each task's start time.
const GROUPS: { title: string; hint: string; test: (t: Task) => boolean }[] = [
  { title: "Do today", hint: "Starts today or earlier", test: (t) => t.status !== "Done" && Date.parse(t.startsAt) <= endOfToday() },
  { title: "Do next", hint: "Next 7 days", test: (t) => t.status !== "Done" && Date.parse(t.startsAt) > endOfToday() && Date.parse(t.startsAt) <= endOfToday() + 7 * DAY },
  { title: "Do later", hint: "After this week", test: (t) => t.status !== "Done" && Date.parse(t.startsAt) > endOfToday() + 7 * DAY },
  { title: "Done", hint: "Completed", test: (t) => t.status === "Done" },
];

// Board view: columns are statuses, so dragging a card between them changes its status.
// Tinted by severity: blocked is the alarm, in progress a caution, done is settled.
const COLUMNS: { title: string; status: TaskStatus; bg: string; dot: string }[] = [
  { title: "To do", status: "Pending", bg: "bg-soft", dot: "bg-ink-3" },
  { title: "In progress", status: "In Progress", bg: "bg-warn-soft", dot: "bg-[#C9A54A]" },
  { title: "Blocked", status: "Blocked", bg: "bg-danger-soft", dot: "bg-danger" },
  { title: "Done", status: "Done", bg: "bg-accent-soft", dot: "bg-live" },
];

const when = (iso: string) => {
  const d = new Date(iso);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toDateString() === new Date().toDateString() ? time : `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
};

function Checkbox({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const done = task.status === "Done";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={done ? `Mark ${task.name} as not done` : `Mark ${task.name} as done`}
      aria-pressed={done}
      className={`grid size-[18px] flex-none cursor-pointer place-items-center rounded-[5px] border text-[11px] text-paper ${done ? "border-ink bg-ink" : "border-[#C4CEC6] bg-surface hover:border-ink"}`}
    >
      {done && "✓"}
    </button>
  );
}

export default function MyTasksPage() {
  const [view, setView] = useState<"List" | "Board">("List");
  const { events, selected, selectedId, setSelectedId, loading: eventsLoading, error: eventsError } = useEventSelection();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);

  const user = getStoredUser();
  const eventTitle = selected?.title ?? "Event";

  useEffect(() => {
    if (!selectedId) return setAllTasks([]);
    let cancelled = false;
    setLoading(true);
    setError(null);
    listSchedule(selectedId)
      .then((r) => !cancelled && setAllTasks(r.items.map(toTask).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Unassigned tasks are the event backlog. Otherwise staff see only their own; organizers see the whole event.
  const backlog = allTasks.filter((t) => !t.ownerId && t.status !== "Done");
  const myTasks = useMemo(
    () => allTasks.filter((t) => t.ownerId && (!user || user.role === "organizer" || t.ownerId === user.id)),
    [allTasks, user]
  );

  const [claiming, setClaiming] = useState<string | null>(null);
  const takeOn = async (t: Task) => {
    if (!selectedId) return;
    setClaiming(t.id);
    setError(null);
    try {
      const mine = toTask(await claimTask(selectedId, t.id));
      setAllTasks((cur) => cur.map((x) => (x.id === t.id ? mine : x)));
    } catch (e) {
      setError(`Could not take on "${t.name}": ${(e as Error).message}`);
    } finally {
      setClaiming(null);
    }
  };

  // Optimistic status change, rolled back if the server refuses.
  const moveTask = async (taskId: string, status: TaskStatus) => {
    const task = allTasks.find((t) => t.id === taskId);
    if (!task || task.status === status || !selectedId) return;
    const setStatus = (s: TaskStatus) => setAllTasks((cur) => cur.map((t) => (t.id === taskId ? { ...t, status: s } : t)));
    setStatus(status);
    setError(null);
    try {
      await updateTask(selectedId, taskId, { status });
    } catch (e) {
      setStatus(task.status);
      setError(`Could not update "${task.name}": ${(e as Error).message}`);
    }
  };
  const toggle = (t: Task) => moveTask(t.id, t.status === "Done" ? "Pending" : "Done");

  const open = myTasks.filter((t) => t.status !== "Done").length;
  const blocked = myTasks.filter((t) => t.status === "Blocked").length;

  return (
    <div>
      <PageHeader
        eyebrow="Tasks"
        title="My Tasks"
        subtitle={`${open} open task${open === 1 ? "" : "s"} on ${eventTitle}${blocked ? ` · ${blocked} blocked` : ""}`}
      >
        <EventPicker events={events} selectedId={selectedId} onSelect={setSelectedId} />
        <Segmented options={["List", "Board"] as const} value={view} onChange={setView} />
      </PageHeader>

      {(error || eventsError) && (
        <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error || eventsError}</p>
      )}

      {eventsLoading || loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-ink-3">
          <Loader2 size={16} className="animate-spin" /> Loading tasks…
        </div>
      ) : !selectedId ? (
        <p className="py-16 text-center text-sm text-ink-3">No events yet. Create one on the Events page first.</p>
      ) : (
        <>
          {backlog.length > 0 && (
            <section className={`${card} mb-5`} aria-labelledby="backlog">
              <div className="flex items-center justify-between border-b border-line-soft bg-soft px-[18px] py-3.5">
                <h2 id="backlog" className="flex items-center gap-2.5 text-[15px] font-medium">
                  <Inbox size={15} className="text-ink-3" aria-hidden="true" />
                  Event backlog
                  <span className={`${mono} font-normal text-[#6E7C73]`}>{backlog.length}</span>
                </h2>
                <span className="text-xs text-[#6E7C73]">Unassigned · anyone on the event can take these on</span>
              </div>
              {backlog.map((t) => {
                const p = priorityOf(t);
                return (
                  <div key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 border-b border-line-soft px-[18px] py-[13px] text-[13.5px] last:border-0">
                    <div className="min-w-0">
                      <div className="truncate text-ink">{t.name}</div>
                      <div className="mt-0.5 truncate text-xs text-[#6E7C73]">
                        starts {when(t.startsAt)}
                        {t.dependsOn && ` · after ${t.dependsOn}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`${mono} hidden sm:inline ${PRIORITY_TEXT[p]}`}>{p.toUpperCase()}</span>
                      <button
                        type="button"
                        onClick={() => void takeOn(t)}
                        disabled={claiming === t.id}
                        className="flex cursor-pointer items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs text-paper hover:bg-ink-hover disabled:opacity-60"
                      >
                        {claiming === t.id ? <Loader2 size={12} className="animate-spin" /> : <Hand size={12} />}
                        Take on
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>
          )}
          {myTasks.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-3">No tasks assigned to you on this event yet.</p>
      ) : view === "List" ? (
        <div className="flex flex-col gap-5">
          {GROUPS.map((g) => {
            const items = myTasks.filter(g.test);
            if (items.length === 0) return null;
            return (
              <section key={g.title} className={card}>
                <div className="flex items-center justify-between border-b border-line-soft bg-soft px-[18px] py-3.5">
                  <h2 className="flex items-baseline gap-2.5 text-[15px] font-medium">
                    {g.title}
                    <span className={`${mono} font-normal text-[#6E7C73]`}>{items.length}</span>
                  </h2>
                  <span className="text-xs text-[#6E7C73]">{g.hint}</span>
                </div>
                {items.map((t) => {
                  const done = t.status === "Done";
                  const p = priorityOf(t);
                  return (
                    <div key={t.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 border-b border-line-soft px-[18px] py-[13px] text-[13.5px] last:border-0">
                      <Checkbox task={t} onToggle={() => toggle(t)} />
                      <div className="min-w-0">
                        <div className={`truncate ${done ? "text-[#6E7C73] line-through" : "text-ink"}`}>{t.name}</div>
                        <div className="mt-0.5 truncate text-xs text-[#6E7C73]">
                          {t.owner} · starts {when(t.startsAt)}
                          {t.dependsOn && !done && ` · after ${t.dependsOn}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!done && <span className={`${mono} hidden sm:inline ${PRIORITY_TEXT[p]}`}>{p.toUpperCase()}</span>}
                        <span className={pillOf(t.status)}>{t.status}</span>
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid items-start gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
          {COLUMNS.map((col) => {
            const items = myTasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setOverCol(col.status);
                }}
                onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setOverCol(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOverCol(null);
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) moveTask(id, col.status);
                }}
                className={`flex min-h-[200px] flex-col gap-2 rounded-2xl p-3 ${col.bg} ${overCol === col.status ? "ring-2 ring-live" : ""}`}
              >
                <div className="flex justify-between px-1 pt-1 pb-2 text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${col.dot}`} aria-hidden="true" />
                    {col.title}
                  </span>
                  <span className={`${mono} font-normal text-[#6E7C73]`}>{items.length}</span>
                </div>
                {items.map((t) => {
                  const p = priorityOf(t);
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", t.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className={`flex cursor-grab flex-col gap-2.5 rounded-xl border bg-surface p-3 active:cursor-grabbing ${t.status === "Blocked" ? "border-[#F0C9BC]" : "border-line"}`}
                    >
                      <div className="flex justify-between gap-2">
                        <span className={`${mono} ${PRIORITY_TEXT[p]}`}>{t.status === "Done" ? "DONE" : p.toUpperCase()}</span>
                        <span className="truncate text-xs text-[#6E7C73]">{t.owner}</span>
                      </div>
                      <div className={`text-sm leading-[1.35] ${t.status === "Done" ? "text-[#6E7C73] line-through" : "text-ink"}`}>{t.name}</div>
                      {t.status === "Blocked" && t.dependsOn && <div className="text-xs text-danger">Waiting on {t.dependsOn}</div>}
                      <div className="flex items-center justify-between text-xs text-[#6E7C73]">
                        <span>starts {when(t.startsAt)}</span>
                        <Checkbox task={t} onToggle={() => toggle(t)} />
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-[#CBD6CC] py-10 text-xs text-[#6E7C73]">Drop tasks here</div>
                )}
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}
