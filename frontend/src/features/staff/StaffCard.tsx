import type { StaffRef } from "../events/api";
import { initialsOf, pillOf } from "../../components/ui";

export interface StaffLoad {
  status: "On task" | "Blocked" | "Available";
  now?: string; // name of the in-progress (or blocked) task
  total: number;
  done: number;
}

export default function StaffCard({ member, load, onRemove }: { member: StaffRef; load: StaffLoad; onRemove?: () => void }) {
  const row = "flex justify-between gap-2.5 border-b border-line-soft py-[9px] last:border-0";
  return (
    <div className={`flex flex-col gap-3.5 rounded-2xl border bg-surface p-[18px] ${load.status === "Blocked" ? "border-[#F0CDB8]" : "border-line"}`}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 flex-none place-items-center rounded-xl bg-[#E4EEE6] text-[13px]">{initialsOf(member.name)}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium">{member.name}</div>
          <div className="truncate text-[12.5px] text-ink-3">Event staff</div>
        </div>
        <span className={pillOf(load.status)}>{load.status.toUpperCase()}</span>
      </div>
      <div className="border-t border-line-soft text-[13px]">
        <div className={row}>
          <span className="text-ink-3">Now</span>
          <span className={`truncate text-right ${load.status === "Blocked" ? "text-danger" : ""}`}>{load.now ?? "—"}</span>
        </div>
        <div className={row}>
          <span className="text-ink-3">Tasks</span>
          <span>{load.total ? `${load.done} of ${load.total} done` : "None assigned"}</span>
        </div>
        <div className={row}>
          <span className="text-ink-3">Email</span>
          <a href={`mailto:${member.email}`} className="truncate font-mono text-xs hover:text-accent">{member.email}</a>
        </div>
      </div>
      {onRemove && (
        <button type="button" onClick={onRemove} className="cursor-pointer self-start text-xs text-ink-3 hover:text-danger">
          Remove from event
        </button>
      )}
    </div>
  );
}
