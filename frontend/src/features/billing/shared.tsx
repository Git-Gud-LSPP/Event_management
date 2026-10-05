import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { byId, nextPlan, planById } from "../../billing/catalog";
import { slotsFor, swapModule, useWorkspace } from "../../billing/plan";
import { buttonCls } from "../../marketing/lib";

/** Native <dialog>: focus trap, Esc and inert background come free. */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
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
      aria-labelledby="dlg-title"
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-card border border-line bg-surface p-0 text-ink shadow-overlay backdrop:bg-ink/30"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line p-5">
        <h2 id="dlg-title" className="text-lg font-semibold tracking-[-0.01em]">{title}</h2>
        <button type="button" onClick={onClose} className="-m-1 rounded-control p-1 text-ink-3 hover:text-ink" aria-label="Close">
          <X className="size-5" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}

/** Hairline track, 2px fill, mono count. No filled background bar. */
export function Meter({ used, total, label }: { used: number; total: number | null; label: string }) {
  const pct = total === null || !isFinite(total) ? 0 : Math.min(100, (used / Math.max(total, 1)) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-ink-2">{label}</span>
        <span className="font-mono text-ink tabular-nums">
          {used}/{total === null || !isFinite(total) ? "∞" : total}
        </span>
      </div>
      <div className="relative mt-2 h-px bg-line" aria-hidden="true">
        <div className={`absolute -top-px h-[3px] rounded-full ${pct >= 100 ? "bg-accent" : "bg-ink"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

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
    <Dialog open={!!m} onClose={onClose} title={`All ${slotsFor(w)} ${planById(w.plan).name} slots are in use`}>
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
                Need more than 60? <a href="/contact-sales" className="font-medium text-ink underline underline-offset-2">Book a demo</a> for Enterprise, which includes every module.
              </p>
            )}
          </div>
        </>
    </Dialog>
  );
}
