// Copy and demo data for the v2 landing page (claude.ai/design "EventOps Landing v2").
// Customer names, metrics and quotes are design placeholders until real ones are supplied.

export const TIERS = ["Starter", "Growth", "Scale", "Enterprise"] as const;
export const PRICES = { monthly: [0, 290, 790], annual: [0, 240, 650] };
export type Billing = keyof typeof PRICES;

/** Plan index for a module count (and the highest tier any picked module needs). */
export const planFor = (n: number, minTier = 0) => Math.max(n <= 5 ? 0 : n <= 25 ? 1 : n <= 60 ? 2 : 3, minTier);
export const priceLabel = (i: number, billing: Billing) => (i === 3 ? "Custom" : `$${PRICES[billing][i]}`);

// [name, description, lowest tier index]
type Cap = [string, string, number];
export const CATS: { n: string; m: Cap[] }[] = [
  { n: "Events", m: [["Event dashboard", "Status, readiness and incidents across every event.", 0], ["AI event setup", "Paste a brief — AI drafts tasks and workstreams.", 0], ["Readiness score", "Progress by workstream, flagged when at risk.", 0], ["Needs attention", "Blocked tasks and open incidents in one list.", 1], ["Inventory alerts", "Low-stock and damaged kit, with AI reorder.", 1], ["Multi-event portfolio", "See every event, live or upcoming, at once.", 2]] },
  { n: "My Tasks", m: [["Personal task list", "Recently assigned, today, next and later.", 0], ["List & board views", "Switch layout without losing context.", 0], ["AI prioritisation", "Ordered by what unblocks the most.", 0], ["Blocked flags", "See what you’re waiting on and who owns it.", 0], ["One-tap complete", "Updates the schedule and dependants instantly.", 0], ["Mobile for staff", "Tasks and shifts on any phone.", 1]] },
  { n: "Schedule", m: [["Run-of-show list", "Every task with owner, start and priority.", 0], ["Gantt timeline", "Drag tasks on a live day timeline.", 0], ["Dependencies", "Link tasks so delays carry through.", 1], ["AI delay prediction", "See the cascade before it happens.", 1], ["Dependency alert chains", "Trigger → impact → suggested fix.", 1], ["One-click re-plan", "Apply the fix and notify owners.", 2]] },
  { n: "Staff", m: [["Staff roster", "Roles, phones and current task per person.", 0], ["On-site status", "On site, checked in, off shift, unavailable.", 0], ["Attendance", "On time, late and no-shows flagged live.", 1], ["Add staff to event", "Search people and assign in seconds.", 0], ["AI cover suggestions", "Who can step in when someone drops out.", 1], ["Shift planning", "Balance hours across the event days.", 2]] },
  { n: "Vendors", m: [["Find vendors nearby", "Search by location with distance and rating.", 0], ["Map view", "See suppliers around your venue.", 0], ["Vendor profiles", "Address, phone, website and reviews.", 0], ["Booking tracker", "Contract, PO and payment status per event.", 1], ["AI shortlists", "Ranked by fit for this event’s needs.", 1], ["At-risk alerts", "Backups found before a vendor slips.", 2]] },
  { n: "Incidents", m: [["Report incident", "What, when, where, who — from any phone.", 0], ["Severity & status", "Critical to low, open to resolved.", 0], ["Assign owners", "Route to whoever is actually on site.", 0], ["AI triage", "Severity, owner and fix suggested in seconds.", 1], ["Impact on schedule", "See which tasks an incident blocks.", 1], ["Incident history", "Patterns carried into the debrief.", 2]] },
  { n: "Floor Plan", m: [["Room builder", "Draw rooms with name and capacity.", 0], ["Place staff", "Drop people into rooms or the floor.", 0], ["Zoom & fit", "Navigate large venues easily.", 0], ["Capacity alerts", "Know when a room is over capacity.", 1], ["AI room suggestions", "Where to send overflow or extra staff.", 1], ["Multiple floors", "Plan every level of the venue.", 2]] },
  { n: "EventOps AI", m: [["Copilot (⌘K)", "Ask anything about your event.", 0], ["Suggested actions", "Every fix waits for your approval.", 0], ["Drafted messages", "Attendee, staff and vendor notices.", 1], ["Explain why", "See the data behind each suggestion.", 1], ["AI debrief", "Wrap-up report the night of the event.", 1], ["Lessons memory", "Next plan learns from the last event.", 2]] },
];
export const CAP_TIER: Record<string, number> = Object.fromEntries(CATS.flatMap((c) => c.m.map(([n, , t]) => [n, t])));
export const DEFAULT_STACK = ["Event dashboard", "AI event setup", "Personal task list", "Gantt timeline", "Staff roster", "Report incident", "Copilot (⌘K)"];

