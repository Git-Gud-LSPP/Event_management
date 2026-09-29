import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { StaffRef } from "../events/api";
import {
  createIncident,
  type IncidentInput,
  type IncidentPriority,
  type IncidentRecord,
} from "./service";

const PRIORITIES: IncidentPriority[] = ["Low", "Medium", "Critical"];

export default function IncidentFormModal({
  eventId,
  staff,
  onClose,
  onSaved,
}: {
  eventId: string;
  staff: StaffRef[];
  onClose: () => void;
  onSaved: (saved: IncidentRecord) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState<IncidentPriority>("Medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: IncidentInput = {
        title,
        description: description || undefined,
        location: location || undefined,
        priority,
        assignedTo: assignedTo || null,
      };
      onSaved(await createIncident(eventId, payload));
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
            Report incident
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Title
            </label>
            <input
              className={field}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Description
            </label>
            <textarea
              className={field}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Location
              </label>
              <input
                className={field}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Priority
              </label>
              <select
                className={field}
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as IncidentPriority)
                }
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Assign to (optional)
            </label>
            <select
              className={field}
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Leave unassigned</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            {staff.length === 0 && (
              <p className="mt-1 text-xs text-amber-700">
                This event has no staff yet — add people on the Staff page to
                assign incidents.
              </p>
            )}
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
              Report incident
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
