import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Segmented } from "../../../components/DashboardHeader";
import { mono } from "../../../components/ui";
import type { ScheduleItem } from "../api";
import type { TaskStatus } from "../data";

// Run-of-show timeline from the v2 design (Claude Design "Schedule" page): task/owner column, an hour or day
// grid, status-coloured bars and striped delay tails. Organizers drag a bar to move it, or click it to edit.

// [background, border, text]. Blocked is red to match the Blocked pills elsewhere.
const BAR: Record<TaskStatus, [string, string, string]> = {
  "In Progress": ["#16231C", "#16231C", "#F2F5F1"],
  Blocked: ["#8A2E52", "#8A2E52", "#FFFFFF"],
  Done: ["#E1E8E0", "#E1E8E0", "#56645B"],
  Pending: ["#FFFFFF", "#C4CEC6", "#56645B"],
};
const DELAY_STRIPES = "repeating-linear-gradient(135deg,#C9BDF2 0 4px,#F4DCE6 4px 8px)";

type Scale = "Day" | "Week" | "Month";
const MIN = 60_000, HOUR = 60 * MIN;
const NO_END = 30 * MIN; // tasks without endsAt still get a visible bar
const SNAP: Record<Scale, number> = { Day: 5 * MIN, Week: 30 * MIN, Month: 6 * HOUR };
const MIN_WIDTH: Record<Scale, number> = { Day: 820, Week: 900, Month: 1260 };

const dayStart = (t: number) => new Date(t).setHours(0, 0, 0, 0);
// Local-hour rounding (epoch maths would land on :30/:45 in half-hour time zones).
const floorHour = (t: number) => new Date(t).setMinutes(0, 0, 0);
const ceilHour = (t: number) => (floorHour(t) === t ? t : floorHour(t) + HOUR);
const addDays = (t: number, n: number) => {
  const d = new Date(t);
  d.setDate(d.getDate() + n); // calendar days, so DST shifts don't drift the grid
  return d.getTime();
};
const weekStart = (t: number) => addDays(dayStart(t), -((new Date(t).getDay() + 6) % 7)); // Monday
const monthStart = (t: number) => new Date(new Date(t).getFullYear(), new Date(t).getMonth(), 1).getTime();
const addMonths = (t: number, n: number) => new Date(new Date(t).getFullYear(), new Date(t).getMonth() + n, 1).getTime();

const span = (i: ScheduleItem) => {
  const s = Date.parse(i.startsAt);
  const e = i.endsAt ? Date.parse(i.endsAt) : s + NO_END;
  return [s, e > s ? e : s + NO_END] as const;
};
const fmtTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const fmtDay = (t: number, o: Intl.DateTimeFormatOptions) => new Date(t).toLocaleDateString([], o);

/** The visible window and its grid lines for a scale anchored on `anchor`. */
function windowFor(scale: Scale, anchor: number, items: ScheduleItem[]) {
  if (scale === "Day") {
    const d0 = dayStart(anchor), d1 = addDays(d0, 1);
    // Fit the hours that have work (as in the design), at least 4h, defaulting to 08:00-18:00.
    const today = items.map(span).filter(([s, e]) => s < d1 && e > d0);
    let r0 = d0 + 8 * HOUR, r1 = d0 + 18 * HOUR;
    if (today.length) {
      r0 = Math.max(d0, floorHour(Math.min(...today.map(([s]) => s))));
      r1 = Math.min(d1, ceilHour(Math.max(...today.map(([, e]) => e))));
      if (r1 - r0 < 4 * HOUR) r1 = Math.min(d1, r0 + 4 * HOUR);
    }
    const step = r1 - r0 > 12 * HOUR ? 2 * HOUR : HOUR;
    const ticks = [];
    for (let t = r0; t <= r1; t += step) ticks.push({ t, l: fmtTime(t) });
    return { r0, r1, ticks, label: fmtDay(d0, { weekday: "long", month: "short", day: "numeric" }) };
  }
  const r0 = scale === "Week" ? weekStart(anchor) : monthStart(anchor);
  const r1 = scale === "Week" ? addDays(r0, 7) : addMonths(r0, 1);
  const ticks = [];
  for (let t = r0; t < r1; t = addDays(t, 1)) ticks.push({ t, l: scale === "Week" ? fmtDay(t, { weekday: "short", day: "numeric" }) : fmtDay(t, { day: "numeric" }) });
  const label = scale === "Week"
    ? `${fmtDay(r0, { month: "short", day: "numeric" })} – ${fmtDay(addDays(r1, -1), { month: "short", day: "numeric" })}`
    : fmtDay(r0, { month: "long", year: "numeric" });
  return { r0, r1, ticks, label };
}