export const TIER_CARDS = [
  { name: "Starter", desc: "For a first event or a small team trying the platform.", feats: ["Up to 5 modules", "3 events / year", "250 attendees per event", "2 team seats"], cta: "Start free", to: "/signup" },
  { name: "Growth", desc: "For teams running a regular calendar of events.", feats: ["Up to 25 modules", "25 events / year", "2,500 attendees per event", "10 seats · custom branding"], cta: "Start 14-day trial", to: "/signup?plan=growth" },
  { name: "Scale", desc: "For portfolios of large, multi-track events.", feats: ["Up to 60 modules", "Unlimited events", "15,000 attendees per event", "40 seats · SSO · 99.9% SLA"], cta: "Start 14-day trial", to: "/signup?plan=scale" },
  { name: "Enterprise", desc: "Every module, custom ones too, with a team behind you.", feats: ["All 102 modules + custom", "Unlimited everything", "SCIM, data residency", "Dedicated CSM · onsite"], cta: "Talk to sales", to: "/contact-sales" },
];

const ck = "✓";
export const NO = "—";
export const COMPARE: { g: string; rows: [string, string[]][] }[] = [
  { g: "PLATFORM", rows: [["Modules included", ["5", "25", "60", "All 102"]], ["Events per year", ["3", "25", "Unlimited", "Unlimited"]], ["Attendees per event", ["250", "2,500", "15,000", "Unlimited"]], ["Team seats", ["2", "10", "40", "Unlimited"]], ["Workspaces", ["1", "1", "5", "Unlimited"]]] },
  { g: "MODULES & CUSTOMIZATION", rows: [["Swap modules anytime", [ck, ck, ck, ck]], ["Custom branding", [NO, ck, ck, ck]], ["Custom domains", [NO, NO, ck, ck]], ["Custom-built modules", [NO, NO, NO, ck]]] },
  { g: "INTEGRATIONS & DATA", rows: [["Native integrations", ["5", "40", "All 120+", "All + custom"]], ["API & webhooks", [NO, "Read", "Full", "Full, raised limits"]], ["Warehouse sync", [NO, NO, NO, ck]]] },
  { g: "SECURITY & SUPPORT", rows: [["SSO / SAML", [NO, NO, ck, ck]], ["SCIM provisioning", [NO, NO, NO, ck]], ["Audit logs", [NO, "30 days", "1 year", "Unlimited"]], ["Uptime SLA", [NO, NO, "99.9%", "99.99%"]], ["Support", ["Community", "Email", "Priority chat", "Dedicated CSM"]], ["Onsite support", [NO, NO, "Add-on", "Included"]]] },
];

