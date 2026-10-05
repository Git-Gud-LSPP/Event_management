import { useEffect, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { listEvents, type EventRecord } from "../features/events/api";
import { getSelectedEventId, setSelectedEventId } from "../services/selectedEvent";

// Schedule and Staff both hang off a chosen event, so the "load my events and
// remember which one is selected" part lives here once.
export function useEventSelection() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>(getSelectedEventId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedId) setSelectedEventId(selectedId);
  }, [selectedId]);

  useEffect(() => {
    let cancelled = false;
    listEvents()
      .then(({ items }) => {
        if (cancelled) return;
        setEvents(items);
        setSelectedId((current) =>
          items.some((e) => e._id === current) ? current : items[0]?._id || ""
        );
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
  status === "published" ? "bg-live" : status === "cancelled" ? "bg-danger" : "bg-ink-3";

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
        className="flex cursor-pointer items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-sm text-ink ring-1 ring-transparent transition hover:ring-ink"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${dotFor(selected?.status ?? "draft")}`} />
        <span>{selected ? selected.title : "No events"}</span>
        <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
          {events.length === 0 && (
            <p className="px-4 py-5 text-sm text-ink-3">
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
              className={`flex w-full items-center justify-between px-4 py-3 text-left hover:bg-soft ${
                ev._id === selectedId ? "bg-accent-soft" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${dotFor(ev.status)}`} />
                <div>
                  <p className="text-sm font-medium text-ink">{ev.title}</p>
                  <p className="mt-1 text-xs text-ink-3">
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
              {ev._id === selectedId && <Check size={16} className="text-ink" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
