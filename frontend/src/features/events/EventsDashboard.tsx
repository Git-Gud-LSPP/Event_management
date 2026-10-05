import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { CalendarPlus, Check, Loader2, X } from "lucide-react";
import { planById } from "../../billing/catalog";
import { useWorkspace } from "../../billing/plan";
import EventCard from "./EventCard";
import EventFormModal from "./EventFormModal";
import DashboardHeader from "../../components/DashboardHeader";
import { listEvents, type EventRecord } from "./api";

const FILTERS = ["All", "Live", "Upcoming", "Draft", "Completed", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];

// Derived from the dates/status the backend already stores — no extra fields needed.
const bucketOf = (ev: EventRecord): Filter => {
  if (ev.status === "cancelled") return "Cancelled";
  if (ev.status === "draft") return "Draft";
  const now = Date.now();
  const start = new Date(ev.startsAt).getTime();
  const end = ev.endsAt ? new Date(ev.endsAt).getTime() : start;
  if (now < start) return "Upcoming";
  if (now > end) return "Completed";
  return "Live";
};

const progressOf = (ev: EventRecord): number => {
  const start = new Date(ev.startsAt).getTime();
  const end = ev.endsAt ? new Date(ev.endsAt).getTime() : start;
  if (end <= start) return Date.now() >= start ? 100 : 0;
  return Math.round(Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100)));
};

const EventsDashboard = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [limitHit, setLimitHit] = useState(false);
  const ws = useWorkspace();
  const plan = planById(ws.plan);

  useEffect(() => {
    listEvents()
      .then(({ items }) => setEvents(items))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const result: Record<string, number> = { All: events.length };
    for (const ev of events) {
      const bucket = bucketOf(ev);
      result[bucket] = (result[bucket] ?? 0) + 1;
    }
    return result;
  }, [events]);

  const visible = useMemo(
    () =>
      events.filter(
        (ev) =>
          (filter === "All" || bucketOf(ev) === filter) &&
          (ev.title.toLowerCase().includes(search.toLowerCase()) ||
            (ev.location ?? "").toLowerCase().includes(search.toLowerCase()))
      ),
    [events, filter, search]
  );

  return (
    <div className="">
      <div className="">
        <DashboardHeader
          eyebrow="Events"
          title="Event operations"
          subtitle={loading ? "Loading events…" : `${events.length} event${events.length === 1 ? "" : "s"} across every status`}
          label="Create event"
          categoriesList={[...FILTERS]}
          counts={counts}
          activeCategory={filter}
          onCategoryChange={(c) => setFilter(c as Filter)}
          onAction={() => {
            // Free/Starter cap active events. Say so where the user acts, not in a surprise modal.
            const active = events.filter((e) => ["Live", "Upcoming", "Draft"].includes(bucketOf(e))).length;
            if (plan.events !== null && active >= plan.events) setLimitHit(true);
            else setShowForm(true);
          }}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search events or venues…"
        />

        {limitHit && (
          <div role="status" className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-surface p-4 text-sm text-ink">
            <span className="flex-1">
              You're running {plan.events} of {plan.events} active events on {plan.name}. Complete or cancel one, or move up a plan for{" "}
              {plan.id === "starter" ? "25 events a year" : "unlimited events"}.
            </span>
            <Link to="/billing" className="eh-press inline-flex h-9 items-center rounded-full bg-ink px-4 text-paper hover:bg-ink-hover">Compare plans</Link>
            <button type="button" onClick={() => setLimitHit(false)} className="px-2 text-ink-2 hover:text-ink">Not now</button>
          </div>
        )}

        {!loading && <SetupChecklist hasEvent={events.length > 0} />}

        {error && (
          <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error}</p>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-ink-3">
            <Loader2 size={16} className="animate-spin" /> Loading events…
          </div>
        ) : visible.length === 0 ? (
          events.length === 0 ? (
            <div className="eh-grid-bg mt-6 flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center">
              <CalendarPlus className="size-8 text-ink-3" strokeWidth={1.25} aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold text-ink">Your first event takes about two minutes</h2>
              <p className="mt-1 max-w-[42ch] text-sm text-ink-2">
                Add a name, dates and a venue. Tasks, schedule and staff hang off it from there.
              </p>
              <button type="button" onClick={() => setShowForm(true)} className="eh-press mt-6 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm text-paper hover:bg-ink-hover">
                Create event
              </button>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-ink-3">No events match this filter.</p>
          )
        ) : (
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
            {visible.map((ev) => (
              <EventCard
                key={ev._id}
                event={ev}
                category={bucketOf(ev)}
                progress={progressOf(ev)}
                staffCount={ev.staff?.length ?? 0}
                onClick={() => navigate(`/events/${ev._id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <EventFormModal
          onClose={() => setShowForm(false)}
          onSaved={(saved) => setEvents((prev) => [...prev, saved])}
        />
      )}
    </div>
  );
};

export default EventsDashboard;

// First-run checklist. Each item checks real state where we have it; dismissal is remembered.
function SetupChecklist({ hasEvent }: { hasEvent: boolean }) {
  const [hidden, setHidden] = useState(() => localStorage.getItem("eh.checklist") === "done");
  if (hidden) return null;
  const items: [string, boolean, string][] = [
    ["Create your first event", hasEvent, "#"],
    ["Add a schedule item", false, "/schedule"],
    ["Invite a teammate", false, "/staffs"],
    ["Try the assistant (Ctrl+K)", false, "#"],
  ];
  const done = items.filter((i) => i[1]).length;
  return (
    <section aria-label="Setup checklist" className="mb-6 rounded-2xl bg-surface p-5 text-ink">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-medium">Get set up</h2>
        <span className="ml-auto font-mono text-xs text-ink-3">{done}/{items.length}</span>
        <button
          type="button"
          onClick={() => (localStorage.setItem("eh.checklist", "done"), setHidden(true))}
          aria-label="Dismiss checklist"
          className="rounded-[6px] p-1 text-ink-3 hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="relative mt-3 h-px bg-line" aria-hidden="true">
        <div className="absolute -top-px h-[3px] rounded-full bg-live" style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([label, ok, href]) => (
          <li key={label} className="flex items-center gap-2 text-sm">
            <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${ok ? "border-ink bg-ink text-paper" : "border-line-strong"}`}>
              {ok && <Check className="size-3" strokeWidth={2.5} aria-hidden="true" />}
            </span>
            {href === "#" || ok ? (
              <span className={ok ? "text-ink-3 line-through" : "text-ink-2"}>{label}</span>
            ) : (
              <Link to={href} className="text-ink-2 underline-offset-2 hover:text-ink hover:underline">{label}</Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
