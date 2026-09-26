import { Mail, Trash2, ClipboardList } from "lucide-react";
import type { StaffRef } from "../events/api";

const initialsOf = (name: string) =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";

export default function StaffCard({
  member,
  taskCount,
  onRemove,
}: {
  member: StaffRef;
  taskCount?: number;
  onRemove?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
            {initialsOf(member.name)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold tracking-tight text-gray-900">
              {member.name}
            </h3>
            <p className="flex items-center gap-1 truncate text-xs text-gray-500">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {member.email}
            </p>
          </div>
        </div>

        {onRemove && (
          <button
            onClick={onRemove}
            title="Remove from this event"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3 text-xs font-medium text-gray-500">
        <ClipboardList className="h-3.5 w-3.5" />
        {taskCount === undefined
          ? "Assigned to this event"
          : `${taskCount} task${taskCount === 1 ? "" : "s"} on this event`}
      </div>
    </div>
  );
}