export const USE_CASES = [
  { name: "Conferences", head: "Multi-track conferences, without the war room", desc: "Three stages, twelve breakout rooms and 48 staff on one run-of-show. AI watches every AV check and rehearsal so the keynote starts on time.", stack: ["AI event setup", "Gantt timeline", "Dependency alert chains", "Floor plan", "AI triage", "AI debrief"], metric: "−52%", metricLabel: "planning hours vs. last year", photo: "EVENT PHOTO — CONFERENCE KEYNOTE" },
  { name: "Trade shows & expos", head: "Big floors, live capacity", desc: "Lay out halls and booths on the floor plan, place staff where they’re needed and get alerted the moment a room goes over capacity.", stack: ["Floor plan", "Capacity alerts", "Vendor booking tracker", "Staff roster", "Incidents"], metric: "3.1×", metricLabel: "leads captured per exhibitor", photo: "EVENT PHOTO — EXPO FLOOR" },
  { name: "Corporate & internal", head: "Offsites and kickoffs with HR-grade privacy", desc: "From galas to kickoffs: AI drafts the plan from a one-paragraph brief, finds florists and caterers near the venue, and tracks every booking.", stack: ["AI event setup", "Vendors nearby", "My Tasks", "Schedule", "AI debrief"], metric: "98%", metricLabel: "RSVP completion via SSO invite", photo: "EVENT PHOTO — COMPANY OFFSITE" },
  { name: "Festivals & ticketed", head: "Big crews, fast incident response", desc: "120 staff across 8 stages. Incidents are reported from phones, triaged by AI and routed to whoever is actually on site.", stack: ["Staff on-site status", "AI cover suggestions", "Incidents", "Floor plan", "Vendor at-risk alerts"], metric: "90k", metricLabel: "attendees through gates in a day", photo: "EVENT PHOTO — FESTIVAL GATES" },
  { name: "Hybrid & virtual", head: "Studio days that run to the minute", desc: "Tight schedules with crew, AV vendors and talent. The Gantt shows every dependency and AI re-plans when a segment overruns.", stack: ["Schedule", "Staff roster", "Vendors", "Incidents", "Copilot (⌘K)"], metric: "71%", metricLabel: "remote attendee engagement", photo: "EVENT PHOTO — HYBRID STUDIO" },
  { name: "Associations", head: "Member events that renew members", desc: "Run the same annual events year after year — and let AI carry last year’s lessons, vendors and timings into this year’s plan.", stack: ["Multi-event portfolio", "Readiness score", "Lessons memory", "Schedule", "AI debrief"], metric: "+19%", metricLabel: "member renewal after events", photo: "EVENT PHOTO — ASSOCIATION MEETING" },
];

export const FAQS: [string, string][] = [
  ["What does the AI actually do?", "It works at every stage: drafts the task plan from your brief, prioritises each person’s day, predicts how delays cascade through dependencies, triages incidents, ranks nearby vendors, flags over-capacity rooms and writes the debrief. Each output is a suggestion you can edit, apply or dismiss."],
  ["Will the AI change things without me?", "No. EventOps AI never sends a message, reassigns a person or changes the schedule on its own. Every action waits for a click from someone with permission, and every suggestion shows the data behind it."],
  ["What happens if I hit a limit mid-event?", "Nothing breaks. If you exceed attendees or events, registration stays open and we notify an admin. You can upgrade or buy a one-off overage pack; we never lock check-in or ticket sales on event day."],
  ["Can I swap modules once my event is live?", "Yes. Turn any module on or off at any time — data from a module you switch off is kept for 12 months and returns the moment you switch it back on."],
  ["How do upgrades and downgrades work?", "Upgrades take effect immediately and are prorated to the day. Downgrades apply at the end of your billing period; we will flag any modules or seats you need to remove first."],
  ["Is the Starter plan really free?", "Yes — free forever for up to 5 modules, 3 events a year and 250 attendees per event. Paid tickets carry standard payment processing fees only."],
  ["How hard is it to switch from our current tools?", "Most teams switch in under two weeks. We import attendees, past events and ticket history from spreadsheets and common event platforms, and Scale and Enterprise plans include a migration specialist."],
  ["Do you provide onsite hardware?", "Scanners, kiosks and badge printers can be rented per event on any paid plan. Enterprise includes onsite technicians for flagship events."],
];

