import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { byId, planById, type PlanId } from "../../billing/catalog";
import { addModule, changePlan, daysLeft, freeSlots, priceFor, readWorkspace, useWorkspace, type Workspace } from "../../billing/plan";
import { getStoredUser } from "../../services/authApi";
import { buttonCls } from "../../marketing/lib";

// ponytail: test-mode form. In production these card fields are replaced by Stripe Elements and the
// charge/proration is computed server-side; we never handle raw card numbers ourselves.

const field = "h-10 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-3 aria-[invalid=true]:border-danger";

export default function CheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const w = useWorkspace();
  const planId = (params.get("plan") as PlanId) || "starter";
  const add = params.get("add");
  const plan = planById(planId);
  const [cycle, setCycle] = useState<Workspace["cycle"]>((params.get("cycle") as Workspace["cycle"]) || "annual");
  const [form, setForm] = useState({ card: "", exp: "", cvc: "", name: getStoredUser()?.name ?? "", email: getStoredUser()?.email ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const per = priceFor(planId, cycle) ?? 0;
  const charge = cycle === "annual" ? per * 12 : per;
  // Unused time on a current paid plan is credited against today's charge.
  const curPer = w.trialEndsAt ? 0 : (priceFor(w.plan, w.cycle) ?? 0);
  const periodDays = w.cycle === "annual" ? 365 : 30;
  const credit = Math.round(((w.cycle === "annual" ? curPer * 12 : curPer) * Math.min(daysLeft(w.renewsAt), periodDays)) / periodDays);
  const total = Math.max(0, charge - credit);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (form.card.replace(/\s/g, "").length < 15) err.card = "Enter the full card number.";
    if (!/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/.test(form.exp)) err.exp = "Use MM / YY.";
    if (!/^\d{3,4}$/.test(form.cvc)) err.cvc = "3 or 4 digits.";
    if (!form.name.trim()) err.name = "Name on card is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = "Enter a valid billing email.";
    setErrors(err);
    if (Object.keys(err).length) {
      document.getElementById(`co-${Object.keys(err)[0]}`)?.focus();
      return;
    }
    changePlan(planId, cycle);
    if (add && freeSlots(readWorkspace()) > 0) addModule(add);
    setDone(true);
  };

  if (done) {
    const addMod = add ? byId(add) : null;
    return (
      <div className="mx-auto max-w-lg py-16 text-center text-ink">
        <CheckCircle2 className="mx-auto size-10 text-accent" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">You're on {plan.name}</h1>
        <p className="mt-2 text-ink-2">
          {addMod ? `${addMod.name} is switched on.` : `You have ${freeSlots(readWorkspace())} add-on slots to fill.`} A receipt is on its way to {form.email}.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          {addMod?.route ? (
            <button type="button" onClick={() => navigate(addMod.route!)} className={buttonCls.primary}>Open {addMod.name}</button>
          ) : (
            <Link to="/modules" className={buttonCls.primary}>Pick your modules</Link>
          )}
          <Link to="/billing" className={buttonCls.secondary}>Plan & billing</Link>
        </div>
      </div>
    );
  }

  const input = (k: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="grid gap-1.5">
      <label htmlFor={`co-${k}`} className="text-sm font-medium text-ink">{label}</label>
      <input id={`co-${k}`} value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `co-${k}-err` : undefined} className={field} {...props} />
      {errors[k] && (
        <p id={`co-${k}-err`} className="flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="size-3.5" aria-hidden="true" /> {errors[k]}
        </p>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl text-ink">
      <Link to="/billing" className="text-sm text-ink-2 hover:text-ink">← Plan & billing</Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">Upgrade to {plan.name}</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <form onSubmit={submit} noValidate className="space-y-5">
          <p className="rounded-card border border-dashed border-line-strong p-3 text-sm text-ink-2">
            Test mode: no card is charged. Any 16 digits work, for example 4242 4242 4242 4242.
          </p>
          <fieldset>
            <legend className="text-sm font-medium">Billing cycle</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["annual", "monthly"] as const).map((c) => (
                <label key={c} className="flex cursor-pointer items-center gap-2 rounded-control border border-line-strong p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                  <input type="radio" name="cycle" checked={cycle === c} onChange={() => setCycle(c)} className="accent-[var(--eh-accent)]" />
                  {c === "annual" ? `Annual · $${plan.annual}/mo` : `Monthly · $${plan.monthly}/mo`}
                </label>
              ))}
            </div>
          </fieldset>
          {input("card", "Card number", { inputMode: "numeric", autoComplete: "cc-number", placeholder: "1234 1234 1234 1234" })}
          <div className="grid grid-cols-2 gap-4">
            {input("exp", "Expiry", { autoComplete: "cc-exp", placeholder: "MM / YY" })}
            {input("cvc", "CVC", { inputMode: "numeric", autoComplete: "cc-csc", placeholder: "123" })}
          </div>
          {input("name", "Name on card", { autoComplete: "cc-name" })}
          {input("email", "Billing email", { type: "email", autoComplete: "email" })}
          <details className="text-sm">
            <summary className="cursor-pointer text-ink-2">Add company name or VAT ID</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input aria-label="Company name" placeholder="Company name" className={field} />
              <input aria-label="VAT ID" placeholder="VAT ID" className={field} />
            </div>
          </details>
          <button type="submit" className={`${buttonCls.primary} h-11 w-full`}>
            <Lock className="size-4" aria-hidden="true" /> Confirm and pay ${total}
          </button>
          <p className="text-center text-xs text-ink-3">Cancel any time from Plan & billing.</p>
        </form>

        <aside aria-label="Order summary" className="h-fit rounded-card border border-line bg-surface p-5 lg:sticky lg:top-6">
          <h2 className="font-medium">Summary</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <Row k={`${plan.name}, ${cycle}`} v={`$${charge}`} />
            {credit > 0 && <Row k={`Unused ${planById(w.plan).name} time`} v={`-$${credit}`} />}
            {add && byId(add) && <Row k={`Add-on: ${byId(add)!.name}`} v="Included" />}
            <Row k="Add-on slots" v={String(plan.slots)} />
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="font-medium">Due today</span>
            <span className="text-2xl font-semibold tabular-nums">${total}</span>
          </div>
          <p className="mt-2 text-xs text-ink-3">
            Renews {cycle === "annual" ? "yearly" : "monthly"} at ${charge}. Prices are placeholders, excl. tax.
          </p>
        </aside>
      </div>
    </div>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-ink-2">{k}</dt>
    <dd className="font-mono tabular-nums">{v}</dd>
  </div>
);