export default function TimelineView({
  items,
  onReschedule,
  onEdit,
}: {
  items: ScheduleItem[];
  // Both omitted for staff (read-only). onReschedule receives only the fields that changed.
  onReschedule?: (id: string, change: { startsAt: string; endsAt?: string }) => void;
  onEdit?: (id: string) => void;
}) {
  const [scale, setScale] = useState<Scale>("Day");
  // Open on the first task's day; arrows move by one day/week/month.
  const [anchor, setAnchor] = useState(() => (items.length ? Math.min(...items.map((i) => Date.parse(i.startsAt))) : Date.now()));
  const [drag, setDrag] = useState<{ id: string; x0: number; width: number; delta: number } | null>(null);
  const moved = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), MIN); // keep the "now" line moving
    return () => clearInterval(t);
  }, []);

  const { r0, r1, ticks, label } = windowFor(scale, anchor, items);
  const total = r1 - r0;
  const pct = (t: number) => `${((t - r0) / total) * 100}%`;
  const rows = items.filter((i) => {
    const [s, e] = span(i);
    return s < r1 && e > r0;
  });
  const step = (dir: number) =>
    setAnchor((a) => (scale === "Day" ? addDays(a, dir) : scale === "Week" ? addDays(a, 7 * dir) : addMonths(a, dir)));
  const snap = (ms: number) => Math.round(ms / SNAP[scale]) * SNAP[scale];

  const commit = (item: ScheduleItem, delta: number) => {
    if (!onReschedule || !delta) return;
    const [s] = span(item);
    onReschedule(item._id, {
      startsAt: new Date(s + delta).toISOString(),
      ...(item.endsAt ? { endsAt: new Date(Date.parse(item.endsAt) + delta).toISOString() } : {}),
    });
  };

  const onDown = (e: PointerEvent<HTMLButtonElement>, id: string) => {
    if (!onReschedule || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    moved.current = false;
    setDrag({ id, x0: e.clientX, width: e.currentTarget.parentElement!.clientWidth, delta: 0 });
  };
  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    if (Math.abs(e.clientX - drag.x0) > 4) moved.current = true;
    setDrag({ ...drag, delta: snap(((e.clientX - drag.x0) / drag.width) * total) });
  };
  const onUp = (item: ScheduleItem) => {
    if (!drag) return;
    if (moved.current) commit(item, drag.delta);
    setDrag(null);
  };
  // Click (no drag) edits; the click event still fires after a drag, so `moved` filters it out.
  const onClick = (id: string) => {
    if (!moved.current) onEdit?.(id);
    moved.current = false;
  };
  const onKey = (e: KeyboardEvent, item: ScheduleItem) => {
    if (!onReschedule || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    e.preventDefault();
    commit(item, (e.key === "ArrowRight" ? 1 : -1) * SNAP[scale]);
  };

  const navBtn = "grid size-8 cursor-pointer place-items-center rounded-full bg-surface text-ink-2 hover:text-ink";

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => step(-1)} className={navBtn} aria-label={`Previous ${scale.toLowerCase()}`}><ChevronLeft size={16} /></button>
          <button type="button" onClick={() => step(1)} className={navBtn} aria-label={`Next ${scale.toLowerCase()}`}><ChevronRight size={16} /></button>
          <span className="ml-1 text-[15px] font-medium" aria-live="polite">{label}</span>
        </div>
        <Segmented options={["Day", "Week", "Month"] as const} value={scale} onChange={setScale} />
      </div>

      <div className="overflow-x-auto rounded-2xl bg-surface">
        <div style={{ minWidth: MIN_WIDTH[scale] }}>
          <div className="grid grid-cols-[260px_1fr] border-b border-line bg-soft">
            <div className={`${mono} px-[18px] py-3 text-ink-3`}>TASK · OWNER</div>
            <div className="relative h-[38px]" aria-hidden="true">
              {ticks.map((h, i) => (
                <span
                  key={h.t}
                  className={`${mono} absolute top-3 text-[#6E7C73] ${scale === "Day" ? "-translate-x-1/2" : "pl-1.5"} ${scale === "Month" && i % 2 ? "max-[1400px]:hidden" : ""}`}
                  style={{ left: pct(h.t) }}
                >
                  {h.l}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute top-0 right-0 bottom-0 left-[260px]" aria-hidden="true">
              {ticks.map((h) => (
                <div key={h.t} className="absolute top-0 bottom-0 w-px bg-line-soft" style={{ left: pct(h.t) }} />
              ))}
              {now > r0 && now < r1 && (
                <div className="absolute top-0 bottom-0 z-[1] w-px bg-live" style={{ left: pct(now) }}>
                  <span className="absolute -top-0.5 -left-5 rounded bg-live px-[5px] py-px font-mono text-[9.5px] text-white">{fmtTime(now)}</span>
                </div>
              )}
            </div>

            {rows.map((item) => {
              const [s, e] = span(item);
              const delta = drag?.id === item._id ? drag.delta : 0;
              const [bg, border, fg] = BAR[item.status] ?? BAR.Pending;
              const left = Math.max(s + delta, r0), right = Math.min(e + delta, r1);
              const delay = (item.delayMinutes ?? 0) * MIN;
              return (
                <div key={item._id} className="grid grid-cols-[260px_1fr] border-b border-line-soft last:border-0">
                  <div className="min-w-0 px-[18px] py-2.5">
                    <div className="truncate text-[13px]">{item.name}</div>
                    <div className="mt-px truncate text-[11.5px] text-[#6E7C73]">
                      {item.owner?.name ?? "Unassigned"}
                      {item.dependsOn ? ` · after ${item.dependsOn.name}` : ""}
                    </div>
                  </div>
                  <div className="relative h-[52px]">
                    <button
                      type="button"
                      onPointerDown={(ev) => onDown(ev, item._id)}
                      onPointerMove={onMove}
                      onPointerUp={() => onUp(item)}
                      onPointerCancel={() => setDrag(null)}
                      onClick={() => onClick(item._id)}
                      onKeyDown={(ev) => onKey(ev, item)}
                      disabled={!onEdit && !onReschedule}
                      title={`${item.name} · ${fmtTime(s + delta)} – ${fmtTime(e + delta)} · ${item.status}`}
                      aria-label={`${item.name}, ${item.status}, ${fmtDay(s + delta, { weekday: "short" })} ${fmtTime(s + delta)} to ${fmtTime(e + delta)}${onReschedule ? ". Arrow keys move it" : ""}`}
                      className={`absolute top-3.5 flex h-6 touch-none items-center overflow-hidden rounded-md border px-2 text-[11px] whitespace-nowrap select-none disabled:cursor-default ${
                        onReschedule ? (drag?.id === item._id ? "cursor-grabbing shadow-[0_6px_16px_-8px_rgba(20,45,30,.5)]" : "cursor-grab") : "cursor-pointer"
                      }`}
                      style={{ left: pct(left), width: `max(6px, ${((right - left) / total) * 100}%)`, background: bg, borderColor: border, color: fg }}
                    >
                      {item.status}
                    </button>
                    {delay > 0 && e + delta < r1 && (
                      <div
                        className="pointer-events-none absolute top-3.5 h-6 rounded-r-md"
                        style={{ left: pct(e + delta), width: `${(Math.min(delay, r1 - e - delta) / total) * 100}%`, background: DELAY_STRIPES }}
                        title={`+${item.delayMinutes} min delay`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            {rows.length === 0 && (
              <p className="py-12 text-center text-sm text-ink-3">
                {items.length ? `No tasks in this ${scale.toLowerCase()}. Use the arrows to move through the schedule.` : "No tasks to chart yet."}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-3">
        <div className="flex flex-wrap gap-[18px]">
          {(Object.keys(BAR) as TaskStatus[]).map((st) => (
            <span key={st} className="flex items-center gap-1.5">
              <span className="h-2 w-3.5 rounded-sm border" style={{ background: BAR[st][0], borderColor: BAR[st][1] }} />
              {st}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3.5 rounded-sm" style={{ background: DELAY_STRIPES }} /> Delay
          </span>
        </div>
        {onReschedule && <span>Drag a bar to move it. Click it to edit.</span>}
      </div>
    </>
  );
}
