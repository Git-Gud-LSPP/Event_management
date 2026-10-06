import { useState } from "react";
import { Download, FileJson, Loader2, Lock } from "lucide-react";
import EventPicker, { useEventSelection } from "../../components/EventPicker";
import { PageHeader } from "../../components/DashboardHeader";
import { card, mono } from "../../components/ui";
import { byId } from "../../billing/catalog";
import { hasModule, useWorkspace } from "../../billing/plan";
import { listInventory, type EventRecord } from "../events/api";
import { listSchedule } from "../schedule/api";
import { listIncidents } from "../incidents/api";
import { listBudget } from "../budget/api";
import { listLostItems } from "../lostfound/api";

type Row = Record<string, string | number | null | undefined>;

// What can be exported. `module` = only when that add-on is on the plan (its API answers 403 otherwise).
const DATASETS: { id: string; label: string; module?: string; load: (id: string, ev: EventRecord) => Promise<Row[]> }[] = [
  {
    id: "schedule",
    label: "Run-of-show tasks",
    load: async (id) =>
      (await listSchedule(id)).items.map((t) => ({
        task: t.name, owner: t.owner?.name, starts: t.startsAt, ends: t.endsAt, status: t.status, depends_on: t.dependsOn?.name, delay_minutes: t.delayMinutes,
      })),
  },
  { id: "staff", label: "Staff", load: async (_, ev) => ev.staff.map((s) => ({ name: s.name, email: s.email })) },
  {
    id: "inventory",
    label: "Inventory",
    load: async (id) =>
      (await listInventory(id)).items.map((i) => ({ item: i.name, category: i.category, stock: i.stock, max_stock: i.maxStock, location: i.location, status: i.status })),
  },
  {
    id: "incidents",
    label: "Incidents",
    module: "incidents",
    load: async (id) =>
      (await listIncidents(id)).items.map((i) => ({
        title: i.title, priority: i.priority, status: i.status, location: i.location, reported_by: i.reportedBy?.name, assigned_to: i.assignedTo?.name, reported: i.createdAt, resolved: i.resolvedAt,
      })),
  },
  {
    id: "budget",
    label: "Budget lines",
    module: "budget-planner",
    load: async (id) =>
      (await listBudget(id)).items.map((l) => ({ item: l.name, category: l.category, planned: l.planned, actual: l.actual, variance: l.planned - l.actual, owner: l.owner })),
  },
  {
    id: "lost-found",
    label: "Lost & found",
    module: "lost-and-found",
    load: async (id) =>
      (await listLostItems(id)).items.map((i) => ({ item: i.item, description: i.description, found_at: i.foundAt, stored_at: i.storedAt, status: i.status, claimed_by: i.claimedBy, logged: i.createdAt })),
  },
];

/** RFC 4180 CSV. Text starting with = + - @ is prefixed with ' so spreadsheets don't run it as a formula. */
function toCsv(rows: Row[]) {
  const cols = [...new Set(rows.flatMap(Object.keys))];
  const cell = (v: Row[string]) => {
    let s = v == null ? "" : String(v);
    if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.map(cell).join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\r\n");
}

function save(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

const BOM = String.fromCharCode(0xfeff);
const fileSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "event";

export default function ExportPage() {
  const { events, selected, selectedId, setSelectedId, loading, error: eventsError } = useEventSelection();
  const ws = useWorkspace();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const available = DATASETS.filter((d) => !d.module || hasModule(ws, d.module));

  const run = async (key: string, fn: (ev: EventRecord) => Promise<void>) => {
    if (!selected) return;
    setBusy(key);
    setError(null);
    try {
      await fn(selected);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const csv = (d: (typeof DATASETS)[number]) =>
    run(d.id, async (ev) => {
      const rows = await d.load(ev._id, ev);
      // BOM so Excel opens the file as UTF-8.
      save(`${fileSlug(ev.title)}-${d.id}.csv`, `${BOM}${rows.length ? toCsv(rows) : "no rows"}`, "text/csv;charset=utf-8");
    });

  const everything = () =>
    run("all", async (ev) => {
      const sets = await Promise.all(available.map(async (d) => [d.id, await d.load(ev._id, ev)] as const));
      // Staff has its own section; undefined drops it from the JSON.
      const body = { exportedAt: new Date().toISOString(), event: { ...ev, staff: undefined }, ...Object.fromEntries(sets) };
      save(`${fileSlug(ev.title)}-export.json`, JSON.stringify(body, null, 2), "application/json");
    });

  return (
    <div>
      <PageHeader
        eyebrow={`Data export${selected ? ` · ${selected.title}` : ""}`}
        title="Data export"
        subtitle="Download an event's data as CSV for spreadsheets, or as one JSON file."
      >
        <EventPicker events={events} selectedId={selectedId} onSelect={setSelectedId} />
      </PageHeader>

      {(error || eventsError) && (
        <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error || eventsError}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-ink-3">
          <Loader2 size={16} className="animate-spin" /> Loading events…
        </div>
      ) : !selected ? (
        <p className="py-16 text-center text-sm text-ink-3">No events yet. Create one on the Events page first.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
            {DATASETS.map((d) => {
              const locked = d.module && !hasModule(ws, d.module);
              return (
                <button
                  key={d.id}
                  type="button"
                  disabled={!!locked || busy !== null}
                  onClick={() => void csv(d)}
                  className={`${card} flex cursor-pointer items-center gap-3 px-[18px] py-4 text-left ring-1 ring-transparent transition hover:ring-ink disabled:cursor-default disabled:opacity-60 disabled:hover:ring-transparent`}
                >
                  {busy === d.id ? <Loader2 size={18} className="animate-spin text-ink-3" /> : locked ? <Lock size={18} className="text-ink-3" /> : <Download size={18} className="text-accent" />}
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{d.label}</span>
                    <span className={`${mono} text-ink-3`}>{locked ? `NEEDS ${byId(d.module!)?.name.toUpperCase()}` : "CSV"}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void everything()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-ink px-[18px] py-[11px] text-sm text-paper hover:bg-ink-hover disabled:opacity-60"
          >
            {busy === "all" ? <Loader2 size={16} className="animate-spin" /> : <FileJson size={16} />}
            Everything for {selected.title} (JSON)
          </button>
        </div>
      )}
    </div>
  );
}
