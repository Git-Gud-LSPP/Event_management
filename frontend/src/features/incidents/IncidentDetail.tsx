import { useState, type ReactNode } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import type { StaffRef } from "../events/api";
import type { LayoutContext } from "../../App";
import { getStoredUser } from "../../services/authApi";
import { mono, pillOf } from "../../components/ui";
import { assignIncident, deleteIncident, updateIncidentStatus, type IncidentRecord, type IncidentStatus } from "./api";

const STATUSES: IncidentStatus[] = ["Open", "In Progress", "Resolved"];

// Backend rules: Open -> In Progress (needs an assignee) -> Resolved, which is terminal.
const canMoveTo = (from: IncidentStatus, to: IncidentStatus, hasAssignee: boolean) =>
  (from === "Open" && to === "In Progress" && hasAssignee) || (from === "In Progress" && to === "Resolved");

const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Side panel for the selected incident: details, assignment, status moves, delete. */
export default function IncidentDetail({
  eventId,
  incident,
  staff,
  onUpdated,
  onDeleted,
}: {
  eventId: string;
  incident: IncidentRecord;
  staff: StaffRef[];
  onUpdated: (updated: IncidentRecord) => void;
  onDeleted: (id: string) => void;
}) {
  const { openAgent } = useOutletContext<LayoutContext>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const user = getStoredUser();
  const isOrganizer = user?.role === "organizer";
  const canChangeStatus = isOrganizer || Boolean(user && incident.assignedTo?._id === user.id);

  const run = async (action: () => Promise<IncidentRecord | void>) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await action();
      if (updated) onUpdated(updated);
      else onDeleted(incident._id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const rows: [string, ReactNode][] = [
    ["STATUS", incident.status],
    ["WHAT", incident.description || "No description yet."],
    [
      "ASSIGNED",
      isOrganizer && !incident.assignedTo ? (
        <select
          aria-label="Assign incident"
          className="h-8 w-full rounded-full border border-line bg-surface px-2.5 text-[13px] outline-none hover:border-ink focus:border-ink"
          value=""
          disabled={busy}
          onChange={(e) => e.target.value && run(() => assignIncident(eventId, incident._id, e.target.value))}
        >
          <option value="">Unassigned. Pick someone…</option>
          {staff.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      ) : (
        incident.assignedTo?.name ?? "Unassigned"
      ),
    ],
    ["REPORTED", `${incident.reportedBy.name} · ${fmtWhen(incident.createdAt)}`],
    ...(incident.resolvedAt ? [["RESOLVED", fmtWhen(incident.resolvedAt)] as [string, ReactNode]] : []),
  ];

  return (
    <aside aria-label="Incident details" className="sticky top-[84px] overflow-hidden rounded-2xl bg-surface">
      <div className="border-b border-line-soft px-5 pt-5 pb-4">
        <div className="flex gap-1.5">
          <span className={pillOf(incident.priority)}>{incident.priority.toUpperCase()}</span>
          <span className={pillOf(incident.status)}>{incident.status.toUpperCase()}</span>
        </div>
        <h2 className="mt-3 mb-1 text-[22px] leading-[1.15] font-medium tracking-[-0.03em]">{incident.title}</h2>
        <div className="text-[13px] text-ink-3">
          {fmtWhen(incident.createdAt)}
          {incident.location && ` · ${incident.location}`}
        </div>
      </div>

      <button
        type="button"
        onClick={openAgent}
        className="mx-5 mt-4 block w-[calc(100%-40px)] cursor-pointer rounded-xl bg-ink p-3.5 text-left text-paper hover:bg-ink-hover"
      >
        <span className={`${mono} flex items-center gap-[7px] text-ai`}>
          <span className="size-1.5 rounded-full bg-live" aria-hidden="true" />
          AI TRIAGE
        </span>
        <span className="mt-1.5 block text-[13.5px] leading-normal text-[#DCE6DE]">
          Ask EventOps AI who should take this, what it blocks, and how to resolve it.
        </span>
      </button>

      {error && <p role="alert" className="mx-5 mt-4 rounded-xl bg-danger-soft px-3 py-2 text-xs font-medium text-danger">{error}</p>}

      <dl className="px-5 pt-2 pb-1 text-[13.5px]">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[90px_1fr] gap-3 border-b border-line-soft py-[11px] last:border-0">
            <dt className={`${mono} pt-0.5 text-[#6E7C73]`}>{k}</dt>
            <dd className="leading-normal text-[#2B3830]">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center gap-1.5 px-5 pt-4 pb-5">
        {STATUSES.map((st) => {
          const current = incident.status === st;
          const allowed = canChangeStatus && canMoveTo(incident.status, st, Boolean(incident.assignedTo));
          return (
            <button
              key={st}
              type="button"
              disabled={!allowed || busy}
              onClick={() => run(() => updateIncidentStatus(eventId, incident._id, st))}
              aria-current={current || undefined}
              className={`rounded-full border px-3.5 py-[9px] text-[13px] ${current ? "border-ink bg-ink text-paper" : "border-[#CBD6CC] bg-surface text-ink enabled:cursor-pointer enabled:hover:border-ink disabled:opacity-45"}`}
            >
              {current ? `● ${st}` : `Mark ${st.toLowerCase()}`}
            </button>
          );
        })}
        {busy && <Loader2 size={14} className="animate-spin text-ink-3" />}
      </div>
      {incident.status === "Open" && !incident.assignedTo && (
        <p className="-mt-3 px-5 pb-4 text-xs text-warn">Assign someone before this can move to in progress.</p>
      )}

      {isOrganizer && (
        <div className="border-t border-line-soft px-5 py-3.5">
          {!confirmingDelete ? (
            <button type="button" onClick={() => setConfirmingDelete(true)} className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-ink-3 hover:text-danger">
              <Trash2 size={13} /> Delete incident
            </button>
          ) : (
            <div className="flex items-center gap-3 text-xs">
              <span className="flex-1 text-danger">Delete this incident? This can't be undone.</span>
              <button type="button" onClick={() => setConfirmingDelete(false)} className="cursor-pointer text-ink-3 hover:text-ink">Cancel</button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => deleteIncident(eventId, incident._id))}
                className="cursor-pointer rounded-full bg-danger px-3 py-1.5 text-white disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
