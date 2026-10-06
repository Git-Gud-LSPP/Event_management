import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PLANS, byId, planById, type PlanId } from "../../billing/catalog";
import { changePlan, daysLeft, priceFor, removeModule, scheduleChange, slotsFor, undoScheduledChange, useWorkspace } from "../../billing/plan";
import { listEvents } from "../events/api";
import { CheckBox, Dialog, Facts, Meter } from "./shared";
import { useToast } from "./useToast";

const RANK: Record<PlanId, number> = { starter: 0, growth: 1, scale: 2, enterprise: 3 };
const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
const money = (n: number) => "$" + n.toLocaleString("en-US");
const mono = "font-mono text-[11px] tracking-[.05em]";
const darkBtn = "cursor-pointer rounded-full bg-paper px-[18px] py-[11px] text-sm text-ink hover:bg-surface hover:text-ink";
const lineBtn = "cursor-pointer rounded-full border border-[#CBD6CC] px-4 py-[9px] text-[13.5px] hover:border-ink";

export default function BillingPage() {
  const w = useWorkspace();
  const navigate = useNavigate();
  const plan = planById(w.plan);
  const price = priceFor(w.plan, w.cycle);
  const trial = !!w.trialEndsAt;
  const [cycle, setCycle] = useState(w.cycle); // price preview for the plan grid
  const [activeEvents, setActiveEvents] = useState<number | null>(null);
  const [downTo, setDownTo] = useState<PlanId | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const { flash, toast } = useToast();

  useEffect(() => {
    listEvents()
      .then(({ items }) => setActiveEvents(items.filter((e) => e.status !== "cancelled" && new Date(e.endsAt ?? e.startsAt) > new Date()).length))
      .catch(() => setActiveEvents(null));
  }, []);

  const pick = (id: PlanId) => {
    if (id === "enterprise") navigate("/demo");
    else if (RANK[id] > RANK[w.plan] || (id === w.plan && trial)) navigate(`/billing/checkout?plan=${id}&cycle=${cycle}`);
    else if (trial) {
      changePlan(id, "monthly"); // nothing paid yet, so a trial can step down immediately
      flash(`Switched to ${planById(id).name}`);
    } else setDownTo(id);
  };

  const slots = slotsFor(w);
  const used = Math.min(w.addOns.length, slots);
  const status = w.pendingPlan ? ["CHANGE SCHEDULED", "bg-[#F6EFD9] text-[#5E4510]"] : trial ? ["TRIAL", "bg-ai text-ink"] : price === 0 ? ["FREE", "bg-ink-hover text-[#B7E0C5]"] : ["ACTIVE", "bg-ink-hover text-[#B7E0C5]"];
  const overEvents = activeEvents !== null && plan.events !== null && activeEvents > plan.events;

  return (
    <div className="mx-auto max-w-[1120px] pb-24 text-ink">
      <p className="font-mono text-xs tracking-[.04em] text-ink-3">WORKSPACE · BILLING</p>
      <h1 className="mt-3 mb-7 text-[clamp(34px,4vw,52px)] leading-none font-medium tracking-[-0.045em]">Plan &amp; billing</h1>

      {w.pendingPlan && (
        <div role="status" className="mb-4 flex flex-wrap items-center gap-3.5 rounded-[14px] bg-[#F6EFD9] px-4 py-3.5 text-sm text-[#5E4510]">
          <span className="size-2 shrink-0 rounded-full bg-[#C08A1E]" aria-hidden="true" />
          <span className="min-w-[220px] flex-1">
            {w.pendingPlan === "starter" ? "Your subscription is cancelled." : `You're moving to ${planById(w.pendingPlan).name} on ${date(w.cancelAt)}.`} {plan.name} stays active until {date(w.cancelAt)}.
          </span>
          <button type="button" onClick={() => (undoScheduledChange(), flash(`Keeping ${plan.name}`))} className="cursor-pointer rounded-full bg-[#5E4510] px-3.5 py-[7px] text-[13px] text-[#F6EFD9]">
            Keep {plan.name}
          </button>
        </div>
      )}

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))]">
        <section aria-label="Current plan" className="flex flex-col gap-5 rounded-[20px] bg-ink p-[clamp(22px,3vw,32px)] text-paper">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <span className={`${mono} text-[#95A39A]`}>CURRENT PLAN</span>
            <span className={`rounded-full px-[9px] py-1 font-mono text-[10.5px] tracking-[.04em] ${status[1]}`}>{status[0]}</span>
          </div>
          <div>
            <p className="text-[clamp(44px,5vw,64px)] leading-[.95] font-medium tracking-[-0.05em]">{plan.name}</p>
            <p className="mt-3 max-w-[420px] text-[15px] leading-normal text-[#B7C4BA]">
              {trial
                ? `Free until ${date(w.trialEndsAt)}. Add a card to keep your modules after that.`
                : price === null
                  ? "Custom contract, invoiced annually."
                  : price === 0
                    ? "Free forever. Upgrade any time — nothing you set up is lost."
                    : `${money(price)}/mo, billed ${w.cycle === "annual" ? `${money(price * 12)} yearly` : "monthly"}. Renews ${date(w.renewsAt)}.`}
            </p>
          </div>
          {trial && (
            <div>
              <div className="mb-2 flex justify-between text-xs text-[#95A39A]">
                <span>Trial</span>
                <span className="font-mono">{daysLeft(w.trialEndsAt)} of 14 days left</span>
              </div>
              <div className="h-1 overflow-hidden rounded-sm bg-ink-hover">
                <div className="h-full bg-ai" style={{ width: `${(daysLeft(w.trialEndsAt) / 14) * 100}%` }} />
              </div>
            </div>
          )}
          <div className="mt-auto flex flex-wrap gap-2">
            {trial && <Link to={`/billing/checkout?plan=${w.plan}`} className={darkBtn}>Add payment method</Link>}
            {!trial && w.cycle === "monthly" && !!price && (
              <button type="button" onClick={() => (changePlan(w.plan, "annual"), setCycle("annual"), flash("Switched to annual billing"))} className={darkBtn}>
                Switch to annual · save {money((plan.monthly! - plan.annual!) * 12)}/yr
              </button>
            )}
            <Link to="/modules" className="rounded-full border border-[#3A4B41] px-[18px] py-2.5 text-sm text-[#DCE6DE] hover:border-paper hover:text-paper">
              Manage modules
            </Link>
          </div>
        </section>

        <section aria-label="Usage" className="flex flex-col gap-[22px] rounded-[20px] bg-surface p-[clamp(22px,3vw,32px)]">
          <span className={`${mono} text-[#6E7C73]`}>USAGE THIS PERIOD</span>
          <Meter used={used} total={slots} label="Add-on slots" note={isFinite(slots) ? `${slots - used} free` : "Every module included"} />
          <Meter
            used={activeEvents ?? 0}
            total={plan.events}
            label="Active events"
            warn={overEvents}
            note={activeEvents === null ? "Couldn't load events" : overEvents ? "Over limit · new events need an upgrade" : "Upcoming and in progress"}
          />
          <div className="flex items-baseline justify-between gap-2.5 border-t border-line-soft pt-4 text-sm">
            <span className="text-ink-2">Seats</span>
            <span className="font-mono text-[13px]">up to {plan.seats ?? "custom"}</span>
          </div>
        </section>
      </div>

      <section className="mt-14" aria-labelledby="change">
        <div className="mb-[18px] flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="change" className="text-2xl font-medium tracking-[-0.03em]">Change plan</h2>
            <p className="mt-1.5 text-sm text-[#56645B]">Upgrades apply now, prorated. Downgrades apply at the end of the period.</p>
          </div>
          <div className="flex gap-1 rounded-full bg-sunken p-1" role="group" aria-label="Billing cycle">
            {(["monthly", "annual"] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={cycle === c}
                onClick={() => setCycle(c)}
                className={`flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-[7px] text-[13px] capitalize ${cycle === c ? "bg-surface text-ink shadow-[0_1px_2px_rgba(22,35,28,.12)]" : "text-[#56645B]"}`}
              >
                {c}
                {c === "annual" && <span className="font-mono text-[10.5px] text-[#2A6E4B]">−17%</span>}
              </button>
            ))}
          </div>
        </div>
        <ul className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))]">
          {PLANS.map((p) => {
            const current = p.id === w.plan;
            const pr = priceFor(p.id, cycle);
            const verb = p.id === "enterprise" ? "Talk to sales" : current ? (trial ? "Keep after trial" : "Current plan") : RANK[p.id] > RANK[w.plan] ? "Upgrade" : "Downgrade";
            const primary = verb === "Upgrade" || verb === "Keep after trial";
            return (
              <li key={p.id} className={`flex flex-col gap-4 rounded-[18px] bg-surface p-[22px] ${current ? "shadow-[inset_0_0_0_1.5px_var(--eh-ink)]" : ""}`}>
                <div className="flex min-h-[22px] items-center justify-between gap-2">
                  <span className="text-base font-medium">{p.name}</span>
                  {current && <span className="rounded-full bg-ink px-2 py-[3px] font-mono text-[10px] tracking-[.04em] text-paper">CURRENT</span>}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-medium tracking-[-0.04em] tabular-nums">{pr === null ? "Custom" : money(pr)}</span>
                  <span className="text-[13px] text-[#6E7C73]">{pr === null ? "" : pr === 0 ? "forever" : cycle === "annual" ? "/mo, yearly" : "/mo"}</span>
                </div>
                <p className="min-h-10 text-[13.5px] leading-[1.45] text-[#56645B]">{p.pitch}</p>
                <dl className="flex flex-1 flex-col gap-2 border-t border-line-soft pt-3.5 text-[13px]">
                  {[["Add-on slots", isFinite(p.slots) ? p.slots : "All"], ["Active events", p.events ?? "Unlimited"], ["Seats", p.seats ?? "Custom"]].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <dt className="text-[#6E7C73]">{k}</dt>
                      <dd className="font-mono text-xs text-ink-2">{v}</dd>
                    </div>
                  ))}
                </dl>
                <button
                  type="button"
                  disabled={current && !trial}
                  onClick={() => pick(p.id)}
                  className={`cursor-pointer rounded-full border px-4 py-[11px] text-center text-sm disabled:cursor-default disabled:opacity-50 ${primary ? "border-ink bg-ink text-paper hover:bg-ink-hover" : "border-[#CBD6CC] bg-surface text-ink hover:border-ink"}`}
                >
                  {verb}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-14 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
        <section aria-labelledby="addons" className="rounded-[20px] bg-surface p-6">
          <div className="mb-3.5 flex items-baseline justify-between gap-2.5">
            <h2 id="addons" className="text-lg font-medium tracking-[-0.02em]">Your add-ons</h2>
            <Link to="/modules" className="text-[13px] font-medium hover:text-accent">Browse modules →</Link>
          </div>
          {w.addOns.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#CBD6CC] p-6 text-center text-sm text-[#56645B]">No add-ons yet. Pick some from the catalog.</p>
          ) : (
            <ul>
              {w.addOns.map((id, i) => {
                const m = byId(id);
                const locked = i >= slots;
                return (
                  <li key={id} className="flex items-center gap-3 border-t border-line-soft py-3">
                    <span className={`size-2 shrink-0 rounded-[2px] ${locked ? "bg-[#CBD6CC]" : "bg-live"}`} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{m?.name ?? id}</p>
                      <p className="text-xs text-[#6E7C73]">{locked ? "Locked · data kept" : m?.category}</p>
                    </div>
                    <button type="button" onClick={() => (removeModule(id), flash(`${m?.name ?? id} switched off · data kept`))} className="cursor-pointer text-[12.5px] text-[#6E7C73] hover:text-ink">
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="invoices" className="rounded-[20px] bg-surface p-6">
          <h2 id="invoices" className="mb-3.5 text-lg font-medium tracking-[-0.02em]">Invoices</h2>
          <p className="rounded-xl border border-dashed border-[#CBD6CC] p-6 text-sm leading-normal text-[#56645B]">
            Invoices appear here after your first payment. Billing email and VAT details are set at checkout.
          </p>
        </section>
      </div>

      {w.plan !== "starter" && !w.pendingPlan && !trial && (
        <section className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <div>
            <h2 className="text-base font-medium">Cancel subscription</h2>
            <p className="mt-1 text-sm text-[#56645B]">You'll move to Starter (free) at the end of the period. Nothing is deleted.</p>
          </div>
          <button type="button" onClick={() => setCancelling(true)} className="cursor-pointer rounded-full border border-[#CBD6CC] px-4 py-2.5 text-[13.5px] text-[#9A3B2A] hover:border-[#9A3B2A]">
            Cancel subscription
          </button>
        </section>
      )}

      {downTo && <DowngradeDialog to={downTo} onClose={() => setDownTo(null)} onDone={flash} />}
      <CancelDialog open={cancelling} onClose={() => setCancelling(false)} onDone={flash} />
      {toast}
    </div>
  );
}

const Actions = ({ keepLabel, onKeep, confirmLabel, onConfirm, danger }: { keepLabel: string; onKeep: () => void; confirmLabel: string; onConfirm: () => void; danger?: boolean }) => (
  <div className="mt-5 flex flex-wrap justify-end gap-2">
    <button type="button" onClick={onKeep} className="cursor-pointer rounded-full bg-ink px-4 py-2.5 text-[13.5px] text-paper hover:bg-ink-hover">{keepLabel}</button>
    <button type="button" onClick={onConfirm} className={`${lineBtn} ${danger ? "text-[#9A3B2A]" : ""}`}>{confirmLabel}</button>
  </div>
);

function DowngradeDialog({ to, onClose, onDone }: { to: PlanId; onClose: () => void; onDone: (m: string) => void }) {
  const w = useWorkspace();
  const target = planById(to);
  const [keep, setKeep] = useState<string[]>(w.addOns.slice(0, target.slots));
  const toggle = (id: string) => setKeep((k) => (k.includes(id) ? k.filter((x) => x !== id) : k.length < target.slots ? [...k, id] : k));

  return (
    <Dialog open onClose={onClose} kicker="DOWNGRADE" title={`Move to ${target.name}`}>
      <Facts
        items={[
          `Add-on slots go from ${slotsFor(w)} to ${target.slots}.`,
          `Active events: ${target.events ?? "unlimited"}. Seats: ${target.seats}.`,
          `Takes effect on ${date(w.renewsAt)}. Until then nothing changes.`,
        ]}
      />
      {w.addOns.length > target.slots && (
        <fieldset className="mt-4">
          <legend className="mb-2 flex w-full justify-between text-[13.5px] font-medium">
            <span>Pick add-ons to keep</span>
            <span className="font-mono text-xs font-normal text-[#6E7C73]">{keep.length}/{target.slots} selected</span>
          </legend>
          <div className="overflow-hidden rounded-xl border border-line">
            {w.addOns.map((id) => {
              const on = keep.includes(id);
              return (
                <button key={id} type="button" role="checkbox" aria-checked={on} onClick={() => toggle(id)} className={`flex w-full cursor-pointer items-center gap-3 border-t border-line-soft px-3.5 py-[11px] text-left text-sm first:border-t-0 ${on ? "bg-[#F4F9F3]" : "bg-surface"}`}>
                  <CheckBox on={on} />
                  <span className="flex-1">{byId(id)?.name}</span>
                  <span className="text-xs text-[#6E7C73]">{on ? "Keeps working" : "Locked, data kept"}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      <Actions
        keepLabel={`Keep ${planById(w.plan).name}`}
        onKeep={onClose}
        confirmLabel={`Downgrade on ${date(w.renewsAt)}`}
        onConfirm={() => (scheduleChange(to, keep), onClose(), onDone(`Downgrade scheduled for ${date(w.renewsAt)}`))}
      />
    </Dialog>
  );
}

const REASONS = ["Too expensive", "Between events / seasonal", "Missing a feature", "Switching to another tool", "Something else"];

function CancelDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (m: string) => void }) {
  const w = useWorkspace();
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState("");
  const close = () => (setStep(1), setReason(""), onClose());
  const name = planById(w.plan).name;
  const extra = w.addOns.length - 5;

  return (
    <Dialog open={open} onClose={close} kicker={`CANCEL · ${step} OF 2`} title={step === 1 ? "Why are you cancelling?" : "Before you go"}>
      {step === 1 ? (
        <fieldset>
          <legend className="text-sm text-ink-2">Optional. It helps us decide what to build.</legend>
          <div className="mt-4 flex flex-col gap-1.5">
            {REASONS.map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3.5 py-[11px] text-sm has-[:checked]:border-ink has-[:checked]:bg-[#F4F9F3]">
                <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--eh-ink)]" />
                {r}
              </label>
            ))}
          </div>
          <Actions keepLabel="Keep my plan" onKeep={close} confirmLabel="Continue" onConfirm={() => setStep(2)} />
        </fieldset>
      ) : (
        <>
          <Facts
            items={[
              `${name} stays active until ${date(w.renewsAt)}.`,
              "Then you're on Starter: core modules plus 5 add-ons, 3 events, 2 seats.",
              ...(extra > 0 ? [`${extra} add-on${extra === 1 ? "" : "s"} become locked. Data is kept and exportable.`] : []),
            ]}
          />
          {reason === "Between events / seasonal" && (
            <p className="mt-4 rounded-xl bg-[#F4F9F3] p-3.5 text-[13.5px] leading-normal text-ink-2">
              Running events seasonally? Starter keeps your setup and data ready for next season. Re-upgrade in one click when the next event starts.
            </p>
          )}
          <Actions
            keepLabel="Keep my plan"
            onKeep={close}
            danger
            confirmLabel="Cancel subscription"
            onConfirm={() => (scheduleChange("starter", w.addOns.slice(0, 5)), close(), onDone(`Cancelled · ${name} active until ${date(w.renewsAt)}`))}
          />
        </>
      )}
    </Dialog>
  );
}
