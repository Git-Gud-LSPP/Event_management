import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import EventPicker, { useEventSelection } from "../../components/EventPicker";
import { PageHeader } from "../../components/DashboardHeader";
import { card, cardHead, mono, pillOf } from "../../components/ui";
import { apiFetch } from "../../services/api";
import { money } from "../budget/api";

type Counts = Record<string, number>;

interface Analytics {
  event: { title: string; staff: number; capacity: number | null };
  tasks: { total: number; done: number; overdue: number; completion: number; unassigned: number; byStatus: Counts };
  incidents: { total: number; open: number; critical: number; mttrMinutes: number | null; byPriority: Counts; byStatus: Counts };
  inventory: { items: number; units: number; byStatus: Counts };
  budget: { planned: number; actual: number; variance: number; used: number; lines: number };
  vendors: { total: number; committed: number; byStage: Counts };
  lostFound: { total: number; claimed: number };
}

const duration = (m: number | null) => (m == null ? "—" : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`);

/** One horizontal bar per key, scaled to the largest count. */
function Breakdown({ title, counts }: { title: string; counts: Counts }) {
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...rows.map(([, n]) => n));
  return (
    <div className={card}>
      <div className={cardHead}><h2 className="text-[15px] font-medium">{title}</h2></div>
      <div className="space-y-3 px-[18px] py-4">
        {rows.length === 0 ? (
          <p className="text-[13px] text-ink-3">Nothing logged yet.</p>
        ) : (
          rows.map(([k, n]) => (
            <div key={k} className="grid grid-cols-[110px_1fr_32px] items-center gap-3 text-[13px]">
              <span className={`${pillOf(k)} justify-self-start`}>{k}</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
                <div className="h-full rounded-full bg-live" style={{ width: `${(n / max) * 100}%` }} />
              </div>
              <span className="text-right tabular-nums">{n}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { events, selected, selectedId, setSelectedId, loading: eventsLoading, error: eventsError } = useEventSelection();
  // Keyed by event id, so "loading" is derived instead of set inside the effect.
  const [result, setResult] = useState<{ id: string; data?: Analytics; error?: string } | null>(null);
  const current = result?.id === selectedId ? result : null;
  const data = current?.data ?? null;
  const error = current?.error ?? null;
  const loading = !!selectedId && !current;

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    apiFetch<Analytics>(`/events/${selectedId}/analytics`)
      .then((d) => !cancelled && setResult({ id: selectedId, data: d }))
      .catch((e: Error) => !cancelled && setResult({ id: selectedId, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const tiles: [string, string, string?][] = data
    ? [
        ["TASKS DONE", `${data.tasks.completion}%`, `${data.tasks.done} of ${data.tasks.total}`],
        ["OVERDUE", String(data.tasks.overdue), `${data.tasks.unassigned} unassigned`],
        ["OPEN INCIDENTS", String(data.incidents.open), `${data.incidents.critical} critical`],
        ["TIME TO RESOLVE", duration(data.incidents.mttrMinutes), "average"],
        ["BUDGET USED", `${data.budget.used}%`, `${money(data.budget.actual)} of ${money(data.budget.planned)}`],
        ["VENDOR COMMITTED", money(data.vendors.committed), `${data.vendors.total} vendors`],
        ["INVENTORY", String(data.inventory.units), `units across ${data.inventory.items} items`],
        ["LOST & FOUND", `${data.lostFound.claimed}/${data.lostFound.total}`, "returned"],
      ]
    : [];

  return (
    <div>
      <PageHeader
        eyebrow={`Analytics${selected ? ` · ${selected.title}` : ""}`}
        title="Analytics"
        subtitle={selected ? `How ${selected.title} is tracking` : "Pick an event to see its numbers"}
      >
        <EventPicker events={events} selectedId={selectedId} onSelect={setSelectedId} />
      </PageHeader>

      {(error || eventsError) && (
        <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error || eventsError}</p>
      )}

      {eventsLoading || loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-ink-3">
          <Loader2 size={16} className="animate-spin" /> Loading analytics…
        </div>
      ) : !selectedId ? (
        <p className="py-16 text-center text-sm text-ink-3">No events yet. Create one on the Events page first.</p>
      ) : data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tiles.map(([label, value, sub]) => (
              <div key={label} className="rounded-2xl bg-surface px-[18px] py-4">
                <div className={`${mono} text-ink-3`}>{label}</div>
                <div className={`mt-1.5 text-[28px] font-medium tracking-[-0.03em] ${label === "BUDGET USED" && data.budget.used > 100 ? "text-danger" : "text-ink"}`}>{value}</div>
                {sub && <div className="mt-0.5 truncate text-xs text-ink-3">{sub}</div>}
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Breakdown title="Tasks by status" counts={data.tasks.byStatus} />
            <Breakdown title="Incidents by priority" counts={data.incidents.byPriority} />
            <Breakdown title="Vendor pipeline" counts={data.vendors.byStage} />
            <Breakdown title="Inventory by status" counts={data.inventory.byStatus} />
          </div>
        </div>
      )}
    </div>
  );
}
