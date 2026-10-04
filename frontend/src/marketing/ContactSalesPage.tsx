import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Check, CheckCircle2 } from "lucide-react";
import { getStoredUser, isLoggedIn } from "../services/authApi";
import { FlowShell } from "../features/billing/SignupPage";
import { buttonCls } from "./lib";

const field = "h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-[15px] text-ink placeholder:text-ink-3 aria-[invalid=true]:border-danger";
const NEEDS = ["SSO / SAML", "Security or procurement review", "Migration from another tool", "Custom integrations"];

// ponytail: submission is client-only. POST it to the CRM (HubSpot/Salesforce form API) before launch,
// otherwise leads go nowhere.
export default function ContactSalesPage() {
  const user = getStoredUser();
  const [form, setForm] = useState({ email: user?.email ?? "", name: user?.name ?? "", company: "", size: "", volume: "", note: "" });
  const [needs, setNeeds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  useEffect(() => {
    document.title = "Book a demo · EventHQ";
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = "Enter your work email.";
    if (!form.name.trim()) err.name = "Required.";
    if (!form.company.trim()) err.company = "Required.";
    if (!form.size) err.size = "Pick a team size.";
    setErrors(err);
    if (Object.keys(err).length) document.getElementById(`cs-${Object.keys(err)[0]}`)?.focus();
    else setSent(true);
  };

  const label = (k: string, text: string, optional?: boolean) => (
    <label htmlFor={`cs-${k}`} className="text-sm font-medium">
      {text} {optional && <span className="font-normal text-ink-3">(optional)</span>}
    </label>
  );
  const error = (k: string) =>
    errors[k] && (
      <p id={`cs-${k}-err`} className="flex items-center gap-1 text-sm text-danger">
        <AlertCircle className="size-4" aria-hidden="true" /> {errors[k]}
      </p>
    );
  const a11y = (k: string) => ({ id: `cs-${k}`, "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `cs-${k}-err` : undefined });

  if (sent)
    return (
      <FlowShell>
        <div role="status" className="max-w-md text-center">
          <CheckCircle2 className="mx-auto size-10 text-accent" strokeWidth={1.5} aria-hidden="true" />
          <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.03em]">Thanks, {form.name.split(" ")[0]}.</h1>
          <p className="mt-2 text-ink-2">We'll reply to {form.email} within one business day to set up a 30-minute call.</p>
          <p className="mt-6 text-ink-2">Meanwhile, start free. We'll upgrade your workspace in place, so nothing you set up is lost.</p>
          <Link to={isLoggedIn() ? "/events" : "/signup"} className={`${buttonCls.primary} mt-6`}>
            {isLoggedIn() ? "Back to your workspace" : "Start free"}
          </Link>
        </div>
      </FlowShell>
    );

  return (
    <FlowShell>
      <div className="grid w-full max-w-5xl gap-12 lg:grid-cols-[1fr_20rem]">
        <form onSubmit={submit} noValidate className="grid gap-5">
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.03em]">Book a demo</h1>
            <p className="mt-2 text-ink-2">Tell us about your events. We'll tailor the demo and a module plan to them.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">{label("email", "Work email")}<input type="email" autoComplete="email" value={form.email} onChange={set("email")} className={field} {...a11y("email")} />{error("email")}</div>
            <div className="grid gap-2">{label("name", "Full name")}<input autoComplete="name" value={form.name} onChange={set("name")} className={field} {...a11y("name")} />{error("name")}</div>
            <div className="grid gap-2">{label("company", "Company")}<input autoComplete="organization" value={form.company} onChange={set("company")} className={field} {...a11y("company")} />{error("company")}</div>
            <div className="grid gap-2">
              {label("size", "Team size")}
              <select value={form.size} onChange={set("size")} className={field} {...a11y("size")}>
                <option value="">Select</option>
                {["1-10", "11-50", "51-200", "201-1,000", "1,000+"].map((o) => <option key={o}>{o}</option>)}
              </select>
              {error("size")}
            </div>
            <div className="grid gap-2 sm:col-span-2">
              {label("volume", "Events per year", true)}
              <select value={form.volume} onChange={set("volume")} className={field} {...a11y("volume")}>
                <option value="">Select</option>
                {["Fewer than 10", "10-50", "51-200", "200+"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <fieldset>
            <legend className="text-sm font-medium">What do you need? <span className="font-normal text-ink-3">(optional)</span></legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {NEEDS.map((n) => (
                <label key={n} className="flex items-center gap-3 rounded-control border border-line-strong px-3 py-2.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                  <input type="checkbox" checked={needs.includes(n)} onChange={() => setNeeds((x) => (x.includes(n) ? x.filter((y) => y !== n) : [...x, n]))} className="accent-[var(--eh-accent)]" />
                  {n}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-2">
            {label("note", "Anything else?", true)}
            <textarea id="cs-note" rows={3} value={form.note} onChange={set("note")} className={`${field} h-auto py-2`} />
          </div>
          <button type="submit" className={`${buttonCls.primary} h-11 justify-self-start px-6`}>Book a demo</button>
        </form>

        <aside className="h-fit border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <h2 className="font-medium">What happens next</h2>
          <ol className="mt-3 space-y-3 text-sm text-ink-2">
            <li>1. We reply within one business day.</li>
            <li>2. A 30-minute call on your events and tools.</li>
            <li>3. A tailored module plan and quote.</li>
          </ol>
          <h2 className="mt-8 font-medium">Enterprise includes</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            {["All 104 modules", "SSO/SAML and SCIM", "99.95% uptime SLA", "Dedicated success manager", "Audit log and data residency", "Security review support"].map((x) => (
              <li key={x} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-ink" aria-hidden="true" />{x}</li>
            ))}
          </ul>
        </aside>
      </div>
    </FlowShell>
  );
}
