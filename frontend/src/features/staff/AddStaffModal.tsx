import { useEffect, useMemo, useState } from "react";
import { X, Loader2, UserPlus } from "lucide-react";
import { authApi, type AuthUser } from "../../services/authApi";
import { addStaff, type EventRecord } from "../events/api";

// Lets the organizer pick a real person instead of typing a database id.
export default function AddStaffModal({
  event,
  onClose,
  onAdded,
}: {
  event: EventRecord;
  onClose: () => void;
  onAdded: (updated: EventRecord) => void;
}) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .listUsers("staff")
      .then(setUsers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const alreadyOn = useMemo(
    () => new Set((event.staff ?? []).map((s) => s._id)),
    [event.staff]
  );

  const visible = users.filter(
    (u) =>
      !alreadyOn.has(u.id) &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const add = async (user: AuthUser) => {
    setBusyId(user.id);
    setError(null);
    try {
      onAdded(await addStaff(event._id, user.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Add staff to {event.title}</h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink-2">
            <X size={18} />
          </button>
        </div>

        <input
          autoFocus
          placeholder="Search people by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        />

        {error && (
          <p className="mb-3 rounded-xl bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
            {error}
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-ink-3">
              <Loader2 size={15} className="animate-spin" /> Loading people…
            </div>
          ) : visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-3">
              {users.length === 0
                ? "No staff accounts exist yet. Sign someone up with the Staff role first."
                : "Everyone matching is already on this event."}
            </p>
          ) : (
            <ul className="space-y-1">
              {visible.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-soft"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{u.name}</p>
                    <p className="truncate text-xs text-ink-3">{u.email}</p>
                  </div>
                  <button
                    onClick={() => add(u)}
                    disabled={busyId === u.id}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                  >
                    {busyId === u.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <UserPlus size={13} />
                    )}
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
