/**
 * Demo seed for EventHQ — "Operations Manager" workspace.
 *
 *   node seed/seed.js            re-seed (removes only data created by a previous seed run)
 *   node seed/seed.js --fresh    wipe EVERY collection first (clean demo database)
 *
 * Place at backend/seed/seed.js. Uses the app's own Mongoose models, so validation
 * (enums, endsAt >= startsAt, floor-plan staff rules) applies exactly as in the app.
 * All dates are relative to "now", so the workspace always looks current.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../auth/user.model');
const Event = require('../event/event.model');
const Schedule = require('../schedule/schedule.model');
const FloorPlan = require('../floorplan/floorplan.model');
const Incident = require('../incident/incident.model');
const Inventory = require('../inventory/inventory.model');
const EventVendor = require('../procurement/procurement.model');
const Doc = require('../document/document.model');
const { AgentConversation, AgentAction } = require('../agent/agent.model');

// ---------------------------------------------------------------- config
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event_management';
const DOMAIN = 'meridian-ops.example';
const PASSWORD = process.env.SEED_PASSWORD || 'Demo@1234';
const CURRENCY = 'USD';
const CITY = { lat: 1.2834, lng: 103.8607 }; // vendor map pins cluster around this point

// ---------------------------------------------------------------- time helpers
const MIN = 60_000;
const NOW = Date.now();
const snap = (ms) => new Date(Math.round(ms / (5 * MIN)) * 5 * MIN);
const ago = (min) => snap(NOW - min * MIN);
const ahead = (min) => snap(NOW + min * MIN);
const D = (n) => n * 1440; // days -> minutes
const dayAt = (offsetDays, hh, mm = 0) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hh, mm, 0, 0);
  return d;
};
const plus = (date, min) => new Date(date.getTime() + min * MIN);

// ---------------------------------------------------------------- people
// key: [name, role, job title (comment only — the User model has no title field)]
const PEOPLE = {
  alex: ['Alex Morgan', 'organizer'], // Operations Manager — the demo login
  sofia: ['Sofia Alvarez', 'staff'], // Facilities
  marcus: ['Marcus Chen', 'staff'], // AV & IT
  priya: ['Priya Nair', 'staff'], // Procurement
  daniel: ['Daniel Okafor', 'staff'], // Security & safety
  hannah: ['Hannah Weber', 'staff'], // People & Culture
  tom: ['Tom Brennan', 'staff'], // Catering liaison
  yuki: ['Yuki Tanaka', 'staff'], // Internal comms
  leila: ['Leila Haddad', 'staff'], // Finance
  carlos: ['Carlos Mendes', 'staff'], // Logistics
  nina: ['Nina Petrova', 'staff'], // Executive office
  omar: ['Omar Farouk', 'staff'], // Compliance
  grace: ['Grace Liu', 'staff'], // Front desk & registration
};
const emailOf = (name) => `${name.toLowerCase().replace(/[^a-z ]/g, '').replace(/ /g, '.')}@${DOMAIN}`;

// ---------------------------------------------------------------- DSL helpers
// Schedule task. `start` = minutes relative to the event's startsAt.
const T = (key, name, owner, start, dur, status = 'Pending', dep = null, delay = 0) => ({
  key, name, owner, start, dur, status, dep, delay,
});

// ---------------------------------------------------------------- events
const summitStart = ago(180); // "live" event: started 3h ago, runs 6h more
const SUMMIT_STAFF = ['sofia', 'marcus', 'daniel', 'tom', 'yuki', 'grace', 'carlos', 'nina', 'priya'];

const EVENTS = [
  // ============================ 1. LIVE EVENT ============================
  {
    title: 'Meridian Customer Summit 2026',
    description:
      'Flagship two-track customer conference: keynote, breakout sessions, sponsor expo and VIP reception. 450 on-site attendees plus live stream to regional offices.',
    location: 'Harbourfront Convention Centre, Hall B',
    startsAt: summitStart,
    endsAt: ahead(360),
    capacity: 450,
    status: 'published',
    createdAt: dayAt(-75, 10),
    staff: SUMMIT_STAFF,
    schedule: [
      T('walk', 'Venue walkthrough & capacity sign-off', 'sofia', -D(14) + 600, 120, 'Done'),
      T('avspec', 'Finalise AV & staging specification', 'marcus', -D(10), 90, 'Done'),
      T('menu', 'Lock catering menu & dietary counts', 'tom', -D(7), 60, 'Done'),
      T('badges', 'Print attendee badges & lanyards', 'grace', -D(2), 180, 'Done'),
      T('approve', 'Approve final run-of-show v7', 'alex', -D(1) + 540, 45, 'Done'),
      T('loadin', 'Load-in & stage build', 'carlos', -480, 300, 'Done'),
      T('soundchk', 'Sound, lighting & screen check', 'marcus', -170, 60, 'Done', 'loadin'),
      T('secsweep', 'Security sweep & access-control check', 'daniel', -120, 60, 'Done'),
      T('regopen', 'Registration & badge pickup', 'grace', -60, 180, 'Done'),
      T('keynote', 'Opening keynote — CEO', 'nina', 0, 60, 'Done', 'soundchk'),
      T('breakouts', 'Breakout sessions (Tracks A & B)', 'yuki', 90, 120, 'In Progress', 'keynote'),
      T('lunch', 'Lunch service — Catering Lounge', 'tom', 150, 90, 'In Progress', null, 15),
      T('livestream', 'Livestream relay to regional offices', 'marcus', 60, 420, 'Blocked', 'soundchk'),
      T('plenary', 'Afternoon plenary: 2027 roadmap', 'nina', 270, 75, 'Pending', 'lunch'),
      T('panel', 'Executive Q&A panel', 'nina', 345, 60, 'Pending', 'plenary'),
      T('reception', 'VIP networking reception', 'nina', 420, 120, 'Pending', 'panel'),
      T('recording', 'Upload session recordings to intranet', 'marcus', 500, 90, 'Pending', 'livestream'),
      T('teardown', 'Teardown & load-out', 'carlos', 540, 180, 'Pending', 'reception'),
      T('settle', 'Vendor settlement & invoice approvals', 'alex', D(1) + 540, 120, 'Pending', 'teardown'),
      T('survey', 'Post-event feedback survey', 'yuki', D(1) + 600, 60, 'Pending'),
    ],
    floors: [
      {
        name: 'Level 1 — Convention Floor',
        rooms: [
          ['main', 'Main Stage Hall', 40, 40, 480, 336, 450, '#e4f7f9'],
          ['reg', 'Registration & Badge Pickup', 560, 40, 216, 144, 40, '#fff4cc'],
          ['expo', 'Sponsor Expo', 560, 216, 216, 160, 80, '#e8f0e0'],
          ['cater', 'Catering Lounge', 40, 416, 264, 144, 120, '#fdebd0'],
          ['avctl', 'AV Control Booth', 344, 416, 144, 144, 6, '#ece6f5'],
          ['sec', 'Security Desk', 528, 416, 120, 72, 4, '#fbe3e8'],
        ],
        people: [
          ['marcus', 'avctl'], ['daniel', 'sec'], ['grace', 'reg'],
          ['tom', 'cater'], ['yuki', 'expo'], ['carlos', 'main'],
          ['sofia', null, 700, 440],
        ],
      },
      {
        name: 'Level 2 — Breakout Rooms',
        rooms: [
          ['bka', 'Breakout A — Product', 40, 40, 240, 168, 80, '#e4f7f9'],
          ['bkb', 'Breakout B — Customer Success', 320, 40, 240, 168, 80, '#e8f0e0'],
          ['exec', 'Executive Lounge', 40, 248, 240, 168, 30, '#fff4cc'],
          ['green', 'Speaker Green Room', 320, 248, 240, 168, 20, '#ece6f5'],
        ],
        people: [['nina', 'exec'], ['priya', 'green']],
      },
    ],
    incidents: [
      { title: 'Livestream relay dropping frames to regional offices', description: 'Remote offices report buffering roughly every 90 seconds. Suspected uplink saturation from sponsor demo traffic; dedicated line RFQ already out.', location: 'AV Control Booth', priority: 'Critical', status: 'In Progress', by: 'grace', to: 'marcus', at: 125 },
      { title: 'Fire exit B partially blocked by sponsor crates', description: 'Sponsor shipping crates stacked within 1m of the Exit B door. Needs clearing before the afternoon plenary.', location: 'Sponsor Expo', priority: 'Critical', status: 'Open', by: 'daniel', to: 'sofia', at: 160 },
      { title: 'Lunch queue exceeding 20 minutes', description: 'Single service line at the Catering Lounge. Request to open the second buffet station.', location: 'Catering Lounge', priority: 'Medium', status: 'Open', by: 'yuki', to: 'tom', at: 155 },
      { title: 'Breakout B projector flickering', description: 'Intermittent flicker on the main projector during the first session. Swapped HDMI cable and fixed.', location: 'Breakout B', priority: 'Medium', status: 'Resolved', by: 'yuki', to: 'marcus', at: 95, res: 140 },
      { title: 'Badge printer jam at Registration', description: 'Thermal printer jammed mid-queue. Backup printer brought online.', location: 'Registration & Badge Pickup', priority: 'Low', status: 'Resolved', by: 'grace', to: 'grace', at: -20, res: 25 },
      { title: 'Wet floor near Sponsor Expo entrance', description: 'Spill from a coffee station. Area coned off and cleaned.', location: 'Sponsor Expo', priority: 'Low', status: 'Resolved', by: 'daniel', to: 'sofia', at: 70, res: 85 },
    ],
    inventory: [
      ['Wireless lavalier mics', 'AV', 18, 24, 'AV Control Booth', 'Available'],
      ['Handheld wireless mics', 'AV', 12, 12, 'Main Stage Hall', 'Checked Out'],
      ['Spare HDMI & USB-C cables', 'AV', 3, 20, 'AV Control Booth', 'Low Stock'],
      ['Confirmation monitors (55")', 'AV', 14, 16, 'Main Stage Hall', 'Available'],
      ['LED stage panel (spare)', 'AV', 1, 2, 'Storage Room 2', 'Damaged'],
      ['Two-way radios', 'Security', 20, 20, 'Security Desk', 'Checked Out'],
      ['Badge lanyards', 'Registration', 120, 500, 'Registration Desk', 'Low Stock'],
      ['Badge holders', 'Registration', 180, 500, 'Registration Desk', 'Available'],
      ['Folding chairs', 'Furniture', 520, 600, 'Hall B Storage', 'Available'],
      ['Cocktail tables', 'Furniture', 32, 40, 'Catering Lounge', 'Available'],
      ['Bottled water (cases)', 'Catering', 40, 200, 'Catering Lounge', 'Low Stock'],
      ['Branded tote bags', 'Merchandise', 450, 500, 'Sponsor Expo', 'Available'],
      ['Welcome signage frames', 'Signage', 0, 10, 'In transit — PrintWorks', 'Ordered'],
      ['Power strips', 'Electrical', 8, 30, 'Hall B Storage', 'Low Stock'],
      ['First-aid kits', 'Safety', 6, 6, 'First Aid Post', 'Available'],
    ],
    vendors: [
      { k: 'harbour', name: 'Harbourfront Convention Centre', type: 'Venue', contactName: 'Elaine Tan', phone: '+65 6555 0142', email: 'events@harbourfront-cc.example', website: 'https://harbourfront-cc.example', address: '1 Harbour Walk, Singapore', stage: 'Paid', scope: 'Hall B — 3-day hire incl. load-in and breakout rooms', quoteAmount: 38500 },
      { k: 'apex', name: 'Apex AV & Staging', type: 'AV & Staging', contactName: 'Ravi Menon', phone: '+65 6555 0188', email: 'bookings@apex-av.example', website: 'https://apex-av.example', address: '24 Kallang Way, Singapore', stage: 'Booked', scope: 'Main stage, LED wall, PA system, 2-person camera crew', quoteAmount: 22400 },
      { k: 'saffron', name: 'Saffron & Salt Catering', type: 'Catering', contactName: 'Mei Lin Koh', phone: '+65 6555 0107', email: 'corporate@saffronsalt.example', website: 'https://saffronsalt.example', address: '88 Telok Ayer St, Singapore', stage: 'Booked', scope: 'Lunch and reception for 450 guests', quoteAmount: 31200 },
      { k: 'brightline', name: 'Brightline Security Services', type: 'Security', contactName: 'Hassan Idris', phone: '+65 6555 0166', email: 'ops@brightline-sec.example', website: 'https://brightline-sec.example', address: '5 Ubi Road 1, Singapore', stage: 'Paid', scope: '12 guards plus access-control desk, 3 days', quoteAmount: 6800 },
      { k: 'printworks', name: 'PrintWorks Signage', type: 'Printing & Signage', contactName: 'Olivia Grant', phone: '+65 6555 0133', email: 'orders@printworks.example', website: 'https://printworks.example', address: '17 Jalan Besar, Singapore', stage: 'Quoted', scope: 'Signage frames, banners and badge stock', quoteAmount: 4950 },
      { k: 'skystream', name: 'SkyStream Connectivity', type: 'Network & Internet', contactName: 'Jun Wei Ong', phone: '+65 6555 0155', email: 'enterprise@skystream.example', website: 'https://skystream.example', address: '9 Changi Business Park, Singapore', stage: 'RFQ Sent', scope: 'Dedicated 1 Gbps uplink for livestream', notes: 'Needed to unblock the livestream relay to regional offices.' },
      { k: 'lumen', name: 'Lumen Staging Co.', type: 'AV & Staging', contactName: 'Dana Foo', phone: '+65 6555 0121', email: 'hello@lumenstaging.example', website: 'https://lumenstaging.example', address: '3 Tuas Avenue, Singapore', stage: 'Rejected', scope: 'Alternative stage package', quoteAmount: 29800, notes: 'Over budget compared with Apex.' },
    ],
    documents: [
      { t: 'Apex AV & Staging — Services Agreement', c: 'Contract', s: 'Signed', v: 'apex', a: 22400, due: -21, body: '## Services Agreement\n\n- Main stage, LED wall and PA\n- 2-person camera crew\n- Load-in from 07:00 on event day\n- Payment: 50% deposit, 50% on completion' },
      { t: 'Saffron & Salt — Catering Quote (450 guests)', c: 'Quote', s: 'Approved', v: 'saffron', a: 31200, due: -30, body: 'Lunch buffet, afternoon refreshments and evening canapés. Includes vegetarian, halal and gluten-free options.' },
      { t: 'PO-2026-0417 — Signage & Badges', c: 'Purchase Order', s: 'Sent', v: 'printworks', a: 4950, due: -3, body: 'Signage frames x10, welcome banners x4, badge stock x500.' },
      { t: 'Brightline Security — Final Invoice', c: 'Invoice', s: 'Paid', v: 'brightline', a: 6800, due: -2 },
      { t: 'Harbourfront — Balance Invoice', c: 'Invoice', s: 'Received', v: 'harbour', a: 19250, due: 5, body: 'Balance of venue hire. Awaiting approval from Operations.' },
      { t: 'RFQ — Dedicated Livestream Uplink', c: 'RFQ', s: 'Sent', v: 'skystream', due: 1, body: 'Request for a dedicated 1 Gbps symmetrical uplink, installed today, for livestream to regional offices.' },
      { t: 'Fire Safety Occupancy Permit — Hall B', c: 'Permit', s: 'Approved', due: 7, body: 'Maximum occupancy 480. Exits A, B and C to remain unobstructed.' },
      { t: 'Event Liability Insurance Certificate', c: 'Insurance', s: 'Received', a: 1850, due: 60 },
      { t: 'Run-of-Show v7', c: 'Plan', s: 'Approved', body: '## Run-of-Show\n\n| Time | Item |\n|---|---|\n| 09:00 | Opening keynote |\n| 10:30 | Breakouts |\n| 12:30 | Lunch |\n| 14:00 | Afternoon plenary |\n| 15:30 | Executive Q&A |\n| 16:30 | VIP reception |' },
    ],
  },

  // ============================ 2. UPCOMING — AT RISK ============================
  {
    title: 'Leadership Offsite — Q4 Strategy',
    description: 'Three-day executive offsite: 2027 strategy workshops, budget alignment and team dinner for 60 leaders.',
    location: 'Bayview Resort & Conference Centre',
    startsAt: dayAt(21, 9),
    endsAt: dayAt(23, 17),
    capacity: 60,
    status: 'published',
    createdAt: dayAt(-48, 9),
    staff: ['nina', 'hannah', 'priya', 'carlos', 'leila', 'sofia'],
    schedule: [
      T('venue', 'Select venue & sign contract', 'priya', -D(35), 240, 'Done'),
      T('guests', 'Confirm attendee list with executive office', 'nina', -D(28), 120, 'Done'),
      T('travel', 'Book flights & accommodation block', 'carlos', -D(22), 180, 'In Progress'),
      T('budget', 'Reconcile spend against approved budget', 'leila', -D(23), 120, 'In Progress', null, 1440),
      T('fac', 'Confirm external facilitator', 'priya', -D(20), 90, 'Blocked', 'venue'),
      T('diet', 'Collect dietary & accessibility requirements', 'hannah', -D(16), 60),
      T('agenda', 'Finalise agenda with CEO office', 'nina', -D(14), 120, 'Pending', 'fac'),
      T('signoff', 'Executive budget sign-off', 'alex', -D(12), 45, 'Pending', 'budget'),
      T('workbook', 'Print offsite workbook & name tents', 'carlos', -D(8), 120, 'Pending', 'agenda'),
      T('welcome', 'Welcome session & icebreaker', 'nina', 0, 90),
      T('workshop', 'Strategy workshop — Day 1', 'nina', 120, 240, 'Pending', 'welcome'),
      T('dinner', 'Team dinner — Dining Terrace', 'carlos', 600, 150),
      T('close', 'Closing session & action items', 'nina', D(2) + 240, 120, 'Pending', 'workshop'),
    ],
    floors: [
      {
        name: 'Conference Level',
        rooms: [
          ['ball', 'Plenary Ballroom', 40, 40, 432, 288, 80, '#e4f7f9'],
          ['s1', 'Breakout Studio 1', 512, 40, 192, 144, 20, '#e8f0e0'],
          ['s2', 'Breakout Studio 2', 512, 200, 192, 128, 20, '#fff4cc'],
          ['terr', 'Dining Terrace', 40, 368, 288, 144, 70, '#fdebd0'],
          ['foyer', 'Registration Foyer', 368, 368, 336, 144, 30, '#ece6f5'],
        ],
        people: [['nina', 'ball'], ['hannah', 'foyer'], ['sofia', 's1'], ['carlos', 'terr'], ['leila', 's2'], ['priya', null, 740, 360]],
      },
    ],
    incidents: [],
    inventory: [
      ['Printed workbooks', 'Stationery', 0, 60, 'Print vendor', 'Ordered'],
      ['Name tents', 'Stationery', 60, 60, 'HQ Ops Cupboard', 'Available'],
      ['Whiteboards & easels', 'Facilitation', 4, 8, 'HQ Store', 'Available'],
      ['Sticky-note & marker kits', 'Facilitation', 10, 12, 'HQ Ops Cupboard', 'Available'],
      ['Welcome gift bags', 'Merchandise', 20, 60, 'HQ Store', 'Low Stock'],
    ],
    vendors: [
      { k: 'bayview', name: 'Bayview Resort & Conference Centre', type: 'Venue', contactName: 'Marcus Teo', phone: '+65 6555 0201', email: 'groups@bayviewresort.example', website: 'https://bayviewresort.example', address: '1 Bayview Drive, Singapore', stage: 'Booked', scope: 'Plenary ballroom, 2 studios, 30 rooms x 2 nights', quoteAmount: 54000 },
      { k: 'peak', name: 'Summit Peak Facilitation', type: 'Facilitation', contactName: 'Dr. Amara Singh', phone: '+65 6555 0219', email: 'engage@summitpeak.example', website: 'https://summitpeak.example', address: '40 Anson Road, Singapore', stage: 'RFQ Sent', scope: 'Two-day strategy facilitation for 60 executives', notes: 'No response yet; agenda is blocked on this.' },
      { k: 'horizon', name: 'Horizon Coaches', type: 'Transport', contactName: 'Zul Rahman', phone: '+65 6555 0233', email: 'charters@horizoncoaches.example', website: 'https://horizoncoaches.example', address: '12 Woodlands Terrace, Singapore', stage: 'Quoted', scope: 'Return coach transfers, 2 x 40-seaters', quoteAmount: 7200 },
      { k: 'lattice', name: 'Lattice Experiences', type: 'Team Activities', contactName: 'Pia Romero', phone: '+65 6555 0244', email: 'hello@lattice-exp.example', website: 'https://lattice-exp.example', address: '77 Robinson Road, Singapore', stage: 'Shortlisted', scope: 'Half-day leadership team challenge' },
    ],
    documents: [
      { t: 'Bayview Resort — Group Booking Contract', c: 'Contract', s: 'Signed', v: 'bayview', a: 54000, due: -14, body: 'Ballroom, two studios and 30 rooms for two nights. Cancellation free until 14 days before arrival.' },
      { t: 'RFQ — Strategy Facilitation (2 days)', c: 'RFQ', s: 'Sent', v: 'peak', due: 3, body: 'Seeking quotes for a two-day facilitated strategy workshop for 60 executives.' },
      { t: 'Horizon Coaches — Transfer Quote', c: 'Quote', s: 'Received', v: 'horizon', a: 7200, due: 10 },
      { t: 'Budget Request — Q4 Strategy Offsite', c: 'Other', s: 'Draft', a: 78500, due: 7, body: 'Venue 54,000 · Transport 7,200 · Facilitation TBC · Contingency 10%.' },
      { t: 'Offsite Agenda — Draft v2', c: 'Plan', s: 'Draft', body: '## Day 1\n- 09:00 Welcome\n- 10:00 2027 strategy workshop\n\n## Day 2\n- Budget alignment\n\n## Day 3\n- Action items and close' },
    ],
  },

  // ============================ 3. COMPLETED ============================
  {
    title: 'Q3 All-Hands & Town Hall',
    description: 'Company-wide quarterly update with CEO address, department highlights and live Q&A. Streamed to all offices.',
    location: 'HQ Atrium, Level 1',
    startsAt: dayAt(-12, 14),
    endsAt: dayAt(-12, 16, 30),
    capacity: 600,
    status: 'published',
    createdAt: dayAt(-60, 9),
    staff: ['marcus', 'yuki', 'sofia', 'daniel', 'grace', 'hannah'],
    schedule: [
      T('book', 'Book HQ atrium & overflow seating', 'sofia', -D(30), 60, 'Done'),
      T('rehearse', 'AV rehearsal with CEO team', 'marcus', -D(1), 90, 'Done'),
      T('stream', 'Livestream & captioning setup', 'yuki', -120, 60, 'Done', 'rehearse'),
      T('doors', 'Doors & seating marshals', 'daniel', -45, 45, 'Done'),
      T('townhall', 'Town hall & live Q&A', 'hannah', 0, 150, 'Done'),
      T('survey', 'Post-event pulse survey', 'yuki', D(1), 60, 'Done'),
      T('report', 'Publish attendance & feedback report', 'alex', D(3), 90, 'Done', 'survey'),
    ],
    floors: [
      {
        name: 'Atrium',
        rooms: [
          ['stage', 'Stage & AV', 40, 40, 552, 100, 12, '#ece6f5'],
          ['seat', 'Atrium Seating', 40, 170, 552, 260, 600, '#e4f7f9'],
          ['live', 'Livestream Corner', 632, 40, 168, 120, 4, '#e8f0e0'],
          ['reg', 'Check-in', 632, 200, 168, 120, 20, '#fff4cc'],
        ],
        people: [['marcus', 'stage'], ['yuki', 'live'], ['grace', 'reg'], ['sofia', 'seat'], ['hannah', 'seat'], ['daniel', null, 700, 400]],
      },
    ],
    incidents: [
      { title: 'Wireless mic dropout during CEO address', description: 'Lapel mic lost signal for ~20 seconds. Swapped to backup handheld.', location: 'Stage & AV', priority: 'Medium', status: 'Resolved', by: 'yuki', to: 'marcus', at: 20, res: 28 },
      { title: 'Overflow seating needed on balcony level', description: 'Atrium filled early. Opened balcony overflow with a live relay screen.', location: 'Atrium Seating', priority: 'Low', status: 'Resolved', by: 'grace', to: 'sofia', at: 40, res: 75 },
      { title: 'Catering delivery arrived 30 minutes late', description: 'Afternoon refreshments delayed in traffic. Served after the first segment.', location: 'Atrium Seating', priority: 'Low', status: 'Resolved', by: 'sofia', to: 'hannah', at: -90, res: -50 },
    ],
    inventory: [
      ['Lapel mics', 'AV', 10, 10, 'Atrium Stage', 'Available'],
      ['Stackable chairs', 'Furniture', 480, 600, 'Facilities Store', 'Available'],
      ['Branded notebooks', 'Merchandise', 40, 700, 'HQ Level 1', 'Low Stock'],
    ],
    vendors: [
      { k: 'apex', name: 'Apex AV & Staging', type: 'AV & Staging', contactName: 'Ravi Menon', phone: '+65 6555 0188', email: 'bookings@apex-av.example', website: 'https://apex-av.example', address: '24 Kallang Way, Singapore', stage: 'Paid', scope: 'Stage, PA and screens for atrium', quoteAmount: 9800 },
      { k: 'saffron', name: 'Saffron & Salt Catering', type: 'Catering', contactName: 'Mei Lin Koh', phone: '+65 6555 0107', email: 'corporate@saffronsalt.example', website: 'https://saffronsalt.example', address: '88 Telok Ayer St, Singapore', stage: 'Paid', scope: 'Afternoon refreshments, 600 guests', quoteAmount: 8400 },
      { k: 'hush', name: 'Hush Livestream Studios', type: 'Livestream', contactName: 'Ben Alcaraz', phone: '+65 6555 0177', email: 'live@hushstudios.example', website: 'https://hushstudios.example', address: '61 Ubi Avenue 1, Singapore', stage: 'Paid', scope: 'Multi-camera livestream and captioning', quoteAmount: 3200 },
    ],
    documents: [
      { t: 'Apex AV — Invoice (Q3 All-Hands)', c: 'Invoice', s: 'Paid', v: 'apex', a: 9800, due: -20 },
      { t: 'Hush Livestream — Invoice', c: 'Invoice', s: 'Paid', v: 'hush', a: 3200, due: -18 },
      { t: 'Post-event Report — Q3 All-Hands', c: 'Plan', s: 'Approved', body: '## Highlights\n- 540 on-site attendees, 1,900 streamed\n- 92% positive pulse-survey score\n- Under budget by 6%' },
    ],
  },

  // ============================ 4. UPCOMING — CLIENT DINNER ============================
  {
    title: 'Client Appreciation Dinner',
    description: 'Seated dinner for 80 key clients and executive hosts, with a welcome reception and short host remarks.',
    location: 'The Alder Room, Marina Bay',
    startsAt: dayAt(9, 18, 30),
    endsAt: dayAt(9, 22),
    capacity: 80,
    status: 'published',
    createdAt: dayAt(-30, 11),
    staff: ['tom', 'nina', 'priya', 'leila'],
    schedule: [
      T('room', 'Book private dining room', 'priya', -D(25), 60, 'Done'),
      T('invites', 'Send invitations & collect RSVPs', 'nina', -D(16), 120, 'Done'),
      T('tasting', 'Menu tasting with chef', 'tom', -D(14), 120, 'Done'),
      T('budgetap', 'Approve dinner budget', 'alex', -D(12), 30, 'Done'),
      T('favors', 'Select & order guest gifts', 'nina', -D(11), 90, 'In Progress'),
      T('wine', 'Wine pairing sign-off', 'tom', -D(6), 45, 'Pending', 'tasting'),
      T('seating', 'Finalise seating chart', 'nina', -D(5), 120, 'Pending', 'invites'),
      T('recep', 'Guest reception & welcome toast', 'tom', 0, 60),
      T('dinnersvc', 'Seated dinner & host remarks', 'tom', 60, 150, 'Pending', 'recep'),
    ],
    floors: [
      {
        name: 'The Alder Room',
        rooms: [
          ['dine', 'Private Dining', 40, 40, 360, 264, 80, '#fdebd0'],
          ['bar', 'Bar & Reception', 440, 40, 240, 168, 40, '#e4f7f9'],
          ['foyer', 'Coat Check & Foyer', 440, 248, 240, 96, 20, '#fff4cc'],
          ['pass', "Chef's Pass", 40, 344, 200, 96, 6, '#e8f0e0'],
        ],
        people: [['tom', 'pass'], ['nina', 'foyer'], ['priya', 'dine'], ['leila', 'bar']],
      },
    ],
    incidents: [],
    inventory: [
      ['Guest gift boxes', 'Gifts', 0, 80, 'Gifted & Co — in production', 'Ordered'],
      ['Place cards & menus', 'Stationery', 80, 80, 'HQ Ops Cupboard', 'Available'],
      ['Wine (cases)', 'Catering', 0, 12, "Vintner's Cellar — pending quote", 'Ordered'],
    ],
    vendors: [
      { k: 'alder', name: 'The Alder Room', type: 'Venue', contactName: 'Camille Ward', phone: '+65 6555 0301', email: 'private@alderroom.example', website: 'https://alderroom.example', address: '8 Marina Boulevard, Singapore', stage: 'Booked', scope: 'Private dining, 80 covers, 3-course menu', quoteAmount: 12800 },
      { k: 'vintner', name: "Vintner's Cellar", type: 'Wine & Beverage', contactName: 'Paolo Ferraro', phone: '+65 6555 0312', email: 'corporate@vintnerscellar.example', website: 'https://vintnerscellar.example', address: '30 Duxton Road, Singapore', stage: 'Quoted', scope: 'Wine pairing for 80 guests', quoteAmount: 3400 },
      { k: 'gifted', name: 'Gifted & Co', type: 'Gifts', contactName: 'Helena Cruz', phone: '+65 6555 0327', email: 'corporate@giftedco.example', website: 'https://giftedco.example', address: '14 Haji Lane, Singapore', stage: 'Quoted', scope: 'Branded gift boxes x80', quoteAmount: 2100 },
      { k: 'harp', name: 'Harp & Strings Quartet', type: 'Entertainment', contactName: 'Isla Murray', phone: '+65 6555 0338', email: 'bookings@harpstrings.example', website: 'https://harpstrings.example', address: '2 Orchard Link, Singapore', stage: 'Shortlisted', scope: 'Live background music, 90 minutes' },
    ],
    documents: [
      { t: 'The Alder Room — Private Dining Contract', c: 'Contract', s: 'Signed', v: 'alder', a: 12800, due: -20 },
      { t: "Vintner's Cellar — Wine Pairing Quote", c: 'Quote', s: 'Received', v: 'vintner', a: 3400, due: 4 },
      { t: 'PO — Guest Gift Boxes', c: 'Purchase Order', s: 'Draft', v: 'gifted', a: 2100, due: 2 },
    ],
  },

  // ============================ 5. UPCOMING — COMPLIANCE WEEK ============================
  {
    title: 'Annual Compliance & Safety Training Week',
    description: 'Mandatory five-day training programme: workplace safety, data protection, code of conduct and first aid. Rolled out department by department.',
    location: 'HQ Training Rooms 3–5',
    startsAt: dayAt(4, 9),
    endsAt: dayAt(8, 17),
    capacity: 200,
    status: 'published',
    createdAt: dayAt(-35, 9),
    staff: ['omar', 'hannah', 'sofia', 'daniel', 'grace'],
    schedule: [
      T('book', 'Book training rooms & certified trainers', 'sofia', -D(20), 60, 'Done'),
      T('roster', 'Compile per-department attendance roster', 'omar', -D(7), 120, 'In Progress'),
      T('reading', 'Distribute pre-reading & e-learning links', 'hannah', -D(5), 60, 'Done'),
      T('d1', 'Day 1 — Workplace safety fundamentals', 'omar', 0, 420),
      T('d2', 'Day 2 — Data protection & security awareness', 'omar', D(1), 420, 'Pending', 'd1'),
      T('d3', 'Day 3 — Code of conduct & anti-harassment', 'hannah', D(2), 420, 'Pending', 'd2'),
      T('d4', 'Day 4 — First aid & emergency response', 'omar', D(3), 420, 'Pending', 'd3'),
      T('drill', 'Fire-evacuation drill coordination', 'daniel', D(3) + 300, 90, 'Pending', 'd4'),
      T('certs', 'Issue completion certificates', 'grace', D(4) + 420, 60, 'Pending', 'drill'),
      T('report', 'Sign off compliance completion report', 'alex', D(4) + 480, 60, 'Pending', 'certs'),
    ],
    floors: [],
    incidents: [],
    inventory: [
      ['First-aid training dummies', 'Training', 3, 6, 'Training Room 3', 'Low Stock'],
      ['AED trainer units', 'Training', 2, 4, 'Training Room 4', 'Available'],
      ['Fire-extinguisher trainers', 'Training', 4, 4, 'Facilities Store', 'Available'],
      ['Sign-in sheets & pens', 'Stationery', 200, 200, 'HQ Ops Cupboard', 'Available'],
    ],
    vendors: [
      { k: 'safeworks', name: 'SafeWorks Training Partners', type: 'Training', contactName: 'Greg Holloway', phone: '+65 6555 0401', email: 'corporate@safeworks.example', website: 'https://safeworks.example', address: '21 Science Park Road, Singapore', stage: 'Booked', scope: 'Certified trainers for safety, first aid and fire modules', quoteAmount: 11500 },
      { k: 'certifirst', name: 'CertiFirst First-Aid', type: 'Training', contactName: 'Nadia Karim', phone: '+65 6555 0412', email: 'groups@certifirst.example', website: 'https://certifirst.example', address: '6 Eu Tong Sen Street, Singapore', stage: 'Quoted', scope: 'Add-on first-aid certification', quoteAmount: 2900 },
    ],
    documents: [
      { t: 'SafeWorks — Training Services Contract', c: 'Contract', s: 'Signed', v: 'safeworks', a: 11500, due: -15 },
      { t: 'CertiFirst — First-Aid Certification Quote', c: 'Quote', s: 'Received', v: 'certifirst', a: 2900, due: 3 },
      { t: 'Training Week Schedule', c: 'Plan', s: 'Approved', body: '| Day | Module |\n|---|---|\n| 1 | Workplace safety |\n| 2 | Data protection |\n| 3 | Code of conduct |\n| 4 | First aid & drill |\n| 5 | Certification & review |' },
    ],
  },

  // ============================ 6. DRAFT ============================
  {
    title: 'Year-End Holiday Party',
    description: 'Company-wide celebration for ~350 guests. Venue, theme and budget still being decided.',
    location: 'Skyline Rooftop Venue (TBC)',
    startsAt: dayAt(74, 18),
    endsAt: dayAt(74, 23),
    capacity: 350,
    status: 'draft',
    createdAt: dayAt(-5, 15),
    staff: ['hannah', 'tom', 'yuki'],
    schedule: [
      T('venue', 'Shortlist & tour venues', 'hannah', -D(60), 180),
      T('budget', 'Submit party budget for approval', 'alex', -D(55), 45),
      T('theme', 'Agree theme & entertainment brief', 'yuki', -D(50), 90),
      T('caterer', 'Request catering quotes', 'tom', -D(45), 90, 'Pending', 'venue'),
    ],
    floors: [],
    incidents: [],
    inventory: [],
    vendors: [
      { k: 'skyline', name: 'Skyline Rooftop Venue', type: 'Venue', contactName: 'Jasmine Lau', phone: '+65 6555 0501', email: 'events@skylinerooftop.example', website: 'https://skylinerooftop.example', address: '100 Cecil Street, Singapore', stage: 'Shortlisted', scope: 'Rooftop party for 350' },
      { k: 'glass', name: 'The Glasshouse Events', type: 'Venue', contactName: 'Owen Price', phone: '+65 6555 0514', email: 'hello@glasshouse-events.example', website: 'https://glasshouse-events.example', address: '4 Gardens Walk, Singapore', stage: 'Shortlisted', scope: 'Garden pavilion for 400' },
      { k: 'pavilion', name: 'Marina Pavilion', type: 'Venue', contactName: 'Sara Boon', phone: '+65 6555 0526', email: 'bookings@marinapavilion.example', website: 'https://marinapavilion.example', address: '2 Marina Gardens, Singapore', stage: 'Shortlisted', scope: 'Waterfront pavilion for 380' },
    ],
    documents: [
      { t: 'Venue Shortlist & Comparison', c: 'Plan', s: 'Draft', body: '| Venue | Capacity | Notes |\n|---|---|---|\n| Skyline Rooftop | 350 | Weather backup needed |\n| Glasshouse | 400 | Higher F&B minimum |\n| Marina Pavilion | 380 | Best transport links |' },
    ],
  },

  // ============================ 7. CANCELLED ============================
  {
    title: 'Regional Vendor Expo (Cancelled)',
    description: 'Supplier showcase for regional offices. Cancelled after the venue became unavailable; to be re-planned next quarter.',
    location: 'Expo Hall 2 (released)',
    startsAt: dayAt(35, 9),
    endsAt: dayAt(35, 17),
    capacity: 300,
    status: 'cancelled',
    createdAt: dayAt(-70, 10),
    staff: ['carlos', 'priya'],
    schedule: [
      T('venue', 'Venue booking (released)', 'carlos', -D(60), 60, 'Done'),
      T('inform', 'Notify exhibitors of cancellation', 'priya', -D(40), 120, 'Done'),
    ],
    floors: [],
    incidents: [],
    inventory: [],
    vendors: [
      { k: 'hall', name: 'Expo Hall Rentals', type: 'Venue', contactName: 'Ken Soh', phone: '+65 6555 0601', email: 'hire@expohall.example', website: 'https://expohall.example', address: '1 Expo Drive, Singapore', stage: 'Rejected', scope: 'Hall 2 rental', notes: 'Venue became unavailable.' },
    ],
    documents: [],
  },
];

// ---------------------------------------------------------------- builders
const buildFloors = (floors, ids) =>
  floors.map((f) => {
    const used = {};
    return {
      name: f.name,
      rooms: f.rooms.map(([id, name, x, y, w, h, cap, color]) => ({ id, name, x, y, width: w, height: h, capacity: cap, color })),
      placements: f.people.map(([who, roomId, px, py]) => {
        if (!roomId) return { user: ids[who], roomId: null, x: px, y: py };
        const r = f.rooms.find((room) => room[0] === roomId);
        const i = (used[roomId] = (used[roomId] ?? -1) + 1);
        return { user: ids[who], roomId, x: r[2] + 36 + (i % 3) * 56, y: r[3] + 44 + Math.floor(i / 3) * 56 };
      }),
    };
  });

let vendorPin = 0;
const pin = () => {
  const i = vendorPin++;
  return { latitude: +(CITY.lat + (((i * 7) % 11) - 5) * 0.004).toFixed(5), longitude: +(CITY.lng + (((i * 5) % 13) - 6) * 0.004).toFixed(5) };
};

async function wipe(fresh) {
  if (fresh) {
    await Promise.all([User, Event, Schedule, FloorPlan, Incident, Inventory, EventVendor, Doc, AgentConversation, AgentAction].map((M) => M.deleteMany({})));
    return;
  }
  const rx = new RegExp(`@${DOMAIN.replace(/\./g, '\\.')}$`, 'i');
  const uids = (await User.find({ email: rx }).select('_id')).map((u) => u._id);
  const eids = (await Event.find({ organizer: { $in: uids } }).select('_id')).map((e) => e._id);
  await Promise.all([Schedule, FloorPlan, Incident, Inventory, EventVendor, Doc].map((M) => M.deleteMany({ event: { $in: eids } })));
  await Event.deleteMany({ _id: { $in: eids } });
  await AgentConversation.deleteMany({ user: { $in: uids } });
  await AgentAction.deleteMany({ user: { $in: uids } });
  await User.deleteMany({ _id: { $in: uids } });
}

// ---------------------------------------------------------------- main
async function main() {
  const fresh = process.argv.includes('--fresh');
  await mongoose.connect(MONGO_URI);
  console.log(`Connected: ${MONGO_URI}`);
  await wipe(fresh);

  // users
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const ids = {};
  for (const [key, [name, role]] of Object.entries(PEOPLE)) {
    const u = await User.create({ name, email: emailOf(name), passwordHash, role });
    ids[key] = u._id;
  }

  const counts = { events: 0, tasks: 0, incidents: 0, inventory: 0, vendors: 0, documents: 0, floorplans: 0 };

  for (const def of EVENTS) {
    const event = await Event.create({
      title: def.title,
      description: def.description,
      location: def.location,
      startsAt: def.startsAt,
      endsAt: def.endsAt,
      capacity: def.capacity,
      status: def.status,
      organizer: ids.alex,
      staff: def.staff.map((k) => ids[k]),
      createdAt: def.createdAt,
    });
    counts.events++;

    // schedule (dependencies reference earlier tasks in the same list)
    const made = {};
    for (const t of def.schedule) {
      const startsAt = plus(def.startsAt, t.start);
      made[t.key] = await Schedule.create({
        event: event._id,
        name: t.name,
        owner: ids[t.owner],
        startsAt,
        endsAt: plus(startsAt, t.dur),
        status: t.status,
        dependsOn: t.dep ? made[t.dep]._id : null,
        delayMinutes: t.delay,
      });
      counts.tasks++;
    }

    // floor plan (placements are staff-only, per the API's validation)
    if (def.floors.length) {
      await FloorPlan.create({ event: event._id, floors: buildFloors(def.floors, ids) });
      counts.floorplans++;
    }

    // incidents
    for (const i of def.incidents) {
      await Incident.create({
        event: event._id,
        title: i.title,
        description: i.description,
        location: i.location,
        priority: i.priority,
        status: i.status,
        reportedBy: ids[i.by],
        assignedTo: ids[i.to],
        resolvedAt: i.res !== undefined ? plus(def.startsAt, i.res) : null,
        createdAt: plus(def.startsAt, i.at),
      });
      counts.incidents++;
    }

    // inventory
    if (def.inventory.length) {
      await Inventory.insertMany(
        def.inventory.map(([name, category, stock, maxStock, location, status]) => ({ event: event._id, name, category, stock, maxStock, location, status }))
      );
      counts.inventory += def.inventory.length;
    }

    // procurement pipeline
    const vendorId = {};
    for (const v of def.vendors) {
      const { k, ...fields } = v;
      const doc = await EventVendor.create({ ...fields, ...pin(), currency: CURRENCY, event: event._id });
      vendorId[k] = doc._id;
      counts.vendors++;
    }

    // documents
    for (const d of def.documents) {
      await Doc.create({
        event: event._id,
        title: d.t,
        category: d.c,
        status: d.s,
        vendor: d.v ? vendorId[d.v] : null,
        amount: d.a,
        currency: d.a !== undefined ? CURRENCY : undefined,
        dueDate: d.due !== undefined ? dayAt(d.due, 17) : undefined,
        content: d.body || '',
        createdBy: ids.alex,
      });
      counts.documents++;
    }
  }

  console.log('\nSeeded:', counts);
  console.log('\nDemo logins (password for all: %s)', PASSWORD);
  console.log(`  Organizer (Operations Manager): ${emailOf(PEOPLE.alex[0])}`);
  console.log(`  Staff example:                  ${emailOf(PEOPLE.marcus[0])}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
