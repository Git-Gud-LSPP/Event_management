import type { IncidentRecord } from "../api";
import { card, mono, pillOf } from "../../../components/ui";

const timeAgo = (iso: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

export default function IncidentList({
  incidents,
  selectedId,
  onOpen,
}: {
  incidents: IncidentRecord[];
  selectedId?: string;
  onOpen: (incident: IncidentRecord) => void;
}) {
  return (
    <div className={card}>
      {incidents.map((i) => (
        <button
          key={i._id}
          type="button"
          onClick={() => onOpen(i)}
          aria-pressed={i._id === selectedId}
          className={`flex w-full cursor-pointer flex-col gap-2 border-b border-line-soft px-[18px] py-4 text-left last:border-0 hover:bg-soft ${i._id === selectedId ? "bg-[#F4F9F3]" : ""}`}
        >
          <span className="flex items-center justify-between gap-2.5">
            <span className="flex gap-1.5">
              <span className={pillOf(i.priority)}>{i.priority.toUpperCase()}</span>
              <span className={pillOf(i.status)}>{i.status.toUpperCase()}</span>
            </span>
            <span className={`${mono} text-[#6E7C73]`}>{timeAgo(i.createdAt)}</span>
          </span>
          <span className="text-[14.5px] font-medium text-ink">{i.title}</span>
          <span className="text-[12.5px] text-ink-3">
            {i.location || "No location"} · {i.assignedTo ? i.assignedTo.name : "Unassigned"}
          </span>
        </button>
      ))}

      {incidents.length === 0 && <div className="py-12 text-center text-sm text-ink-3">No incidents match this filter.</div>}
    </div>
  );
}
