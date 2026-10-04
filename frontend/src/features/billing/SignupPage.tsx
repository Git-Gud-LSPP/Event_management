import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi, saveSession } from "../../services/authApi";
import { byId } from "../../billing/catalog";
import { loadStack } from "../../billing/plan";
import { Wordmark } from "../../marketing/ui";
import { buttonCls } from "../../marketing/lib";

const field =
  "h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-[15px] text-ink placeholder:text-ink-3 aria-[invalid=true]:border-danger";

/** Shell shared by signup, onboarding and contact sales: wordmark, one centered column, auto dark mode. */
export function FlowShell({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="eh-auto flex min-h-[100dvh] flex-col bg-paper font-sans text-ink">
      <header className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 md:px-6">
        <Link to="/" aria-label="EventHQ home"><Wordmark /></Link>
        {aside}
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 pb-16 pt-8 md:pt-16">{children}</main>
    </div>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<{ field?: string; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const stack = loadStack();
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Start free · EventHQ";
    if (step === 2) nameRef.current?.focus();
  }, [step]);

  const toStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError({ field: "email", msg: "Enter your work email, like priya@agency.com." });
    setError(null);
    setStep(2);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError({ field: "name", msg: "Tell us your name." });
    if (password.length < 8) return setError({ field: "password", msg: "Use at least 8 characters." });
    setBusy(true);
    setError(null);
    try {
      const data = await authApi.register({ name, email, password, role: "organizer" });
      if (!data.token) throw new Error("No token returned by the server.");
      saveSession(data.token, data.user);
      navigate("/welcome", { replace: true });
    } catch (err) {
      setError({ msg: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  // ponytail: no OAuth app is registered yet, so SSO buttons explain instead of failing silently.
  // Wire to /api/auth/google|microsoft when the backend gets passport strategies.
  const sso = (provider: string) => setError({ msg: `${provider} sign-in isn't set up on this server yet. Continue with your work email.` });

  const err = (f: string) =>
    error?.field === f && (
      <p id={`su-${f}-err`} className="flex items-center gap-1 text-sm text-danger">
        <AlertCircle className="size-4" aria-hidden="true" /> {error.msg}
      </p>
    );

  return (
    <FlowShell aside={<Link to="/login" className="text-sm text-ink-2 hover:text-ink">Log in</Link>}>
      <div className="w-full max-w-sm">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em]">{step === 1 ? "Start free" : "Create your workspace"}</h1>
        <p className="mt-2 text-ink-2">{step === 1 ? "Core modules free forever. No card needed." : email}</p>
        {stack.length > 0 && (
          <p className="mt-4 rounded-control border border-accent/40 bg-accent-soft/50 px-3 py-2 text-sm text-ink">
            Your stack: {stack.map((id) => byId(id)?.name).filter(Boolean).join(", ")}
          </p>
        )}

        {error && !error.field && (
          <p role="alert" className="mt-5 flex gap-2 rounded-control border border-danger/40 bg-danger-soft p-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {error.msg}
          </p>
        )}

        {step === 1 ? (
          <>
            <div className="mt-6 grid gap-2.5">
              {["Google", "Microsoft"].map((p) => (
                <button key={p} type="button" onClick={() => sso(p)} className={`${buttonCls.secondary} h-11 w-full`}>
                  Continue with {p}
                </button>
              ))}
            </div>
            <div className="my-6 flex items-center gap-3 text-xs text-ink-3" aria-hidden="true">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>
            <form onSubmit={toStep2} noValidate className="grid gap-2">
              <label htmlFor="su-email" className="text-sm font-medium">Work email</label>
              <input
                id="su-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error?.field === "email"}
                aria-describedby={error?.field === "email" ? "su-email-err" : undefined}
                className={field}
              />
              {err("email")}
              <button type="submit" className={`${buttonCls.primary} mt-2 h-11 w-full`}>Continue</button>
            </form>
          </>
        ) : (
          <form onSubmit={create} noValidate className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="su-name" className="text-sm font-medium">Full name</label>
              <input ref={nameRef} id="su-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={error?.field === "name"} aria-describedby={error?.field === "name" ? "su-name-err" : undefined} className={field} />
              {err("name")}
            </div>
            <div className="grid gap-2">
              <label htmlFor="su-password" className="text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  id="su-password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={error?.field === "password"}
                  aria-describedby="su-password-help"
                  className={`${field} pr-11`}
                />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-control text-ink-3 hover:text-ink">
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p id="su-password-help" className="text-sm text-ink-3">At least 8 characters.</p>
              {err("password")}
            </div>
            <button type="submit" disabled={busy} className={`${buttonCls.primary} h-11 w-full disabled:opacity-60`}>
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} {busy ? "Creating workspace" : "Create workspace"}
            </button>
            <button type="button" onClick={() => setStep(1)} className="text-sm text-ink-2 hover:text-ink">Use a different email</button>
          </form>
        )}
        <p className="mt-8 border-t border-line pt-4 text-sm text-ink-2">
          Joining a team? Ask your organizer for an invite, or <Link to="/login" className="font-medium text-ink underline underline-offset-2">log in</Link>.
        </p>
      </div>
    </FlowShell>
  );
}
