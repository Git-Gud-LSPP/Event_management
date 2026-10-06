const { z } = require('zod');

// Every tool is a thin wrapper over an existing REST route, called with the user's own
// JWT (see makeCall in agent.service). The route guards stay the single source of truth
// for permissions, so the agent can never do more than the logged-in user.
//
// Tools are plain { description, inputSchema, execute } objects: the AI SDK accepts them
// as-is, and nothing here depends on the model provider.

// Ids must be real ObjectIds. That also stops a prompt-injected id like "../auth/users"
// from steering a call to a different route.
const id = (what) => z.string().regex(/^[a-f\d]{24}$/i, 'must be a 24-char hex id').describe(what);
const isoDate = (what) => z.string().describe(`${what} (ISO 8601 datetime, e.g. 2026-11-12T09:00:00+05:45)`);

const EVENT_STATUS = ['draft', 'published', 'cancelled'];
const TASK_STATUS = ['Pending', 'In Progress', 'Blocked', 'Done'];
const INCIDENT_PRIORITY = ['Low', 'Medium', 'Critical'];
const INCIDENT_STATUS = ['Open', 'In Progress', 'Resolved'];
const INVENTORY_STATUS = ['Available', 'Low Stock', 'Damaged', 'Checked Out', 'Ordered'];
// Mirrors vendorTags in vendor/vendor.service.js.
const VENDOR_TYPES = ['photographer', 'bakery', 'florist', 'hotel', 'catering', 'entertainment', 'decoration', 'restaurant'];
// Mirror procurement/procurement.model.js and document/document.model.js.
const VENDOR_STAGES = ['Shortlisted', 'RFQ Sent', 'Quoted', 'Booked', 'Paid', 'Rejected'];
const DOC_CATEGORIES = ['Contract', 'Quote', 'RFQ', 'Purchase Order', 'Invoice', 'Receipt', 'Permit', 'Insurance', 'Plan', 'Other'];
const DOC_STATUSES = ['Draft', 'Sent', 'Received', 'Approved', 'Signed', 'Paid', 'Void'];
const FLOOR_KINDS = ['room', 'zone', 'stage', 'booth', 'registration', 'entrance', 'exit', 'firstaid', 'restroom', 'access'];

const PAGES = {
  events: '/events',
  event_detail: '/events/:eventId',
  my_tasks: '/my-tasks',
  schedule: '/schedule',
  staff: '/staffs',
  vendors: '/vendors',
  incidents: '/incidents',
  floorplan: '/floorplan',
  documents: '/documents',
};

const qs = (params) => {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return s ? `?${s}` : '';
};

const eventFields = {
  title: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional().describe('Free-text venue/address'),
  startsAt: isoDate('Start time').optional(),
  endsAt: isoDate('End time').optional(),
  capacity: z.number().int().min(0).optional(),
  status: z.enum(EVENT_STATUS).optional(),
};

const taskFields = {
  name: z.string().optional(),
  owner: id('User id of the task owner').optional(),
  startsAt: isoDate('Start time').optional(),
  endsAt: isoDate('End time').optional(),
  status: z.enum(TASK_STATUS).optional(),
  dependsOn: id('Task id that must finish first').nullable().optional(),
  delayMinutes: z.number().int().min(0).optional(),
};

const floorSchema = z.object({
  name: z.string(),
  rooms: z.array(
    z.object({
      id: z.string().describe('Stable client id; keep existing ids unchanged'),
      kind: z.enum(FLOOR_KINDS).optional().describe('room/zone are spaces; the rest are markers. Defaults to room'),
      name: z.string(),
      x: z.number(),
      y: z.number(),
      width: z.number().min(1),
      height: z.number().min(1),
      capacity: z.number().min(0).optional(),
      color: z.string().optional(),
      rot: z.number().optional(),
      locked: z.boolean().optional(),
      owner: id('Staff user id who owns this point on show day').nullable().optional(),
    })
  ),
  placements: z.array(
    z.object({
      user: id('Staff user id'),
      roomId: z.string().nullable().optional(),
      x: z.number(),
      y: z.number(),
    })
  ),
});

