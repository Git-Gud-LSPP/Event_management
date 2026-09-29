export type EventStatus = 'Live' | 'Upcoming' | 'Completed' | 'At Risk';
export type TaskStatus = 'Done' | 'In Progress' | 'Blocked' | 'Pending';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type StaffStatus = 'On Site' | 'Checked In' | 'Off Shift' | 'Unavailable';
export type InventoryStatus = 'Available' | 'Low Stock' | 'Damaged' | 'Checked Out' | 'Ordered';
export type VendorStatus = 'Confirmed' | 'Pending' | 'At Risk' | 'Delayed' | 'Cancelled';

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  type: string;
  staffCount: number;
  activeTasks: number;
  incidents: number;
  status: EventStatus;
  progress: number;
  description: string;
}

export interface Task {
  id: string;
  eventId: string;
  title: string;
  owner: string;
  ownerInitials: string;
  dueTime: string;
  startTime: string;
  duration: number;
  priority: 'High' | 'Medium' | 'Low';
  status: TaskStatus;
  dependsOn?: string;
  dependencyId?: string;
  category: string;
  delayMinutes?: number;
}

export interface StaffMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  status: StaffStatus;
  currentTask: string;
  attendance: string;
  phone: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  status: InventoryStatus;
  stock: number;
  maxStock: number;
  assignedTo: string;
  location: string;
}

export interface Vendor {
  id: string;
  name: string;
  service: string;
  eventId: string;
  contact: string;
  contactPhone: string;
  status: VendorStatus;
  procurement: string;
  amount: string;
}

export interface Incident {
  id: string;
  title: string;
  what: string;
  when: string;
  where: string;
  who: string;
  impact: string;
  resolution: string;
  severity: Severity;
  status: 'Open' | 'In Progress' | 'Resolved';
  eventId: string;
  category: string;
  timeAgo: string;
}

export interface DependencyChain {
  id: string;
  eventId: string;
  trigger: { label: string; type: 'delay' | 'risk' | 'blocked'; time: string };
  chain: Array<{ id: string; label: string; impact: string; severity: 'critical' | 'high' | 'medium' }>;
  suggestedAction: string;
}

export const events: Event[] = [
  {
    id: 'evt-1',
    name: 'TechSummit 2026',
    date: 'Aug 9, 2026 · 9:00 AM',
    location: 'Moscone Center, SF',
    type: 'Conference',
    staffCount: 48,
    activeTasks: 12,
    incidents: 2,
    status: 'Live',
    progress: 62,
    description: 'Annual technology summit with 5,000 attendees across 3 main stages and 12 breakout rooms.',
  },
  {
    id: 'evt-2',
    name: 'GreenFest Music Festival',
    date: 'Aug 15, 2026 · 2:00 PM',
    location: 'Golden Gate Park, SF',
    type: 'Festival',
    staffCount: 120,
    activeTasks: 34,
    incidents: 0,
    status: 'At Risk',
    progress: 41,
    description: 'Three-day outdoor music festival with 8 stages, food vendors, and 20,000 expected attendees.',
  },
  {
    id: 'evt-3',
    name: 'Meridian Corporate Gala',
    date: 'Aug 22, 2026 · 6:00 PM',
    location: 'The Fairmont, SF',
    type: 'Corporate',
    staffCount: 32,
    activeTasks: 18,
    incidents: 1,
    status: 'Upcoming',
    progress: 28,
    description: 'Annual awards ceremony and dinner for 600 executives from the Meridian Group.',
  },
  {
    id: 'evt-4',
    name: 'Design Week Opening',
    date: 'Sep 5, 2026 · 11:00 AM',
    location: 'SFMOMA, SF',
    type: 'Exhibition',
    staffCount: 18,
    activeTasks: 9,
    incidents: 0,
    status: 'Upcoming',
    progress: 15,
    description: 'Opening reception for the annual design week exhibition, curated for 800 guests.',
  },
  {
    id: 'evt-5',
    name: 'Founders Forum Q2',
    date: 'Jul 12, 2026 · 8:00 AM',
    location: 'Palace of Fine Arts, SF',
    type: 'Conference',
    staffCount: 24,
    activeTasks: 0,
    incidents: 0,
    status: 'Completed',
    progress: 100,
    description: 'Quarterly founders networking and pitch event. 300 attendees, 12 speakers.',
  },
  {
    id: 'evt-6',
    name: 'BioHorizon Summit',
    date: 'Jun 28, 2026 · 9:00 AM',
    location: 'UCSF Mission Bay',
    type: 'Conference',
    staffCount: 36,
    activeTasks: 0,
    incidents: 1,
    status: 'Completed',
    progress: 100,
    description: 'Life sciences and biotech conference with 1,200 researchers and investors.',
  },
];

