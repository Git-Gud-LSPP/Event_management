import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Minus } from "lucide-react";
import { CORE, PLANS, recommendPlan, ADD_ONS, type PlanId } from "../billing/catalog";
import { Placeholder } from "./ui";
import { buttonCls } from "./lib";

const BULLETS: Record<PlanId, string[]> = {
  free: ["Events, tasks, schedule, staff, documents", "AI assistant, 50 actions/mo", "2 active events", "5 team seats"],
  starter: ["Everything in Free", "5 add-on modules of your choice", "10 active events", "25 team seats", "14-day trial, no card"],
  growth: ["Everything in Free", "20 add-on modules of your choice", "Unlimited events", "100 team seats", "Priority support"],
  enterprise: ["All 104 modules", "SSO/SAML and SCIM", "99.95% uptime SLA", "Dedicated success manager", "Audit log and data residency"],
};

type Cell = boolean | string;
const COMPARE: [group: string, rows: [label: string, cells: Cell[]][]][] = [
  ["Modules", [
    [`Core modules (${CORE.length})`, [true, true, true, true]],
    ["Add-on modules you pick", ["None", "5", "20", "All"]],
    ["Swap modules any time", [false, true, true, true]],
    ["Enterprise-only modules (SSO, SCIM, audit log)", [false, false, false, true]],
  ]],
  ["Usage", [
    ["Active events", ["2", "10", "Unlimited", "Unlimited"]],
    ["Team seats", ["5", "25", "100", "Custom"]],
    ["Assistant actions / month", ["50", "1,000", "5,000", "Custom"]],
    ["CSV import and export", [true, true, true, true]],
  ]],
  ["Support", [
    ["Help center and email", [true, true, true, true]],
    ["Priority support", [false, false, true, true]],
    ["Migration help", [false, false, true, true]],
    ["Dedicated success manager", [false, false, false, true]],
  ]],
  ["Security", [
    ["Organizer / staff roles", [true, true, true, true]],
    ["Custom roles", [false, false, true, true]],
    ["SSO/SAML, SCIM", [false, false, false, true]],
    ["Uptime SLA", [false, false, false, "99.95%"]],
  ]],
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const [need, setNeed] = useState(4);
  const rec = recommendPlan(ADD_ONS.slice(0, need).filter((m) => !m.enterpriseOnly).map((m) => m.id));
  const recName = PLANS.find((p) => p.id === rec)!.name;

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <label className="block w-full max-w-md">
          <span className="text-sm text-ink-2">How many add-on modules do you need?</span>
          <span className="mt-1 flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={30}
              value={need}
              onChange={(e) => setNeed(+e.target.value)}
              aria-valuetext={`${need} add-on modules, ${recName} recommended`}
              className="h-6 w-full accent-[var(--eh-accent)]"
            />
            <span className="w-24 shrink-0 font-mono text-sm text-ink">{need === 30 ? "30+" : need} add-ons</span>
          </span>
        </label>
        <div role="group" aria-label="Billing cycle" className="inline-flex shrink-0 self-start rounded-control border border-line-strong p-0.5 md:self-auto">
          {[false, true].map((a) => (
            <button
              key={String(a)}
              type="button"
              aria-pressed={annual === a}
              onClick={() => setAnnual(a)}
              className={`eh-press h-8 rounded-[4px] px-3 text-[13px] ${annual === a ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
            >
              {a ? "Annual (save 20%)" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid overflow-hidden rounded-card border border-line md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((p, i) => {
          const isRec = p.id === rec;
          const price = annual ? p.annual : p.monthly;
          return (
            <div
              key={p.id}
              className={`relative flex flex-col border-line p-6 transition-colors duration-300 ${i > 0 ? "border-t md:border-t-0" : ""} ${
                i % 2 === 1 ? "md:border-l" : ""
              } ${i >= 2 ? "md:border-t xl:border-t-0" : ""} ${i === 2 ? "xl:border-l" : ""} ${isRec ? "bg-accent-soft/60" : "bg-surface"}`}
            >
              {isRec && <span className="absolute inset-x-0 top-0 h-0.5 bg-accent" aria-hidden="true" />}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ink">{p.name}</h3>
                {isRec ? (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-ink">Fits your stack</span>
                ) : p.id === "growth" ? (
                  <span className="rounded-full border border-line-strong px-2 py-0.5 text-xs text-ink-2">Most popular</span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-ink-2">{p.pitch}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span key={`${p.id}${annual}`} className="eh-swap text-[40px] font-semibold leading-none tracking-[-0.03em] text-ink tabular-nums">
                  {price === null ? "Custom" : `$${price}`}
                </span>
                {price !== null && <span className="text-sm text-ink-3">/mo</span>}
              </p>
              <p className="mt-2 h-5 text-xs text-ink-3">
                {price === null ? "Annual contract" : price === 0 ? "Free forever" : annual ? `Billed $${price * 12} yearly` : "Billed monthly"}
              </p>
              <Link
                to={p.id === "enterprise" ? "/contact-sales" : `/signup?plan=${p.id}`}
                className={`${isRec ? buttonCls.primary : buttonCls.secondary} mt-6 w-full`}
              >
                {p.id === "enterprise" ? "Book a demo" : "Start free"}
              </Link>
              <ul className="mt-6 space-y-2.5 text-sm text-ink-2">
                {BULLETS[p.id].map((b) => (
                  <li key={b} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-ink" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-ink-3">
        <Placeholder /> All prices, limits and the SLA figure are placeholders. USD, excl. tax.
      </p>

      <details className="group mt-10 rounded-card border border-line">
        <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-[15px] font-medium text-ink">
          Compare every feature
          <span className="font-mono text-ink-3 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
        </summary>
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Plan comparison</caption>
            <thead>
              <tr className="bg-sunken">
                <th scope="col" className="p-4 font-medium text-ink-2">Feature</th>
                {PLANS.map((p) => (
                  <th key={p.id} scope="col" className="p-4 font-medium text-ink">{p.name}</th>
                ))}
              </tr>
            </thead>
            {COMPARE.map(([group, rows]) => (
              <tbody key={group}>
                <tr>
                  <th colSpan={5} scope="colgroup" className="border-t border-line px-4 pb-2 pt-6 text-xs font-medium text-ink-3">{group}</th>
                </tr>
                {rows.map(([label, cells]) => (
                  <tr key={label}>
                    <th scope="row" className="px-4 py-2.5 font-normal text-ink-2">{label}</th>
                    {cells.map((c, i) => (
                      <td key={i} className="px-4 py-2.5 text-ink">
                        {c === true ? <Check className="size-4" aria-label="Included" /> : c === false ? <Minus className="size-4 text-ink-3" aria-label="Not included" /> : c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </details>
    </div>
  );
}
