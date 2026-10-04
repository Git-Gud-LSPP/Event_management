import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BellRing, Check, Search } from "lucide-react";
import { CATEGORIES, MODULES, planById, recommendAddOns, type Module } from "../../billing/catalog";
import { addModule, freeSlots, hasModule, removeModule, slotLabel, slotsFor, toggleNotify, useWorkspace } from "../../billing/plan";
import { buttonCls } from "../../marketing/lib";
import { Meter, SlotDialog } from "./shared";

export default function ModulesPage() {
  const w = useWorkspace();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [dialog, setDialog] = useState<string | null>(null);
  const search = useRef<HTMLInputElement>(null);

  // "/" focuses search, like most catalogs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const term = q.trim().toLowerCase();
  const list = MODULES.filter((m) => (!cat || m.category === cat) && (!term || `${m.name} ${m.blurb}`.toLowerCase().includes(term)));
  const recs = recommendAddOns(w.eventTypes ?? [], 3).filter((m) => !hasModule(w, m.id));

  const add = (m: Module) => {
    if (freeSlots(w) > 0) addModule(m.id);
    else setDialog(m.id);
  };

  const action = (m: Module) => {
    const on = hasModule(w, m.id);
    if (m.core) return <span className="text-xs text-ink-3">Included</span>;
    if (on)
      return (
        <span className="flex items-center gap-2">
          {m.route && <Link to={m.route} className="text-sm font-medium text-ink underline-offset-2 hover:underline">Open</Link>}
          {w.plan !== "enterprise" && (
            <button type="button" onClick={() => removeModule(m.id)} className="text-sm text-ink-3 hover:text-ink">Remove</button>
          )}
        </span>
      );
    if (m.enterpriseOnly) return <Link to="/contact-sales" className="text-sm font-medium text-ink hover:underline">Book a demo</Link>;
    if (!m.live) {
      const on = w.notify?.includes(m.id);
      return (
        <button type="button" aria-pressed={on} onClick={() => toggleNotify(m.id)} className="flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
          {on ? <BellRing className="size-4 text-accent" aria-hidden="true" /> : <Bell className="size-4" aria-hidden="true" />}
          {on ? "We'll email you" : "Notify me"}
        </button>
      );
    }
    return (
      <button type="button" onClick={() => add(m)} className={`${buttonCls.secondary} h-8 px-3`}>
        Add
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-6xl text-ink">
      <header className="flex flex-col gap-6 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Modules</h1>
          <p className="mt-1 text-ink-2">Switch on what this season's events need. Swap any time; data is kept.</p>
        </div>
        <div className="w-full md:w-72">
          <Meter used={Math.min(w.addOns.length, slotsFor(w))} total={slotsFor(w)} label={`${planById(w.plan).name} add-on slots`} />
          <p className="mt-2 text-xs text-ink-3">
            {slotLabel(w)} · <Link to="/billing" className="underline underline-offset-2">Plan & billing</Link>
          </p>
        </div>
      </header>

      {recs.length > 0 && (
        <section className="mt-8" aria-labelledby="recs">
          <h2 id="recs" className="text-sm font-medium text-ink-2">Recommended for your events</h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-3">
            {recs.map((m) => (
              <li key={m.id} className="flex flex-col rounded-card border border-accent/40 bg-accent-soft/40 p-4">
                <p className="font-medium">{m.name}</p>
                <p className="mt-1 flex-1 text-sm text-ink-2">{m.blurb}</p>
                <div className="mt-4">{action(m)}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 grid gap-8 md:grid-cols-[12rem_1fr]">
        <nav aria-label="Categories" className="-mx-1 flex gap-1 overflow-x-auto md:mx-0 md:flex-col">
          {[null, ...CATEGORIES].map((c) => (
            <button
              key={c ?? "all"}
              type="button"
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-control px-3 py-1.5 text-left text-sm ${cat === c ? "bg-sunken font-medium text-ink" : "text-ink-2 hover:text-ink"}`}
            >
              {c ?? "All modules"}
            </button>
          ))}
        </nav>
        <div>
          <label className="relative block">
            <span className="sr-only">Search modules</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
            <input
              ref={search}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search modules (press /)"
              className="h-10 w-full rounded-control border border-line-strong bg-surface pl-9 pr-3 text-sm placeholder:text-ink-3"
            />
          </label>
          {list.length === 0 ? (
            <div className="mt-10 rounded-card border border-dashed border-line-strong p-10 text-center">
              <p className="font-medium">No modules match "{q}"</p>
              <p className="mt-1 text-sm text-ink-2">Try a broader word, or tell us what you need.</p>
              <button type="button" onClick={() => (setQ(""), setCat(null))} className={`${buttonCls.secondary} mt-4`}>Clear search</button>
            </div>
          ) : (
            <ul className="mt-4 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
              {list.map((m) => (
                <li key={m.id} className={`flex flex-col bg-surface p-4 ${!m.live ? "bg-[repeating-linear-gradient(135deg,transparent_0_8px,var(--eh-grid)_8px_9px)]" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{m.name}</p>
                    {hasModule(w, m.id) && <Check className="size-4 shrink-0 text-accent" aria-label="On" />}
                  </div>
                  <p className="mt-1 flex-1 text-sm text-ink-2">{m.blurb}</p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="text-xs text-ink-3">{m.live ? m.category : "In development"}</span>
                    {action(m)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <SlotDialog want={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
