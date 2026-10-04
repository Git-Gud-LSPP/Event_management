import type { IncidentPriority, IncidentStatus } from "../api";

const priorityStyle: Record<IncidentPriority, string> = {
  Critical: "bg-red-100 text-red-600",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-gray-100 text-gray-600",
};

const statusStyle: Record<IncidentStatus, string> = {
  Open: "bg-gray-100 text-gray-600",
  "In Progress": "bg-indigo-100 text-indigo-600",
  Resolved: "bg-green-100 text-green-700",
};

const pill = "inline-flex rounded-full px-3 py-1 text-xs font-medium";

export function PriorityBadge({ priority }: { priority: IncidentPriority }) {
  return (
    <span className={`${pill} ${priorityStyle[priority]}`}>{priority}</span>
  );
}

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return <span className={`${pill} ${statusStyle[status]}`}>{status}</span>;
}
