import type { IncidentRecord } from "../api";
import { PriorityBadge, StatusBadge } from "./IncidentBadges";

interface IncidentListProps {
  incidents: IncidentRecord[];
  onOpen: (incident: IncidentRecord) => void;
}

const timeAgo = (iso: string) => {
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  );
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

export default function IncidentList({ incidents, onOpen }: IncidentListProps) {
  const cols = "grid-cols-[2fr_1fr_1fr_1.2fr_1fr_0.8fr]";

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div
        className={`grid ${cols} border-b border-gray-200 bg-[#FAFAF8] px-5 py-4 text-xs font-medium uppercase tracking-wide text-gray-500`}
      >
        <div>Incident</div>
        <div>Priority</div>
        <div>Status</div>
        <div>Assigned To</div>
        <div>Location</div>
        <div>Reported</div>
      </div>

      {incidents.map((incident) => (
        <button
          key={incident._id}
          onClick={() => onOpen(incident)}
          className={`grid ${cols} w-full items-center border-b border-gray-100 px-5 py-4 text-left last:border-b-0 hover:bg-gray-50 ${
            incident.priority === "Critical" ? "bg-red-50/60" : "bg-white"
          }`}
        >
          <span className="text-sm font-medium text-gray-900">
            {incident.title}
          </span>
          <div>
            <PriorityBadge priority={incident.priority} />
          </div>
          <div>
            <StatusBadge status={incident.status} />
          </div>
          <span className="text-sm text-gray-500">
            {incident.assignedTo?.name ?? "Unassigned"}
          </span>
          <span className="truncate pr-2 text-sm text-gray-500">
            {incident.location || "—"}
          </span>
          <span className="text-xs text-gray-400">
            {timeAgo(incident.createdAt)}
          </span>
        </button>
      ))}

      {incidents.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">
          No incidents reported for this event yet.
        </div>
      )}
    </div>
  );
}
