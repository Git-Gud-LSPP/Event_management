import { createElement, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES, MODULES, planById, recommendAddOns, type Module } from "../../billing/catalog";
import { addModule, freeSlots, hasModule, removeModule, slotsFor, toggleNotify, useWorkspace, type Workspace } from "../../billing/plan";
import { moduleIcon } from "../../billing/icons";
import { SlotDialog } from "./shared";
import { useToast } from "./useToast";

type State = "core" | "on" | "off" | "dev" | "ent";
const stateOf = (w: Workspace, m: Module): State =>
  m.core ? "core" : !m.live ? "dev" : hasModule(w, m.id) ? "on" : m.enterpriseOnly ? "ent" : "off";

const FILTERS: [string, string, (s: State) => boolean][] = [
  ["all", "All", () => true],
  ["on", "On", (s) => s === "core" || s === "on"],
  ["avail", "Available", (s) => s === "off" || s === "ent"],
  ["dev", "In development", (s) => s === "dev"],
];

const PILL: Record<State, [string, string]> = {
  core: ["CORE", "bg-line-soft text-ink-2"],
  on: ["ON", "bg-accent-soft text-[#2A6E4B]"],
  off: ["ADD-ON", "bg-paper text-[#56645B]"],
  dev: ["IN DEVELOPMENT", "bg-[#EFEBFA] text-[#5B4A9E]"],
  ent: ["ENTERPRISE", "bg-ink text-paper"],
};

const chip = (on: boolean) => (on ? "border-ink bg-ink text-paper" : "border-[#CBD6CC] bg-surface text-ink-2 hover:border-ink");

