// Module catalog + plan rules. Shared by the landing page, onboarding, marketplace and gating.
// `live` = shipped in this codebase. Everything else is roadmap: shown honestly as "In development".

export type EventType = "conference" | "festival" | "corporate" | "wedding" | "webinar";
export type PlanId = "free" | "starter" | "growth" | "enterprise";

export interface Module {
  id: string;
  name: string;
  blurb: string;
  category: string;
  types: EventType[];
  live?: boolean;
  core?: boolean; // included on every plan
  enterpriseOnly?: boolean;
  route?: string; // app route, for live modules
}

export const EVENT_TYPES: { id: EventType; label: string; plural: string }[] = [
  { id: "conference", label: "Conference", plural: "Conferences" },
  { id: "festival", label: "Festival", plural: "Festivals" },
  { id: "corporate", label: "Corporate", plural: "Corporate events" },
  { id: "wedding", label: "Wedding", plural: "Weddings" },
  { id: "webinar", label: "Webinar", plural: "Webinars" },
];

// Type codes keep the table below readable: c conference, f festival, o corporate, w wedding, b webinar.
const CODES: Record<string, EventType> = { c: "conference", f: "festival", o: "corporate", w: "wedding", b: "webinar" };
type Row = [name: string, blurb: string, types: string, extra?: Partial<Module>];

