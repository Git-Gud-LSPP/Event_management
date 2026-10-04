import { useEffect, useMemo, useState } from "react";
import {
  List,
  LayoutGrid,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock3,
  Loader2,
} from "lucide-react";

import type { Task, TaskStatus } from "../schedule/data";
import { listSchedule, toTask, updateTask } from "../schedule/api";
import EventPicker, { useEventSelection } from "../../components/EventPicker";
import { getStoredUser } from "../../services/authApi";

type ViewMode = "list" | "board";

type Priority = "High" | "Medium" | "Low";

// The schedule backend has no priority field, so derive one for display:
// blocked or delayed tasks need attention first.
const getPriority = (task: Task): Priority => {
  if (task.status === "Blocked" || task.delayed) return "High";
  if (task.status === "In Progress") return "Medium";
  if (task.status === "Pending") return "Medium";
  return "Low";
};

const getStatusClasses = (status: Task["status"]) => {
  switch (status) {
    case "Done":
      return "bg-emerald-50 text-emerald-600";

    case "In Progress":
      return "bg-indigo-50 text-indigo-600";

    case "Blocked":
      return "bg-red-50 text-red-500";

    case "Pending":
      return "bg-gray-100 text-gray-600";

    default:
      return "bg-gray-100 text-gray-600";
  }
};

const getPriorityClasses = (priority: Priority) => {
  switch (priority) {
    case "High":
      return "text-red-500";

    case "Medium":
      return "text-amber-500";

    case "Low":
      return "text-slate-500";

    default:
      return "text-slate-500";
  }
};

const Avatar = ({ initials }: { initials: string }) => {
  return (
    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-semibold shrink-0">
      {initials}
    </div>
  );
};