export default function ModulesPage() {
  const w = useWorkspace();
  const plan = planById(w.plan);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [dialog, setDialog] = useState<string | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const { flash, toast } = useToast();

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

  const toggle = (m: Module) => {
    if (hasModule(w, m.id)) return removeModule(m.id), flash(`${m.name} switched off · data kept`);
    if (freeSlots(w) === 0) return setDialog(m.id);
    addModule(m.id);
    flash(`${m.name} added`);
  };

  // Search narrows everything; the filter chips narrow the rail counts; the rail picks a category.
  const term = q.trim().toLowerCase();
  const searched = MODULES.filter((m) => !term || `${m.name} ${m.blurb}`.toLowerCase().includes(term));
  const pass = FILTERS.find((f) => f[0] === filter)![2];
  const matches = searched.filter((m) => pass(stateOf(w, m)));
  const groups = CATEGORIES.map((c) => ({ c, items: matches.filter((m) => m.category === c && (!cat || cat === c)) })).filter((g) => g.items.length);
  const recs = recommendAddOns(w.eventTypes ?? [], 3).filter((m) => !hasModule(w, m.id));

  const slots = slotsFor(w);
  const finite = isFinite(slots);
  const used = Math.min(w.addOns.length, slots);
  const tickN = finite ? Math.min(slots, 30) : 30;
  const filled = finite ? Math.round((used / slots) * tickN) : tickN;
  const full = !finite || used >= slots;

  return (
    <div className="mx-auto max-w-[1240px] pb-24 text-ink">
      <div className="mb-9 grid items-end gap-x-12 gap-y-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
        <div>
          <p className="font-mono text-xs tracking-[.04em] text-ink-3">WORKSPACE · MODULES</p>
          <h1 className="mt-3 mb-2.5 text-[clamp(34px,4vw,52px)] leading-none font-medium tracking-[-0.045em]">Build the toolkit this season needs.</h1>
          <p className="max-w-[520px] text-base leading-normal text-pretty text-[#56645B]">
            Switch add-ons on and off any time. Turning one off keeps its data, so it's all there when you switch it back on.
          </p>
        </div>
        <div className="rounded-card bg-surface p-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] text-ink-3">{plan.name} add-on slots</span>
            <span className="font-mono text-[13px] tabular-nums">
              {used}<span className="text-[#8A968E]">/{finite ? slots : "∞"}</span>
            </span>
          </div>
          <div className="mt-3 flex h-[18px] gap-[3px]" aria-hidden="true">
            {Array.from({ length: tickN }, (_, i) => (
              <span key={i} className={`flex-1 rounded-[3px] ${i < filled ? (full ? "bg-live" : "bg-ink") : "bg-sunken"}`} />
            ))}
          </div>
          <div className="mt-3.5 flex flex-wrap justify-between gap-3 text-[13px]">
            <span className="text-[#56645B]">{!finite ? "Every module included" : used >= slots ? "All slots in use" : `${slots - used} slots free`}</span>
            <Link to="/billing" className="font-medium text-ink hover:text-accent">Plan &amp; billing →</Link>
          </div>
        </div>
      </div>

      {recs.length > 0 && (
        <section aria-labelledby="recs" className="mb-10 rounded-[20px] bg-ink p-[clamp(20px,3vw,28px)] text-paper">
          <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
            <h2 id="recs" className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[.05em] text-ai">
              <span className="size-1.5 rounded-full bg-live" aria-hidden="true" />
              RECOMMENDED FOR YOUR EVENTS
            </h2>
            <span className="text-[13px] text-[#95A39A]">Based on the events in your workspace</span>
          </div>
          <ul className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
            {recs.map((m) => (
              <li key={m.id} className="flex flex-col gap-2 rounded-[14px] bg-[#22322A] p-[18px]">
                <p className="text-base font-medium tracking-[-0.01em]">{m.name}</p>
                <p className="flex-1 text-[13.5px] leading-[1.45] text-[#B7C4BA]">{m.blurb}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-[10.5px] tracking-[.04em] text-[#95A39A]">{m.category.toUpperCase()}</span>
                  <button type="button" onClick={() => toggle(m)} className="cursor-pointer rounded-full bg-paper px-3.5 py-[7px] text-[13px] text-ink hover:bg-surface">
                    Add module
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-8">
        <nav aria-label="Categories" className="min-w-0 flex-[1_1_200px] md:max-w-[220px]">
          <div className="flex gap-0.5 overflow-x-auto md:sticky md:top-[84px] md:flex-col">
            <p className="hidden px-2.5 pb-2.5 font-mono text-[10.5px] tracking-[.05em] text-[#6E7C73] md:block">CATEGORIES</p>
            {[null, ...CATEGORIES].map((c) => (
              <button
                key={c ?? "all"}
                type="button"
                aria-pressed={cat === c}
                onClick={() => setCat(c)}
                className={`flex shrink-0 cursor-pointer justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] hover:bg-sunken ${cat === c ? "bg-surface font-medium text-ink" : "text-[#56645B]"}`}
              >
                <span>{c ?? "All modules"}</span>
                <span className="font-mono text-[10.5px] text-[#8A968E]">{c ? matches.filter((m) => m.category === c).length : matches.length}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="min-w-0 flex-[999_1_520px]">
          <div className="mb-6 flex flex-wrap justify-between gap-3">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter">
              {FILTERS.map(([id, n, f]) => (
                <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} className={`flex cursor-pointer items-center gap-[7px] rounded-full border px-[13px] py-[7px] text-[13px] ${chip(filter === id)}`}>
                  {n}
                  <span className="font-mono text-[10.5px] opacity-60">{searched.filter((m) => f(stateOf(w, m))).length}</span>
                </button>
              ))}
            </div>
            <label className="relative flex min-w-[220px] flex-[0_1_300px] items-center">
              <span className="sr-only">Search modules</span>
              <input
                ref={search}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search modules"
                className="h-9 w-full rounded-full border border-[#CBD6CC] bg-surface pr-10 pl-3.5 text-[13px] text-ink outline-none placeholder:text-[#8A968E] focus:border-ink"
              />
              <kbd className="absolute right-2.5 rounded-[5px] bg-line-soft px-1.5 py-0.5 font-mono text-[10.5px] text-[#6E7C73]">/</kbd>
            </label>
          </div>

          {groups.length === 0 ? (
            <div className="rounded-card border border-dashed border-[#CBD6CC] px-6 py-12 text-center">
              <p className="text-[17px] font-medium">Nothing matches{q && ` "${q}"`}</p>
              <p className="mt-1.5 text-sm text-[#56645B]">Try a broader word, or tell us what you need on a demo call.</p>
              <div className="mt-[18px] flex justify-center gap-2">
                <button type="button" onClick={() => (setQ(""), setCat(null), setFilter("all"))} className="cursor-pointer rounded-full border border-[#CBD6CC] bg-surface px-4 py-[9px] text-[13px] hover:border-ink">
                  Clear filters
                </button>
                <Link to="/demo" className="rounded-full bg-ink px-4 py-[9px] text-[13px] text-paper hover:text-paper">Book a demo</Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-9">
              {groups.map(({ c, items }) => (
                <section key={c} aria-label={c}>
                  <div className="mb-3.5 flex items-baseline justify-between gap-3 border-b border-line pb-2.5">
                    <h2 className="text-lg font-medium tracking-[-0.02em]">{c}</h2>
                    <span className="font-mono text-[11px] text-[#6E7C73]">
                      {items.filter((m) => FILTERS[1][2](stateOf(w, m))).length} ON · {items.length} SHOWN
                    </span>
                  </div>
                  <ul className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,250px),1fr))]">
                    {items.map((m) => (
                      <ModuleCard key={m.id} m={m} st={stateOf(w, m)} w={w} onToggle={() => toggle(m)} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
      <SlotDialog want={dialog} onClose={() => setDialog(null)} />
      {toast}
    </div>
  );
}

function ModuleCard({ m, st, w, onToggle }: { m: Module; st: State; w: Workspace; onToggle: () => void }) {
  const on = st === "on";
  const notified = !!w.notify?.includes(m.id);
  // Enterprise includes everything, so there's nothing to switch off.
  const locked = on && w.plan === "enterprise";
  const dev = st === "dev";
  return (
    <li
      className={`flex min-h-[148px] flex-col gap-2 rounded-[14px] p-4 ${
        dev ? "bg-[#D9E0D8] text-ink-2" : on ? "bg-[#F4F9F3] shadow-[inset_0_0_0_1px_#9CCBAE]" : "bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid size-8 flex-none place-items-center rounded-lg ${dev ? "bg-[#C8D1C7] text-ink-3" : on ? "bg-accent-soft text-accent" : "bg-line-soft text-ink-2"}`} aria-hidden="true">
            {createElement(moduleIcon(m.id), { className: "h-4 w-4" })}
          </span>
          <p className="text-[15px] font-medium tracking-[-0.01em]">{m.name}</p>
        </div>
        <span className={`shrink-0 rounded-full px-[7px] py-[3px] font-mono text-[10px] tracking-[.04em] ${PILL[st][1]}`}>{PILL[st][0]}</span>
      </div>
      <p className={`flex-1 text-[13px] leading-[1.45] ${dev ? "text-ink-3" : "text-[#56645B]"}`}>{m.blurb}</p>
      <div className="flex min-h-[30px] items-center justify-between gap-2 text-[12.5px]">
        {st === "core" || locked ? (
          <>
            <span className="text-[#6E7C73]">{locked ? "Included on Enterprise" : "Included on every plan"}</span>
            {m.route && <Link to={m.route} className="font-medium hover:text-accent">Open →</Link>}
          </>
        ) : st === "dev" ? (
          <>
            <span className="text-[#6E7C73]">{notified ? "On your list" : "Roadmap"}</span>
            <button
              type="button"
              aria-pressed={notified}
              onClick={() => toggleNotify(m.id)}
              className={`cursor-pointer rounded-full border px-[11px] py-1.5 ${notified ? "border-[#9CCBAE] bg-accent-soft text-[#2A6E4B]" : "border-[#CBD6CC] bg-surface text-ink-2"}`}
            >
              {notified ? "✓ We'll email you" : "Notify me"}
            </button>
          </>
        ) : st === "ent" ? (
          <>
            <span className="text-[#6E7C73]">Enterprise plan</span>
            <Link to="/demo" className="font-medium hover:text-accent">Talk to sales →</Link>
          </>
        ) : (
          <>
            {on && m.route ? (
              <Link to={m.route} className="text-[#2A6E4B] hover:text-ink">Active · Open →</Link>
            ) : (
              <span className={on ? "text-[#2A6E4B]" : "text-[#6E7C73]"}>{on ? "Active" : "Off"}</span>
            )}
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={`${m.name}`}
              onClick={onToggle}
              className={`relative h-[22px] w-[38px] cursor-pointer rounded-full transition-colors ${on ? "bg-live" : "bg-[#CBD6CC]"}`}
            >
              <span className={`absolute top-[3px] size-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.2)] transition-[left] duration-200 ease-out-expo ${on ? "left-[19px]" : "left-[3px]"}`} />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
