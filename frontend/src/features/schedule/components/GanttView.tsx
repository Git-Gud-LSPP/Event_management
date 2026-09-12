import type { Task } from "../data";
import { timelineHours } from "../data";

interface GanttProps {
  tasks: Task[];
}

export default function Gantt({ tasks }: GanttProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* Timeline Header */}
      <div className="grid grid-cols-[220px_1fr] border-b border-gray-200">

        {/* Task heading */}
        <div className="flex items-center border-r border-gray-200 bg-[#FAFAF8] px-5 py-4 text-xs font-medium uppercase tracking-wide text-gray-500">
          Task
        </div>

        {/* Hours */}
        <div className="grid grid-cols-9 bg-[#FAFAF8]">
          {timelineHours.map((hour) => (
            <div
              key={hour}
              className="border-r border-gray-100 px-3 py-4 text-xs text-gray-500 last:border-r-0"
            >
              {hour}
            </div>
          ))}
        </div>
      </div>

      {/* Gantt Rows */}
      {tasks.map((task) => {
        // Timeline starts at 6:00.
        // Total timeline = 8 hours = 480 minutes.
        const left = (task.startMinutes / 480) * 100;
        const width = (task.durationMinutes / 480) * 100;

        const delayWidth = task.delayMinutes
          ? (task.delayMinutes / 480) * 100
          : 0;

        let barClass = "bg-gray-300";

        if (task.status === "In Progress") {
          barClass = "bg-indigo-600";
        }

        if (task.status === "Blocked") {
          barClass = "bg-red-600";
        }

        if (task.status === "Done") {
          barClass = "bg-gray-300";
        }

        if (task.status === "Pending") {
          barClass = "bg-green-200";
        }

        return (
          <div
            key={task.id}
            className={`grid min-h-[62px] grid-cols-[220px_1fr] border-b border-gray-100 last:border-b-0 ${
              task.status === "Blocked"
                ? "bg-red-50/50"
                : "bg-white"
            }`}
          >

            {/* Task Name */}
            <div className="flex items-center gap-2 border-r border-gray-200 px-5">

              {task.delayed && (
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {task.name}
                </p>

                <p className="mt-0.5 text-xs text-gray-400">
                  {task.initials} · {task.duration}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative">

              {/* Hour grid lines */}
              <div className="absolute inset-0 grid grid-cols-9">
                {timelineHours.map((hour) => (
                  <div
                    key={hour}
                    className="border-r border-gray-100 last:border-r-0"
                  />
                ))}
              </div>

              {/* Task bar */}
              <div
                className={`absolute top-1/2 h-6 -translate-y-1/2 rounded-full ${barClass}`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                }}
              >
                <span className="flex h-full items-center px-3 text-xs font-semibold text-white">
                  {task.duration}
                </span>
              </div>

              {/* Delay overflow */}
              {task.delayed && delayWidth > 0 && (
                <div
                  className="absolute top-1/2 h-6 -translate-y-1/2 rounded-full bg-red-300"
                  style={{
                    left: `${left + width}%`,
                    width: `${delayWidth}%`,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}

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