export const tasks: Task[] = [
  // TechSummit 2026 tasks
  { id: 'tsk-1', eventId: 'evt-1', title: 'AV System Check — Main Stage', owner: 'Marcus Chen', ownerInitials: 'MC', dueTime: '9:00 AM', startTime: '7:00', duration: 60, priority: 'High', status: 'In Progress', category: 'Technical', delayMinutes: 15 },
  { id: 'tsk-2', eventId: 'evt-1', title: 'Speaker Green Room Setup', owner: 'Priya Nair', ownerInitials: 'PN', dueTime: '8:30 AM', startTime: '7:30', duration: 45, priority: 'High', status: 'Done', category: 'Logistics' },
  { id: 'tsk-3', eventId: 'evt-1', title: 'Catering Delivery — Lunch Service', owner: 'Tomas Varga', ownerInitials: 'TV', dueTime: '11:30 AM', startTime: '10:00', duration: 90, priority: 'Medium', status: 'Pending', dependsOn: 'Venue Clearance Checkpoint', dependencyId: 'tsk-9', category: 'Catering' },
  { id: 'tsk-4', eventId: 'evt-1', title: 'Registration Desk Open', owner: 'Aisha Okoye', ownerInitials: 'AO', dueTime: '8:00 AM', startTime: '7:45', duration: 30, priority: 'High', status: 'Done', category: 'Logistics' },
  { id: 'tsk-5', eventId: 'evt-1', title: 'Sound Check — Keynote Stage', owner: 'Marcus Chen', ownerInitials: 'MC', dueTime: '9:30 AM', startTime: '8:30', duration: 45, priority: 'High', status: 'Blocked', dependsOn: 'AV System Check — Main Stage', dependencyId: 'tsk-1', category: 'Technical', delayMinutes: 20 },
  { id: 'tsk-6', eventId: 'evt-1', title: 'Sponsor Booth Assembly', owner: 'James Liu', ownerInitials: 'JL', dueTime: '9:00 AM', startTime: '6:30', duration: 120, priority: 'Medium', status: 'Done', category: 'Logistics' },
  { id: 'tsk-7', eventId: 'evt-1', title: 'Keynote Rehearsal', owner: 'Priya Nair', ownerInitials: 'PN', dueTime: '10:00 AM', startTime: '9:30', duration: 30, priority: 'High', status: 'Blocked', dependsOn: 'Sound Check — Keynote Stage', dependencyId: 'tsk-5', category: 'Production', delayMinutes: 35 },
  { id: 'tsk-8', eventId: 'evt-1', title: 'Media Credentials Distribution', owner: 'Fatima Hassan', ownerInitials: 'FH', dueTime: '9:30 AM', startTime: '8:00', duration: 60, priority: 'Low', status: 'In Progress', category: 'Logistics' },
  { id: 'tsk-9', eventId: 'evt-1', title: 'Venue Clearance Checkpoint', owner: 'James Liu', ownerInitials: 'JL', dueTime: '10:00 AM', startTime: '9:30', duration: 30, priority: 'High', status: 'In Progress', category: 'Safety' },
  { id: 'tsk-10', eventId: 'evt-1', title: 'Stage Lighting Test — All Zones', owner: 'Marcus Chen', ownerInitials: 'MC', dueTime: '8:00 AM', startTime: '7:00', duration: 60, priority: 'Medium', status: 'Done', category: 'Technical' },
  // GreenFest tasks
  { id: 'tsk-11', eventId: 'evt-2', title: 'Stage 1 Structure Inspection', owner: 'Orion Webb', ownerInitials: 'OW', dueTime: 'Aug 12, 9:00 AM', startTime: '9:00', duration: 120, priority: 'High', status: 'Pending', category: 'Safety' },
  { id: 'tsk-12', eventId: 'evt-2', title: 'Vendor Equipment Delivery', owner: 'Selin Arslan', ownerInitials: 'SA', dueTime: 'Aug 13, 8:00 AM', startTime: '8:00', duration: 180, priority: 'High', status: 'Blocked', dependsOn: 'Stage 1 Structure Inspection', dependencyId: 'tsk-11', category: 'Logistics' },
  { id: 'tsk-13', eventId: 'evt-2', title: 'Security Briefing', owner: 'Orion Webb', ownerInitials: 'OW', dueTime: 'Aug 13, 2:00 PM', startTime: '14:00', duration: 60, priority: 'High', status: 'Pending', category: 'Safety' },
  // Meridian Gala tasks
  { id: 'tsk-14', eventId: 'evt-3', title: 'Floral Arrangement Delivery', owner: 'Clara Fontaine', ownerInitials: 'CF', dueTime: 'Aug 22, 3:00 PM', startTime: '15:00', duration: 90, priority: 'Medium', status: 'Pending', category: 'Decor' },
  { id: 'tsk-15', eventId: 'evt-3', title: 'Audio System Installation', owner: 'Marcus Chen', ownerInitials: 'MC', dueTime: 'Aug 22, 2:00 PM', startTime: '14:00', duration: 60, priority: 'High', status: 'Pending', category: 'Technical' },
  { id: 'tsk-16', eventId: 'evt-3', title: 'Guest List Finalization', owner: 'Priya Nair', ownerInitials: 'PN', dueTime: 'Aug 20, 5:00 PM', startTime: '09:00', duration: 480, priority: 'High', status: 'In Progress', category: 'Admin' },
];

