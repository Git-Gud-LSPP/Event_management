import { useState } from "react";
import { Link } from "react-router-dom";
import { getStoredUser, isLoggedIn } from "../services/authApi";
import { Dot } from "./ui";
import { eyebrow } from "./lib";

const NEEDS = ["SSO / SAML", "Security or procurement review", "Migration from another tool", "Custom integrations"];
const SIZES = ["1–10", "11–50", "51–200", "201–1,000", "1,000+"];
const VOLUMES = ["Fewer than 10", "10–50", "51–200", "200+"];
const TIMES = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
const TZS = ["Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "Asia/Singapore", "Australia/Sydney"];
const AGENDA = [
  ["A walkthrough of your event", "We set up one of your real events live, from run-of-show to show-day incidents."],
  ["A module plan that fits", "Which add-ons you need now, which can wait, and the plan that covers them."],
  ["Security, SSO and migration", "Bring IT along. We'll cover SAML, procurement reviews and moving off your current tool."],
];

// 15 weekdays (3 weeks) from this week's Monday, or next Monday from Fri–Sun. Today and earlier render disabled.
const weekdays = () => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  const wd = d.getDay();
  d.setDate(d.getDate() + (wd === 0 ? 1 : wd >= 5 ? 8 - wd : 1 - wd));
  const out: Date[] = [];
  for (; out.length < 15; d.setDate(d.getDate() + 1)) if (d.getDay() % 6) out.push(new Date(d));
  return out;
};
const isPast = (d: Date) => d.toDateString() === new Date().toDateString() || d < new Date();
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-US", o);
const dayLabel = (d: Date) => fmt(d, { weekday: "short", month: "short", day: "numeric" });
const endOf = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const e = h * 60 + m + 30;
  return `${String(Math.floor(e / 60)).padStart(2, "0")}:${String(e % 60).padStart(2, "0")}`;
};
const tzLabel = (z: string) => z.replace(/_/g, " ");
const chip = (on: boolean) =>
  `cursor-pointer rounded-full border px-3.5 py-2 text-[13px] hover:border-ink ${on ? "border-ink bg-ink text-paper" : "border-[#CBD6CC] bg-surface text-ink-2"}`;
const input = "rounded-xl border bg-[#F7FAF6] px-3.5 text-[15px] text-ink outline-none placeholder:text-[#8A968E] focus:border-ink focus:bg-surface";
const Legend = ({ n, children, optional }: { n: string; children: string; optional?: boolean }) => (
  <legend className="mb-[18px] flex items-baseline gap-3 p-0">
    <span className="font-mono text-[11px] text-[#6E7C73]">{n}</span>
    <span className="text-lg font-medium tracking-[-0.02em]">{children}</span>
    {optional && <span className="text-[12.5px] text-[#8A968E]">optional</span>}
  </legend>
);
const Err = ({ id, msg }: { id: string; msg?: string }) => (msg ? <p id={id} className="text-[12.5px] text-[#9A3B2A]">{msg}</p> : null);

