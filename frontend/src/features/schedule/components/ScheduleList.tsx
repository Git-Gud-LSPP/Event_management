import { Pencil, Trash2 } from "lucide-react";
import { priorityOf, type Task } from "../data";
import type { StaffRef } from "../../events/api";
import { PRIORITY_TEXT, card, pillOf, tableHead } from "../../../components/ui";

interface ScheduleListProps {
  tasks: Task[];
  staff?: StaffRef[];
  onAssign?: (taskId: string, staffId: string) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

export default function ScheduleList({ tasks, staff, onAssign, onEdit, onDelete }: ScheduleListProps) {
  const canManage = Boolean(onEdit || onDelete);
  const cols = `grid gap-2 ${canManage ? "grid-cols-[2fr_1.3fr_.7fr_.7fr_1fr_1.3fr_64px]" : "grid-cols-[2fr_1.2fr_.8fr_.8fr_1fr_1.4fr]"}`;

  return (
    <div className={`${card} overflow-x-auto`}>
      <div className="min-w-[760px]">
        <div className={`${cols} ${tableHead}`}>
          <span>TASK</span>
          <span>OWNER</span>
          <span>START</span>
          <span>PRIORITY</span>
          <span>STATUS</span>
          <span>DEPENDS ON</span>
          {canManage && <span className="sr-only">Actions</span>}
        </div>

        {tasks.map((task) => {
          const p = priorityOf(task);
          return (
            <div key={task.id} className={`${cols} items-center border-b border-line-soft px-[18px] py-3 text-[13px] last:border-0`}>
              <span className="flex min-w-0 items-center gap-2">
                {task.delayed && <span className="size-1.5 flex-none rounded-full bg-danger" title="Delayed" />}
                <span className="truncate">{task.name}</span>
              </span>

              {onAssign ? (
                <select
                  aria-label={`Owner of ${task.name}`}
                  value={task.ownerId ?? ""}
                  onChange={(e) => e.target.value && onAssign(task.id, e.target.value)}
                  className="h-8 min-w-0 rounded-full border border-line bg-surface px-2.5 text-[13px] text-ink outline-none hover:border-ink focus:border-ink"
                >
                  <option value="">Unassigned</option>
                  {(staff ?? []).map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <span className="flex min-w-0 items-center gap-2">
                  <span className="grid size-6 flex-none place-items-center rounded-full bg-[#E4EEE6] text-[9.5px]">{task.initials}</span>
                  <span className="truncate">{task.owner}</span>
                </span>
              )}

              <span className="font-mono text-xs">{task.start}</span>
              <span className={`font-mono text-[11px] ${PRIORITY_TEXT[p]}`}>{task.status === "Done" ? "—" : p.toUpperCase()}</span>
              <span><span className={pillOf(task.status)}>{task.status}</span></span>
              <span className="truncate text-xs text-ink-3">{task.dependsOn || "—"}</span>

              {canManage && (
                <span className="flex justify-end gap-0.5">
                  {onEdit && (
                    <button type="button" onClick={() => onEdit(task.id)} aria-label={`Edit ${task.name}`} className="cursor-pointer rounded-full p-1.5 text-ink-3 hover:bg-sunken hover:text-ink">
                      <Pencil size={14} />
                    </button>
                  )}
                  {onDelete && (
                    <button type="button" onClick={() => onDelete(task.id)} aria-label={`Delete ${task.name}`} className="cursor-pointer rounded-full p-1.5 text-ink-3 hover:bg-danger-soft hover:text-danger">
                      <Trash2 size={14} />
                    </button>
                  )}
                </span>
              )}
            </div>
          );
        })}

        {tasks.length === 0 && <div className="py-12 text-center text-sm text-ink-3">No tasks found.</div>}
      </div>
    </div>
  );
}