export const staff: StaffMember[] = [
  { id: 'stf-1', name: 'Marcus Chen', initials: 'MC', role: 'AV Lead', status: 'On Site', currentTask: 'AV System Check — Main Stage', attendance: 'On Time', phone: '+1 415 555 0101' },
  { id: 'stf-2', name: 'Priya Nair', initials: 'PN', role: 'Event Producer', status: 'On Site', currentTask: 'Keynote Rehearsal', attendance: 'On Time', phone: '+1 415 555 0102' },
  { id: 'stf-3', name: 'Tomas Varga', initials: 'TV', role: 'Catering Coordinator', status: 'Checked In', currentTask: 'Catering Delivery', attendance: '12 min late', phone: '+1 415 555 0103' },
  { id: 'stf-4', name: 'Aisha Okoye', initials: 'AO', role: 'Registration Lead', status: 'On Site', currentTask: 'Registration Desk', attendance: 'On Time', phone: '+1 415 555 0104' },
  { id: 'stf-5', name: 'James Liu', initials: 'JL', role: 'Logistics Manager', status: 'On Site', currentTask: 'Venue Clearance', attendance: 'On Time', phone: '+1 415 555 0105' },
  { id: 'stf-6', name: 'Fatima Hassan', initials: 'FH', role: 'Media Coordinator', status: 'Checked In', currentTask: 'Credentials Distribution', attendance: 'On Time', phone: '+1 415 555 0106' },
  { id: 'stf-7', name: 'Orion Webb', initials: 'OW', role: 'Security Lead', status: 'Off Shift', currentTask: '—', attendance: 'On Time', phone: '+1 415 555 0107' },
  { id: 'stf-8', name: 'Selin Arslan', initials: 'SA', role: 'Vendor Liaison', status: 'On Site', currentTask: 'Vendor Check-in', attendance: 'On Time', phone: '+1 415 555 0108' },
  { id: 'stf-9', name: 'Devon Park', initials: 'DP', role: 'Stage Manager', status: 'Unavailable', currentTask: '—', attendance: 'No Show', phone: '+1 415 555 0109' },
  { id: 'stf-10', name: 'Clara Fontaine', initials: 'CF', role: 'Decor Lead', status: 'Checked In', currentTask: 'Breakout Room Setup', attendance: 'On Time', phone: '+1 415 555 0110' },
];