const TaskCard = ({
  task,
  eventTitle,
  board = false,
  completed,
  onToggle,
}: {
  task: Task;
  eventTitle: string;
  board?: boolean;
  completed: boolean;
  onToggle: () => void;
}) => {
  const priority = getPriority(task);

  const isDone = completed;
  const isBlocked = task.status === "Blocked" && !completed;

  return (
    <div
      draggable={board}
      onDragStart={
        board
          ? (e) => {
              e.dataTransfer.setData("text/plain", task.id);
              e.dataTransfer.effectAllowed = "move";
            }
          : undefined
      }
      className={`
        bg-white rounded-xl border shadow-sm
        transition-all hover:shadow-md
        ${isBlocked ? "border-red-200" : "border-gray-200"}
        ${board ? "p-4 cursor-grab active:cursor-grabbing" : "px-4 py-5"}
      `}
    >
      {/* TOP / TASK NAME */}
      {!board && (
        <button
          type="button"
          onClick={onToggle}
          className="pt-1 shrink-0 cursor-pointer"
          aria-label={
            isDone
              ? `Mark ${task.name} as incomplete`
              : `Mark ${task.name} as complete`
          }
        >
          {isDone ? (
            <CheckCircle2
              className="w-5 h-5 text-emerald-500"
              fill="currentColor"
            />
          ) : (
            <Circle className="w-5 h-5 text-gray-300 hover:text-emerald-500 transition-colors" />
          )}
        </button>
      )}
      <div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2 flex-wrap">
            <h3
              className={`
                text-sm font-medium
                ${isDone ? "text-gray-400 line-through" : "text-slate-900"}
              `}
            >
              {task.name}
            </h3>

            {isBlocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[10px] font-medium">
                <AlertCircle className="w-3 h-3" />
                Blocked
              </span>
            )}
          </div>

          {!board && <p className="mt-1 text-xs text-slate-400">{eventTitle}</p>}

          {board && isBlocked && task.dependsOn && (
            <p className="mt-2 text-xs text-red-500 leading-4">
              <span className="font-medium">⊘</span> {task.dependsOn}
            </p>
          )}
        </div>

        {board && (
          <span className={`text-xs font-medium ${getPriorityClasses(priority)}`}>
            {priority === "High" ? "H" : priority === "Medium" ? "M" : "L"}
          </span>
        )}
      </div>

      {/* LIST VIEW DETAILS */}
      {!board && (
        <div className="mt-2 flex items-center justify-end gap-5">
          <div className="flex items-center gap-2">
            <Avatar initials={task.initials} />

            <span className="text-xs text-slate-500">{task.owner}</span>
          </div>

          <span className={`text-xs font-medium ${getPriorityClasses(priority)}`}>
            {priority}
          </span>

          <div className="flex items-center gap-1 text-xs text-slate-500 min-w-[55px]">
            <Clock3 className="w-3.5 h-3.5" />
            {task.start}
          </div>

          <span
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium
              ${getStatusClasses(task.status)}
            `}
          >
            {task.status}
          </span>
        </div>
      )}

      {/* BOARD VIEW DETAILS */}
      {board && (
        <div className="mt-3 flex items-center gap-2">
          <Avatar initials={task.initials} />

          <span className="text-xs text-slate-500">{task.start}</span>
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ title, count }: { title: string; count: number }) => {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>

      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-semibold flex items-center justify-center">
        {count}
      </span>

      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
};

const BoardColumn = ({
  title,
  status,
  tasks,
  eventTitle,
  background,
  completedTaskIds,
  toggleTask,
  onDropTask,
}: {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  eventTitle: string;
  background: string;
  completedTaskIds: string[];
  toggleTask: (taskId: string) => void;
  onDropTask: (taskId: string, status: TaskStatus) => void;
}) => {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault(); // allow drop
        e.dataTransfer.dropEffect = "move";
        if (!over) setOver(true);
      }}
      onDragLeave={(e) => {
        // Only when the pointer leaves the column, not when it crosses a child card.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) onDropTask(taskId, status);
      }}
      className={`rounded-xl p-3 min-h-[430px] transition-shadow ${background} ${
        over ? "ring-2 ring-emerald-400 ring-offset-2" : ""
      }`}
    >
      <div className="flex items-center justify-between px-1 mb-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>

        <span className="w-6 h-6 rounded-full bg-white text-slate-500 text-xs font-medium flex items-center justify-center shadow-sm">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-48 rounded-lg border-2 border-dashed border-slate-300/60 text-sm text-slate-400">
            Drop tasks here
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              eventTitle={eventTitle}
              board
              completed={completedTaskIds.includes(task.id)}
              onToggle={() => toggleTask(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Board columns are statuses, so dragging a card between them changes its status.
const BOARD_COLUMNS: { title: string; status: TaskStatus; background: string }[] = [
  { title: "To Do", status: "Pending", background: "bg-[#F8F8F8]" },
  { title: "In Progress", status: "In Progress", background: "bg-[#DFF5F7]" },
  { title: "Blocked", status: "Blocked", background: "bg-[#F5F8D9]" },
  { title: "Done", status: "Done", background: "bg-[#E1E1FA]" },
];

export default function MyTasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const {
    events,
    selected,
    selectedId,
    setSelectedId,
    loading: eventsLoading,
    error: eventsError,
  } = useEventSelection();

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  const user = getStoredUser();
  const eventTitle = selected?.title ?? "Event";

  useEffect(() => {
    if (!selectedId) {
      setAllTasks([]);
      setCompletedTaskIds([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    listSchedule(selectedId)
      .then((r) => {
        if (cancelled) return;
        const tasks = r.items.map(toTask);
        setAllTasks(tasks);
        // Seed local checkmarks from Done status (toggle is local-only for the demo).
        setCompletedTaskIds(
          tasks.filter((t) => t.status === "Done").map((t) => t.id)
        );
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Staff see only their own assignments; organizers see everything so the
  // demo never renders an empty page for the event owner.
  const myTasks = useMemo(() => {
    if (!user) return allTasks;
    if (user.role === "organizer") return allTasks;
    return allTasks.filter((t) => t.ownerId === user.id);
  }, [allTasks, user]);

  // Kanban move: optimistic status change, rolled back if the server refuses.
  const moveTask = async (taskId: string, status: TaskStatus) => {
    const task = allTasks.find((t) => t.id === taskId);
    if (!task || task.status === status || !selectedId) return;
    const prevStatus = task.status;
    const setStatus = (s: TaskStatus) => {
      setAllTasks((cur) => cur.map((t) => (t.id === taskId ? { ...t, status: s } : t)));
      setCompletedTaskIds((cur) =>
        s === "Done" ? [...new Set([...cur, taskId])] : cur.filter((id) => id !== taskId)
      );
    };
    setStatus(status);
    setError(null);
    try {
      await updateTask(selectedId, taskId, { status });
    } catch (e) {
      setStatus(prevStatus);
      setError(`Could not move "${task.name}": ${(e as Error).message}`);
    }
  };

  const toggleTask = (taskId: string) => {
    setCompletedTaskIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId]
    );
  };

  // Partition by status so the four existing sections stay disjoint and cover
  // every task without hardcoded mock ids.
  const recentlyAssigned = myTasks.filter((t) => t.status === "Pending");
  const doToday = myTasks.filter((t) => t.status === "In Progress");
  const doNext = myTasks.filter((t) => t.status === "Blocked");
  const doLater = myTasks.filter((t) => t.status === "Done");

  const blockedCount = myTasks.filter((t) => t.status === "Blocked").length;
  const busy = eventsLoading || loading;

  return (
    <div className="min-h-full bg-[#FBFBF9]">
      <div className="mb-6">
        <EventPicker
          events={events}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {/* PAGE HEADER */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            My Tasks
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {myTasks.length} tasks · {blockedCount} blocked
          </p>
        </div>

        {/* VIEW TOGGLE */}
        <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
          <button
            onClick={() => setViewMode("list")}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full
              text-sm font-medium transition-all
              ${
                viewMode === "list"
                  ? "bg-[#002F2B] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }
            `}
          >
            <List className="w-4 h-4" />
            List
          </button>

          <button
            onClick={() => setViewMode("board")}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full
              text-sm font-medium transition-all
              ${
                viewMode === "board"
                  ? "bg-[#002F2B] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }
            `}
          >
            <LayoutGrid className="w-4 h-4" />
            Board
          </button>
        </div>
      </div>

      {(error || eventsError) && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error || eventsError}
        </p>
      )}

      {busy ? (
        <div className="flex items-center gap-2 py-16 text-sm text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Loading tasks…
        </div>
      ) : !selectedId ? (
        <p className="py-16 text-center text-sm text-gray-400">
          No events yet — create one on the Events page first.
        </p>
      ) : myTasks.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">
          No tasks assigned to you in this event yet.
        </p>
      ) : (
        <>
          {/* ================= LIST VIEW ================= */}
          {viewMode === "list" && (
            <div className="space-y-8">
              {/* RECENTLY ASSIGNED */}
              <section>
                <SectionHeader
                  title="Recently Assigned"
                  count={recentlyAssigned.length}
                />

                <div className="space-y-2">
                  {recentlyAssigned.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      eventTitle={eventTitle}
                      completed={completedTaskIds.includes(task.id)}
                      onToggle={() => toggleTask(task.id)}
                    />
                  ))}
                </div>
              </section>

              {/* DO TODAY */}
              <section>
                <SectionHeader title="Do Today" count={doToday.length} />

                <div className="space-y-2">
                  {doToday.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      eventTitle={eventTitle}
                      completed={completedTaskIds.includes(task.id)}
                      onToggle={() => toggleTask(task.id)}
                    />
                  ))}
                </div>
              </section>

              {/* DO NEXT */}
              <section>
                <SectionHeader title="Do Next" count={doNext.length} />

                <div className="space-y-2">
                  {doNext.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      eventTitle={eventTitle}
                      completed={completedTaskIds.includes(task.id)}
                      onToggle={() => toggleTask(task.id)}
                    />
                  ))}
                </div>
              </section>

              {/* DO LATER */}
              <section>
                <SectionHeader title="Do Later" count={doLater.length} />

                {doLater.length > 0 && (
                  <div className="space-y-2">
                    {doLater.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        eventTitle={eventTitle}
                        completed={completedTaskIds.includes(task.id)}
                        onToggle={() => toggleTask(task.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ================= BOARD VIEW ================= */}
          {viewMode === "board" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {BOARD_COLUMNS.map((col) => (
                <BoardColumn
                  key={col.status}
                  title={col.title}
                  status={col.status}
                  tasks={myTasks.filter((t) => t.status === col.status)}
                  eventTitle={eventTitle}
                  background={col.background}
                  completedTaskIds={completedTaskIds}
                  toggleTask={toggleTask}
                  onDropTask={moveTask}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
