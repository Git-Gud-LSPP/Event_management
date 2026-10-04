import { useState } from "react";
import { X, Loader2, Trash2 } from "lucide-react";
import type { StaffRef } from "../events/api";
import { getStoredUser } from "../../services/authApi";
import {
  assignIncident,
  deleteIncident,
  updateIncidentStatus,
  type IncidentRecord,
  type IncidentStatus,
} from "./api";
import { PriorityBadge, StatusBadge } from "./components/IncidentBadges";

// "In Progress" requires an assignee.
const nextStatuses = (
  current: IncidentStatus,
  hasAssignee: boolean
): IncidentStatus[] => {
  if (current === "Open") return hasAssignee ? ["In Progress"] : [];
  if (current === "In Progress") return ["Resolved"];
  return []; // Resolved is terminal in v1 — no reopening.
};

export default function IncidentDetailModal({
  eventId,
  incident,
  staff,
  onClose,
  onUpdated,
  onDeleted,
}: {
  eventId: string;
  incident: IncidentRecord;
  staff: StaffRef[];
  onClose: () => void;
  onUpdated: (updated: IncidentRecord) => void;
  onDeleted: (id: string) => void;
}) {
  const [current, setCurrent] = useState(incident);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const user = getStoredUser();
  const isOrganizer = user?.role === "organizer";
  const isAssignee = Boolean(user && current.assignedTo?._id === user.id);
  const canChangeStatus = isOrganizer || isAssignee;

  const runAction = async (action: () => Promise<IncidentRecord>) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await action();
      setCurrent(updated);
      onUpdated(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = (staffId: string) =>
    runAction(() => assignIncident(eventId, current._id, staffId));

  const handleStatus = (status: IncidentStatus) =>
    runAction(() => updateIncidentStatus(eventId, current._id, status));

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteIncident(eventId, current._id);
      onDeleted(current._id);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const options = nextStatuses(current.status, Boolean(current.assignedTo));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {current.title}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <PriorityBadge priority={current.priority} />
              <StatusBadge status={current.status} />
            </div>
          </div>
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

        <div className="space-y-3 text-sm">
          {current.description && (
            <p className="text-gray-700">{current.description}</p>
          )}
          <div className="grid grid-cols-2 gap-3 text-gray-500">
            <div>
              <span className="block text-xs font-semibold text-gray-600">
                Location
              </span>
              {current.location || "—"}
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-600">
                Reported by
              </span>
              {current.reportedBy.name}
            </div>
          </div>
        </div>

        {/* Assignment — organizer only */}
        {isOrganizer && (
          <div className="mt-5">
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Assigned to
            </label>
            <select
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              value={current.assignedTo?._id ?? ""}
              disabled={busy}
              onChange={(e) => e.target.value && handleAssign(e.target.value)}
            >
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            {/* Reassignment isn't supported */}
            {current.assignedTo && (
              <p className="mt-1 text-xs text-gray-400">
                Already assigned — reassignment isn't available yet.
              </p>
            )}
          </div>
        )}

        {/* Status actions — assignee or organizer */}
        {canChangeStatus && options.length > 0 && (
          <div className="mt-5 flex gap-2">
            {options.map((status) => (
              <button
                key={status}
                disabled={busy}
                onClick={() => handleStatus(status)}
                className="inline-flex items-center gap-2 rounded-full bg-[#002F2B] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                Mark {status}
              </button>
            ))}
          </div>
        )}

        {current.status === "Open" && !current.assignedTo && isOrganizer && (
          <p className="mt-3 text-xs text-amber-700">
            Assign a staff member before this can move to In Progress.
          </p>
        )}

        {/* Delete — organizer only, inline confirm */}
        {isOrganizer && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            {!confirmingDelete ? (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="inline-flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600"
              >
                <Trash2 size={15} /> Delete incident
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-xl bg-red-50 px-3 py-2">
                <p className="flex-1 text-xs font-medium text-red-600">
                  Delete this incident? This can't be undone.
                </p>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  disabled={busy}
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                >
                  {busy && <Loader2 size={12} className="animate-spin" />}
                  Confirm delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
