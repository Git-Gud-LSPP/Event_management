import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Search, X } from "lucide-react";
import { CATEGORIES, CORE, EVENT_TYPES, MODULES, byId, planById, recommendPlan, type EventType, type Module } from "../billing/catalog";
import { saveStack } from "../billing/plan";
import { buttonCls } from "./lib";

interface Props {
  filter: EventType | null;
  setFilter: (t: EventType | null) => void;
}

export default function ModuleExplorer({ filter, setFilter }: Props) {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string[]>(["floor-plan", "vendors", "incidents"]);
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<Module>(byId("floor-plan")!);

  const q = query.trim().toLowerCase();
  const matches = (m: Module) =>
    (!filter || m.types.includes(filter)) && (!q || `${m.name} ${m.blurb} ${m.category}`.toLowerCase().includes(q));
  const matchCount = useMemo(() => MODULES.filter(matches).length, [filter, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const plan = planById(recommendPlan(picked));
  const toggle = (m: Module) => {
    setFocus(m);
    setPicked((p) => (p.includes(m.id) ? p.filter((x) => x !== m.id) : [...p, m.id]));
  };
  const start = () => {
    saveStack(picked);
    navigate(`/signup?plan=${plan.id}`);
  };

  let idx = 0;
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      {/* min-w-0: let the nowrap filter row scroll instead of widening the column on phones. */}
      <div className="min-w-0 lg:col-span-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="group" aria-label="Filter by event type" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {[{ id: null, label: "All" }, ...EVENT_TYPES].map((t) => (
              <button
                key={t.label}
                type="button"
                aria-pressed={filter === t.id}
                onClick={() => setFilter(t.id as EventType | null)}
                className={`eh-press h-8 shrink-0 rounded-full border px-3 text-[13px] ${
                  filter === t.id ? "border-ink bg-ink text-paper" : "border-line-strong text-ink-2 hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="relative block sm:w-56">
            <span className="sr-only">Search modules</span>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 104 modules"
              className="h-9 w-full rounded-control border border-line-strong bg-surface pl-8 pr-3 text-sm text-ink placeholder:text-ink-3"
            />
          </label>
        </div>
        <p className="mt-3 font-mono text-xs text-ink-3" aria-live="polite">
          {matchCount} of {MODULES.length} modules match. Non-matching ones stay visible, dimmed.
        </p>

        <div data-inview className="mt-6 grid gap-x-6 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <h3 className="mb-2.5 border-b border-line pb-2 text-[13px] font-medium text-ink">{cat}</h3>
              <ul className="flex flex-wrap gap-1.5">
                {MODULES.filter((m) => m.category === cat).map((m) => {
                  const on = m.core || picked.includes(m.id);
                  const dim = !matches(m);
                  return (
                    <li key={m.id} className="eh-cell" style={{ "--i": idx++ } as React.CSSProperties}>
                      <button
                        type="button"
                        aria-pressed={on}
                        aria-disabled={m.core}
                        onClick={() => (m.core ? setFocus(m) : toggle(m))}
                        onMouseEnter={() => setFocus(m)}
                        onFocus={() => setFocus(m)}
                        className={`eh-press flex h-7 items-center gap-1 rounded-control border px-2 text-[12.5px] ${
                          m.core
                            ? "cursor-default border-transparent bg-sunken text-ink-2"
                            : on
                              ? "border-accent bg-accent-soft text-ink"
                              : "border-line text-ink-2 hover:border-line-strong hover:text-ink"
                        } ${dim ? "opacity-35" : ""}`}
                      >
                        {on && <Check className="size-3 shrink-0" strokeWidth={2} aria-hidden="true" />}
                        {m.name}
                        {m.core && <span className="sr-only"> (included free)</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Stack panel: sticky beside the grid on desktop. */}
      <aside className="lg:col-span-4" aria-label="Your stack">
        <div className="rounded-card border border-line bg-surface lg:sticky lg:top-24">
          <div className="border-b border-line p-5">
            <p className="text-sm font-medium text-ink">{focus.name}</p>
            <p className="mt-1 text-sm text-ink-2">{focus.blurb}</p>
            <p className="mt-2 font-mono text-xs text-ink-3">
              {focus.category} · {focus.core ? "Included on every plan" : focus.enterpriseOnly ? "Enterprise" : focus.live ? "Available now" : "In development"}
            </p>
          </div>
          <div className="p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-medium text-ink">Your stack</h3>
              <span className="font-mono text-xs text-ink-3">{CORE.length} included + {picked.length} add-ons</span>
            </div>
            {picked.length === 0 ? (
              <p className="mt-4 text-sm text-ink-2">Pick modules on the left to build your stack. The core {CORE.length} are always free.</p>
            ) : (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {picked.map((id) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => toggle(byId(id)!)}
                      className="eh-press flex h-7 items-center gap-1 rounded-control border border-accent bg-accent-soft px-2 text-[12.5px] text-ink"
                    >
                      {byId(id)!.name}
                      <X className="size-3" aria-hidden="true" />
                      <span className="sr-only">Remove</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 border-t border-line pt-4" aria-live="polite">
              <p className="text-sm text-ink-2">Recommended plan</p>
              <p key={plan.id} className="eh-swap mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-[-0.02em] text-ink">{plan.name}</span>
                <span className="font-mono text-sm text-ink-2">{plan.monthly === null ? "Custom" : `$${plan.monthly}/mo`}</span>
              </p>
              <p className="mt-1 text-sm text-ink-3">{plan.pitch}</p>
            </div>
            <button type="button" onClick={start} className={`${buttonCls.primary} mt-5 hidden w-full lg:inline-flex`}>
              Start free with this stack
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile: compact sticky summary so the CTA is always in reach while browsing. */}
      <div className="sticky bottom-3 z-20 -mx-1 flex items-center justify-between gap-3 rounded-card border border-line bg-surface p-3 shadow-overlay lg:hidden">
        <p className="text-sm text-ink">
          <span className="font-medium">{picked.length} add-ons</span>
          <span className="text-ink-2"> · {plan.name}</span>
        </p>
        <button type="button" onClick={start} className={buttonCls.primary}>
          Start free
        </button>
      </div>
    </div>
  );
}
