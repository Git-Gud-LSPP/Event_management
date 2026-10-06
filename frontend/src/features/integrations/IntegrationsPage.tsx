import { createElement, useEffect, useState, type ReactNode } from "react";
import { Check, Copy, Loader2, Lock } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { PageHeader } from "../../components/DashboardHeader";
import { card, mono, pill } from "../../components/ui";
import { API_BASE, apiFetch } from "../../services/api";
import { byId } from "../../billing/catalog";
import { moduleIcon } from "../../billing/icons";
import { addModule, freeSlots, hasModule, useWorkspace } from "../../billing/plan";
import { SlotDialog } from "../billing/shared";
import { BRANDS } from "../../components/brands";

// Backend: backend/integration/integration.js. Webhook URLs come back masked ("…abc123").
interface Config {
  slack: string | null;
  zapier: string | null;
  calendarToken: string | null;
}

const field = "w-full min-w-0 rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent";
const btn = "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[13px] whitespace-nowrap disabled:opacity-60";
const primary = `${btn} bg-ink text-paper hover:bg-ink-hover`;
const secondary = `${btn} bg-surface text-ink ring-1 ring-line hover:ring-ink`;

export default function IntegrationsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Config>("/integrations").then(setConfig).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader eyebrow="Workspace · Integrations" title="Integrations" subtitle="Connect EventOps to the tools your team already lives in." />
      {error && <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error}</p>}
      {!config ? (
        !error && (
          <div className="flex items-center gap-2 py-16 text-sm text-ink-3">
            <Loader2 size={16} className="animate-spin" /> Loading integrations…
          </div>
        )
      ) : (
        <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))]">
          <WebhookCard
            app="slack"
            hint={config.slack}
            onSaved={(slack) => setConfig({ ...config, slack })}
            placeholder="https://hooks.slack.com/services/…"
            how="In Slack, add the Incoming Webhooks app to a channel and paste its webhook URL here."
            sends={["New incidents, with priority and location", "Incident status changes", "New events"]}
          />
          <WebhookCard
            app="zapier"
            hint={config.zapier}
            onSaved={(zapier) => setConfig({ ...config, zapier })}
            placeholder="https://hooks.zapier.com/hooks/catch/…"
            how={'In Zapier, start a Zap with the "Webhooks by Zapier → Catch Hook" trigger and paste its URL here. Then send any app the data.'}
            sends={["incident.created and incident.status, as JSON", "event.created, as JSON", "Use them to post to Teams, email, Sheets or a CRM"]}
          />
          <CalendarCard token={config.calendarToken} onToken={(calendarToken) => setConfig({ ...config, calendarToken })} />
        </div>
      )}
    </div>
  );
}

/** Card frame shared by every integration. Shows an "add to plan" state when the module is off. */
function AppCard({ id, connected, children }: { id: string; connected: boolean; children: ReactNode }) {
  const ws = useWorkspace();
  const [want, setWant] = useState<string | null>(null);
  const m = byId(id)!;
  const on = hasModule(ws, id);

  return (
    <section className={`${card} p-5`}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 flex-none place-items-center rounded-xl bg-sunken">
          {createElement(moduleIcon(id), { className: "size-5 text-ink", color: BRANDS[m.name]?.color, "aria-hidden": true })}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-medium">{m.name}</h2>
            {on && <span className={`${pill} ${connected ? "bg-accent-soft text-[#2A6E4B]" : "bg-line-soft text-[#56645B]"}`}>{connected ? "CONNECTED" : "NOT CONNECTED"}</span>}
          </div>
          <p className="mt-0.5 text-[13px] text-ink-3">{m.blurb}</p>
        </div>
      </div>
      {on ? (
        <div className="mt-4">{children}</div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line-soft pt-4">
          <span className="flex items-center gap-1.5 text-[13px] text-ink-3">
            <Lock size={14} aria-hidden="true" /> Not in your plan yet
          </span>
          <button type="button" className={primary} onClick={() => (freeSlots(ws) > 0 ? addModule(id) : setWant(id))}>
            Add to my plan
          </button>
        </div>
      )}
      <SlotDialog want={want} onClose={() => setWant(null)} />
    </section>
  );
}

