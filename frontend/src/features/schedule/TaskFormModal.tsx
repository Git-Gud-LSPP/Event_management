import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createTask, updateTask, type ScheduleItem } from "./api";
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner) {
      setError("Pick an owner — the backend requires one on every task.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        owner,
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
    "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {task ? "Edit task" : "New task"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}

        {staff.length === 0 && (
          <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            This event has no staff yet. Add people on the Staff page first — a task needs an owner.
          </p>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Task name</label>
            <input className={field} required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Owner</label>
            <select className={field} value={owner} onChange={(e) => setOwner(e.target.value)} required>
              <option value="">Select staff…</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Starts</label>
              <input
                className={field}
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Ends</label>
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
              <label className="mb-1 block text-xs font-semibold text-gray-600">Status</label>
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
              <label className="mb-1 block text-xs font-semibold text-gray-600">Delay (minutes)</label>
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
            <label className="mb-1 block text-xs font-semibold text-gray-600">Depends on</label>
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
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#002F2B] px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
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