const TABLE: Record<string, Row[]> = {
  "Plan & schedule": [
    ["Events", "Every event, its dates, venue and team in one place.", "cfowb", { live: true, core: true, route: "/events" }],
    ["My Tasks", "A kanban of what each person owes, by event.", "cfowb", { live: true, core: true, route: "/my-tasks" }],
    ["Run-of-show", "Gantt schedule from load-in to load-out.", "cfowb", { live: true, core: true, route: "/schedule" }],
    ["Documents", "Contracts, briefs and riders attached to the event.", "cfowb", { live: true, core: true, route: "/documents" }],
    ["Agenda builder", "Sessions, tracks and rooms on a public agenda.", "cob"],
    ["Budget planner", "Line-item budgets per event with owners.", "cfow"],
    ["Approvals", "Sign-off flows for spend, copy and changes.", "co"],
    ["Event templates", "Clone a past event's plan in one click.", "cfowb"],
    ["Milestones", "Key dates with reminders to the right owner.", "cfow"],
    ["Portfolio view", "Every event across clients on one timeline.", "cfo"],
  ],
  "People & crew": [
    ["Staff", "Your team, roles and who's on which event.", "cfowb", { live: true, core: true, route: "/staffs" }],
    ["Shift rostering", "Build shifts and fill them from your crew pool.", "cf"],
    ["Call sheets", "Daily call times sent to every crew member.", "cfw"],
    ["Volunteers", "Recruit, brief and schedule volunteers.", "cf"],
    ["Speakers", "Speaker profiles, travel and session briefs.", "cob"],
    ["Accreditation", "Passes and zone access by role.", "cf"],
    ["Time tracking", "Clock-in and hours per shift for payroll.", "cf"],
    ["Briefings", "Safety and role briefings with read receipts.", "cfo"],
    ["Contractor onboarding", "Collect paperwork before day one.", "cf"],
    ["Guest list & VIP", "VIP lists, plus-ones and hosting notes.", "cfow"],
  ],
  "Venue & logistics": [
    ["Floor Plan", "Draw the venue and place stages and stations.", "cfow", { live: true, route: "/floorplan" }],
    ["Inventory", "Track kit, quantities and where it is.", "cfo", { live: true }],
    ["Site map", "Outdoor site plans on a real map.", "f"],
    ["Seating charts", "Tables and seats with drag-and-drop guests.", "ow"],
    ["Room blocks", "Hotel allocations and pick-up tracking.", "co"],
    ["Transport", "Shuttles, transfers and driver schedules.", "cfo"],
    ["Load-in planner", "Dock slots and delivery windows per vendor.", "cf"],
    ["Equipment rental", "Hire orders, returns and damage notes.", "cfw"],
    ["Signage", "Every sign, its copy and where it goes.", "cfo"],
    ["Accessibility planner", "Access routes, needs and provisions.", "cfo"],
    ["Catering & dietary", "Menus, counts and dietary needs per session.", "cfow"],
  ],
  "Vendors & spend": [
    ["Vendors", "Supplier directory with contacts and history.", "cfow", { live: true, route: "/vendors" }],
    ["Procurement", "Requests, quotes and orders in one pipeline.", "cfo", { live: true }],
    ["Purchase orders", "Raise POs against the event budget.", "co"],
    ["Contracts & e-sign", "Send, sign and store vendor contracts.", "cfow"],
    ["Quote comparison", "Side-by-side quotes for the same brief.", "cfo"],
    ["Payables", "Vendor invoices matched to orders.", "cfo"],
    ["Expenses", "Snap receipts and code them on the go.", "cfow"],
    ["Sponsorship", "Packages, deliverables and sponsor contacts.", "cf"],
    ["Exhibitor portal", "Booth bookings and exhibitor manuals.", "c"],
    ["Budget vs actuals", "Live variance as spend comes in.", "cfo"],
  ],
  "Registration & ticketing": [
    ["Ticketing", "Ticket types, tiers and capacity limits.", "cfb"],
    ["Registration forms", "Custom forms with conditional questions.", "cob"],
    ["Promo codes", "Discounts, comps and early-bird pricing.", "cf"],
    ["Group bookings", "One order, many attendees.", "co"],
    ["Waitlists", "Release seats automatically when they free up.", "cfb"],
    ["Payments", "Card and invoice payments with payouts.", "cfw"],
    ["Refunds", "Self-serve refunds within your policy.", "cf"],
    ["Reserved seating", "Pick-your-seat for theatres and galas.", "co"],
    ["RSVP", "Simple yes/no with dietary and plus-ones.", "ow"],
    ["Abstracts", "Call for papers with reviewer scoring.", "c"],
  ],
  "Show day": [
    ["Incidents", "Log, triage and close incidents from the floor.", "cfow", { live: true, route: "/incidents" }],
    ["Check-in", "Scan tickets and badges at every door.", "cfo"],
    ["Badge printing", "Print badges on demand at check-in.", "co"],
    ["Live cueing", "Call cues from the run-of-show in real time.", "cfo"],
    ["Channel log", "Radio and channel traffic, timestamped.", "f"],
    ["Lost & found", "Log items and reunite them with owners.", "cf"],
    ["Medical log", "First-aid cases with privacy controls.", "cf"],
    ["Crowd counters", "Live occupancy per zone and gate.", "cf"],
    ["Weather alerts", "Thresholds that page the right lead.", "fw"],
    ["Safety checklists", "Pre-open walkthroughs with sign-off.", "cfo"],
  ],
  "Attendee experience": [
    ["Attendee app", "Agenda, maps and alerts in attendees' pockets.", "cf"],
    ["Networking", "Attendee matchmaking by interest.", "cb"],
    ["Live Q&A", "Questions with upvotes per session.", "cob"],
    ["Polls", "Live polls on stage and in sessions.", "cob"],
    ["Live streaming", "Stream sessions to remote attendees.", "cob"],
    ["On-demand video", "Recordings published after the event.", "cob"],
    ["Gamification", "Points and challenges that drive booth visits.", "cf"],
    ["Meeting scheduler", "Book 1:1 meetings between attendees.", "co"],
    ["Live captions", "Captions and interpretation for sessions.", "cob"],
    ["Push notifications", "Timely alerts to the attendee app.", "cf"],
  ],
  "Marketing": [
    ["Email campaigns", "Invites, reminders and follow-ups.", "cfowb"],
    ["Event website", "A branded site generated from your event data.", "cfwb"],
    ["Landing pages", "Campaign pages with registration built in.", "cb"],
    ["SMS", "Text reminders and day-of updates.", "cfw"],
    ["Social scheduler", "Plan posts around your event timeline.", "cf"],
    ["Referrals", "Attendees invite friends for rewards.", "cf"],
    ["Affiliate tracking", "Track partner sales by link.", "cf"],
    ["Wedding website", "A shared site for the couple and guests.", "w"],
    ["Invitations", "Digital invitations with RSVP tracking.", "ow"],
    ["Webinar reminders", "Smart reminder sequences that lift attendance.", "b"],
    ["Press portal", "Media accreditation and press kits.", "cf"],
  ],
  "Insights": [
    ["Analytics", "Attendance, sales and ops metrics in one view.", "cfob"],
    ["Surveys", "Post-event surveys sent automatically.", "cfowb"],
    ["NPS", "Net promoter tracking across events.", "cob"],
    ["Attendance reports", "Who came, when and to which session.", "cob"],
    ["Sponsor ROI", "Reports sponsors can actually use.", "cf"],
    ["Financial reports", "P&L per event and per client.", "cfo"],
    ["Lead retrieval", "Exhibitors scan and qualify leads.", "c"],
    ["Heatmaps", "Where people spent time on site.", "cf"],
    ["Custom reports", "Build and schedule your own reports.", "cfo"],
    ["Data export", "Everything as CSV or via the API.", "cfowb"],
    ["Sustainability", "Waste, travel and energy footprint per event.", "cfo"],
  ],
  "Integrations & admin": [
    ["Assistant", "AI that acts across every module you add.", "cfowb", { live: true, core: true }],
    ["CRM sync", "Two-way sync with Salesforce and HubSpot.", "cob"],
    ["Calendar sync", "Google and Outlook calendars stay current.", "cfowb"],
    ["Slack & Teams", "Alerts and approvals where your team talks.", "cfo"],
    ["Webhooks & Zapier", "Trigger anything when something changes.", "cfob"],
    ["Public API", "Build on EventHQ with a REST API.", "cfob"],
    ["Custom roles", "Fine-grained permissions beyond organizer/staff.", "cfo"],
    ["Multi-language", "Translate agendas, forms and emails.", "cfb"],
    ["SSO / SAML", "Sign in with your identity provider.", "o", { enterpriseOnly: true }],
    ["SCIM provisioning", "Users created and removed from your IdP.", "o", { enterpriseOnly: true }],
    ["Audit log", "Every change, who made it and when.", "o", { enterpriseOnly: true }],
  ],
};