export const inventory: InventoryItem[] = [
  { id: 'inv-1', name: 'Wireless Lavalier Mic (Sennheiser)', category: 'AV Equipment', status: 'Low Stock', stock: 2, maxStock: 12, assignedTo: 'Marcus Chen', location: 'AV Cage — B2' },
  { id: 'inv-2', name: 'Folding Tables (6ft)', category: 'Furniture', status: 'Available', stock: 40, maxStock: 40, assignedTo: 'Registration', location: 'Storage Bay 3' },
  { id: 'inv-3', name: 'Event Wristbands (Staff)', category: 'Credentials', status: 'Available', stock: 85, maxStock: 100, assignedTo: 'Aisha Okoye', location: 'Registration Desk' },
  { id: 'inv-4', name: 'HDMI to USB-C Adapter', category: 'AV Equipment', status: 'Damaged', stock: 1, maxStock: 8, assignedTo: '—', location: 'AV Cage — B2' },
  { id: 'inv-5', name: 'Projector (Epson 12k)', category: 'AV Equipment', status: 'Checked Out', stock: 0, maxStock: 4, assignedTo: 'Breakout Room 4', location: 'Breakout Room 4' },
  { id: 'inv-6', name: 'Crowd Barriers', category: 'Safety', status: 'Available', stock: 60, maxStock: 60, assignedTo: 'Main Entrance', location: 'Loading Dock A' },
  { id: 'inv-7', name: 'First Aid Kits (Pro)', category: 'Safety', status: 'Low Stock', stock: 3, maxStock: 10, assignedTo: 'Medical Station', location: 'Hall B Corridor' },
  { id: 'inv-8', name: 'LED Stage Lights (Par)', category: 'Lighting', status: 'Available', stock: 24, maxStock: 24, assignedTo: 'Main Stage', location: 'Stage Right Rig' },
  { id: 'inv-9', name: 'Power Extension Cables (25ft)', category: 'Electrical', status: 'Ordered', stock: 0, maxStock: 20, assignedTo: '—', location: 'In Transit' },
  { id: 'inv-10', name: 'Podium (Acrylic)', category: 'Furniture', status: 'Available', stock: 2, maxStock: 2, assignedTo: 'Main Stage', location: 'Stage Left' },
];

export const vendors: Vendor[] = [
  { id: 'vnd-1', name: 'SoundWave Productions', service: 'AV & Sound', eventId: 'evt-1', contact: 'Derek Mosley', contactPhone: '+1 415 555 0201', status: 'Confirmed', procurement: 'Contract signed · $18,500', amount: '$18,500' },
  { id: 'vnd-2', name: 'Harvest Table Catering', service: 'Catering', eventId: 'evt-1', contact: 'Mei-Lin Torres', contactPhone: '+1 415 555 0202', status: 'At Risk', procurement: 'Deposit paid · Balance due Aug 9', amount: '$24,200' },
  { id: 'vnd-3', name: 'BrightLux Lighting', service: 'Lighting Design', eventId: 'evt-1', contact: 'Stefan Vogt', contactPhone: '+1 415 555 0203', status: 'Confirmed', procurement: 'Contract signed · $9,800', amount: '$9,800' },
  { id: 'vnd-4', name: 'Citywide Security Inc.', service: 'Security', eventId: 'evt-1', contact: 'Rosalyn Grant', contactPhone: '+1 415 555 0204', status: 'Confirmed', procurement: 'PO issued · $6,400', amount: '$6,400' },
  { id: 'vnd-5', name: 'FloralCo Studio', service: 'Floral & Decor', eventId: 'evt-3', contact: 'Isabelle Morin', contactPhone: '+1 415 555 0205', status: 'Delayed', procurement: 'Partial delivery confirmed', amount: '$4,600' },
  { id: 'vnd-6', name: 'Pulse Stage Rentals', service: 'Stage & Structure', eventId: 'evt-2', contact: 'Kwame Asante', contactPhone: '+1 415 555 0206', status: 'Pending', procurement: 'Quote received · Awaiting PO', amount: '$31,000' },
  { id: 'vnd-7', name: 'ArcMedia Photo & Video', service: 'Photography / Video', eventId: 'evt-1', contact: 'Nadia Petrov', contactPhone: '+1 415 555 0207', status: 'Confirmed', procurement: 'Contract signed · $7,200', amount: '$7,200' },
];