// ponytail: submission and availability are client-only. POST to the CRM / calendar (HubSpot meetings, Calendly)
// and read real free/busy before launch, otherwise bookings go nowhere.
export function BookingForm() {
  const user = getStoredUser();
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [days] = useState(weekdays);
  const [week, setWeek] = useState(0);
  const [tz, setTz] = useState(localTz);
  const [day, setDay] = useState<Date | null>(null);
  const [slot, setSlot] = useState("");
  const [flex, setFlex] = useState(false);
  const [form, setForm] = useState({ email: user?.email ?? "", name: user?.name ?? "", company: "", size: "", volume: "", note: "", flexTimes: "" });
  const [needs, setNeeds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form, v: string) => (setForm((f) => ({ ...f, [k]: v })), setErrors((e) => ({ ...e, [k]: "" })));
  const clearWhen = () => setErrors((e) => ({ ...e, when: "" }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if ((!day || !slot) && !(flex && form.flexTimes.trim())) err.when = "Pick a time, or suggest a few that work for you.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = "Enter your work email.";
    if (!form.name.trim()) err.name = "Required.";
    if (!form.company.trim()) err.company = "Required.";
    if (!form.size) err.size = "Pick a team size.";
    setErrors(err);
    const first = Object.keys(err)[0];
    if (first) document.getElementById(`cs-${first}`)?.focus();
    else setSent(true);
  };

  const shown = days.slice(week * 5, week * 5 + 5);
  const picked = day && slot;
  const fields = [
    ["email", "Work email", "email", "you@company.com", "email"],
    ["name", "Full name", "text", "First and last", "name"],
    ["company", "Company", "text", "Company name", "organization"],
  ] as const;

  return (
    <div className="grid items-start gap-x-[clamp(32px,5vw,72px)] gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr))]">
      <aside className="flex flex-col gap-7 lg:sticky lg:top-24">
        <div>
          <div className={`${eyebrow} flex items-center gap-2`}><Dot />LIVE DEMO · 30 MIN</div>
          <h2 className="mt-4 mb-3.5 text-[clamp(34px,4vw,52px)] leading-none font-medium tracking-[-0.045em] text-balance">Now see it on your own events.</h2>
          <p className="max-w-[460px] text-[17px] leading-normal text-pretty text-[#56645B]">
            Pick a time and tell us about your events. We'll tailor the walkthrough and come with a module plan that fits.
          </p>
        </div>
        <ol>
          {AGENDA.map(([t, d], i) => (
            <li key={t} className="grid grid-cols-[40px_1fr] gap-3 border-t border-line py-3.5">
              <span className="pt-0.5 font-mono text-xs text-[#6E7C73]">0{i + 1}</span>
              <div>
                <p className="text-[15px] font-medium">{t}</p>
                <p className="mt-[3px] text-[13.5px] leading-[1.45] text-[#56645B]">{d}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-3.5 rounded-[18px] bg-ink p-5 text-paper" aria-live="polite">
          <span className="font-mono text-[11px] tracking-[.05em] text-ai">YOUR BOOKING</span>
          <dl className="grid grid-cols-3 gap-3">
            <div><dt className="text-[11.5px] text-[#95A39A]">Day</dt><dd className={`mt-1 text-[15px] ${day ? "" : "text-[#6E7C73]"}`}>{day ? dayLabel(day) : "Pick a day"}</dd></div>
            <div><dt className="text-[11.5px] text-[#95A39A]">Time</dt><dd className={`mt-1 font-mono text-[15px] ${slot ? "" : "text-[#6E7C73]"}`}>{slot ? `${slot}–${endOf(slot)}` : "--:--"}</dd></div>
            <div><dt className="text-[11.5px] text-[#95A39A]">Length</dt><dd className="mt-1 text-[15px]">30 min</dd></div>
          </dl>
          <p className="border-t border-ink-hover pt-3 text-[12.5px] text-[#95A39A]">Invite goes to {form.email || "your work email"} · {tzLabel(tz)}</p>
        </div>
      </aside>

      <div className="rounded-[24px] bg-surface p-[clamp(22px,3.5vw,40px)]">
        {sent ? (
          <div role="status" className="flex flex-col gap-3.5 py-4">
            <span className="grid size-11 place-items-center rounded-full bg-accent-soft text-xl text-[#2A6E4B]" aria-hidden="true">✓</span>
            <h2 className="mt-2 text-[34px] font-medium tracking-[-0.04em]">You're booked, {form.name.split(" ")[0] || "there"}.</h2>
            <p className="text-base leading-normal text-[#56645B]">
              {picked
                ? `${dayLabel(day)} at ${slot}, ${tzLabel(tz)}. We'll send a calendar invite to ${form.email} within one business day.`
                : `We'll reply to ${form.email} within one business day with a time from your suggestions.`}
            </p>
            <p className="mt-2 text-[15px] leading-normal text-[#56645B]">Meanwhile, start free. We'll upgrade your workspace in place, so nothing you set up is lost.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={isLoggedIn() ? "/events" : "/signup"} className="rounded-full bg-ink px-5 py-3 text-sm text-paper hover:bg-ink-hover hover:text-paper">
                {isLoggedIn() ? "Back to your workspace" : "Start free"}
              </Link>
              <button type="button" onClick={() => setSent(false)} className="cursor-pointer rounded-full border border-[#CBD6CC] px-5 py-[11px] text-sm hover:border-ink">Change booking</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-9">
            <fieldset className="flex flex-col gap-3.5">
              <Legend n="01">Pick a time</Legend>
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <label htmlFor="cs-tz" className="text-[13.5px] text-[#56645B]">30-minute video call. Times shown in</label>
                <select id="cs-tz" value={tz} onChange={(e) => setTz(e.target.value)} className="h-[34px] max-w-full rounded-full border border-[#CBD6CC] bg-surface px-2.5 text-[13px] text-ink outline-none">
                  {(TZS.includes(localTz) ? TZS : [localTz, ...TZS]).map((z) => <option key={z} value={z}>{tzLabel(z)}</option>)}
                </select>
              </div>

              <div id="cs-when" tabIndex={-1} className="overflow-hidden rounded-card border border-line" aria-describedby={errors.when ? "cs-when-err" : undefined}>
                <div className="flex items-center justify-between gap-2 border-b border-line-soft px-3.5 py-3">
                  <button type="button" disabled={week === 0} onClick={() => setWeek(week - 1)} aria-label="Previous week" className="grid size-[30px] cursor-pointer place-items-center rounded-full bg-paper text-sm hover:bg-sunken disabled:cursor-default disabled:opacity-35">←</button>
                  <span className="text-sm font-medium">{fmt(shown[0], { month: "short", day: "numeric" })} – {fmt(shown[4], { month: "short", day: "numeric" })}</span>
                  <button type="button" disabled={week === 2} onClick={() => setWeek(week + 1)} aria-label="Next week" className="grid size-[30px] cursor-pointer place-items-center rounded-full bg-paper text-sm hover:bg-sunken disabled:cursor-default disabled:opacity-35">→</button>
                </div>
                <div className="grid grid-cols-5" role="group" aria-label="Day">
                  {shown.map((d) => {
                    const past = isPast(d);
                    const on = day?.toDateString() === d.toDateString();
                    return (
                      <button
                        key={d.toDateString()}
                        type="button"
                        disabled={past}
                        aria-pressed={on}
                        aria-label={fmt(d, { weekday: "long", month: "long", day: "numeric" })}
                        onClick={() => (setDay(d), setSlot(""), clearWhen())}
                        className={`flex cursor-pointer flex-col items-center gap-[3px] px-1 pt-3 pb-3.5 disabled:cursor-default ${on ? "bg-ink text-paper shadow-[inset_0_-2px_0_var(--eh-live)]" : past ? "bg-surface text-[#B5BFB8]" : "bg-surface hover:bg-[#F4F7F3]"}`}
                      >
                        <span className="font-mono text-[10.5px] tracking-[.05em] opacity-70">{fmt(d, { weekday: "short" }).toUpperCase()}</span>
                        <span className="text-[22px] leading-[1.1] font-medium tracking-[-0.03em]">{d.getDate()}</span>
                        <span className={`text-[11px] ${on ? "text-[#B7E0C5]" : past ? "" : "text-[#2A6E4B]"}`}>{past ? "—" : `${TIMES.length} open`}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-line-soft bg-[#FAFCF9] px-3.5 py-4">
                  {!day ? (
                    <p className="py-3.5 text-center text-[13.5px] text-[#6E7C73]">Choose a day above to see open times.</p>
                  ) : (
                    <div className="flex flex-col gap-3.5">
                      {[["MORNING", TIMES.filter((t) => t < "12")], ["AFTERNOON", TIMES.filter((t) => t > "12")]].map(([label, ts]) => (
                        <div key={label as string} className="flex flex-col gap-2" role="group" aria-label={label as string}>
                          <span className="font-mono text-[10.5px] tracking-[.05em] text-[#6E7C73]">{label}</span>
                          <div className="grid grid-cols-[repeat(auto-fill,minmax(78px,1fr))] gap-1.5">
                            {(ts as string[]).map((t) => (
                              <button
                                key={t}
                                type="button"
                                aria-pressed={slot === t}
                                onClick={() => (setSlot(t), clearWhen())}
                                className={`cursor-pointer rounded-[10px] border px-1 py-[9px] text-center font-mono text-[12.5px] hover:border-ink ${slot === t ? "border-ink bg-ink text-paper" : "border-[#CBD6CC] bg-surface"}`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {picked && (
                <div className="flex items-center gap-2.5 rounded-xl bg-accent-soft px-3.5 py-3 text-sm text-[#1F5A3C]">
                  <span className="size-1.5 shrink-0 rounded-full bg-live" aria-hidden="true" />
                  <span className="flex-1">{fmt(day, { weekday: "long", month: "long", day: "numeric" })} · {slot}–{endOf(slot)}</span>
                  <button type="button" onClick={() => setSlot("")} className="cursor-pointer text-[12.5px] text-[#2A6E4B] hover:text-ink">Change</button>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button type="button" aria-expanded={flex} onClick={() => (setFlex(!flex), clearWhen())} className="cursor-pointer self-start text-[13px] text-ink-2 hover:text-ink">
                  {flex ? "− Hide suggested times" : "None of these work? Suggest your own times →"}
                </button>
                {flex && (
                  <textarea
                    rows={2}
                    aria-label="Times that work for you"
                    value={form.flexTimes}
                    onChange={(e) => (set("flexTimes", e.target.value), clearWhen())}
                    placeholder="e.g. Any Thursday afternoon, or after 18:00 CET"
                    className={`${input} resize-y border-[#CBD6CC] py-3 text-sm leading-[1.45]`}
                  />
                )}
              </div>
              <Err id="cs-when-err" msg={errors.when} />
            </fieldset>

            <fieldset>
              <Legend n="02">About you</Legend>
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
                {fields.map(([k, label, type, ph, ac]) => (
                  <label key={k} className="flex flex-col gap-[7px]">
                    <span className="text-[13px] font-medium text-ink-2">{label}</span>
                    <input
                      id={`cs-${k}`}
                      type={type}
                      value={form[k]}
                      onChange={(e) => set(k, e.target.value)}
                      placeholder={ph}
                      autoComplete={ac}
                      aria-invalid={!!errors[k]}
                      aria-describedby={errors[k] ? `cs-${k}-err` : undefined}
                      className={`${input} h-[46px] ${errors[k] ? "border-[#9A3B2A]" : "border-[#CBD6CC]"}`}
                    />
                    <Err id={`cs-${k}-err`} msg={errors[k]} />
                  </label>
                ))}
              </div>
              <div className="mt-[22px] flex flex-col gap-2" role="group" aria-labelledby="cs-size-l">
                <span id="cs-size-l" className="text-[13px] font-medium text-ink-2">Team size</span>
                <div className="flex flex-wrap gap-1.5">
                  {SIZES.map((t, i) => (
                    <button key={t} id={i === 0 ? "cs-size" : undefined} type="button" aria-pressed={form.size === t} onClick={() => set("size", t)} className={chip(form.size === t)}>{t}</button>
                  ))}
                </div>
                <Err id="cs-size-err" msg={errors.size} />
              </div>
              <div className="mt-5 flex flex-col gap-2" role="group" aria-labelledby="cs-vol-l">
                <span id="cs-vol-l" className="text-[13px] font-medium text-ink-2">Events per year <span className="font-normal text-[#8A968E]">· optional</span></span>
                <div className="flex flex-wrap gap-1.5">
                  {VOLUMES.map((t) => (
                    <button key={t} type="button" aria-pressed={form.volume === t} onClick={() => set("volume", form.volume === t ? "" : t)} className={chip(form.volume === t)}>{t}</button>
                  ))}
                </div>
              </div>
            </fieldset>

            <fieldset>
              <Legend n="03" optional>What should we cover?</Legend>
              <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
                {NEEDS.map((n) => (
                  <label key={n} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3.5 py-[13px] text-sm hover:border-ink has-[:checked]:border-[#9CCBAE] has-[:checked]:bg-[#F4F9F3]">
                    <input type="checkbox" checked={needs.includes(n)} onChange={() => setNeeds((x) => (x.includes(n) ? x.filter((y) => y !== n) : [...x, n]))} className="size-[18px] accent-[var(--eh-live)]" />
                    {n}
                  </label>
                ))}
              </div>
              <label className="mt-[18px] flex flex-col gap-[7px]">
                <span className="text-[13px] font-medium text-ink-2">Anything else? <span className="font-normal text-[#8A968E]">· optional</span></span>
                <textarea rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Current tools, upcoming events, who else is joining…" className={`${input} resize-y border-[#CBD6CC] py-3 leading-[1.45]`} />
              </label>
            </fieldset>

            <div className="flex flex-col gap-3 border-t border-line-soft pt-6">
              <button type="submit" className="cursor-pointer rounded-full bg-ink px-[22px] py-[15px] text-center text-[15px] text-paper hover:bg-ink-hover">
                {picked ? `Book ${dayLabel(day)} at ${slot}` : "Book a demo"}
              </button>
              <p className="text-center text-[12.5px] text-[#6E7C73]">No prep needed. We'll send a calendar invite within one business day.</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
