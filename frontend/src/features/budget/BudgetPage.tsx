import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import EventPicker, { useEventSelection } from "../../components/EventPicker";
import { PageHeader } from "../../components/DashboardHeader";
import { card, cardHead, mono, tableHead } from "../../components/ui";
import { getStoredUser } from "../../services/authApi";
import {
  BUDGET_CATEGORIES, createBudgetLine, deleteBudgetLine, listBudget, money, updateBudgetLine, type BudgetLine,
} from "./api";

const field = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent";

export default function BudgetPage() {
  const { events, selected, selectedId, setSelectedId, loading: eventsLoading, error: eventsError } = useEventSelection();
  const [items, setItems] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isOrganizer = getStoredUser()?.role === "organizer";

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    listBudget(selectedId)
      .then((r) => !cancelled && setItems(r.items))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const add = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setSaving(true);
    void run(async () => {
      const line = await createBudgetLine(selectedId, {
        name: String(f.get("name")),
        category: String(f.get("category")),
        planned: Number(f.get("planned")) || 0,
        actual: Number(f.get("actual")) || 0,
        owner: String(f.get("owner")) || undefined,
      });
      setItems((prev) => [line, ...prev]);
      form.reset();
    }).finally(() => setSaving(false));
  };

  const saveActual = (line: BudgetLine, value: string) => {
    const actual = Number(value) || 0;
    if (actual === line.actual) return;
    void run(async () => {
      const saved = await updateBudgetLine(selectedId, line._id, { actual });
      setItems((prev) => prev.map((l) => (l._id === saved._id ? saved : l)));
    });
  };

  const remove = (id: string) =>
    run(async () => {
      await deleteBudgetLine(selectedId, id);
      setItems((prev) => prev.filter((l) => l._id !== id));
    });

  const planned = items.reduce((s, l) => s + l.planned, 0);
  const actual = items.reduce((s, l) => s + l.actual, 0);
  const variance = planned - actual;
  const byCategory = BUDGET_CATEGORIES.map((c) => {
    const lines = items.filter((l) => (l.category || "Other") === c);
    return { c, planned: lines.reduce((s, l) => s + l.planned, 0), actual: lines.reduce((s, l) => s + l.actual, 0) };
  }).filter((x) => x.planned || x.actual);

  return (
    <div>
      <PageHeader
        eyebrow={`Budget${selected ? ` · ${selected.title}` : ""}`}
        title="Budget planner"
        subtitle={selected ? `${items.length} line items on ${selected.title}` : "Pick an event to see its budget"}
      >
        <EventPicker events={events} selectedId={selectedId} onSelect={setSelectedId} />
      </PageHeader>

      {(error || eventsError) && (
        <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error || eventsError}</p>
      )}

      {eventsLoading || loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-ink-3">
          <Loader2 size={16} className="animate-spin" /> Loading budget…
        </div>
      ) : !selectedId ? (
        <p className="py-16 text-center text-sm text-ink-3">No events yet. Create one on the Events page first.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["PLANNED", money(planned), "text-ink"],
              ["ACTUAL", money(actual), "text-ink"],
              [variance < 0 ? "OVER BUDGET" : "REMAINING", money(Math.abs(variance)), variance < 0 ? "text-danger" : "text-[#2A6E4B]"],
            ].map(([label, value, cls]) => (
              <div key={label} className="rounded-2xl bg-surface px-[18px] py-4">
                <div className={`${mono} text-ink-3`}>{label}</div>
                <div className={`mt-1.5 text-[28px] font-medium tracking-[-0.03em] ${cls}`}>{value}</div>
              </div>
            ))}
          </div>

          {byCategory.length > 0 && (
            <div className={card}>
              <div className={cardHead}><h2 className="text-[15px] font-medium">By category</h2></div>
              <div className="space-y-3 px-[18px] py-4">
                {byCategory.map(({ c, planned: p, actual: a }) => (
                  <div key={c}>
                    <div className="flex justify-between text-[13px]">
                      <span>{c}</span>
                      <span className={a > p ? "text-danger" : "text-ink-3"}>{money(a)} of {money(p)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken">
                      <div className={`h-full rounded-full ${a > p ? "bg-danger" : "bg-live"}`} style={{ width: `${p ? Math.min(100, (a / p) * 100) : 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isOrganizer && (
            <form onSubmit={add} className={`${card} grid gap-2 p-4 sm:grid-cols-[2fr_1.3fr_1fr_1fr_1.2fr_auto]`}>
              <input name="name" required placeholder="Line item, e.g. Stage hire" aria-label="Line item" className={field} />
              <select name="category" aria-label="Category" className={field} defaultValue="Other">
                {BUDGET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input name="planned" type="number" min="0" step="any" placeholder="Planned $" aria-label="Planned" className={field} />
              <input name="actual" type="number" min="0" step="any" placeholder="Actual $" aria-label="Actual" className={field} />
              <input name="owner" placeholder="Owner" aria-label="Owner" className={field} />
              <button type="submit" disabled={saving} className="rounded-full bg-ink px-4 py-2 text-sm text-paper disabled:opacity-60">Add</button>
            </form>
          )}

          {/* Narrow screens scroll the table sideways instead of crushing the columns. */}
          <div className={card}><div className="overflow-x-auto"><div className="min-w-[640px]">
            <div className={`${tableHead} grid grid-cols-[2fr_1.3fr_1fr_1fr_1fr_32px] gap-3`}>
              <span>ITEM</span><span>CATEGORY</span><span className="text-right">PLANNED</span><span className="text-right">ACTUAL</span><span className="text-right">VARIANCE</span><span />
            </div>
            {items.length === 0 ? (
              <p className="px-[18px] py-6 text-[13px] text-ink-3">No budget lines yet.{isOrganizer ? " Add the first one above." : ""}</p>
            ) : (
              items.map((l) => (
                <div key={l._id} className="grid grid-cols-[2fr_1.3fr_1fr_1fr_1fr_32px] items-center gap-3 border-b border-line-soft px-[18px] py-3 text-[13px] last:border-0">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{l.name}</div>
                    {l.owner && <div className="truncate text-xs text-ink-3">{l.owner}</div>}
                  </div>
                  <span className="text-ink-2">{l.category}</span>
                  <span className="text-right">{money(l.planned)}</span>
                  {isOrganizer ? (
                    <input
                      key={l.actual}
                      type="number"
                      min="0"
                      step="any"
                      defaultValue={l.actual}
                      aria-label={`Actual spend for ${l.name}`}
                      onBlur={(e) => saveActual(l, e.target.value)}
                      className="w-full rounded-lg border border-line bg-surface px-2 py-1 text-right outline-none focus:border-accent"
                    />
                  ) : (
                    <span className="text-right">{money(l.actual)}</span>
                  )}
                  <span className={`text-right ${l.actual > l.planned ? "text-danger" : "text-ink-3"}`}>{money(l.planned - l.actual)}</span>
                  {isOrganizer ? (
                    <button type="button" onClick={() => void remove(l._id)} aria-label={`Delete ${l.name}`} className="cursor-pointer text-ink-3 hover:text-danger">
                      <Trash2 size={15} />
                    </button>
                  ) : <span />}
                </div>
              ))
            )}
          </div></div></div>
        </div>
      )}
    </div>
  );
}