export const incidents: Incident[] = [
  {
    id: 'inc-1', eventId: 'evt-1', severity: 'Critical', status: 'In Progress',
    title: 'Main Stage AV Failure — Audio Out',
    what: 'Complete audio dropout on Main Stage. House PA system lost signal at 8:47 AM during setup. Backup system is not responding.',
    when: 'Aug 9, 2026 · 8:47 AM', where: 'Main Stage, Hall A', who: 'Marcus Chen (reported) · Devon Park (assigned)',
    impact: 'Sound Check delayed 20 min. Keynote at risk if not resolved by 9:30 AM. Affects ~850 attendees.',
    resolution: 'SoundWave Productions tech en route. Estimated resolution: 9:15 AM.',
    category: 'Technical', timeAgo: '18 min ago',
  },
  {
    id: 'inc-2', eventId: 'evt-1', severity: 'High', status: 'Open',
    title: 'Catering Delivery Vehicle — Access Denied',
    what: 'Harvest Table Catering truck blocked at Loading Dock B by unauthorized vehicle. Driver cannot unload.',
    when: 'Aug 9, 2026 · 9:02 AM', where: 'Loading Dock B', who: 'Tomas Varga (reported)',
    impact: 'Lunch service at risk. 800 attendees affected if catering setup delayed past 11:00 AM.',
    resolution: 'Security team contacted. Parking enforcement dispatched.',
    category: 'Logistics', timeAgo: '4 min ago',
  },
  {
    id: 'inc-3', eventId: 'evt-1', severity: 'Medium', status: 'Open',
    title: 'Speaker No-Show — Breakout Room 7',
    what: 'Confirmed speaker Rajiv Menon has not checked in and is not responding to contact attempts.',
    when: 'Aug 9, 2026 · 8:55 AM', where: 'Breakout Room 7', who: 'Fatima Hassan (reported)',
    impact: 'Session at 10:00 AM may need to be cancelled or replaced.',
    resolution: 'Attempting contact via secondary number. Standby speaker identified.',
    category: 'Program', timeAgo: '11 min ago',
  },
  {
    id: 'inc-4', eventId: 'evt-1', severity: 'Low', status: 'Resolved',
    title: 'Badge Printer Jam — Registration Desk 2',
    what: 'Badge printer at Registration Desk 2 jammed. Queue of 14 attendees backed up.',
    when: 'Aug 9, 2026 · 7:58 AM', where: 'Registration Hall', who: 'Aisha Okoye (reported & resolved)',
    impact: 'Minor delay. Redirected attendees to Desk 1 and 3.',
    resolution: 'Printer cleared and back online at 8:05 AM.',
    category: 'Equipment', timeAgo: '1 hr ago',
  },
  {
    id: 'inc-5', eventId: 'evt-2', severity: 'High', status: 'Open',
    title: 'Stage Structure Cert. — Missing Documentation',
    what: 'Stage 1 engineering certification missing from permit packet. Inspector on site and waiting.',
    when: 'Aug 9, 2026 · 10:20 AM', where: 'Stage 1, GreenFest Site', who: 'Orion Webb (reported)',
    impact: 'Stage 1 cannot open until cert is produced. Main act set times at risk.',
    resolution: 'Contacting structural engineer. Document may be in offsite filing.',
    category: 'Safety', timeAgo: '36 min ago',
  },
];

export const dependencyChains: DependencyChain[] = [
  {
    id: 'dep-1', eventId: 'evt-1',
    trigger: { label: 'AV System Check delayed 15 min', type: 'delay', time: '8:47 AM' },
    chain: [
      { id: 'c1', label: 'Sound Check — Keynote Stage', impact: 'Pushed to 9:50 AM (was 9:30)', severity: 'high' },
      { id: 'c2', label: 'Keynote Rehearsal', impact: 'Start at 10:20 AM — overlaps keynote at 10:30', severity: 'critical' },
      { id: 'c3', label: 'Keynote Opening Segment', impact: 'Speaker has no rehearsal time — go/no-go decision needed', severity: 'critical' },
    ],
    suggestedAction: 'Compress rehearsal to 5 min walkthrough, or push keynote start to 10:45 AM and notify attendees now.',
  },
  {
    id: 'dep-2', eventId: 'evt-1',
    trigger: { label: 'Catering truck blocked at Dock B', type: 'blocked', time: '9:02 AM' },
    chain: [
      { id: 'c4', label: 'Lunch Service Setup', impact: 'Cannot begin until dock clears (ETA unknown)', severity: 'high' },
      { id: 'c5', label: 'Lunch Service Open (12:00 PM)', impact: 'At risk if setup not started by 10:30 AM', severity: 'high' },
      { id: 'c6', label: 'Afternoon Session Start (1:00 PM)', impact: 'May be delayed if lunch runs over', severity: 'medium' },
    ],
    suggestedAction: 'Redirect truck to Dock A (currently clear). Notify Tomas Varga and security now.',
  },
  {
    id: 'dep-3', eventId: 'evt-2',
    trigger: { label: 'Stage structure cert. missing', type: 'risk', time: '10:20 AM' },
    chain: [
      { id: 'c7', label: 'Stage 1 Safety Inspection Sign-off', impact: 'Inspector cannot approve — stage locked', severity: 'critical' },
      { id: 'c8', label: 'Vendor Equipment Delivery', impact: 'Cannot load Stage 1 until cleared', severity: 'high' },
      { id: 'c9', label: 'Opening Act Load-in', impact: 'Scheduled 4:00 PM — 6 hrs of float consumed', severity: 'medium' },
    ],
    suggestedAction: 'Emergency contact structural engineer for digital cert copy. Prepare Stage 2 as contingency for opening act.',
  },
];
