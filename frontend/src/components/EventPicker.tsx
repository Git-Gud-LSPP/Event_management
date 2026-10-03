import { useEffect, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { listEvents, type EventRecord } from "../features/events/api";

// Schedule and Staff both hang off a chosen event, so the "load my events and
// remember which one is selected" part lives here once.
export function useEventSelection() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listEvents()
      .then(({ items }) => {
        if (cancelled) return;
        setEvents(items);
        setSelectedId((current) => current || items[0]?._id || "");
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = events.find((e) => e._id === selectedId) || null;
  return { events, selected, selectedId, setSelectedId, loading, error, setEvents };
}

const dotFor = (status: string) =>
  status === "published" ? "bg-green-500" : status === "cancelled" ? "bg-red-500" : "bg-indigo-500";

export default function EventPicker({
  events,
  selectedId,
  onSelect,
}: {
  events: EventRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = events.find((e) => e._id === selectedId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full bg-[#F5F5F2] px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-100"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${dotFor(selected?.status ?? "draft")}`} />
        <span>{selected ? selected.title : "No events"}</span>
        <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {events.length === 0 && (
            <p className="px-4 py-5 text-sm text-gray-400">
              No events yet — create one on the Events page.
            </p>
          )}
          {events.map((ev) => (
            <button
              key={ev._id}
              onClick={() => {
                onSelect(ev._id);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 ${
                ev._id === selectedId ? "bg-green-50" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${dotFor(ev.status)}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{ev.title}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(ev.startsAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              {ev._id === selectedId && <Check size={16} className="text-gray-800" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
