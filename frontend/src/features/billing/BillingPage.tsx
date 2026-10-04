import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { PLANS, byId, planById, type PlanId } from "../../billing/catalog";
import { changePlan, daysLeft, priceFor, removeModule, scheduleChange, slotsFor, undoScheduledChange, useWorkspace } from "../../billing/plan";
import { listEvents } from "../events/api";
import { buttonCls } from "../../marketing/lib";
import { Dialog, Meter } from "./shared";

const RANK: Record<PlanId, number> = { free: 0, starter: 1, growth: 2, enterprise: 3 };
const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

export default function BillingPage() {
  const w = useWorkspace();
  const navigate = useNavigate();
  const plan = planById(w.plan);
  const price = priceFor(w.plan, w.cycle);
  const [activeEvents, setActiveEvents] = useState<number | null>(null);
  const [downTo, setDownTo] = useState<PlanId | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    listEvents()
      .then(({ items }) => setActiveEvents(items.filter((e) => e.status !== "cancelled" && new Date(e.endsAt ?? e.startsAt) > new Date()).length))
      .catch(() => setActiveEvents(null));
  }, []);

  const pick = (id: PlanId) => {
    if (id === "enterprise") navigate("/contact-sales");
    else if (RANK[id] > RANK[w.plan] || (id === w.plan && w.trialEndsAt)) navigate(`/billing/checkout?plan=${id}&cycle=${w.cycle}`);
    else if (w.trialEndsAt) changePlan(id, "monthly"); // nothing paid yet, so a trial can step down immediately
    else setDownTo(id);
  };

  return (
    <div className="mx-auto max-w-5xl text-ink">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Plan & billing</h1>

      {w.pendingPlan && (
        <div role="status" className="mt-6 flex flex-wrap items-center gap-3 rounded-card border border-amber-700/30 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">
            {w.pendingPlan === "free" ? "Your subscription is cancelled" : `You're moving to ${planById(w.pendingPlan).name}`}. {plan.name} stays active until {date(w.cancelAt)}.
          </span>
          <button type="button" onClick={undoScheduledChange} className="font-medium underline underline-offset-2">Keep {plan.name}</button>
        </div>
      )}

      <section className="mt-6 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-[1.2fr_1fr]">
        <div className="bg-surface p-6">
          <p className="text-sm text-ink-2">Current plan</p>
          <p className="mt-1 text-3xl font-semibold tracking-[-0.03em]">
            {plan.name}
            {w.trialEndsAt && <span className="ml-2 align-middle text-sm font-normal text-ink-2">trial, {daysLeft(w.trialEndsAt)} days left</span>}
          </p>
          <p className="mt-2 text-ink-2">
            {w.trialEndsAt
              ? `Free until ${date(w.trialEndsAt)}. Add a card to keep your modules after that.`
              : price === null
                ? "Custom contract."
                : price === 0
                  ? "Free forever."
                  : `$${price}/mo, billed ${w.cycle === "annual" ? `$${price * 12} yearly` : "monthly"}. Renews ${date(w.renewsAt)}.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {w.trialEndsAt && (
              <Link to={`/billing/checkout?plan=${w.plan}`} className={buttonCls.primary}>Add payment method</Link>
            )}
            {w.cycle === "monthly" && price !== 0 && price !== null && !w.trialEndsAt && (
              <button type="button" onClick={() => changePlan(w.plan, "annual")} className={buttonCls.secondary}>
                Switch to annual, save ${(plan.monthly! - plan.annual!) * 12}/yr
              </button>
            )}
          </div>
        </div>
        <div className="space-y-5 bg-surface p-6">
          <Meter used={Math.min(w.addOns.length, slotsFor(w))} total={slotsFor(w)} label="Add-on slots" />
          <Meter used={activeEvents ?? 0} total={plan.events} label={activeEvents === null ? "Active events (unavailable)" : "Active events"} />
          <p className="text-xs text-ink-3">Seats: up to {plan.seats ?? "custom"} on {plan.name}.</p>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="addons">
        <div className="flex items-baseline justify-between">
          <h2 id="addons" className="text-lg font-semibold">Your add-on modules</h2>
          <Link to="/modules" className="flex items-center gap-1 text-sm font-medium">Browse modules <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </div>
        {w.addOns.length === 0 ? (
          <p className="mt-3 rounded-card border border-dashed border-line-strong p-6 text-sm text-ink-2">
            {w.plan === "free" ? "Free includes the core modules. Start a trial or upgrade to add more." : "No add-ons yet. Pick some from the catalog."}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-card border border-line bg-surface">
            {w.addOns.map((id, i) => {
              const locked = i >= slotsFor(w);
              return (
                <li key={id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span>
                    <span className="font-medium">{byId(id)?.name}</span>
                    {locked && <span className="ml-2 text-xs text-ink-3">Locked, data kept</span>}
                  </span>
                  <button type="button" onClick={() => removeModule(id)} className="text-sm text-ink-3 hover:text-ink">Remove</button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="change">
        <h2 id="change" className="text-lg font-semibold">Change plan</h2>
        <ul className="mt-3 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => {
            const current = p.id === w.plan;
            const verb = p.id === "enterprise" ? "Book a demo" : current ? (w.trialEndsAt ? "Keep after trial" : "Current plan") : RANK[p.id] > RANK[w.plan] ? "Upgrade" : "Downgrade";
            return (
              <li key={p.id} className={`flex flex-col p-5 ${current ? "bg-accent-soft/50" : "bg-surface"}`}>
                <p className="font-medium">{p.name}</p>
                <p className="mt-1 font-mono text-sm text-ink-2">{p.monthly === null ? "Custom" : `$${priceFor(p.id, w.cycle)}/mo`}</p>
                <p className="mt-2 flex-1 text-sm text-ink-2">{p.pitch}</p>
                <button
                  type="button"
                  disabled={current && !w.trialEndsAt}
                  onClick={() => pick(p.id)}
                  className={`${verb === "Upgrade" || verb === "Keep after trial" ? buttonCls.primary : buttonCls.secondary} mt-4 disabled:cursor-default disabled:opacity-60`}
                >
                  {verb}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-ink-3">Upgrades apply now, prorated. Downgrades apply at the end of the billing period.</p>
      </section>

      <section className="mt-10 border-t border-line pt-6" aria-labelledby="invoices">
        <h2 id="invoices" className="text-lg font-semibold">Invoices</h2>
        <p className="mt-2 text-sm text-ink-2">Invoices appear here after your first payment. Billing email and VAT details are set at checkout.</p>
      </section>

      {w.plan !== "free" && !w.pendingPlan && (
        <section className="mt-10 border-t border-line pt-6">
          <h2 className="text-lg font-semibold">Cancel subscription</h2>
          <p className="mt-1 text-sm text-ink-2">You'll move to Free at the end of the period. Nothing is deleted.</p>
          <button type="button" onClick={() => setCancelling(true)} className={`${buttonCls.secondary} mt-4`}>Cancel subscription</button>
        </section>
      )}

      {downTo && <DowngradeDialog to={downTo} onClose={() => setDownTo(null)} />}
      <CancelDialog open={cancelling} onClose={() => setCancelling(false)} />
    </div>
  );
}

function DowngradeDialog({ to, onClose }: { to: PlanId; onClose: () => void }) {
  const w = useWorkspace();
  const target = planById(to);
  const [keep, setKeep] = useState<string[]>(w.addOns.slice(0, target.slots));
  const toggle = (id: string) => setKeep((k) => (k.includes(id) ? k.filter((x) => x !== id) : k.length < target.slots ? [...k, id] : k));

  return (
    <Dialog open onClose={onClose} title={`Downgrade to ${target.name}`}>
      <ul className="space-y-1.5 text-sm text-ink-2">
        <li>Add-on slots go from {slotsFor(w)} to {target.slots}.</li>
        <li>Active events limit: {target.events ?? "unlimited"}. Seats: {target.seats}.</li>
        <li>Takes effect on {date(w.renewsAt)}. Until then nothing changes.</li>
      </ul>
      {target.slots > 0 && w.addOns.length > target.slots && (
        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-ink">Pick {target.slots} to keep. The rest become locked; their data is kept.</legend>
          <div className="mt-3 divide-y divide-line rounded-card border border-line">
            {w.addOns.map((id) => (
              <label key={id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <input type="checkbox" checked={keep.includes(id)} onChange={() => toggle(id)} className="accent-[var(--eh-accent)]" />
                {byId(id)?.name}
              </label>
            ))}
          </div>
          <p className="mt-2 font-mono text-xs text-ink-3">{keep.length}/{target.slots} selected</p>
        </fieldset>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onClose} className={buttonCls.secondary}>Keep {planById(w.plan).name}</button>
        <button type="button" onClick={() => (scheduleChange(to, keep), onClose())} className={buttonCls.secondary}>
          Downgrade on {date(w.renewsAt)}
        </button>
      </div>
    </Dialog>
  );
}

const REASONS = ["Too expensive", "Between events / seasonal", "Missing a feature", "Switching to another tool", "Something else"];

function CancelDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const w = useWorkspace();
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState("");
  const close = () => (setStep(1), setReason(""), onClose());

  return (
    <Dialog open={open} onClose={close} title={step === 1 ? "Why are you cancelling?" : "Before you go"}>
      {step === 1 ? (
        <fieldset>
          <legend className="text-sm text-ink-2">Optional. It helps us decide what to build.</legend>
          <div className="mt-3 space-y-1">
            {REASONS.map((r) => (
              <label key={r} className="flex items-center gap-3 rounded-control px-2 py-2 text-sm hover:bg-sunken">
                <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--eh-accent)]" />
                {r}
              </label>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={() => setStep(2)} className={buttonCls.secondary}>Continue</button>
          </div>
        </fieldset>
      ) : (
        <>
          <ul className="space-y-1.5 text-sm text-ink-2">
            <li>{planById(w.plan).name} stays active until {date(w.renewsAt)}.</li>
            <li>Then you're on Free: core modules, 2 active events, 5 seats.</li>
            <li>Your {w.addOns.length} add-on module{w.addOns.length === 1 ? "" : "s"} become locked. Data is kept and you can export it any time.</li>
          </ul>
          {reason === "Between events / seasonal" && (
            <p className="mt-5 rounded-card border border-line bg-sunken p-4 text-sm text-ink-2">
              Running events seasonally? Cancelling keeps your setup and data on Free, ready for next season. Re-upgrade in one click when the next event starts.
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={close} className={buttonCls.secondary}>Keep my plan</button>
            <button type="button" onClick={() => (scheduleChange("free", []), close())} className={buttonCls.secondary}>
              Cancel subscription
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