const inventoryFields = {
  name: z.string().optional(),
  category: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).optional(),
  location: z.string().optional(),
  status: z.enum(INVENTORY_STATUS).optional(),
};

const currency = z.string().length(3).optional().describe('ISO currency code, e.g. NPR, USD');

const eventVendorFields = {
  name: z.string().optional(),
  type: z.string().optional().describe('What they supply, e.g. catering, florist, AV rental'),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  stage: z.enum(VENDOR_STAGES).optional(),
  scope: z.string().optional().describe('What the event buys from them'),
  quoteAmount: z.number().min(0).optional(),
  currency,
  notes: z.string().optional(),
};

const docContent = z.string().max(100_000).describe('Full document body in Markdown');
const documentFields = {
  title: z.string().optional(),
  category: z.enum(DOC_CATEGORIES).optional(),
  status: z.enum(DOC_STATUSES).optional(),
  vendorId: id('Event vendor id (from list_event_vendors)').nullable().optional(),
  amount: z.number().min(0).optional(),
  currency,
  dueDate: isoDate('Due / needed-by date').optional(),
  content: docContent.optional(),
};
// The API calls the field `vendor`.
const docBody = ({ vendorId, ...rest }) => (vendorId === undefined ? rest : { ...rest, vendor: vendorId });

const t = (description, shape, execute) => ({ description, inputSchema: z.object(shape), execute });

// Tools whose success changes app data; the UI refreshes the open page after them.
const WRITE_TOOLS = new Set([
  'create_event', 'update_event', 'add_staff',
  'create_task', 'update_task', 'assign_task',
  'report_incident', 'update_incident_status', 'assign_incident',
  'create_inventory_item', 'update_inventory_item',
  'add_event_vendor', 'update_event_vendor', 'create_document', 'update_document',
]);

/**
 * @param {object} deps
 * @param {(method: string, path: string, body?: object) => Promise<string>} deps.call  loopback API call
 * @param {(action: {method: string, path: string, body?: object, summary: string}) => Promise<string>} deps.queueConfirm
 * @param {(event: object) => void} deps.emit  push a UI event to the client stream
 */
