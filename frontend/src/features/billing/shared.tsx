import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { byId, nextPlan, planById } from "../../billing/catalog";
import { slotsFor, swapModule, useWorkspace } from "../../billing/plan";
import { buttonCls } from "../../marketing/lib";

/** Native <dialog>: focus trap, Esc and inert background come free. */
export function Dialog({ open, onClose, title, kicker, children }: { open: boolean; onClose: () => void; title: string; kicker?: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby="dlg-title"
      className="m-auto w-[min(520px,calc(100vw-2rem))] rounded-[20px] bg-surface p-0 text-ink shadow-[0_40px_90px_-30px_rgba(25,70,45,.45)] backdrop:bg-ink/30"
    >
      <div className="flex items-start justify-between gap-4 px-[22px] pt-[22px]">
        <div>
          {kicker && <p className="font-mono text-[11px] tracking-[.05em] text-[#6E7C73]">{kicker}</p>}
          <h2 id="dlg-title" className="mt-2 text-[22px] font-medium tracking-[-0.03em]">{title}</h2>
        </div>
        <button type="button" onClick={onClose} className="grid size-[30px] shrink-0 cursor-pointer place-items-center rounded-full bg-paper text-ink-2 hover:bg-sunken" aria-label="Close">
          <X className="size-4" />
        </button>
      </div>
      <div className="px-[22px] pt-[18px] pb-[22px]">{children}</div>
    </dialog>
  );
}

/** Bulleted fact list used in the billing dialogs. */
export const Facts = ({ items }: { items: ReactNode[] }) => (
  <ul className="flex flex-col gap-2">
    {items.map((x, i) => (
      <li key={i} className="flex gap-2.5 text-sm leading-[1.45] text-ink-2">
        <span className="mt-2 size-[5px] shrink-0 rounded-full bg-[#8A968E]" aria-hidden="true" />
        {x}
      </li>
    ))}
  </ul>
);

/** Label, mono count, 6px bar, optional note. */
export function Meter({ used, total, label, note, warn }: { used: number; total: number | null; label: string; note?: string; warn?: boolean }) {
  const inf = total === null || !isFinite(total);
  const pct = inf ? 100 : Math.min(100, (used / Math.max(total, 1)) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2.5">
        <span className="text-sm text-ink-2">{label}</span>
        <span className="font-mono text-[13px] tabular-nums">
          {used}<span className="text-[#8A968E]">/{inf ? "∞" : total}</span>
        </span>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-[3px] bg-line-soft" aria-hidden="true">
        <div className={`h-full rounded-[3px] ${warn ? "bg-[#C08A1E]" : pct >= 100 ? "bg-live" : "bg-ink"}`} style={{ width: `${pct}%` }} />
      </div>
      {note && <p className="mt-1.5 text-xs text-[#6E7C73]">{note}</p>}
    </div>
  );
}

/** Square checkbox mark from the design (16px ink/green box with a tick). */
export const CheckBox = ({ on, green }: { on: boolean; green?: boolean }) => (
  <span
    aria-hidden="true"
    className={`grid size-[18px] shrink-0 place-items-center rounded-[5px] text-xs text-white ${on ? (green ? "bg-live" : "bg-ink") : "bg-surface ring-1 ring-inset ring-[#CBD6CC]"}`}
  >
    {on && "✓"}
  </span>
);

const ago = (ms?: number) => {
  if (!ms) return "not opened yet";
  const d = Math.floor((Date.now() - ms) / 86_400_000);
  return d === 0 ? "opened today" : `last opened ${d} day${d === 1 ? "" : "s"} ago`;
};

/** Module limit reached: swap one out, or move up a plan. */
export function SlotDialog({ want, onClose }: { want: string | null; onClose: () => void }) {
  const w = useWorkspace();
  const navigate = useNavigate();
  const [out, setOut] = useState<string>("");
  const m = want ? byId(want) : null;
  const active = w.addOns.slice(0, slotsFor(w));
  const up = nextPlan(w.plan);
  const next = up && up.id !== "enterprise" ? up : null;
  const done = () => {
    onClose();
    if (m?.route) navigate(m.route);
  };

  return (
    <Dialog open={!!m} onClose={onClose} kicker="SLOTS FULL" title={`All ${slotsFor(w)} ${planById(w.plan).name} slots are in use`}>
        <>
          {active.length > 0 && (
            <fieldset>
              <legend className="text-ink-2">Swap one out to make room for {m?.name}. Its data is kept and comes back if you switch it on again.</legend>
              <div className="mt-4 divide-y divide-line rounded-card border border-line">
                {active.map((id) => (
                  <label key={id} className="flex cursor-pointer items-center gap-3 px-4 py-3 has-[:checked]:bg-accent-soft">
                    <input type="radio" name="swap" value={id} checked={out === id} onChange={() => setOut(id)} className="accent-[var(--eh-accent)]" />
                    <span className="flex-1 text-sm font-medium">{byId(id)?.name}</span>
                    <span className="text-xs text-ink-3">{ago(w.lastUsed?.[id])}</span>
                  </label>
                ))}
              </div>
              <button type="button" disabled={!out} className={`${buttonCls.secondary} mt-4 w-full disabled:opacity-50`} onClick={() => (swapModule(out, want!), done())}>
                {out ? `Swap ${byId(out)?.name} for ${m?.name}` : "Pick a module to swap"}
              </button>
            </fieldset>
          )}
          <div className="mt-6 border-t border-line pt-5">
            {next ? (
              <>
                <p className="text-sm text-ink-2">
                  Or upgrade to <span className="font-medium text-ink">{next.name}</span>: {next.slots} slots.{" "}
                  <span className="font-mono">+${next.monthly! - planById(w.plan).monthly!}/mo</span>, prorated today.
                </p>
                <button type="button" className={`${buttonCls.primary} mt-3 w-full`} onClick={() => (onClose(), navigate(`/billing/checkout?plan=${next.id}&add=${want}`))}>
                  Upgrade to {next.name}
                </button>
              </>
            ) : (
              <p className="text-sm text-ink-2">
                Need more than 60? <a href="/demo" className="font-medium text-ink underline underline-offset-2">Book a demo</a> for Enterprise, which includes every module.
              </p>
            )}
          </div>
        </>
    </Dialog>
  );
}
