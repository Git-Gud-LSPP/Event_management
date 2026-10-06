import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { clashFor, createTask, updateTask, type ScheduleItem } from "./api";
import type { TaskStatus } from "./data";
import type { StaffRef } from "../events/api";

const STATUSES: TaskStatus[] = ["Pending", "In Progress", "Blocked", "Done"];

const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function TaskFormModal({
  eventId,
  task,
  staff,
  siblings,
  onClose,
  onSaved,
}: {
  eventId: string;
  task?: ScheduleItem;
  staff: StaffRef[];
  siblings: ScheduleItem[];
  onClose: () => void;
  onSaved: (saved: ScheduleItem) => void;
}) {
  const [name, setName] = useState(task?.name ?? "");
  const [owner, setOwner] = useState(task?.owner?._id ?? "");
  const [startsAt, setStartsAt] = useState(toLocalInput(task?.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(task?.endsAt));
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "Pending");
  const [dependsOn, setDependsOn] = useState(task?.dependsOn?._id ?? "");
  const [delayMinutes, setDelayMinutes] = useState(String(task?.delayMinutes ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Who is already on another task during this slot. Only known once a start time is set.
  const busyOf = (staffId: string) =>
    startsAt
      ? clashFor(siblings, staffId, {
          _id: task?._id,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        })?.name
      : undefined;
  const ownerBusy = owner ? busyOf(owner) : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerBusy) {
      setError(`That person is busy with "${ownerBusy}" at this time. Pick someone else or move the task.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        owner: owner || null, // none = event backlog
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        status,
        dependsOn: dependsOn || null,
        delayMinutes: Number(delayMinutes) || 0,
      } as unknown as Partial<ScheduleItem>;

      onSaved(
        task
          ? await updateTask(eventId, task._id, payload)
          : await createTask(eventId, payload)
      );
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const field =
    "w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">
            {task ? "Edit task" : "New task"}
          </h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink-2">
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
            {error}
          </p>
        )}

        {staff.length <= 1 && (
          <p className="mb-4 rounded-xl bg-warn-soft px-3 py-2 text-xs font-medium text-warn">
            This event has no staff yet. Add people on the Staff page, or assign the task to yourself.
          </p>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-2">Task name</label>
            <input className={field} required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-2">Owner</label>
            <select className={field} value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="">Unassigned (backlog)</option>
              {staff.map((s) => {
                const busy = s._id !== owner ? busyOf(s._id) : undefined;
                return (
                  <option key={s._id} value={s._id} disabled={Boolean(busy)}>
                    {busy ? `${s.name} (busy: ${busy})` : s.name}
                  </option>
                );
              })}
            </select>
            {ownerBusy && (
              <p className="mt-1 text-xs text-danger">Busy with "{ownerBusy}" at this time.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">Starts</label>
              <input
                className={field}
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">Ends</label>
              <input
                className={field}
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">Status</label>
              <select
                className={field}
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">Delay (minutes)</label>
              <input
                className={field}
                type="number"
                min={0}
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-2">Depends on</label>
            <select className={field} value={dependsOn} onChange={(e) => setDependsOn(e.target.value)}>
              <option value="">Nothing</option>
              {siblings
                .filter((s) => s._id !== task?._id)
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-medium text-ink-2 hover:bg-sunken"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#16231C] px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {task ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