const ints = [["Salesforce", "CRM", "SF"], ["HubSpot", "CRM", "HS"], ["Zoom", "Video", "ZM"], ["Stripe", "Payments", "ST"], ["Slack", "Messaging", "SL"], ["Marketo", "Marketing", "MK"], ["Microsoft Teams", "Video", "MT"], ["Google Calendar", "Calendar", "GC"], ["Zapier", "Automation", "ZP"], ["Okta", "Identity", "OK"]];
const ints2 = [["Snowflake", "Warehouse", "SN"], ["Mailchimp", "Email", "MC"], ["Adyen", "Payments", "AD"], ["Microsoft Dynamics", "CRM", "MD"], ["LinkedIn", "Ads", "LI"], ["BigQuery", "Warehouse", "BQ"], ["Pipedrive", "CRM", "PD"], ["Webex", "Video", "WX"], ["Segment", "Data", "SG"], ["Azure AD", "Identity", "AZ"]];
// Doubled so the marquee can loop at -50%.
export const INT_ROWS = [[...ints, ...ints], [...ints2, ...ints2]];

export const INT_FEATS = [
  { g: "⇄", t: "Two-way CRM sync", d: "Leads and attendance write back to Salesforce and HubSpot.", meta: "< 60 S", cls: "bg-[#DCEEE2] text-[#1F5A3F]" },
  { g: "{ }", t: "REST & GraphQL", d: "Every module exposes its data. Typed SDKs for TypeScript and Python.", meta: "TS · PY", cls: "bg-[#D6E4F5] text-[#24518A]" },
  { g: "↯", t: "90+ webhooks", d: "React to incidents, task changes and schedule shifts as they happen.", meta: "REAL-TIME", cls: "bg-warn-soft text-warn" },
  { g: "▤", t: "Warehouse export", d: "Nightly or streaming to Snowflake, BigQuery and Redshift.", meta: "NIGHTLY", cls: "bg-ai-soft text-ai-ink" },
];

const LOGOS: [string, string][] = [
  ["Halcyon", "text-[20px] font-semibold tracking-[-0.03em]"],
  ["MERIDIAN", "text-[14px] font-medium tracking-[0.22em]"],
  ["orbital", "font-mono text-[19px] tracking-[-0.02em]"],
  ["Kestrel & Co", "font-serif text-[18px] font-medium tracking-[-0.02em]"],
  ["vantage", "text-[20px] font-bold tracking-[-0.05em] lowercase"],
  ["Lumen Expo", "text-[17px] font-light tracking-[0.02em]"],
  ["ATLAS LIVE", "font-mono text-[13px] font-semibold tracking-[0.16em]"],
  ["Northwind", "font-serif text-[19px] font-medium tracking-[-0.03em]"],
];
export const LOGO_ROW = [...LOGOS, ...LOGOS];

// Hero product-film mock
export const HERO_MODULES: [string, 0 | 1 | 2][] = [["Events", 1], ["My tasks", 1], ["Schedule", 1], ["Staff", 1], ["Vendors", 1], ["Incidents", 2], ["Floor plan", 0], ["Debrief", 0]];
export const HERO_BARS = [0.32, 0.48, 0.7, 0.92, 1, 0.86, 0.64, 0.55, 0.5, 0.58, 0.74, 0.8, 0.6, 0.42, 0.36, 0.3];
export const FEED = [["AO", "Registration Desk Open — done", "Aisha Okoye · Logistics", "07:58"], ["AI", "AV check running 15 min late", "AI · cascade to keynote predicted", "08:47"], ["MC", "Main Stage audio out — reported", "Marcus Chen · Critical", "08:47"], ["AI", "Owner no-show — Marcus suggested", "AI triage · awaiting approval", "08:48"], ["TV", "Catering truck blocked at Dock B", "Tomas Varga · High", "09:02"], ["AI", "Dock A clear — reroute drafted", "AI · floor plan check", "09:02"], ["PN", "Reroute approved", "Priya Nair · 3 owners notified", "09:03"], ["FH", "Media credentials 80% handed out", "Fatima Hassan · Logistics", "09:05"], ["JL", "Venue clearance in progress", "James Liu · Safety", "09:06"], ["AI", "Hall B at 440/400 — open partition?", "AI · capacity alert", "09:08"]];

