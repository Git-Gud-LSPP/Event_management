const crypto = require('crypto');
const router = require('express').Router();
const User = require('../auth/user.model');
const Event = require('../event/event.model');
const Schedule = require('../schedule/schedule.model');
const { authenticate } = require('../auth/auth.middleware');
const { hasModule } = require('../billing/billing');

// Demo-grade integrations, no OAuth: Slack and Zapier take an incoming-webhook URL, and
// calendar sync is a secret ICS feed that Google / Outlook Calendar subscribe to.
// Webhook URLs are only accepted for the vendor's own host (no SSRF into our network).
const APPS = {
  slack: { module: 'slack', host: 'hooks.slack.com', field: 'slackUrl' },
  zapier: { module: 'zapier', host: 'hooks.zapier.com', field: 'zapierUrl' },
};

function validHook(app, raw) {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && u.hostname === APPS[app].host && !u.username && !u.password && !u.port;
  } catch {
    return false;
  }
}

// redirect: 'error' so a hook can't bounce us somewhere else.
async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    redirect: 'error',
    signal: AbortSignal.timeout(5000),
  });
  return { ok: res.ok, status: res.status };
}

// Slack mrkdwn treats &, < and > as control characters.
const slackEsc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Fan an activity out to the owner's connected apps. Fire-and-forget: never throws, never blocks
 * the request. `text` is Slack mrkdwn (escape user input with slackEsc); `data` goes to Zapier as-is.
 * ponytail: no retry or delivery log; queue + retry if a missed alert ever matters.
 */
async function notify(ownerId, { type, text, data = {} }) {
  if (!ownerId) return;
  try {
    const u = await User.findById(ownerId).select('integrations workspace').lean();
    const i = u?.integrations ?? {};
    const jobs = [];
    if (i.slackUrl && hasModule(u.workspace, 'slack')) jobs.push(post(i.slackUrl, { text }));
    if (i.zapierUrl && hasModule(u.workspace, 'zapier')) jobs.push(post(i.zapierUrl, { type, at: new Date().toISOString(), ...data }));
    for (const r of await Promise.allSettled(jobs)) {
      if (r.status === 'rejected' || !r.value.ok) console.warn('[integrations] delivery failed', type, r.reason?.message ?? r.value.status);
    }
  } catch (err) {
    console.warn('[integrations]', err.message);
  }
}

// --- ICS feed (RFC 5545) ---
const icsEsc = (s = '') => String(s).replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');
const icsTime = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const HOUR = 3_600_000;

