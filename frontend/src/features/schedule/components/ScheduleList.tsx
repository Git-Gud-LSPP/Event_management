import type { Task, TaskStatus } from "../data";

interface ScheduleListProps {
  tasks: Task[];
}

const getStatusStyle = (status: TaskStatus) => {
  switch (status) {
    case "Done":
      return "bg-green-100 text-green-700";

    case "In Progress":
      return "bg-indigo-100 text-indigo-600";

    case "Blocked":
      return "bg-red-100 text-red-600";

    case "Pending":
      return "bg-gray-100 text-gray-600";

    default:
      return "bg-gray-100 text-gray-600";
  }
};

export default function ScheduleList({
  tasks,
}: ScheduleListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* Table Header */}
      <div className="grid grid-cols-[2.2fr_1.2fr_0.8fr_0.9fr_1fr_1.5fr] border-b border-gray-200 bg-[#FAFAF8] px-5 py-4 text-xs font-medium uppercase tracking-wide text-gray-500">
        <div>Task</div>
        <div>Owner</div>
        <div>Start</div>
        <div>Duration</div>
        <div>Status</div>
        <div>Depends On</div>
      </div>

      {/* Rows */}
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`grid grid-cols-[2.2fr_1.2fr_0.8fr_0.9fr_1fr_1.5fr] items-center border-b border-gray-100 px-5 py-4 last:border-b-0 ${
            task.status === "Blocked"
              ? "bg-red-50/60"
              : "bg-white"
          }`}
        >
          {/* Task */}
          <div className="flex items-center gap-3">
            {task.delayed && (
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
            )}

            <span className="text-sm font-medium text-gray-900">
              {task.name}
            </span>
          </div>

          {/* Owner */}
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-[10px] font-semibold text-green-800">
              {task.initials}
            </div>

            <span className="text-sm text-gray-500">
              {task.owner}
            </span>
          </div>

          {/* Start */}
          <div className="text-sm text-gray-500">
            {task.start}
          </div>

          {/* Duration */}
          <div className="text-sm text-gray-500">
            {task.duration}
          </div>

          {/* Status */}
          <div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                task.status
              )}`}
            >
              {task.status}
            </span>
          </div>

          {/* Dependency */}
          <div className="truncate pr-2 text-sm text-gray-400">
            {task.dependsOn || "—"}
          </div>
        </div>
      ))}

      {/* No results */}
      {tasks.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">
          No tasks found.
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col gap-3 px-6 py-4 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-4 rounded-full bg-red-300" />
            Delay overflow
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Delayed task
          </div>
        </div>

        <span>
          Delays cascade to dependent tasks — see Dependency Alerts
        </span>
      </div>
    </div>
  );
}