import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import EventPicker, { useEventSelection } from "../../components/EventPicker";
import SearchBar from "../../components/SearchBar";
import { FilterChips, PageHeader } from "../../components/DashboardHeader";
import { card, pillOf } from "../../components/ui";
import { getStoredUser } from "../../services/authApi";
import { createLostItem, deleteLostItem, listLostItems, updateLostItem, type LostItem, type LostItemInput } from "./api";

const FILTERS = ["All", "Found", "Claimed"] as const;
const field = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent";
const when = (iso: string) => new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function LostFoundPage() {
  const { events, selected, selectedId, setSelectedId, loading: eventsLoading, error: eventsError } = useEventSelection();
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const isOrganizer = getStoredUser()?.role === "organizer";

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    listLostItems(selectedId)
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

  const replace = (saved: LostItem) => setItems((prev) => prev.map((i) => (i._id === saved._id ? saved : i)));

  const add = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const text = (k: string) => String(f.get(k) ?? "").trim() || undefined;
    setSaving(true);
    void run(async () => {
      const saved = await createLostItem(selectedId, { item: text("item"), description: text("description"), foundAt: text("foundAt"), storedAt: text("storedAt") });
      setItems((prev) => [saved, ...prev]);
      form.reset();
    }).finally(() => setSaving(false));
  };

  const update = (i: LostItem, data: LostItemInput) => run(async () => replace(await updateLostItem(selectedId, i._id, data)));

  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === "All" ? items.length : items.filter((i) => i.status === f).length]));
  const q = search.toLowerCase();
  const visible = items.filter(
    (i) => (filter === "All" || i.status === filter) && [i.item, i.description, i.foundAt].some((s) => (s ?? "").toLowerCase().includes(q))
  );

  return (
    <div>
      <PageHeader
        eyebrow={`Lost & found${selected ? ` · ${selected.title}` : ""}`}
        title="Lost & found"
        subtitle={selected ? `${counts.Found} waiting · ${counts.Claimed} returned on ${selected.title}` : "Pick an event to see its lost property"}
      >
        <EventPicker events={events} selectedId={selectedId} onSelect={setSelectedId} />
      </PageHeader>

      {(error || eventsError) && (
        <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error || eventsError}</p>
      )}

      {eventsLoading || loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-ink-3">
          <Loader2 size={16} className="animate-spin" /> Loading items…
        </div>
      ) : !selectedId ? (
        <p className="py-16 text-center text-sm text-ink-3">No events yet. Create one on the Events page first.</p>
      ) : (
        <div className="space-y-4">
          <form onSubmit={add} className={`${card} grid gap-2 p-4 sm:grid-cols-[1.4fr_2fr_1.2fr_1.2fr_auto]`}>
            <input name="item" required placeholder="Item, e.g. Black backpack" aria-label="Item" className={field} />
            <input name="description" placeholder="Description" aria-label="Description" className={field} />
            <input name="foundAt" placeholder="Found at" aria-label="Found at" className={field} />
            <input name="storedAt" placeholder="Stored at" aria-label="Stored at" className={field} />
            <button type="submit" disabled={saving} className="rounded-full bg-ink px-4 py-2 text-sm text-paper disabled:opacity-60">Log item</button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterChips options={[...FILTERS]} counts={counts} active={filter} onChange={setFilter} />
            <SearchBar placeholder="Search items or places…" value={search} onChange={setSearch} />
          </div>

          <div className={card}>
            {visible.length === 0 ? (
              <p className="px-[18px] py-6 text-[13px] text-ink-3">{items.length ? "Nothing matches." : "Nothing logged yet."}</p>
            ) : (
              visible.map((i) => (
                <div key={i._id} className="flex flex-wrap items-center gap-3 border-b border-line-soft px-[18px] py-3.5 text-[13px] last:border-0">
                  <div className="min-w-[200px] flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{i.item}</span>
                      <span className={pillOf(i.status === "Claimed" ? "Done" : "Pending")}>{i.status.toUpperCase()}</span>
                    </div>
                    <div className="mt-0.5 text-ink-3">
                      {[i.description, i.foundAt && `found at ${i.foundAt}`, i.storedAt && `stored at ${i.storedAt}`, when(i.createdAt)].filter(Boolean).join(" · ")}
                    </div>
                    {i.status === "Claimed" && <div className="mt-0.5 text-[#2A6E4B]">Returned to {i.claimedBy || "owner"} · {when(i.updatedAt)}</div>}
                  </div>
                  {i.status === "Found" ? (
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const claimedBy = String(new FormData(e.currentTarget).get("claimedBy") ?? "").trim();
                        void update(i, { status: "Claimed", claimedBy: claimedBy || undefined });
                      }}
                    >
                      <input name="claimedBy" placeholder="Claimed by" aria-label={`Who claimed ${i.item}`} className={`${field} w-40 py-1.5`} />
                      <button type="submit" className="rounded-full bg-ink px-3.5 py-1.5 text-[13px] whitespace-nowrap text-paper">Mark returned</button>
                    </form>
                  ) : (
                    <button type="button" onClick={() => void update(i, { status: "Found", claimedBy: "" })} className="cursor-pointer text-ink-3 hover:text-ink">
                      Undo
                    </button>
                  )}
                  {isOrganizer && (
                    <button type="button" onClick={() => void run(async () => { await deleteLostItem(selectedId, i._id); setItems((p) => p.filter((x) => x._id !== i._id)); })} aria-label={`Delete ${i.item}`} className="cursor-pointer text-ink-3 hover:text-danger">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
