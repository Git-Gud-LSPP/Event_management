jest.mock('../../event/event.model');
jest.mock('../../incident/incident.model');

const Event = require('../../event/event.model');
const Incident = require('../../incident/incident.model');
const {
  authorizeIncidentAccess,
  canViewIncidents,
  canManageIncidents,
  canUpdateIncidentStatus,
} = require('../../incident/incident.middleware');

const ORGANIZER = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const STAFF = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const ASSIGNEE = 'bbbbbbbbbbbbbbbbbbbbbbbb'; // also staff on the event
const OUTSIDER = 'cccccccccccccccccccccccc';

const event = { organizer: ORGANIZER, staff: [STAFF] };

const run = async (mw, userId, role, params = { eventId: 'e1' }) => {
  const req = { params, user: { userId, role } };
  const res = {
    statusCode: null,
    status(c) {
      this.statusCode = c;
      return this;
    },
    json() {
      return this;
    },
  };
  let nexted = false;
  await mw(req, res, () => {
    nexted = true;
  });
  return { nexted, status: res.statusCode };
};

beforeEach(() => {
  Event.findById.mockResolvedValue(event);
  Incident.findById.mockReturnValue({ populate: () => ({ event, assignedTo: null }) });
});

describe('canViewIncidents', () => {
  it('lets the organizer list incidents', async () => {
    expect(await run(canViewIncidents, ORGANIZER, 'organizer')).toEqual({ nexted: true, status: null });
  });

  it('lets assigned staff list incidents', async () => {
    expect(await run(canViewIncidents, STAFF, 'staff')).toEqual({ nexted: true, status: null });
  });

  it('rejects a user not on the event', async () => {
    expect(await run(canViewIncidents, OUTSIDER, 'organizer')).toEqual({ nexted: false, status: 403 });
  });

  it('404s an unknown event', async () => {
    Event.findById.mockResolvedValue(null);
    expect(await run(canViewIncidents, ORGANIZER, 'organizer')).toEqual({ nexted: false, status: 404 });
  });
});

describe('canManageIncidents (reporting is organizer-only)', () => {
  it('lets the event organizer report an incident', async () => {
    expect(await run(canManageIncidents, ORGANIZER, 'organizer')).toEqual({ nexted: true, status: null });
  });

  it('rejects staff — reporting is organizer-only, matching the UI gate', async () => {
    expect(await run(canManageIncidents, STAFF, 'staff')).toEqual({ nexted: false, status: 403 });
  });
});

describe('authorizeIncidentAccess', () => {
  it('lets the organizer access a specific incident', async () => {
    expect(await run(authorizeIncidentAccess('staff'), ORGANIZER, 'organizer', { id: 'i1' })).toEqual({
      nexted: true,
      status: null,
    });
  });

  it('rejects a user not on the event', async () => {
    expect(await run(authorizeIncidentAccess('staff'), OUTSIDER, 'organizer', { id: 'i1' })).toEqual({
      nexted: false,
      status: 403,
    });
  });

  it('rejects staff on an organizer-only route', async () => {
    expect(await run(authorizeIncidentAccess('organizer'), STAFF, 'staff', { id: 'i1' })).toEqual({
      nexted: false,
      status: 403,
    });
  });
});

describe('canUpdateIncidentStatus', () => {
  it('lets the organizer update status', async () => {
    expect(await run(canUpdateIncidentStatus, ORGANIZER, 'organizer', { id: 'i1' })).toEqual({
      nexted: true,
      status: null,
    });
  });

  it('lets the assigned staff member update status', async () => {
    Incident.findById.mockReturnValue({
      populate: () => ({ event, assignedTo: ASSIGNEE }),
    });
    expect(await run(canUpdateIncidentStatus, ASSIGNEE, 'staff', { id: 'i1' })).toEqual({
      nexted: true,
      status: null,
    });
  });

  it('rejects staff who are not the assignee', async () => {
    Incident.findById.mockReturnValue({
      populate: () => ({ event, assignedTo: 'dddddddddddddddddddddddd' }),
    });
    expect(await run(canUpdateIncidentStatus, STAFF, 'staff', { id: 'i1' })).toEqual({
      nexted: false,
      status: 403,
    });
  });
});
