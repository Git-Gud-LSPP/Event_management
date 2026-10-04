import { useRef, useState } from "react";
import { Clip } from "./ui";

const FEATURES = [
  {
    id: "schedule",
    title: "Run-of-show that stays current",
    body: "Drag a session and the crew call times, tasks and vendor deliveries move with it.",
    url: "/schedule",
    label: "Clip: a festival run-of-show Gantt chart. The headliner set is dragged 30 minutes later and dependent crew tasks shift with it.",
  },
  {
    id: "floorplan",
    title: "Floor plans your crew can use",
    body: "Draw the venue, place stages and stations, and attach the layout to the event everyone is already working in.",
    url: "/floorplan",
    label: "Clip: a hall floor plan. A stage, bar and first-aid station are placed and labeled, then the plan is saved to the event.",
  },
  {
    id: "incidents",
    title: "Incidents logged in seconds",
    body: "Staff report from the floor, leads triage by severity, and every action gets a timestamp for the post-event review.",
    url: "/incidents",
    label: "Clip: a staff member logs a high-severity spill at Gate B. It appears at the top of the incident list, is assigned, then resolved.",
  },
  {
    id: "assistant",
    title: "An assistant that does the busywork",
    body: "Ask it to assign tomorrow's load-in tasks, draft a vendor brief or find who's on call. It works across every module you add.",
    url: "/events",
    label: "Clip: the assistant is asked to assign load-in tasks to the stage crew. It lists the five tasks it created and who owns each.",
  },
];

export default function FeatureRail() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const f = FEATURES[active];

  const onKey = (e: React.KeyboardEvent) => {
    const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const next = (active + d + FEATURES.length) % FEATURES.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div
        role="tablist"
        aria-orientation="vertical"
        aria-label="Product features"
        onKeyDown={onKey}
        className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:col-span-4 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0"
      >
        {FEATURES.map((x, i) => (
          <button
            key={x.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            role="tab"
            id={`tab-${x.id}`}
            aria-selected={i === active}
            aria-controls="feature-panel"
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={`group shrink-0 snap-start border-b-2 py-3 pr-4 text-left transition-colors lg:border-b-0 lg:border-l lg:py-5 lg:pl-6 ${
              i === active ? "border-accent" : "border-line hover:border-line-strong"
            }`}
          >
            <span className={`block text-[15px] font-medium lg:text-lg ${i === active ? "text-ink" : "text-ink-2 group-hover:text-ink"}`}>{x.title}</span>
            <span className={`mt-2 hidden text-[15px] leading-relaxed text-ink-2 ${i === active ? "lg:block" : ""}`}>{x.body}</span>
          </button>
        ))}
      </div>
      <div id="feature-panel" role="tabpanel" aria-labelledby={`tab-${f.id}`} className="lg:col-span-8">
        <p className="mb-5 text-[15px] leading-relaxed text-ink-2 lg:hidden">{f.body}</p>
        <div key={f.id} className="eh-swap">
          <Clip name={f.id} url={f.url} label={f.label} />
        </div>
      </div>
    </div>
  );
}