const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const CATEGORIES = Object.keys(TABLE);

export const MODULES: Module[] = CATEGORIES.flatMap((category) =>
  TABLE[category].map(([name, blurb, types, extra]) => ({
    id: slug(name),
    name,
    blurb,
    category,
    types: [...types].map((c) => CODES[c]),
    ...extra,
  })),
);

export const byId = (id: string) => MODULES.find((m) => m.id === id);
export const CORE = MODULES.filter((m) => m.core);
export const ADD_ONS = MODULES.filter((m) => !m.core);

export interface Plan {
  id: PlanId;
  name: string;
  monthly: number | null; // USD per month, billed monthly. PLACEHOLDER pricing.
  annual: number | null; // USD per month, billed annually
  slots: number; // add-on modules you can pick
  events: number | null; // active events, null = unlimited
  seats: number | null;
  pitch: string;
}

export const PLANS: Plan[] = [
  { id: "free", name: "Free", monthly: 0, annual: 0, slots: 0, events: 2, seats: 5, pitch: "The core toolkit, free forever." },
  { id: "starter", name: "Starter", monthly: 49, annual: 39, slots: 5, events: 10, seats: 25, pitch: "Core plus 5 modules you pick." },
  { id: "growth", name: "Growth", monthly: 149, annual: 119, slots: 20, events: null, seats: 100, pitch: "Core plus 20 modules you pick." },
  { id: "enterprise", name: "Enterprise", monthly: null, annual: null, slots: Infinity, events: null, seats: null, pitch: "Every module, with SSO and an SLA." },
];

export const planById = (id: PlanId) => PLANS.find((p) => p.id === id)!;

/** Cheapest plan that fits a set of add-on ids. */
export function recommendPlan(addOnIds: string[]): PlanId {
  if (addOnIds.some((id) => byId(id)?.enterpriseOnly)) return "enterprise";
  return PLANS.find((p) => p.slots >= addOnIds.length)!.id;
}

/** Live add-ons ranked by how many of the chosen event types they serve. */
export function recommendAddOns(types: EventType[], max = 4): Module[] {
  return ADD_ONS.filter((m) => m.live)
    .map((m) => ({ m, score: m.types.filter((t) => types.includes(t)).length }))
    .filter((x) => x.score > 0 || types.length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.m);
}