// ponytail: lines aren't folded at 75 octets; Google and Outlook accept long lines.
function toIcs(entries, now = Date.now()) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EventOps//Calendar sync//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:EventOps'];
  for (const e of entries) {
    lines.push('BEGIN:VEVENT', `UID:${e.uid}@eventops`, `DTSTAMP:${icsTime(now)}`, `DTSTART:${icsTime(e.start)}`, `DTEND:${icsTime(e.end)}`, `SUMMARY:${icsEsc(e.title)}`);
    if (e.location) lines.push(`LOCATION:${icsEsc(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${icsEsc(e.description)}`);
    if (e.cancelled) lines.push('STATUS:CANCELLED');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

const TOKEN = /^[a-f0-9]{48}$/;

// Public: calendar apps can't send our JWT, so the unguessable token is the credential.
router.get('/calendar/:token.ics', async (req, res, next) => {
  try {
    const user = TOKEN.test(req.params.token)
      ? await User.findOne({ 'integrations.calendarToken': req.params.token }).select('workspace').lean()
      : null;
    if (!user || !hasModule(user.workspace, 'calendar-sync')) return res.status(404).send('Calendar not found');

    const me = String(user._id);
    const events = await Event.find({ $or: [{ organizer: user._id }, { staff: user._id }] }).lean();
    const byId = new Map(events.map((e) => [String(e._id), e]));
    const own = events.filter((e) => String(e.organizer) === me).map((e) => e._id);
    // Organizers get every run-of-show task on their events; staff get the tasks they own.
    const tasks = await Schedule.find({
      event: { $in: events.map((e) => e._id) },
      $or: [{ event: { $in: own } }, { owner: user._id }],
    }).lean();

    const entries = [
      ...events.map((e) => ({
        uid: `event-${e._id}`,
        start: e.startsAt,
        end: e.endsAt ?? new Date(+e.startsAt + HOUR),
        title: e.title,
        location: e.location,
        description: e.description,
        cancelled: e.status === 'cancelled',
      })),
      ...tasks.map((t) => {
        const ev = byId.get(String(t.event));
        return {
          uid: `task-${t._id}`,
          start: t.startsAt,
          end: t.endsAt ?? new Date(+t.startsAt + HOUR / 2),
          title: `${t.name} · ${ev?.title ?? 'Event'}`,
          location: ev?.location,
          description: `Run-of-show task (${t.status})`,
        };
      }),
    ];
    res.type('text/calendar; charset=utf-8').send(toIcs(entries));
  } catch (err) {
    next(err);
  }
});

router.use(authenticate);
router.use((req, res, next) =>
  req.user.role === 'staff' ? res.status(403).json({ message: 'Only organizers manage integrations' }) : next()
);

const hint = (url) => (url ? `…${url.slice(-6)}` : null);

router.get('/', async (req, res, next) => {
  try {
    const i = (await User.findById(req.user.userId).select('integrations').lean())?.integrations ?? {};
    res.json({ slack: hint(i.slackUrl), zapier: hint(i.zapierUrl), calendarToken: i.calendarToken ?? null });
  } catch (err) {
    next(err);
  }
});

// Empty url = disconnect.
router.put('/:app', async (req, res, next) => {
  try {
    const app = APPS[req.params.app];
    if (!app) return res.status(404).json({ message: 'Unknown integration' });
    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    if (url && !validHook(req.params.app, url)) {
      return res.status(400).json({ message: `Paste a webhook URL that starts with https://${app.host}/` });
    }
    const path = `integrations.${app.field}`;
    await User.updateOne({ _id: req.user.userId }, url ? { $set: { [path]: url } } : { $unset: { [path]: 1 } });
    res.json({ [req.params.app]: hint(url) });
  } catch (err) {
    next(err);
  }
});

router.post('/:app/test', async (req, res, next) => {
  const app = APPS[req.params.app];
  if (!app) return res.status(404).json({ message: 'Unknown integration' });
  let u;
  try {
    u = await User.findById(req.user.userId).select('integrations workspace').lean();
  } catch (err) {
    return next(err);
  }
  const url = u?.integrations?.[app.field];
  if (!url) return res.status(400).json({ message: 'Connect it first' });
  if (!hasModule(u.workspace, app.module)) return res.status(403).json({ message: 'This integration is not on your plan' });
  const text = ':white_check_mark: EventOps is connected. Incident and event alerts will post here.';
  try {
    const r = await post(url, req.params.app === 'slack' ? { text } : { type: 'test', at: new Date().toISOString(), text });
    res.status(r.ok ? 200 : 502).json(r.ok ? r : { ...r, message: `The app answered ${r.status}. Check the webhook URL.` });
  } catch (err) {
    res.status(502).json({ ok: false, message: `Could not reach the app: ${err.message}` });
  }
});

// Creates or rotates the feed token; the old feed URL stops working.
router.post('/calendar/token', async (req, res, next) => {
  try {
    const calendarToken = crypto.randomBytes(24).toString('hex');
    await User.updateOne({ _id: req.user.userId }, { $set: { 'integrations.calendarToken': calendarToken } });
    res.json({ calendarToken });
  } catch (err) {
    next(err);
  }
});

module.exports = { router, notify, slackEsc, toIcs, validHook };