function WebhookCard({ app, hint, onSaved, placeholder, how, sends }: {
  app: "slack" | "zapier";
  hint: string | null;
  onSaved: (hint: string | null) => void;
  placeholder: string;
  how: string;
  sends: string[];
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const call = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMsg(null);
    try {
      setMsg({ ok: true, text: await fn() });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const save = (value: string) =>
    call(async () => {
      const r = await apiFetch<Record<string, string | null>>(`/integrations/${app}`, { method: "PUT", body: JSON.stringify({ url: value }) });
      onSaved(r[app]);
      setUrl("");
      return value ? "Saved. Send a test to check it." : "Disconnected.";
    });

  const test = () =>
    call(async () => {
      await apiFetch(`/integrations/${app}/test`, { method: "POST" });
      return "Test message delivered.";
    });

  return (
    <AppCard id={app} connected={!!hint}>
      <p className="text-[13px] text-ink-2">{how}</p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void save(url.trim());
        }}
      >
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={hint ? `Connected (${hint}). Paste a new URL to replace it.` : placeholder}
          aria-label={`${app} webhook URL`}
          className={field}
        />
        <button type="submit" disabled={busy} className={primary}>
          {busy && <Loader2 size={14} className="animate-spin" />} Save
        </button>
      </form>
      {hint && (
        <div className="mt-2 flex gap-2">
          <button type="button" disabled={busy} onClick={() => void test()} className={secondary}>Send test</button>
          <button type="button" disabled={busy} onClick={() => void save("")} className={`${btn} text-ink-3 hover:text-danger`}>Disconnect</button>
        </div>
      )}
      {msg && <p role="status" className={`mt-2 text-[13px] ${msg.ok ? "text-[#2A6E4B]" : "text-danger"}`}>{msg.text}</p>}
      <div className={`${mono} mt-4 text-ink-3`}>WHAT GETS SENT</div>
      <ul className="mt-1.5 space-y-1">
        {sends.map((s) => (
          <li key={s} className="flex gap-2 text-[13px] text-ink-2">
            <Check size={14} className="mt-0.5 flex-none text-accent" aria-hidden="true" /> {s}
          </li>
        ))}
      </ul>
    </AppCard>
  );
}

function CalendarCard({ token, onToken }: { token: string | null; onToken: (t: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Absolute even when API_BASE is a relative "/api".
  const feed = token ? new URL(`${API_BASE}/integrations/calendar/${token}.ics`, window.location.origin).href : "";
  const isLocal = /^https?:\/\/(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(feed);
  const webcal = feed.replace(/^https?:/, "webcal:");

  const rotate = async () => {
    if (token && !window.confirm("Reset the link? Calendars subscribed to the old one stop updating.")) return;
    setBusy(true);
    setError(null);
    try {
      onToken((await apiFetch<{ calendarToken: string }>("/integrations/calendar/token", { method: "POST" })).calendarToken);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(feed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AppCard id="calendar-sync" connected={!!token}>
      <p className="text-[13px] text-ink-2">
        A private calendar feed with every event you're on, plus run-of-show tasks. Subscribe once and Google or Outlook keeps it current.
      </p>
      {error && <p role="alert" className="mt-2 text-[13px] text-danger">{error}</p>}
      {!token ? (
        <button type="button" disabled={busy} onClick={() => void rotate()} className={`${primary} mt-3`}>
          {busy && <Loader2 size={14} className="animate-spin" />} Create calendar feed
        </button>
      ) : (
        <>
          <div className="mt-3 flex gap-2">
            <input readOnly value={feed} aria-label="Calendar feed URL" onFocus={(e) => e.target.select()} className={`${field} font-mono text-xs`} />
            <button type="button" onClick={() => void copy()} className={secondary} aria-label="Copy feed URL">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <a className={primary} target="_blank" rel="noreferrer" href={`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`}>
              <FcGoogle size={14} aria-hidden="true" /> Add to Google Calendar
            </a>
            <a className={secondary} target="_blank" rel="noreferrer" href={`https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(feed)}&name=EventOps`}>
              {createElement(BRANDS.Outlook.Icon, { size: 14, color: BRANDS.Outlook.color, "aria-hidden": true })} Add to Outlook
            </a>
            <a className={secondary} href={feed} download="eventops.ics">Download .ics</a>
            <button type="button" disabled={busy} onClick={() => void rotate()} className={`${btn} text-ink-3 hover:text-danger`}>Reset link</button>
          </div>
          {isLocal && (
            <p className="mt-3 rounded-xl bg-warn-soft px-3 py-2 text-xs text-warn">
              This server runs on localhost, which Google and Outlook can't reach. Use Download .ics and import the file, or deploy to subscribe live.
            </p>
          )}
          <p className="mt-3 text-xs text-ink-3">Anyone with this link can read the calendar. Reset it if it leaks.</p>
        </>
      )}
    </AppCard>
  );
}