// Hub diagram: [x, y, before, after, dx, dy, rotate] in a 1000×460 viewBox
const C = { x: 500, y: 230 };
export const TOOLS = ([[140, 80, "Spreadsheets", "Registration", -60, -30, -8], [400, 34, "Email blasts", "Campaigns", 30, -24, 6], [690, 46, "Ticket vendor", "Ticketing", 70, -20, -5], [880, 150, "Badge software", "Badging", 40, 40, 9], [860, 340, "Survey tool", "Feedback", 60, 30, -7], [620, 414, "Payment links", "Payments", 30, 30, 5], [300, 404, "CRM exports", "CRM sync", -50, 30, -6], [110, 290, "Group chats", "Staff ops", -60, 20, 8]] as const).map(([x, y, a, b, dx, dy, r]) => ({
  x, y, a, b, dx, dy, r,
  left: `${x / 10}%`,
  top: `${y / 4.6}%`,
  d: `M${x} ${y} C ${(x + C.x) / 2} ${y}, ${(x + C.x) / 2} ${C.y}, ${C.x} ${C.y}`,
}));
export const BEFORE_TOOLS = ["Spreadsheets", "Email threads", "Ticket vendor", "Badge software", "Survey tool", "Payment links", "CRM exports", "Group chats"];
export const AFTER_MODS = ["Events", "My Tasks", "Schedule", "Staff", "Vendors", "Incidents", "Floor plan", "AI copilot"];

export const AI_STAGES = [
  { n: "01", stage: "Plan", where: "Events · My Tasks", does: "Drafts the task plan, owners and dependencies from your brief.", you: "Edit and approve the plan" },
  { n: "02", stage: "Staff", where: "Staff · Floor Plan", does: "Matches people to roles and rooms; finds cover for no-shows.", you: "Confirm the swap" },
  { n: "03", stage: "Source", where: "Vendors", does: "Ranks nearby vendors by fit, distance and rating; spots at-risk bookings.", you: "Send the request" },
  { n: "04", stage: "Schedule", where: "Schedule", does: "Predicts how one delay cascades through every dependent task.", you: "Pick the fix" },
  { n: "05", stage: "Run", where: "Incidents · Floor Plan", does: "Triages reports, routes owners and watches room capacity live.", you: "One-tap resolve" },
  { n: "06", stage: "Debrief", where: "Events", does: "Writes the wrap-up and carries lessons into the next plan.", you: "Share with stakeholders" },
];

// Feature clips
export const REG_FIELDS = [["AV system check — Main Stage", "TECH", "70%"], ["Sound check — Keynote", "AFTER AV", "55%"], ["Registration desk open", "LOGISTICS", "60%"], ["Catering delivery — lunch", "CATERING", "80%"], ["Venue clearance", "SAFETY", "45%"]];
export const WORKSTREAMS: [string, string, number, string][] = [["Technical", "5 tasks", 0.6, "Marcus Chen · 3 dependencies"], ["Logistics", "7 tasks", 0.75, "James Liu · 2 dependencies"], ["Catering", "4 tasks", 0.35, "Tomas Varga · 1 vendor"]];
const done = "bg-[#DCEEE2] text-[#1F5A3F]", blue = "bg-[#D6E4F5] text-[#24518A]", amber = "bg-warn-soft text-warn", red = "bg-danger-soft text-danger";
export const SESSIONS = [
  { n: "Lighting test", p: "M. Chen · done", l: "0%", t: "0%", cls: done },
  { n: "AV system check", p: "M. Chen · +15", l: "0%", t: "25%", cls: blue },
  { n: "Green room setup", p: "P. Nair · done", l: "33.333%", t: "0%", cls: done },
  { n: "Booth assembly", p: "J. Liu · done", l: "66.666%", t: "0%", cls: done },
  { n: "Credentials", p: "F. Hassan", l: "66.666%", t: "25%", cls: amber },
  { n: "Sound check", p: "M. Chen · blocked", l: "33.333%", t: "25%", cls: red },
  { n: "Venue clearance", p: "J. Liu", l: "66.666%", t: "50%", cls: amber },
];

