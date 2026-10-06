/**
 * Demo seed for EventHQ — Islington College clubs workspace (Kathmandu, Nepal).
 *
 *   node seed/seed.js            re-seed (removes only data created by a previous seed run)
 *   node seed/seed.js --fresh    wipe EVERY collection first (clean demo database)
 *
 * Place at backend/seed/seed.js. Uses the app's own Mongoose models, so validation
 * (enums, endsAt >= startsAt, etc.) applies exactly as in the app.
 * All dates are relative to "now", so the workspace always looks current.
 *
 * Vendor businesses and their contacts are fictional placeholders (phones/emails are fake).
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
const DOMAIN = 'clubs.example'; // all seeded users get name@clubs.example
const PASSWORD = process.env.SEED_PASSWORD || 'Demo@1234';
const CURRENCY = 'NPR';
const CITY = { lat: 27.7172, lng: 85.324 }; // Kathmandu — vendor map pins cluster here
const ORGANIZER = 'sworna'; // the demo login (the only organizer); change the key to switch

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
// key: [full name, role]; the comment is the person's role in the club (User has no title field).
const PEOPLE = {
  sworna: ['Sworna Tuladhar', 'organizer'], // club lead / organizer
  aashutosh: ['Aashutosh Dhungana', 'staff'], // tech & hackathon lead
  nozomi: ['Nozomi Giri', 'staff'], // design & branding
  priyanka: ['Priyanka Khatri', 'staff'], // sponsorship & outreach
  ayusha: ['Ayusha Shrestha', 'staff'], // logistics & operations
  drishya: ['Drishya Karki', 'staff'], // volunteer coordinator
  bibek: ['Bibek Thapa', 'staff'], // AV & tech support
  sabina: ['Sabina Rai', 'staff'], // registration & front desk
  anish: ['Anish Gurung', 'staff'], // treasurer
  kritika: ['Kritika Basnet', 'staff'], // social media & content
  rohan: ['Rohan Maharjan', 'staff'], // speaker liaison
  suman: ['Suman Lama', 'staff'], // venue & college admin liaison
  samikshya: ['Samikshya Poudel', 'staff'], // food & refreshments
  pratik: ['Pratik Adhikari', 'staff'], // photography & media
  rojina: ['Rojina Bhandari', 'staff'], // mentors & judges liaison
  niraj: ['Niraj Subedi', 'staff'], // safety & crowd management
};
const emailOf = (name) => `${name.toLowerCase().replace(/[^a-z ]/g, '').replace(/ /g, '.')}@${DOMAIN}`;

// ---------------------------------------------------------------- DSL helper
// Schedule task. `start` = minutes relative to the event's startsAt. `dep` = key of an earlier task.
const T = (key, name, owner, start, dur, status = 'Pending', dep = null, delay = 0) => ({
  key, name, owner, start, dur, status, dep, delay,
});

// ---------------------------------------------------------------- events
const EVENTS = [
  // ====================== 1. LIVE NOW — GDG on Campus ======================
  {
    title: 'GDG on Campus Islington — Build with AI Study Jam',
    description:
      'Hands-on study jam with Google Developer Group on Campus: build a small AI-powered app in teams, with mentor help and a mini demo round. 120 students from BIT and BSc Computing batches.',
    location: 'Islington College, Kamalpokhari — Lab Block & Seminar Hall',
    startsAt: ago(120),
    endsAt: ahead(240),
    capacity: 120,
    status: 'published',
    createdAt: dayAt(-28, 11),
    staff: ['aashutosh', 'rojina', 'bibek', 'sabina', 'samikshya', 'drishya', 'pratik', 'niraj', 'kritika', 'suman'],
    schedule: [
      T('permit', 'Get permission letter signed by the Program Leader', 'suman', -D(14), 60, 'Done'),
      T('lab', 'Book Lab 2 & Lab 3 with IT department', 'suman', -D(12), 45, 'Done'),
      T('reg', 'Open Google Form registration & cap at 120', 'sabina', -D(10), 60, 'Done'),
      T('mentors', 'Confirm 8 mentors from the GDG core team', 'rojina', -D(7), 90, 'Done'),
      T('swag', 'Collect stickers & swag from GDG kit', 'drishya', -D(3), 60, 'Done'),
      T('wifi', 'Check lab Wi-Fi bandwidth with IT department', 'bibek', -D(1), 45, 'Done'),
      T('setup', 'Set up labs, projector & extension boards', 'drishya', -90, 60, 'Done'),
      T('checkin', 'Registration & check-in desk', 'sabina', -60, 90, 'Done'),
      T('welcome', 'Welcome & intro to Gemini API', 'aashutosh', 0, 45, 'Done', 'setup'),
      T('build', 'Team build sprint', 'rojina', 45, 150, 'In Progress', 'welcome'),
      T('snacks', 'Snack & chiya break', 'samikshya', 120, 30, 'In Progress', null, 20),
      T('stream', 'Livestream mini demos to the GDG Discord', 'bibek', 195, 60, 'Blocked', 'build'),
      T('demos', 'Mini demo round (3 min per team)', 'aashutosh', 195, 75, 'Pending', 'build'),
      T('feedback', 'Feedback form & certificate list', 'sabina', 270, 30, 'Pending', 'demos'),
      T('cleanup', 'Lab cleanup & equipment return', 'drishya', 300, 60, 'Pending', 'demos'),
      T('recap', 'Post recap & photos on Instagram / LinkedIn', 'kritika', D(1) + 600, 60, 'Pending'),
    ],
    floors: [
      {
        name: 'Lab Block',
        rooms: [
          ['lab2', 'Lab 2 — Build Zone', 40, 40, 336, 240, 60, '#e4f7f9'],
          ['lab3', 'Lab 3 — Build Zone', 416, 40, 336, 240, 60, '#e8f0e0'],
          ['mentor', 'Mentor Corner', 40, 320, 216, 144, 10, '#ece6f5'],
          ['reg', 'Registration Desk', 296, 320, 192, 120, 20, '#fff4cc'],
        ],
        people: [['rojina', 'mentor'], ['bibek', 'lab2'], ['aashutosh', 'lab3'], ['sabina', 'reg'], ['drishya', 'lab2']],
      },
      {
        name: 'Seminar Hall',
        rooms: [
          ['hall', 'Seminar Hall', 40, 40, 456, 264, 150, '#e4f7f9'],
          ['cafe', 'Chiya & Snacks Table', 536, 40, 216, 120, 40, '#fdebd0'],
        ],
        people: [['samikshya', 'cafe'], ['pratik', 'hall'], ['niraj', null, 520, 220], ['kritika', 'hall']],
      },
    ],
    incidents: [
      { title: 'Lab Wi-Fi crawling — 100+ laptops on one access point', description: 'API calls timing out during the build sprint. Asked IT to prioritise the lab VLAN and shared a phone hotspot as backup.', location: 'Lab 2 — Build Zone', priority: 'Critical', status: 'In Progress', by: 'rojina', to: 'bibek', at: 70 },
      { title: 'Extension boards overloaded in Lab 3', description: 'Breaker tripped on the back row twice. Redistribute laptops across two boards and add another one.', location: 'Lab 3 — Build Zone', priority: 'Critical', status: 'Open', by: 'niraj', to: 'drishya', at: 95 },
      { title: 'Chiya ran out before the second batch of students', description: 'Flask refill requested from the canteen.', location: 'Chiya & Snacks Table', priority: 'Medium', status: 'Open', by: 'samikshya', to: 'samikshya', at: 112 },
      { title: 'Projector HDMI not detected', description: 'Swapped to the backup cable and rebooted. Fixed.', location: 'Seminar Hall', priority: 'Medium', status: 'Resolved', by: 'aashutosh', to: 'bibek', at: 5, res: 20 },
      { title: 'Registration list missing 6 walk-ins', description: 'Added manually and flagged for the certificate list.', location: 'Registration Desk', priority: 'Low', status: 'Resolved', by: 'sabina', to: 'sabina', at: -30, res: -10 },
    ],
    inventory: [
      ['Extension boards', 'Electrical', 8, 20, 'Lab 3 storage', 'Low Stock'],
      ['Mobile hotspot devices', 'Network', 2, 3, 'Lab 2 Mentor Corner', 'Checked Out'],
      ['Projector HDMI & USB-C cables', 'AV', 4, 8, 'Seminar Hall', 'Available'],
      ['GDG stickers', 'Swag', 85, 150, 'Registration Desk', 'Available'],
      ['Participant name tags', 'Registration', 130, 150, 'Registration Desk', 'Available'],
      ['Chiya flasks (5 L)', 'Refreshments', 1, 4, 'Chiya & Snacks Table', 'Low Stock'],
      ['Water jars', 'Refreshments', 6, 10, 'Seminar Hall', 'Available'],
      ['Printed certificates', 'Stationery', 0, 130, 'Thamel Print House', 'Ordered'],
      ['Wireless mic', 'AV', 1, 2, 'Seminar Hall', 'Damaged'],
    ],
    vendors: [
      { k: 'cloud', name: 'Cloud Kitchen Kathmandu', type: 'Catering', contactName: 'Sanjay Pradhan', phone: '+977 9801000123', email: 'orders@cloudkitchen-ktm.example', website: 'https://cloudkitchen-ktm.example', address: 'Kamalpokhari, Kathmandu', stage: 'Booked', scope: 'Veg & non-veg snack boxes and chiya for 130 people', quoteAmount: 28000 },
      { k: 'himal', name: 'Himalayan Sound & Lights', type: 'AV', contactName: 'Pasang Sherpa', phone: '+977 9801000145', email: 'book@himalayansound.example', website: 'https://himalayansound.example', address: 'Putalisadak, Kathmandu', stage: 'Booked', scope: 'PA, 2 mics and 1 projector for seminar hall', quoteAmount: 12000 },
      { k: 'thamel', name: 'Thamel Print House', type: 'Printing', contactName: 'Rajesh Joshi', phone: '+977 9801000167', email: 'hello@thamelprint.example', website: 'https://thamelprint.example', address: 'Thamel, Kathmandu', stage: 'Quoted', scope: 'Certificates, name tags and posters', quoteAmount: 6500 },
      { k: 'isp', name: 'FiberLink Nepal (backup uplink)', type: 'Internet', contactName: 'Sunita Karn', phone: '+977 9801000189', email: 'sales@fiberlink.example', website: 'https://fiberlink.example', address: 'Baneshwor, Kathmandu', stage: 'RFQ Sent', scope: 'Temporary dedicated 200 Mbps line for the lab block', notes: 'Chasing a same-day install; the livestream is blocked on this.' },
    ],
    documents: [
      { t: 'Permission Letter — GDG Study Jam (College Admin)', c: 'Permit', s: 'Approved', due: -14, body: 'Letter signed by the Program Leader for lab and seminar hall use, 10:00–16:00.' },
      { t: 'Cloud Kitchen — Quote (Snack Boxes)', c: 'Quote', s: 'Approved', v: 'cloud', a: 28000, due: -5 },
      { t: 'Himalayan Sound — Booking Confirmation', c: 'Contract', s: 'Signed', v: 'himal', a: 12000, due: -3 },
      { t: 'Thamel Print — Certificates & Name Tags', c: 'Quote', s: 'Received', v: 'thamel', a: 6500, due: 2 },
      { t: 'RFQ — Temporary Lab Internet Line', c: 'RFQ', s: 'Sent', v: 'isp', due: 1, body: 'Request for a same-day temporary 200 Mbps line for 120 students building AI demos.' },
      { t: 'Study Jam Run Sheet', c: 'Plan', s: 'Approved', body: '| Time | Item |\n|---|---|\n| 10:00 | Check-in |\n| 11:00 | Welcome & Gemini API intro |\n| 11:45 | Build sprint |\n| 14:15 | Mini demos |\n| 15:30 | Feedback & certificates |' },
    ],
  },

  // ====================== 2. COMPLETED — Islington Hackathon 2026 ======================
  {
    title: 'Islington Hackathon 2026',
    description:
      'Our flagship 24-hour inter-college hackathon. 60 teams, 220 participants, 3 tracks (EdTech, HealthTech, Smart Kathmandu), mentors from local startups and a prize pool for the top five.',
    location: 'Islington College, Kamalpokhari — Main Auditorium & Lab Block',
    startsAt: dayAt(-16, 10),
    endsAt: dayAt(-15, 10),
    capacity: 240,
    status: 'published',
    createdAt: dayAt(-90, 10),
    staff: ['aashutosh', 'nozomi', 'priyanka', 'ayusha', 'drishya', 'bibek', 'sabina', 'anish', 'kritika', 'rojina', 'suman', 'samikshya', 'pratik', 'niraj'],
    schedule: [
      T('sponsor', 'Pitch & close sponsors (prize pool + food)', 'priyanka', -D(60), 240, 'Done'),
      T('brand', 'Design logo, posters & social media kit', 'nozomi', -D(45), 300, 'Done'),
      T('open', 'Open registrations & team formation channel on Discord', 'aashutosh', -D(40), 90, 'Done'),
      T('judges', 'Confirm judging panel & mentors', 'rojina', -D(25), 120, 'Done'),
      T('budget', 'Approve final budget with treasurer', 'sworna', -D(21), 60, 'Done'),
      T('venue', 'Book auditorium, labs & overnight access permission', 'suman', -D(18), 90, 'Done'),
      T('swag', 'Order T-shirts, stickers & name tags', 'ayusha', -D(10), 120, 'Done'),
      T('setup', 'Venue setup: tables, extension boards & Wi-Fi', 'drishya', -240, 210, 'Done'),
      T('checkin', 'Participant check-in & swag distribution', 'sabina', -60, 90, 'Done', 'setup'),
      T('opening', 'Opening ceremony & rules briefing', 'sworna', 0, 60, 'Done', 'setup'),
      T('hacking', '24-hour hacking begins', 'aashutosh', 60, 1080, 'Done', 'opening'),
      T('midnight', 'Midnight snack & chiya run', 'samikshya', 780, 60, 'Done'),
      T('mentoring', 'Mentor rounds (every 4 hours)', 'rojina', 240, 900, 'Done', 'hacking'),
      T('submit', 'Project submission deadline', 'aashutosh', 1140, 60, 'Done', 'hacking'),
      T('judging', 'Judging & demo rounds', 'rojina', 1200, 150, 'Done', 'submit'),
      T('awards', 'Awards & closing ceremony', 'sworna', 1350, 60, 'Done', 'judging'),
      T('prizes', 'Transfer prize money & sponsor thank-yous', 'anish', D(3), 90, 'Done', 'awards'),
      T('report', 'Publish sponsor report & photo album', 'kritika', D(5), 120, 'Done', 'awards'),
    ],
    floors: [
      {
        name: 'Main Auditorium',
        rooms: [
          ['stage', 'Stage & Judges Panel', 40, 40, 504, 120, 12, '#ece6f5'],
          ['hack', 'Hacking Floor', 40, 190, 504, 290, 160, '#e4f7f9'],
          ['reg', 'Check-in & Swag Desk', 584, 40, 192, 128, 20, '#fff4cc'],
          ['food', 'Food & Chiya Counter', 584, 200, 192, 140, 60, '#fdebd0'],
        ],
        people: [['suman', 'stage'], ['sabina', 'reg'], ['samikshya', 'food'], ['aashutosh', 'hack'], ['bibek', 'hack'], ['pratik', 'hack']],
      },
      {
        name: 'Lab Block',
        rooms: [
          ['lab1', 'Lab 1 — Teams 1–20', 40, 40, 264, 216, 60, '#e4f7f9'],
          ['lab2', 'Lab 2 — Teams 21–40', 344, 40, 264, 216, 60, '#e8f0e0'],
          ['lab3', 'Lab 3 — Teams 41–60', 648, 40, 264, 216, 60, '#fff4cc'],
          ['rest', 'Quiet Rest Room', 40, 296, 264, 144, 20, '#fbe3e8'],
          ['mentor', 'Mentor Lounge', 344, 296, 264, 144, 15, '#ece6f5'],
        ],
        people: [['rojina', 'mentor'], ['drishya', 'lab1'], ['niraj', 'rest'], ['ayusha', 'lab2'], ['kritika', 'lab3']],
      },
    ],
    incidents: [
      { title: 'Power fluctuation in Lab 2 around 2 AM', description: 'Brief outage in Lab 2. Inverter backup kicked in; no work lost, but two teams lost their live demos.', location: 'Lab 2 — Teams 21–40', priority: 'Critical', status: 'Resolved', by: 'drishya', to: 'ayusha', at: 840, res: 870 },
      { title: 'Wi-Fi slowed to a crawl with 200+ devices', description: 'Added a second access point and moved mentors to hotspot. Speeds recovered within 40 minutes.', location: 'Hacking Floor', priority: 'Critical', status: 'Resolved', by: 'aashutosh', to: 'bibek', at: 300, res: 340 },
      { title: 'Chiya & snacks ran out at midnight', description: 'Late-night food order arrived 45 minutes late. Canteen opened early and restocked.', location: 'Food & Chiya Counter', priority: 'Medium', status: 'Resolved', by: 'samikshya', to: 'samikshya', at: 760, res: 820 },
      { title: 'Team locked out of the submission portal', description: 'Portal rejected the zip upload near the deadline. Extended the deadline by 10 minutes for all teams and shared the manual link.', location: 'Hacking Floor', priority: 'Medium', status: 'Resolved', by: 'sabina', to: 'aashutosh', at: 1120, res: 1150 },
      { title: 'Participant felt dizzy during overnight session', description: 'Moved to the rest room, given water and snacks; recovered after a short break.', location: 'Quiet Rest Room', priority: 'Low', status: 'Resolved', by: 'niraj', to: 'niraj', at: 900, res: 930 },
      { title: 'Extra T-shirt sizes requested', description: 'Ran out of XL. Noted for next year and promised delivery by courier.', location: 'Check-in & Swag Desk', priority: 'Low', status: 'Resolved', by: 'sabina', to: 'ayusha', at: -20, res: 60 },
    ],
    inventory: [
      ['Hackathon T-shirts', 'Swag', 8, 260, 'Check-in Desk', 'Low Stock'],
      ['Sticker packs', 'Swag', 40, 300, 'Check-in Desk', 'Available'],
      ['Participant name tags', 'Registration', 20, 260, 'Check-in Desk', 'Low Stock'],
      ['Extension boards', 'Electrical', 28, 30, 'Lab Block storage', 'Available'],
      ['Backup access points', 'Network', 2, 2, 'IT Room', 'Checked Out'],
      ['Energy drink cartons', 'Refreshments', 0, 20, 'Food & Chiya Counter', 'Available'],
      ['Chiya flasks (5 L)', 'Refreshments', 3, 8, 'Food & Chiya Counter', 'Available'],
      ['Winner trophies', 'Awards', 5, 5, 'Stage Table', 'Available'],
      ['Wireless mics', 'AV', 2, 4, 'Auditorium Booth', 'Damaged'],
      ['Printed certificates', 'Stationery', 220, 260, 'Club Office', 'Available'],
    ],
    vendors: [
      { k: 'bhoj', name: 'Bhoj Ghar Catering', type: 'Catering', contactName: 'Gita Maharjan', phone: '+977 9812000111', email: 'events@bhojghar.example', website: 'https://bhojghar.example', address: 'Kamalpokhari, Kathmandu', stage: 'Paid', scope: 'Dinner, midnight snacks and breakfast for 240 people', quoteAmount: 185000 },
      { k: 'himal', name: 'Himalayan Sound & Lights', type: 'AV', contactName: 'Pasang Sherpa', phone: '+977 9801000145', email: 'book@himalayansound.example', website: 'https://himalayansound.example', address: 'Putalisadak, Kathmandu', stage: 'Paid', scope: 'Stage, PA, projector and live camera', quoteAmount: 62000 },
      { k: 'ktmtees', name: 'KTM Tees & Merch', type: 'Merchandise', contactName: 'Anil Shakya', phone: '+977 9812000134', email: 'orders@ktmtees.example', website: 'https://ktmtees.example', address: 'Patan Dhoka, Lalitpur', stage: 'Paid', scope: '260 T-shirts, 300 sticker packs', quoteAmount: 78000 },
      { k: 'thamel', name: 'Thamel Print House', type: 'Printing', contactName: 'Rajesh Joshi', phone: '+977 9801000167', email: 'hello@thamelprint.example', website: 'https://thamelprint.example', address: 'Thamel, Kathmandu', stage: 'Paid', scope: 'Banners, name tags and certificates', quoteAmount: 24500 },
      { k: 'isp', name: 'FiberLink Nepal (backup uplink)', type: 'Internet', contactName: 'Sunita Karn', phone: '+977 9801000189', email: 'sales@fiberlink.example', website: 'https://fiberlink.example', address: 'Baneshwor, Kathmandu', stage: 'Paid', scope: 'Dedicated 300 Mbps line for 24 hours', quoteAmount: 35000 },
      { k: 'power', name: 'PowerBackup Solutions', type: 'Power', contactName: 'Dipesh Karmacharya', phone: '+977 9812000156', email: 'rent@powerbackup.example', website: 'https://powerbackup.example', address: 'Kalimati, Kathmandu', stage: 'Paid', scope: 'Inverter & generator rental for lab block', quoteAmount: 18000 },
      { k: 'shoot', name: 'Pixel Pahad Studios', type: 'Photography', contactName: 'Utsav Khadka', phone: '+977 9812000178', email: 'shoot@pixelpahad.example', website: 'https://pixelpahad.example', address: 'Jhamsikhel, Lalitpur', stage: 'Rejected', scope: 'Event photo & video package', quoteAmount: 55000, notes: 'Over budget. Our own media team shot the event instead.' },
    ],
    documents: [
      { t: 'Hackathon Budget & Sponsor Plan', c: 'Plan', s: 'Approved', due: -60, body: '## Budget summary (NPR)\n\n| Item | Amount |\n|---|---|\n| Food & refreshments | 185,000 |\n| Stage, AV & lighting | 62,000 |\n| Merchandise | 78,000 |\n| Backup internet & power | 53,000 |\n| Print | 24,500 |\n| Prize pool | 300,000 |\n\nFunded by sponsors and college support.' },
      { t: 'Prize Pool Agreement — Sponsors', c: 'Contract', s: 'Signed', a: 300000, due: -40, body: 'Sponsor commitments for first to fifth place prizes, payable within 7 days of the event.' },
      { t: 'Bhoj Ghar — Catering Invoice', c: 'Invoice', s: 'Paid', v: 'bhoj', a: 185000, due: -10 },
      { t: 'Himalayan Sound — Invoice', c: 'Invoice', s: 'Paid', v: 'himal', a: 62000, due: -10 },
      { t: 'KTM Tees — T-shirt Order Receipt', c: 'Receipt', s: 'Paid', v: 'ktmtees', a: 78000, due: -20 },
      { t: 'Overnight Access Permission', c: 'Permit', s: 'Approved', due: -17, body: 'College admin approval for building access from 06:00 to 18:00 the next day, with guard and caretaker assigned.' },
      { t: 'Hackathon Final Report', c: 'Plan', s: 'Approved', body: '## Highlights\n- 60 teams, 220 participants\n- 3 tracks, 14 mentors, 6 judges\n- Total spend NPR 427,000\n- Biggest lesson: add a second Wi-Fi access point from the start.' },
    ],
  },

  // ====================== 3. UPCOMING — Guest Speaker Session ======================
  {
    title: "Guest Speaker Session — Founders' Fireside",
    description:
      'Fireside chat with a Nepali startup founder on building products in Nepal: first customers, fundraising, hiring and failing forward. Open to all students, with a 20-minute Q&A and networking over chiya.',
    location: 'Islington College, Kamalpokhari — Seminar Hall',
    startsAt: dayAt(3, 14),
    endsAt: dayAt(3, 16, 30),
    capacity: 150,
    status: 'published',
    createdAt: dayAt(-18, 10),
    staff: ['rohan', 'kritika', 'sabina', 'pratik', 'samikshya', 'suman'],
    schedule: [
      T('invite', 'Send speaker invite & confirm date', 'rohan', -D(14), 60, 'Done'),
      T('topic', 'Agree topic, bio & talking points with speaker', 'rohan', -D(10), 90, 'Done'),
      T('hall', 'Book seminar hall & get permission letter', 'suman', -D(8), 60, 'Done'),
      T('poster', 'Design poster & announce on socials', 'kritika', -D(7), 120, 'Done'),
      T('rsvp', 'Open RSVP form & share in batch groups', 'sabina', -D(6), 45, 'In Progress'),
      T('pickup', 'Arrange speaker pick-up & parking', 'rohan', -D(1), 30, 'Pending'),
      T('mc', 'Prepare MC script & speaker introduction', 'rohan', -120, 60, 'Pending', 'topic'),
      T('setup', 'Hall setup: mic, projector & seating', 'suman', -90, 60),
      T('talk', 'Fireside chat', 'rohan', 0, 70, 'Pending', 'setup'),
      T('qa', 'Audience Q&A', 'rohan', 70, 30, 'Pending', 'talk'),
      T('network', 'Chiya & networking', 'samikshya', 100, 50),
      T('thanks', 'Thank-you note & share session photos', 'kritika', D(1), 60, 'Pending', 'network'),
    ],
    floors: [],
    incidents: [],
    inventory: [
      ['Wireless mics', 'AV', 2, 2, 'Seminar Hall', 'Available'],
      ['Speaker memento (khada & plaque)', 'Gifts', 1, 1, 'Club Office', 'Available'],
      ['Feedback QR standees', 'Stationery', 0, 4, 'Thamel Print House', 'Ordered'],
      ['Chiya flasks (5 L)', 'Refreshments', 4, 4, 'Club Office', 'Available'],
    ],
    vendors: [
      { k: 'cloud', name: 'Cloud Kitchen Kathmandu', type: 'Catering', contactName: 'Sanjay Pradhan', phone: '+977 9801000123', email: 'orders@cloudkitchen-ktm.example', website: 'https://cloudkitchen-ktm.example', address: 'Kamalpokhari, Kathmandu', stage: 'Quoted', scope: 'Chiya and light snacks for 150', quoteAmount: 18000 },
      { k: 'pixel', name: 'Pixel Pahad Studios', type: 'Photography', contactName: 'Utsav Khadka', phone: '+977 9812000178', email: 'shoot@pixelpahad.example', website: 'https://pixelpahad.example', address: 'Jhamsikhel, Lalitpur', stage: 'Shortlisted', scope: 'Half-day coverage and 30 edited photos', quoteAmount: 8000 },
    ],
    documents: [
      { t: 'Speaker Brief & Talking Points', c: 'Plan', s: 'Approved', body: '## Topics\n1. How I found my first 10 customers\n2. Fundraising in Nepal: what actually works\n3. Hiring when nobody wants to join a startup\n4. One failure we learned from' },
      { t: 'Speaker Honorarium & Travel Note', c: 'Other', s: 'Draft', a: 5000, due: 3, body: 'Token of appreciation and fuel reimbursement. Awaiting treasurer approval.' },
      { t: 'Cloud Kitchen — Snack Quote', c: 'Quote', s: 'Received', v: 'cloud', a: 18000, due: 1 },
    ],
  },

  // ====================== 4. UPCOMING — Figma ======================
  {
    title: 'Figma Friends Kathmandu — Design Systems Night',
    description:
      'Evening community meetup for Nepali designers and students: lightning talks, a live component-library teardown and a hands-on workshop on design tokens and variables in Figma.',
    location: 'Jhamsikhel Co-working Loft, Lalitpur',
    startsAt: dayAt(6, 17),
    endsAt: dayAt(6, 20, 30),
    capacity: 80,
    status: 'published',
    createdAt: dayAt(-21, 12),
    staff: ['nozomi', 'kritika', 'sabina', 'pratik', 'samikshya', 'drishya'],
    schedule: [
      T('venue', 'Book co-working loft', 'nozomi', -D(20), 60, 'Done'),
      T('speakers', 'Confirm 3 lightning-talk speakers', 'nozomi', -D(15), 120, 'Done'),
      T('brand', 'Design event poster & Figma-themed stickers', 'nozomi', -D(12), 240, 'Done'),
      T('rsvp', 'Open RSVP & share in design communities', 'kritika', -D(10), 60, 'Done'),
      T('workshop', 'Prepare workshop Figma file & duplicate links', 'nozomi', -D(4), 180, 'In Progress'),
      T('swag', 'Print stickers & name tags', 'drishya', -D(3), 90, 'Pending'),
      T('snacks', 'Order snacks & drinks', 'samikshya', -D(2), 45, 'Pending'),
      T('setup', 'Set up chairs, screen & power strips', 'drishya', -90, 60),
      T('checkin', 'Check-in & name tags', 'sabina', -30, 45, 'Pending', 'setup'),
      T('talks', 'Lightning talks (3 × 10 min)', 'nozomi', 0, 45, 'Pending', 'setup'),
      T('teardown', 'Live design-system teardown', 'nozomi', 45, 40, 'Pending', 'talks'),
      T('hands', 'Hands-on workshop: variables & tokens', 'nozomi', 85, 60, 'Pending', 'teardown'),
      T('social', 'Networking & photos', 'pratik', 145, 45, 'Pending', 'hands'),
    ],
    floors: [
      {
        name: 'Co-working Loft',
        rooms: [
          ['main', 'Main Room', 40, 40, 408, 264, 80, '#e4f7f9'],
          ['bar', 'Snacks & Drinks', 488, 40, 216, 120, 25, '#fdebd0'],
          ['desk', 'Check-in Desk', 488, 200, 216, 104, 10, '#fff4cc'],
          ['gallery', 'Sticker & Poster Wall', 40, 344, 264, 120, 20, '#ece6f5'],
        ],
        people: [['nozomi', 'main'], ['sabina', 'desk'], ['samikshya', 'bar'], ['pratik', 'main'], ['drishya', 'main'], ['kritika', 'gallery']],
      },
    ],
    incidents: [],
    inventory: [
      ['Figma-themed sticker packs', 'Swag', 0, 150, 'Thamel Print House', 'Ordered'],
      ['Name tags', 'Registration', 80, 100, 'Club Office', 'Available'],
      ['Power strips', 'Electrical', 5, 8, 'Club Office', 'Available'],
      ['HDMI to USB-C adapters', 'AV', 2, 4, 'Club Office', 'Low Stock'],
      ['Backdrop banner (3×6 ft)', 'Signage', 1, 1, 'Club Office', 'Available'],
    ],
    vendors: [
      { k: 'loft', name: 'Jhamsikhel Co-working Loft', type: 'Venue', contactName: 'Saugat Bista', phone: '+977 9823000101', email: 'hello@jhamloft.example', website: 'https://jhamloft.example', address: 'Jhamsikhel, Lalitpur', stage: 'Booked', scope: 'Evening hire with projector, Wi-Fi and chairs', quoteAmount: 15000 },
      { k: 'momo', name: 'Momo & More Catering', type: 'Catering', contactName: 'Pema Tamang', phone: '+977 9823000122', email: 'party@momomore.example', website: 'https://momomore.example', address: 'Pulchowk, Lalitpur', stage: 'Quoted', scope: 'Momo trays, samosa and drinks for 80', quoteAmount: 22000 },
      { k: 'thamel', name: 'Thamel Print House', type: 'Printing', contactName: 'Rajesh Joshi', phone: '+977 9801000167', email: 'hello@thamelprint.example', website: 'https://thamelprint.example', address: 'Thamel, Kathmandu', stage: 'Booked', scope: 'Stickers, posters and name tags', quoteAmount: 9500 },
    ],
    documents: [
      { t: 'Co-working Loft — Booking Confirmation', c: 'Contract', s: 'Signed', v: 'loft', a: 15000, due: -15 },
      { t: 'Momo & More — Catering Quote', c: 'Quote', s: 'Received', v: 'momo', a: 22000, due: 2 },
      { t: 'PO — Stickers & Posters', c: 'Purchase Order', s: 'Sent', v: 'thamel', a: 9500, due: 1 },
      { t: 'Workshop Outline — Variables & Tokens', c: 'Plan', s: 'Draft', body: '1. Why design systems matter\n2. Setting up variables and modes\n3. Building a themed button component\n4. Dev handoff checklist' },
    ],
  },

  // ====================== 5. UPCOMING — Leapfrog (AT RISK) ======================
  {
    title: 'Leapfrog Tech Talk & Internship Info Session',
    description:
      'Engineers from Leapfrog share how they build software, what they look for in interns and how to prepare for tech interviews, followed by an open Q&A and CV tips corner for students.',
    location: 'Islington College, Kamalpokhari — Main Auditorium',
    startsAt: dayAt(12, 13),
    endsAt: dayAt(12, 16),
    capacity: 220,
    status: 'published',
    createdAt: dayAt(-14, 10),
    staff: ['priyanka', 'rohan', 'suman', 'kritika', 'sabina', 'bibek'],
    schedule: [
      T('outreach', 'Outreach email & first call with company contact', 'priyanka', -D(12), 90, 'Done'),
      T('agenda', 'Agree agenda & speaker list', 'rohan', -D(9), 90, 'Blocked', 'outreach'),
      T('permit', 'College admin approval for external guests', 'suman', -D(8), 60, 'In Progress', null, 2880),
      T('poster', 'Poster & announcement', 'kritika', -D(7), 120, 'Pending', 'agenda'),
      T('rsvp', 'Open RSVP & CV collection form', 'sabina', -D(6), 60, 'Pending', 'agenda'),
      T('badges', 'Visitor passes for company team', 'suman', -D(2), 45, 'Pending', 'permit'),
      T('av', 'AV test with speaker slides', 'bibek', -120, 45, 'Pending', 'agenda'),
      T('talk', 'Tech talk & internship overview', 'rohan', 0, 75, 'Pending', 'av'),
      T('qa', 'Open Q&A', 'rohan', 75, 30, 'Pending', 'talk'),
      T('cv', 'CV tips corner', 'priyanka', 105, 60, 'Pending', 'qa'),
      T('thanks', 'Send thank-you & collect feedback', 'kritika', D(1), 60, 'Pending', 'cv'),
    ],
    floors: [],
    incidents: [],
    inventory: [
      ['Visitor passes', 'Registration', 0, 15, 'Club Office', 'Ordered'],
      ['CV tips handouts', 'Stationery', 0, 100, 'Thamel Print House', 'Ordered'],
      ['Wireless mics', 'AV', 2, 2, 'Auditorium Booth', 'Available'],
    ],
    vendors: [
      { k: 'himal', name: 'Himalayan Sound & Lights', type: 'AV', contactName: 'Pasang Sherpa', phone: '+977 9801000145', email: 'book@himalayansound.example', website: 'https://himalayansound.example', address: 'Putalisadak, Kathmandu', stage: 'Shortlisted', scope: 'Auditorium AV support (if the college booth is unavailable)' },
      { k: 'cloud', name: 'Cloud Kitchen Kathmandu', type: 'Catering', contactName: 'Sanjay Pradhan', phone: '+977 9801000123', email: 'orders@cloudkitchen-ktm.example', website: 'https://cloudkitchen-ktm.example', address: 'Kamalpokhari, Kathmandu', stage: 'RFQ Sent', scope: 'Light refreshments for 220 and 15 guests', notes: 'Waiting for a quote.' },
    ],
    documents: [
      { t: 'Outreach Email — Leapfrog (v2)', c: 'Other', s: 'Sent', body: 'Hello, we are the tech club at Islington College and would love to host a tech talk and internship info session for our students...' },
      { t: 'Permission Request — External Guests', c: 'Permit', s: 'Sent', due: -4, body: 'Request to the Program Leader to allow company staff on campus; awaiting reply.' },
      { t: 'RFQ — Refreshments for Info Session', c: 'RFQ', s: 'Sent', v: 'cloud', due: 4 },
      { t: 'Draft Agenda', c: 'Plan', s: 'Draft', body: '13:00 Welcome\n13:10 Engineering at Leapfrog\n13:50 Intern hiring Q&A\n14:25 CV tips corner' },
    ],
  },

  // ====================== 6. UPCOMING — Club Fair ======================
  {
    title: 'Club Fair & Freshers Welcome',
    description:
      'Annual open day where every student club sets up a stall to recruit new members: demos, games, performances and a quick-fire hackathon teaser. Expected footfall of around 800 students.',
    location: 'Islington College, Kamalpokhari — Main Ground & Atrium',
    startsAt: dayAt(25, 10),
    endsAt: dayAt(25, 16),
    capacity: 800,
    status: 'published',
    createdAt: dayAt(-10, 11),
    staff: ['ayusha', 'drishya', 'nozomi', 'kritika', 'bibek', 'niraj', 'samikshya', 'anish', 'suman'],
    schedule: [
      T('approve', 'Get permission & ground booking from admin', 'suman', -D(20), 60, 'Done'),
      T('invite', 'Invite all clubs & collect stall requests', 'drishya', -D(18), 90, 'Done'),
      T('map', 'Design stall layout & ground map', 'nozomi', -D(14), 180, 'In Progress'),
      T('budget', 'Approve budget with treasurer', 'sworna', -D(12), 45, 'Pending'),
      T('tents', 'Book tents, tables & chairs', 'ayusha', -D(10), 60, 'Pending'),
      T('perf', 'Schedule cultural performances', 'kritika', -D(8), 90),
      T('sound', 'Sound system & stage booking', 'bibek', -D(7), 45, 'Pending'),
      T('volunteers', 'Recruit & brief 25 volunteers', 'drishya', -D(5), 90, 'Pending', 'invite'),
      T('setup', 'Stall setup & signage', 'ayusha', -150, 120, 'Pending', 'tents'),
      T('open', 'Opening & ribbon cutting', 'sworna', 0, 30, 'Pending', 'setup'),
      T('fair', 'Club fair open hours', 'drishya', 30, 300, 'Pending', 'open'),
      T('stage', 'Stage performances & club teasers', 'kritika', 120, 150, 'Pending', 'sound'),
      T('cleanup', 'Cleanup & equipment return', 'ayusha', 360, 90, 'Pending', 'fair'),
    ],
    floors: [
      {
        name: 'Main Ground',
        rooms: [
          ['stalls', 'Stall Area (30 tents)', 40, 40, 552, 264, 500, '#e8f0e0'],
          ['stage', 'Performance Stage', 632, 40, 192, 144, 200, '#ece6f5'],
          ['food', 'Food Court', 632, 224, 192, 120, 80, '#fdebd0'],
          ['help', 'Help & Lost-and-Found', 40, 344, 192, 96, 6, '#fff4cc'],
          ['aid', 'First Aid Post', 272, 344, 160, 96, 6, '#fbe3e8'],
        ],
        people: [['ayusha', 'stalls'], ['drishya', 'help'], ['niraj', 'aid'], ['bibek', 'stage'], ['kritika', 'stage'], ['samikshya', 'food'], ['nozomi', 'stalls']],
      },
    ],
    incidents: [],
    inventory: [
      ['Tents (10×10 ft)', 'Furniture', 0, 30, 'Rental vendor', 'Ordered'],
      ['Tables', 'Furniture', 18, 40, 'College store', 'Low Stock'],
      ['Folding chairs', 'Furniture', 90, 200, 'College store', 'Available'],
      ['Volunteer T-shirts', 'Merchandise', 25, 30, 'Club Office', 'Available'],
      ['Stage speakers', 'AV', 2, 4, 'College store', 'Available'],
    ],
    vendors: [
      { k: 'tent', name: 'Everest Tents & Events', type: 'Rental', contactName: 'Mingma Lama', phone: '+977 9841000101', email: 'rent@everesttents.example', website: 'https://everesttents.example', address: 'Teku, Kathmandu', stage: 'Quoted', scope: '30 tents, 40 tables and 200 chairs for one day', quoteAmount: 68000 },
      { k: 'himal', name: 'Himalayan Sound & Lights', type: 'AV', contactName: 'Pasang Sherpa', phone: '+977 9801000145', email: 'book@himalayansound.example', website: 'https://himalayansound.example', address: 'Putalisadak, Kathmandu', stage: 'Shortlisted', scope: 'Stage and PA for performances' },
      { k: 'food', name: 'Chatpate Street Food Stalls', type: 'Catering', contactName: 'Ramesh Shahi', phone: '+977 9841000143', email: 'stalls@chatpate.example', website: 'https://chatpate.example', address: 'Putalisadak, Kathmandu', stage: 'Shortlisted', scope: '4 food stalls on commission' },
    ],
    documents: [
      { t: 'Ground Booking Permission', c: 'Permit', s: 'Approved', due: -18, body: 'Admin approval for the main ground and atrium from 08:00 to 18:00.' },
      { t: 'Everest Tents — Quote', c: 'Quote', s: 'Received', v: 'tent', a: 68000, due: 6 },
      { t: 'Club Fair Budget Request', c: 'Other', s: 'Draft', a: 140000, due: 8, body: 'Tents 68,000 · Sound 22,000 · Print 18,000 · Misc 32,000.' },
      { t: 'Ground Layout Map v1', c: 'Plan', s: 'Draft' },
    ],
  },

  // ====================== 7. DRAFT ======================
  {
    title: 'Tihar Cultural Night & Club Reunion',
    description:
      'Festive evening for all clubs and alumni: deusi-bhailo performances, a music jam, food stalls and a photo wall. Date and venue are still being finalised with the college.',
    location: 'College Atrium (TBC)',
    startsAt: dayAt(45, 16),
    endsAt: dayAt(45, 21),
    capacity: 300,
    status: 'draft',
    createdAt: dayAt(-3, 15),
    staff: ['kritika', 'nozomi', 'samikshya', 'drishya', 'suman', 'priyanka'],
    schedule: [
      T('date', 'Confirm date with college calendar', 'suman', -D(20), 45),
      T('theme', 'Agree theme & performances', 'kritika', -D(18), 90),
      T('budget', 'Draft budget & find sponsors', 'priyanka', -D(15), 120),
      T('decor', 'Plan decor: diyas, marigold & lights', 'nozomi', -D(12), 120, 'Pending', 'theme'),
    ],
    floors: [],
    incidents: [],
    inventory: [],
    vendors: [
      { k: 'decor', name: 'Marigold Decor Studio', type: 'Decor', contactName: 'Binita Rajbhandari', phone: '+977 9851000101', email: 'hello@marigolddecor.example', website: 'https://marigolddecor.example', address: 'Bhaktapur', stage: 'Shortlisted', scope: 'Marigold garlands, diyas and string lights' },
      { k: 'band', name: 'Sunkoshi Folk Band', type: 'Entertainment', contactName: 'Hari Gurung', phone: '+977 9851000122', email: 'book@sunkoshiband.example', website: 'https://sunkoshiband.example', address: 'Kirtipur', stage: 'Shortlisted', scope: 'Live folk set for 90 minutes' },
    ],
    documents: [
      { t: 'Cultural Night Concept Note', c: 'Plan', s: 'Draft', body: 'Deusi-bhailo performances, open mic, momo stalls, photo wall and an alumni reunion corner.' },
    ],
  },

  // ====================== 8. CANCELLED ======================
  {
    title: 'Inter-College Quiz Bowl (Cancelled)',
    description:
      'Tech and general-knowledge quiz bowl for five colleges. Cancelled because it clashed with mid-term exams; to be rescheduled next semester.',
    location: 'Seminar Hall (released)',
    startsAt: dayAt(18, 11),
    endsAt: dayAt(18, 15),
    capacity: 120,
    status: 'cancelled',
    createdAt: dayAt(-40, 10),
    staff: ['rojina', 'rohan'],
    schedule: [
      T('teams', 'Invite colleges & collect team lists', 'rohan', -D(25), 90, 'Done'),
      T('inform', 'Notify teams of cancellation', 'rojina', -D(10), 60, 'Done'),
    ],
    floors: [],
    incidents: [],
    inventory: [],
    vendors: [
      { k: 'quiz', name: 'QuizMaster Nepal', type: 'Entertainment', contactName: 'Prabin Neupane', phone: '+977 9861000101', email: 'host@quizmasternepal.example', website: 'https://quizmasternepal.example', address: 'Lazimpat, Kathmandu', stage: 'Rejected', scope: 'Professional quiz host', notes: 'Cancelled due to exam clash.' },
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
  return {
    latitude: +(CITY.lat + (((i * 7) % 11) - 5) * 0.004).toFixed(5),
    longitude: +(CITY.lng + (((i * 5) % 13) - 6) * 0.004).toFixed(5),
  };
};

async function wipe(fresh) {
  if (fresh) {
    await Promise.all(
      [User, Event, Schedule, FloorPlan, Incident, Inventory, EventVendor, Doc, AgentConversation, AgentAction].map((M) => M.deleteMany({}))
    );
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
      organizer: ids[ORGANIZER],
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
        def.inventory.map(([name, category, stock, maxStock, location, status]) => ({
          event: event._id, name, category, stock, maxStock, location, status,
        }))
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
        createdBy: ids[ORGANIZER],
      });
      counts.documents++;
    }
  }

  console.log('\nSeeded:', counts);
  console.log('\nDemo logins (password for all: %s)', PASSWORD);
  console.log(`  Organizer (sees everything):  ${emailOf(PEOPLE[ORGANIZER][0])}`);
  console.log(`  Staff (sees only own tasks):  ${emailOf(PEOPLE.aashutosh[0])}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
