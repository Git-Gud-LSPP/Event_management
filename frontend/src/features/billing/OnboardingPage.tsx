import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { CORE, EVENT_TYPES, byId, planById, recommendAddOns, recommendPlan, type EventType } from "../../billing/catalog";
import { loadStack, readWorkspace, saveStack, saveWorkspace, startTrial } from "../../billing/plan";
import { buttonCls } from "../../marketing/lib";
import { FlowShell } from "./SignupPage";

const ROLES = ["Agency", "In-house events team", "Venue", "Festival or production company", "Freelance planner"];
const SIZES = ["Just me", "2-10", "11-50", "51+"];

const tile =
  "eh-press flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-card border border-line-strong bg-surface px-4 py-3 text-left text-[15px] has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("");
  const [types, setTypes] = useState<EventType[]>([]);
  const [size, setSize] = useState("");
  const [picks, setPicks] = useState<string[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);

  // Move focus to each new question so screen readers announce it.
  useEffect(() => heading.current?.focus(), [step]);

  const stack = loadStack();
  // Only shipped modules can fill trial slots; roadmap picks from the site become "notify me" requests.
  const suggested = [...new Set([...stack, ...recommendAddOns(types).map((m) => m.id)])].filter((id) => byId(id)?.live && !byId(id)!.core);
  const waitlist = stack.filter((id) => byId(id) && !byId(id)!.live);
  const go = (n: number) => {
    if (n === 3) setPicks(suggested.slice(0, 5));
    setStep(n);
  };

  const rec = planById(recommendPlan(picks));

  const finish = (trial: boolean) => {
    const base = { onboarded: true, eventTypes: types, notify: waitlist };
    if (trial && picks.length) startTrial(picks, { ...base, plan: rec.id === "growth" ? "growth" : "starter" });
    else saveWorkspace({ ...readWorkspace(), ...base, plan: "free", cycle: "monthly", addOns: picks, trialEndsAt: undefined });
    saveStack([]);
    navigate("/events", { replace: true });
  };

  const questions = [
    { title: "What best describes you?", body: ROLES.map((r) => (
      <label key={r} className={tile}>
        {r}
        <input type="radio" name="role" className="sr-only" checked={role === r} onChange={() => setRole(r)} />
      </label>
    )) },
    { title: "What do you run?", hint: "Pick all that apply.", body: EVENT_TYPES.map((t) => (
      <label key={t.id} className={tile}>
        {t.plural}
        <input
          type="checkbox"
          className="size-4 accent-[var(--eh-accent)]"
          checked={types.includes(t.id)}
          onChange={() => setTypes((x) => (x.includes(t.id) ? x.filter((y) => y !== t.id) : [...x, t.id]))}
        />
      </label>
    )) },
    { title: "How big is your team?", body: SIZES.map((s) => (
      <label key={s} className={tile}>
        {s}
        <input type="radio" name="size" className="sr-only" checked={size === s} onChange={() => setSize(s)} />
      </label>
    )) },
  ];

  return (
    <FlowShell aside={step < 3 && <button type="button" onClick={() => go(3)} className="text-sm text-ink-2 hover:text-ink">Skip</button>}>
      <div className="w-full max-w-xl">
        <div className="flex gap-1.5" aria-label={`Step ${Math.min(step + 1, 4)} of 4`} role="img">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-px flex-1 ${i <= step ? "bg-accent" : "bg-line"}`} />
          ))}
        </div>

        {step < 3 ? (
          <fieldset className="mt-10">
            <legend>
              <h1 ref={heading} tabIndex={-1} className="text-[28px] font-semibold tracking-[-0.03em] outline-none">{questions[step].title}</h1>
              {questions[step].hint && <p className="mt-1 text-ink-2">{questions[step].hint}</p>}
            </legend>
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">{questions[step].body}</div>
            <div className="mt-8 flex justify-between">
              <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className={`${buttonCls.ghost} disabled:invisible`}>Back</button>
              <button
                type="button"
                onClick={() => go(step + 1)}
                disabled={(step === 0 && !role) || (step === 2 && !size)}
                className={`${buttonCls.primary} disabled:opacity-50`}
              >
                Continue
              </button>
            </div>
          </fieldset>
        ) : (
          <section className="mt-10">
            <h1 ref={heading} tabIndex={-1} className="text-[28px] font-semibold tracking-[-0.03em] outline-none">Your starting stack</h1>
            <p className="mt-1 text-ink-2">Based on {types.length ? types.map((t) => EVENT_TYPES.find((e) => e.id === t)!.plural.toLowerCase()).join(", ") : "what most teams start with"}. Change it any time.</p>

            <h2 className="mt-8 text-sm font-medium text-ink-2">Included free</h2>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {CORE.map((m) => (
                <li key={m.id} className="flex h-8 items-center gap-1 rounded-control bg-sunken px-2.5 text-sm text-ink-2">
                  <Check className="size-3.5" aria-hidden="true" /> {m.name}
                </li>
              ))}
            </ul>

            {suggested.length > 0 && (
              <fieldset className="mt-8">
                <legend className="text-sm font-medium text-ink-2">Suggested add-ons</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {suggested.map((id) => {
                    const m = byId(id)!;
                    return (
                      <label key={id} className={`${tile} items-start`}>
                        <span>
                          <span className="block font-medium">{m.name}</span>
                          <span className="block text-sm text-ink-2">{m.blurb}</span>
                        </span>
                        <input
                          type="checkbox"
                          className="mt-1 size-4 shrink-0 accent-[var(--eh-accent)]"
                          checked={picks.includes(id)}
                          onChange={() => setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
                        />
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {waitlist.length > 0 && (
              <p className="mt-6 text-sm text-ink-2">
                Still in development: {waitlist.map((id) => byId(id)!.name).join(", ")}. We'll email you when they ship.
              </p>
            )}

            <div className="mt-8 border-t border-line pt-6" aria-live="polite">
              {picks.length ? (
                <p className="text-ink-2">
                  {rec.name} covers this. Try it free for 14 days, no card. Afterwards you can stay on Free with the core modules.
                </p>
              ) : (
                <p className="text-ink-2">The core modules are free forever.</p>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                {picks.length ? (
                  <>
                    <button type="button" onClick={() => finish(true)} className={buttonCls.primary}>
                      Start free trial with {picks.length} module{picks.length === 1 ? "" : "s"}
                    </button>
                    <button type="button" onClick={() => finish(false)} className={buttonCls.secondary}>Continue on Free</button>
                  </>
                ) : (
                  <button type="button" onClick={() => finish(false)} className={buttonCls.primary}>Go to my workspace</button>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </FlowShell>
  );
}
