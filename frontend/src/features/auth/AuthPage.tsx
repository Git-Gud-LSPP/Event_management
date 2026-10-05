import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { useOrganizerAuth } from "../../hooks/useOrganizerAuth";
import { Wordmark } from "../../marketing/ui";

// Example of the overnight summary the AI panel shows. Illustrative copy, not account data.
const AWAY = [
  ["16 tasks drafted from the TechSummit brief", "AI · PLAN"],
  ["Catering vendor flagged: delivery window overlaps load-in", "AI · VENDORS"],
  ["Run-of-show re-planned around the AV check", "AI · SCHEDULE"],
];

const input =
  "h-11 rounded-[10px] border border-line-strong/60 bg-surface px-3.5 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-ink disabled:opacity-50";
const label = "flex flex-col gap-1.5 text-[13px] text-ink-2";

export default function EventOpsAuth(): React.JSX.Element {
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const auth = useOrganizerAuth(() => navigate(from ?? "/events", { replace: true }));
  const isRegister = auth.mode === "register";

  const tab = (on: boolean) => `cursor-pointer rounded-full px-4 py-[7px] ${on ? "bg-surface shadow-[0_1px_2px_rgba(0,0,0,.08)]" : "text-ink-2"}`;
  const roleCls = (on: boolean) => `cursor-pointer rounded-[10px] border bg-surface px-3.5 py-3 text-left ${on ? "border-ink" : "border-line"}`;

  return (
    <div className="grid min-h-screen bg-paper text-ink [grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr))]">
      <div className="flex flex-col px-[clamp(20px,5vw,64px)] py-7">
        <Link to="/" aria-label="EventOps home" className="self-start"><Wordmark /></Link>
        <div className="my-auto w-full max-w-[400px] py-12">
          <div className="font-mono text-xs tracking-[.04em] text-ink-3">{isRegister ? "CREATE ACCOUNT" : "WELCOME BACK"}</div>
          <h1 className="mt-3 mb-2.5 text-[clamp(34px,4vw,48px)] leading-[1.02] font-medium tracking-[-0.045em]">
            {isRegister ? "Start running events." : "Sign in to EventOps."}
          </h1>
          <p className="mb-7 text-[15px] leading-[1.55] text-ink-3">
            {isRegister ? "Organizers create and run events. Staff get their tasks and shifts." : "Pick up where your team left off."}
          </p>

          <div className="mb-[22px] flex w-max rounded-full bg-sunken p-[3px] text-[13px]" role="group" aria-label="Sign in or create account">
            <button type="button" aria-pressed={!isRegister} onClick={() => auth.switchMode("login")} className={tab(!isRegister)}>Sign in</button>
            <button type="button" aria-pressed={isRegister} onClick={() => auth.switchMode("register")} className={tab(isRegister)}>Create account</button>
          </div>

          {auth.errorMessage && (
            <div role="alert" className="mb-5 flex items-center gap-2 rounded-xl bg-danger-soft p-3 text-[13px] text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{auth.errorMessage}</span>
            </div>
          )}

          <form onSubmit={auth.handleLogin} className="flex flex-col gap-3.5">
            {isRegister && (
              <>
                <label className={label}>
                  Full name
                  <input type="text" required autoComplete="name" disabled={auth.isLoading} value={auth.name} onChange={(e) => auth.setName(e.target.value)} placeholder="Alex Morgan" className={input} />
                </label>
                <fieldset className={label}>
                  <legend className="mb-1.5">I'm joining as</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {([["organizer", "Organizer", "Create and run events"], ["staff", "Staff", "Get tasks and shifts"]] as const).map(([r, t, d]) => (
                      <button key={r} type="button" aria-pressed={auth.role === r} onClick={() => (auth.setRole(r), auth.clearError())} className={roleCls(auth.role === r)}>
                        <div className="text-sm font-medium text-ink">{t}</div>
                        <div className="mt-0.5 text-xs text-ink-3">{d}</div>
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            )}
            <label className={label}>
              Work email
              <input type="email" required autoComplete="email" disabled={auth.isLoading} value={auth.email} onChange={(e) => auth.setEmail(e.target.value)} placeholder="jane@agency.com" className={input} />
            </label>
            <label className={label}>
              Password
              <input type="password" required minLength={6} autoComplete={isRegister ? "new-password" : "current-password"} disabled={auth.isLoading} value={auth.password} onChange={(e) => auth.setPassword(e.target.value)} placeholder="••••••••" className={input} />
            </label>
            <button
              type="submit"
              disabled={auth.isLoading}
              className="mt-1.5 flex h-[46px] cursor-pointer items-center justify-center gap-2 rounded-full bg-ink text-[15px] text-paper hover:bg-ink-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {auth.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {isRegister ? "Creating account…" : "Signing in…"}
                </>
              ) : (
                <>{isRegister ? "Create account" : "Sign in"} →</>
              )}
            </button>
          </form>
        </div>
        <div className="text-[12.5px] text-[#6E7C73]">© 2026 EventOps, Inc.</div>
      </div>

      <div aria-hidden="true" className="relative m-3 flex min-h-[520px] items-end overflow-hidden rounded-[22px] bg-[#CFE5D5] p-[clamp(20px,4vw,48px)]">
        <div className="absolute -inset-1/4 blur-[24px] [background:radial-gradient(38%_46%_at_22%_30%,#F1F7EA_0%,rgba(241,247,234,0)_70%),radial-gradient(34%_44%_at_80%_22%,#9CCBAE_0%,rgba(156,203,174,0)_72%),radial-gradient(44%_50%_at_62%_86%,#BFE0CF_0%,rgba(191,224,207,0)_70%),radial-gradient(30%_40%_at_8%_92%,#88BC9E_0%,rgba(136,188,158,0)_70%)]" />
        <div className="relative w-full max-w-[460px] rounded-2xl bg-ink p-[22px] text-paper shadow-[0_40px_90px_-30px_rgba(25,70,45,.35)]">
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-[.04em] text-ai">
            <span className="size-1.5 rounded-full bg-live" />WHILE YOU WERE AWAY
          </div>
          <p className="mt-3 mb-[18px] text-[19px] leading-[1.35] tracking-[-0.02em]">
            EventOps AI drafted 16 tasks for TechSummit, flagged a catering risk and re-planned tomorrow's run-of-show.
          </p>
          <div className="flex flex-col border-t border-[#2E3E35]">
            {AWAY.map(([a, b]) => (
              <div key={a} className="flex justify-between gap-3 border-b border-[#2E3E35] py-2.5 text-[13px]">
                <span className="text-[#DCE6DE]">{a}</span>
                <span className="font-mono text-[10.5px] whitespace-nowrap text-[#95A39A]">{b}</span>
              </div>
            ))}
          </div>
          <div className="mt-3.5 text-xs text-[#95A39A]">Example of an overnight summary.</div>
        </div>
      </div>
    </div>
  );
}