const makeTools = ({ call, queueConfirm, emit }) => ({
  // ---------- events ----------
  list_events: t(
    'List events the current user organizes or staffs. Use this to resolve an event name to its id.',
    { status: z.enum(EVENT_STATUS).optional() },
    ({ status }) => call('GET', `/events${qs({ status, limit: 100 })}`)
  ),
  get_event: t(
    'Get one event, including its staff (names and ids).',
    { eventId: id('Event id') },
    ({ eventId }) => call('GET', `/events/${eventId}`)
  ),
  create_event: t(
    'Create a new event. Organizers only. title and startsAt are required.',
    { ...eventFields, title: z.string(), startsAt: isoDate('Start time') },
    (input) => call('POST', '/events', input)
  ),
  update_event: t(
    'Update fields of an existing event. Only send the fields that change.',
    { eventId: id('Event id'), ...eventFields },
    ({ eventId, ...fields }) => call('PATCH', `/events/${eventId}`, fields)
  ),
  delete_event: t(
    'Delete an event and everything under it. Requires the user to confirm in the UI.',
    { eventId: id('Event id'), title: z.string().describe('Event title, shown to the user') },
    ({ eventId, title }) =>
      queueConfirm({ method: 'DELETE', path: `/events/${eventId}`, summary: `Delete event "${title}"` })
  ),

  // ---------- people ----------
  search_users: t(
    'Search the user directory by name or email (organizers only). Use it to find user ids before adding staff or assigning work.',
    { q: z.string().optional().describe('Name or email fragment'), role: z.enum(['organizer', 'staff']).optional() },
    ({ q, role }) => call('GET', `/auth/users${qs({ q, role })}`)
  ),
  add_staff: t(
    'Add a user to an event as staff. A user must be event staff before they can be assigned tasks or incidents.',
    { eventId: id('Event id'), staffId: id('User id') },
    ({ eventId, staffId }) => call('POST', `/events/${eventId}/staff`, { staffId })
  ),
  remove_staff: t(
    'Remove a staff member from an event. Requires the user to confirm in the UI.',
    { eventId: id('Event id'), staffId: id('User id'), staffName: z.string().describe('Shown to the user') },
    ({ eventId, staffId, staffName }) =>
      queueConfirm({
        method: 'DELETE',
        path: `/events/${eventId}/staff`,
        body: { staffId },
        summary: `Remove ${staffName} from the event staff`,
      })
  ),

  // ---------- schedule ----------
  list_tasks: t(
    'List schedule tasks for an event, with owners and dependencies.',
    { eventId: id('Event id') },
    ({ eventId }) => call('GET', `/events/${eventId}/schedule${qs({ limit: 100 })}`)
  ),
  create_task: t(
    'Create a schedule task for an event (organizer only). name and startsAt are required; leave owner out to put it in the event backlog.',
    { eventId: id('Event id'), ...taskFields, name: z.string(), startsAt: isoDate('Start time') },
    ({ eventId, ...fields }) => call('POST', `/events/${eventId}/schedule`, fields)
  ),
  update_task: t(
    'Update a schedule task. Only send the fields that change.',
    { eventId: id('Event id'), taskId: id('Task id'), ...taskFields },
    ({ eventId, taskId, ...fields }) => call('PATCH', `/events/${eventId}/schedule/${taskId}`, fields)
  ),
  assign_task: t(
    'Hand a task to a staff member of the event (organizer only).',
    { eventId: id('Event id'), taskId: id('Task id'), assigneeId: id("Staff user id, or the organizer's own id") },
    ({ eventId, taskId, assigneeId }) =>
      call('POST', `/events/${eventId}/schedule/${taskId}/tasks-assign`, { assigneeId })
  ),
  delete_task: t(
    'Delete a schedule task. Requires the user to confirm in the UI.',
    { eventId: id('Event id'), taskId: id('Task id'), name: z.string().describe('Task name, shown to the user') },
    ({ eventId, taskId, name }) =>
      queueConfirm({ method: 'DELETE', path: `/events/${eventId}/schedule/${taskId}`, summary: `Delete task "${name}"` })
  ),

  get_dependency_chains: t(
    'Get dependency alert chains for an event: each Blocked or delayed task and the downstream tasks it holds up. ' +
      'Use it to explain knock-on effects and suggest fixes.',
    { eventId: id('Event id') },
    ({ eventId }) => call('GET', `/events/${eventId}/schedule/chains`)
  ),

  // ---------- incidents ----------
  list_incidents: t(
    'List incidents for an event, newest first.',
    { eventId: id('Event id') },
    ({ eventId }) => call('GET', `/events/${eventId}/incidents${qs({ limit: 100 })}`)
  ),
  get_incident: t(
    'Get one incident.',
    { eventId: id('Event id'), incidentId: id('Incident id') },
    ({ eventId, incidentId }) => call('GET', `/events/${eventId}/incidents/${incidentId}`)
  ),
  report_incident: t(
    'Report a new incident on an event.',
    {
      eventId: id('Event id'),
      title: z.string(),
      description: z.string().optional(),
      location: z.string().optional(),
      priority: z.enum(INCIDENT_PRIORITY).optional(),
      assignedTo: id('Staff user id').optional(),
    },
    ({ eventId, ...fields }) => call('POST', `/events/${eventId}/incidents`, fields)
  ),
  update_incident_status: t(
    'Change an incident status (organizer or the assignee).',
    { eventId: id('Event id'), incidentId: id('Incident id'), status: z.enum(INCIDENT_STATUS) },
    ({ eventId, incidentId, status }) => call('PATCH', `/events/${eventId}/incidents/${incidentId}`, { status })
  ),
  assign_incident: t(
    'Assign an incident to a staff member of the event (organizer only).',
    { eventId: id('Event id'), incidentId: id('Incident id'), staffId: id('Staff user id') },
    ({ eventId, incidentId, staffId }) =>
      call('POST', `/events/${eventId}/incidents/${incidentId}/assign`, { staffId })
  ),
  delete_incident: t(
    'Delete an incident. Requires the user to confirm in the UI.',
    { eventId: id('Event id'), incidentId: id('Incident id'), title: z.string().describe('Shown to the user') },
    ({ eventId, incidentId, title }) =>
      queueConfirm({ method: 'DELETE', path: `/events/${eventId}/incidents/${incidentId}`, summary: `Delete incident "${title}"` })
  ),

  // ---------- inventory ----------
  list_inventory: t(
    'List inventory items (equipment, supplies) for an event with stock and status.',
    { eventId: id('Event id') },
    ({ eventId }) => call('GET', `/events/${eventId}/inventory`)
  ),
  create_inventory_item: t(
    'Add an inventory item to an event (organizer only). name is required.',
    { eventId: id('Event id'), ...inventoryFields, name: z.string() },
    ({ eventId, ...fields }) => call('POST', `/events/${eventId}/inventory`, fields)
  ),
  update_inventory_item: t(
    'Update an inventory item (organizer only). Only send the fields that change.',
    { eventId: id('Event id'), itemId: id('Inventory item id'), ...inventoryFields },
    ({ eventId, itemId, ...fields }) => call('PATCH', `/events/${eventId}/inventory/${itemId}`, fields)
  ),
  delete_inventory_item: t(
    'Delete an inventory item. Requires the user to confirm in the UI.',
    { eventId: id('Event id'), itemId: id('Inventory item id'), name: z.string().describe('Shown to the user') },
    ({ eventId, itemId, name }) =>
      queueConfirm({ method: 'DELETE', path: `/events/${eventId}/inventory/${itemId}`, summary: `Delete inventory item "${name}"` })
  ),

  // ---------- procurement: the event's vendors ----------
  list_event_vendors: t(
    "List the vendors on an event's procurement pipeline, with contact details, stage, scope and quote.",
    { eventId: id('Event id') },
    ({ eventId }) => call('GET', `/events/${eventId}/vendors`)
  ),
  add_event_vendor: t(
    "Add a vendor to an event's procurement pipeline (organizer only). name is required. " +
      'Only use contact details the user gave you or that came from a tool; never invent them.',
    { eventId: id('Event id'), ...eventVendorFields, name: z.string() },
    ({ eventId, ...fields }) => call('POST', `/events/${eventId}/vendors`, fields)
  ),
  update_event_vendor: t(
    'Update an event vendor, e.g. move its stage or record a quote. Only send the fields that change.',
    { eventId: id('Event id'), vendorId: id('Event vendor id'), ...eventVendorFields },
    ({ eventId, vendorId, ...fields }) => call('PATCH', `/events/${eventId}/vendors/${vendorId}`, fields)
  ),
  remove_event_vendor: t(
    "Remove a vendor from an event's pipeline. Requires the user to confirm in the UI.",
    { eventId: id('Event id'), vendorId: id('Event vendor id'), name: z.string().describe('Shown to the user') },
    ({ eventId, vendorId, name }) =>
      queueConfirm({ method: 'DELETE', path: `/events/${eventId}/vendors/${vendorId}`, summary: `Remove vendor "${name}" from the event` })
  ),

  // ---------- documents ----------
  list_documents: t(
    "List an event's documents (metadata only, no content). Filter by category or vendor.",
    { eventId: id('Event id'), category: z.enum(DOC_CATEGORIES).optional(), vendorId: id('Event vendor id').optional() },
    ({ eventId, category, vendorId }) => call('GET', `/events/${eventId}/documents${qs({ category, vendor: vendorId })}`)
  ),
  get_document: t(
    'Read one document, including its full text (uploaded files come back as extracted text).',
    { eventId: id('Event id'), documentId: id('Document id') },
    ({ eventId, documentId }) => call('GET', `/events/${eventId}/documents/${documentId}`)
  ),
  create_document: t(
    "Create a document in the event's document hub (organizer only), e.g. a procurement plan, RFQ, purchase order or contract. " +
      'title and content are required. Set vendorId when it is about one vendor.',
    { eventId: id('Event id'), ...documentFields, title: z.string(), content: docContent },
    ({ eventId, ...fields }) => call('POST', `/events/${eventId}/documents`, docBody(fields))
  ),
  update_document: t(
    'Update a document (status, amount, content...). Only send the fields that change; content replaces the whole body.',
    { eventId: id('Event id'), documentId: id('Document id'), ...documentFields },
    ({ eventId, documentId, ...fields }) => call('PATCH', `/events/${eventId}/documents/${documentId}`, docBody(fields))
  ),
  delete_document: t(
    'Delete a document. Requires the user to confirm in the UI.',
    { eventId: id('Event id'), documentId: id('Document id'), title: z.string().describe('Shown to the user') },
    ({ eventId, documentId, title }) =>
      queueConfirm({ method: 'DELETE', path: `/events/${eventId}/documents/${documentId}`, summary: `Delete document "${title}"` })
  ),

  // ---------- floor plan ----------
  get_floorplan: t(
    'Get the floor plan for an event: floors, rooms (with coordinates) and staff placements, plus the staff roster.',
    { eventId: id('Event id') },
    ({ eventId }) => call('GET', `/events/${eventId}/floorplan`)
  ),
  save_floorplan: t(
    'Replace the WHOLE floor plan of an event. Always call get_floorplan first and send every floor, room and placement back, ' +
      'changing only what the user asked for and keeping existing room ids. Requires the user to confirm in the UI.',
    { eventId: id('Event id'), floors: z.array(floorSchema).min(1), summary: z.string().describe('One line describing the change, shown to the user') },
    ({ eventId, floors, summary }) =>
      queueConfirm({ method: 'PUT', path: `/events/${eventId}/floorplan`, body: { floors }, summary: `Floor plan: ${summary}` })
  ),

  // ---------- vendors ----------
  geocode: t(
    'Turn a free-text address or place name (e.g. an event location) into latitude/longitude. Use before vendor_route.',
    { address: z.string() },
    async ({ address }) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search${qs({ format: 'json', limit: 3, q: address })}`,
          { headers: { 'User-Agent': 'EventManagement/1.0' }, signal: AbortSignal.timeout(10_000) }
        );
        if (!res.ok) return JSON.stringify({ error: `Geocoding failed (HTTP ${res.status})` });
        const hits = await res.json();
        if (!hits.length) return JSON.stringify({ error: `No location found for "${address}"` });
        return JSON.stringify(hits.map((h) => ({ name: h.display_name, latitude: Number(h.lat), longitude: Number(h.lon) })));
      } catch (err) {
        return JSON.stringify({ error: `Geocoding failed: ${err.message}` });
      }
    }
  ),
  open_vendor_search: t(
    'Open the Vendors page and run a vendor search there. Results are shown to the user on that page, ' +
      'not returned to you, so do not list vendors in chat.',
    {
      type: z.enum(VENDOR_TYPES),
      near: z.string().min(2).max(200).describe('Address or place to search around, usually the event location'),
    },
    ({ type, near }) => {
      const path = `/vendors${qs({ type, near })}`;
      emit({ type: 'ui', action: 'navigate', path, eventId: null });
      return JSON.stringify({ ok: true, note: 'The search is running on the Vendors page; the user sees the results there.' });
    }
  ),
  vendor_route: t(
    'Get a travel route between two coordinates (e.g. venue to vendor).',
    { fromLat: z.number(), fromLon: z.number(), toLat: z.number(), toLon: z.number() },
    (input) => call('GET', `/vendors/route${qs(input)}`)
  ),

  // ---------- UI ----------
  navigate: t(
    "Open a page in the user's app. Pass eventId to also select that event on event-scoped pages " +
      '(schedule, staff, incidents, floorplan, documents); event_detail requires it.',
    { page: z.enum(Object.keys(PAGES)), eventId: id('Event id').optional() },
    ({ page, eventId }) => {
      if (page === 'event_detail' && !eventId) return JSON.stringify({ error: 'event_detail needs an eventId' });
      const path = PAGES[page].replace(':eventId', eventId || '');
      emit({ type: 'ui', action: 'navigate', path, eventId: eventId || null });
      return JSON.stringify({ ok: true, path });
    }
  ),
});

module.exports = { makeTools, WRITE_TOOLS };
