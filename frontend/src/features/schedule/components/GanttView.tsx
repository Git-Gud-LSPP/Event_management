import { useEffect, useMemo, useRef } from "react";
import { Gantt as SvarGantt, Willow, type IApi, type ITask } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";
import type { ScheduleItem } from "../api";
import type { TaskStatus } from "../data";

// SVAR React Gantt (MIT core): real date axis, dependency arrows, drag/resize.
// Dependencies are edited in the task form, so link editing in the chart is off.

const STATUS_COLOR: Record<TaskStatus, string> = {
  Pending: "#86efac",
  "In Progress": "#4f46e5",
  Blocked: "#dc2626",
  Done: "#9ca3af",
};

const MIN = 60_000;
const NO_END_MINUTES = 30; // tasks without endsAt still need a visible bar
// Drags are per-minute; persist on a 5-minute grid so times stay readable.
const snap = (d: Date) => new Date(Math.round(d.getTime() / (5 * MIN)) * 5 * MIN);

const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const SCALES = [
  { unit: "day", step: 1, format: (d: Date) => d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) },
  { unit: "hour", step: 1, format: (d: Date) => d.toLocaleTimeString([], { hour: "numeric" }) },
];

const COLUMNS = [
  { id: "text", header: "Task", flexgrow: 2 },
  { id: "owner", header: "Owner", width: 110 },
  { id: "status", header: "Status", width: 90 },
];

// Locked chart edits: we only persist start/end changes from drag and resize.
const BLOCKED_ACTIONS = [
  "add-task", "copy-task", "delete-task", "move-task", "indent-task",
  "add-link", "update-link", "delete-link",
];

function TaskBar({ data }: { data: ITask }) {
  const status = data.status as TaskStatus;
  return (
    <div
      className="absolute inset-0 flex items-center gap-1.5 overflow-hidden rounded-[inherit] px-2 text-[11px] font-semibold text-white"
      style={{ background: STATUS_COLOR[status] ?? STATUS_COLOR.Pending }}
      title={`${data.text} · ${fmtTime(data.start!)} - ${fmtTime(data.end!)} · ${status}`}
    >
      <span className="truncate">{data.text}</span>
      {data.delayMinutes > 0 && (
        <span className="shrink-0 rounded bg-white/25 px-1">+{data.delayMinutes}m</span>
      )}
    </div>
  );
}

export default function Gantt({
  items,
  onReschedule,
}: {
  items: ScheduleItem[];
  // Omit for read-only (staff). Receives only the fields that changed.
  onReschedule?: (id: string, change: { startsAt?: string; endsAt?: string }) => void;
}) {
  // init() runs once, so the handlers read the latest props through refs.
  const itemsRef = useRef(items);
  const rescheduleRef = useRef(onReschedule);
  useEffect(() => {
    itemsRef.current = items;
    rescheduleRef.current = onReschedule;
  });

  const { tasks, links } = useMemo(() => {
    const ids = new Set(items.map((i) => i._id));
    return {
      tasks: items.map((i) => {
        const start = new Date(i.startsAt);
        const end = i.endsAt ? new Date(i.endsAt) : new Date(start.getTime() + NO_END_MINUTES * MIN);
        return {
          id: i._id,
          text: i.name,
          start,
          end: end > start ? end : new Date(start.getTime() + NO_END_MINUTES * MIN),
          type: "task",
          owner: i.owner?.name ?? "Unassigned",
          status: i.status,
          delayMinutes: i.delayMinutes ?? 0,
        };
      }),
      links: items
        .filter((i) => i.dependsOn && ids.has(i.dependsOn._id))
        .map((i) => ({ id: `${i.dependsOn!._id}>${i._id}`, source: i.dependsOn!._id, target: i._id, type: "e2s" as const })),
    };
  }, [items]);

  const init = (api: IApi) => {
    for (const action of BLOCKED_ACTIONS) api.intercept(action, () => false);
    api.on("update-task", (ev) => {
      if (ev.inProgress || !rescheduleRef.current) return;
      const item = itemsRef.current.find((i) => i._id === ev.id);
      if (!item || !ev.task.start || !ev.task.end) return;
      const start = snap(ev.task.start);
      const end = snap(ev.task.end);

      // Work from the edge(s) that moved, not SVAR's duration, which it rounds to whole
      // hours (a 30-minute task would otherwise come back with a different length).
      const oldStart = new Date(item.startsAt).getTime();
      const oldEnd = item.endsAt ? new Date(item.endsAt).getTime() : oldStart + NO_END_MINUTES * MIN;
      const movedStart = Math.abs(start.getTime() - oldStart) >= MIN;
      const movedEnd = Math.abs(end.getTime() - oldEnd) >= MIN;

      if (movedStart && movedEnd) {
        // Whole bar dragged: keep the original length.
        const shift = start.getTime() - oldStart;
        rescheduleRef.current(item._id, {
          startsAt: start.toISOString(),
          ...(item.endsAt ? { endsAt: new Date(oldEnd + shift).toISOString() } : {}),
        });
      } else if (movedStart) {
        rescheduleRef.current(item._id, { startsAt: start.toISOString() });
      } else if (movedEnd) {
        rescheduleRef.current(item._id, { endsAt: end.toISOString() });
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-400">
        No tasks to chart yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="h-[560px]">
        <Willow fonts={false}>
          <SvarGantt
            init={init}
            tasks={tasks}
            links={links}
            scales={SCALES}
            columns={COLUMNS}
            durationUnit="hour"
            lengthUnit="minute"
            cellWidth={70}
            cellHeight={40}
            taskTemplate={TaskBar}
            readonly={!onReschedule}
          />
        </Willow>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          {(Object.keys(STATUS_COLOR) as TaskStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full" style={{ background: STATUS_COLOR[s] }} />
              {s}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="rounded bg-gray-200 px-1 text-[10px] font-semibold">+15m</span> Delay
          </span>
        </div>
        <span>
          {onReschedule ? "Drag a bar to move it, or its edges to resize. " : ""}
          Arrows show dependencies.
        </span>
      </div>
    </div>
  );
}