const AI_C = "text-[#5B47A8]", MUTE = "text-[#6E7C73]", OK = "text-[#2A6E4B]";
export const STEPS = [
  { n: "01", t: "Create the event", d: "Add the date, venue and a short brief. EventOps AI drafts the task plan, workstreams and dependencies for you to edit.", rows: [["TechSummit 2026 created", "0:42", MUTE], ["16 tasks drafted by AI", "AI", AI_C], ["Plan approved by Priya", "DONE", OK]] },
  { n: "02", t: "Staff and source", d: "Add staff, place them on the floor plan and book vendors near the venue. AI flags gaps and ranks backups.", rows: [["48 staff assigned", "STAFF", MUTE], ["7 vendors booked", "VENDORS", MUTE], ["Catering backup shortlisted", "AI", AI_C]] },
  { n: "03", t: "Run the day", d: "Tasks, incidents and capacity update live. AI watches every dependency and proposes the fix the moment something slips.", rows: [["AV delay → keynote at risk", "AI", AI_C], ["5-min walkthrough applied", "APPLIED", OK], ["Debrief drafted overnight", "AI", AI_C]] },
];

export const QUOTES = [
  { m: "11 → 1", ml: "tools replaced in one quarter", q: "Procurement signed off in a week. The module model meant we only paid for what our events actually used.", n: "Priya Raman", r: "VP Global Events, Halcyon", i: "PR" },
  { m: "6.8s", ml: "average scan-to-badge at 12k attendees", q: "Our doors used to be the worst part of the show. This year nobody queued longer than a coffee order.", n: "Jonas Lindqvist", r: "Head of Operations, Meridian", i: "JL" },
  { m: "+27%", ml: "sponsor renewals year over year", q: "Sponsors get their ROI report the night of the event. That single change paid for the platform.", n: "Aiko Sato", r: "Partnerships Director, Orbital", i: "AS" },
];
export const METRICS = [
  { l: "Average reduction in event tooling spend", v: "−41%", to: 41, dec: 0, pre: "−", suf: "%" },
  { l: "Faster event setup versus stitched tools", v: "4.2×", to: 4.2, dec: 1, pre: "", suf: "×" },
  { l: "Platform uptime across event days in 2026", v: "99.99%", to: 99.99, dec: 2, pre: "", suf: "%" },
  { l: "Attendees checked in on EventOps this year", v: "11.6M", to: 11.6, dec: 1, pre: "", suf: "M" },
];

export const CERTS = ["SOC 2 TYPE II", "ISO 27001", "GDPR", "PCI DSS L1", "HIPAA-READY"];
export const SECURITY = [
  { k: "IDENTITY", t: "SSO, SAML & SCIM", d: "Okta, Azure AD and Google. Provision and deprovision automatically." },
  { k: "ACCESS", t: "Granular roles", d: "Permissions per workspace, event and module — down to field level." },
  { k: "DATA", t: "Regional residency", d: "Host in the EU, US or APAC. Encrypted at rest and in transit." },
  { k: "AUDIT", t: "Immutable audit logs", d: "Every change, export and login, streamed to your SIEM." },
  { k: "RELIABILITY", t: "99.99% uptime SLA", d: "Offline-capable check-in so doors never depend on venue Wi-Fi." },
  { k: "SUPPORT", t: "Named team", d: "Dedicated CSM, security reviews and onsite techs for flagship events." },
];

export const FOOTER = [
  { h: "PRODUCT", l: ["Events", "My Tasks", "Schedule", "Staff", "Vendors", "Incidents", "Floor Plan", "EventOps AI"] },
  { h: "SOLUTIONS", l: ["Conferences", "Trade shows", "Corporate", "Festivals", "Hybrid"] },
  { h: "DEVELOPERS", l: ["API reference", "Webhooks", "Integrations", "Status"] },
  { h: "COMPANY", l: ["Customers", "Pricing", "Trust center", "Careers", "Contact"] },
];
