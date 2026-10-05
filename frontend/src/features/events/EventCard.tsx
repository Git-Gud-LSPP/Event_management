import React from "react";
import type { EventRecord } from "./api";
import { STATUS_PILL, fmtDate } from "./format";

export interface EventCardProps {
  event: EventRecord;
  category: string; // Live / Upcoming / Draft / Completed / Cancelled
  progress: number; // share of the event's scheduled time that has passed
  staffCount: number;
  onClick?: () => void;
}

const EventCard = ({ event, category, progress, staffCount, onClick }: EventCardProps): React.JSX.Element => (
  <button
    type="button"
    onClick={onClick}
    className="flex cursor-pointer flex-col gap-3.5 rounded-2xl border border-transparent bg-surface p-5 text-left transition-[transform,box-shadow,border-color] duration-[350ms] ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-[3px] hover:border-[#C4CEC6] hover:shadow-[0_24px_48px_-32px_rgba(20,45,30,.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
  >
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10.5px] tracking-[.04em] text-ink-3">EVENT</span>
      <span className={`rounded-full px-2 py-[3px] font-mono text-[10.5px] tracking-[.03em] uppercase ${STATUS_PILL[category] ?? STATUS_PILL.Draft}`}>{category}</span>
    </div>
    <div>
      <div className="text-[19px] font-medium tracking-[-0.02em] text-ink">{event.title}</div>
      <div className="mt-1 text-[13px] text-ink-3">
        {fmtDate(event.startsAt)}
        {event.location && ` · ${event.location}`}
      </div>
    </div>
    {event.description && <div className="line-clamp-2 text-[13.5px] leading-normal text-ink-3">{event.description}</div>}
    <div>
      <div className="mb-1.5 flex justify-between text-xs text-ink-3">
        <span>Event timeline</span>
        <span className="font-mono">{progress}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-sm bg-line-soft">
        <div className={`h-full ${category === "Live" ? "bg-live" : "bg-ink"}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
    <div className="grid grid-cols-2 border-t border-line-soft pt-3 text-xs text-ink-3">
      <div>
        <div className="text-base tracking-[-0.02em] text-ink">{staffCount}</div>staff
      </div>
      <div>
        <div className="text-base tracking-[-0.02em] text-ink">{event.capacity ?? "—"}</div>capacity
      </div>
    </div>
  </button>
);

export default EventCard;
