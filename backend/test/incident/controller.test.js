jest.mock('../../incident/incident.model');
jest.mock('../../incident/incident.repository');

const Incident = require('../../incident/incident.model');
const repo = require('../../incident/incident.repository');
const { updateStatus, assign } = require('../../incident/incident.controller');

const STAFF = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const OUTSIDER = 'cccccccccccccccccccccccc';

const res = () => ({
  statusCode: 200,
  body: null,
  status(c) {
    this.statusCode = c;
    return this;
  },
  json(b) {
    this.body = b;
    return this;
  },
});

beforeEach(() => {
  repo.update.mockImplementation((id, data) => Promise.resolve({ _id: id, ...data }));
});

describe('updateStatus', () => {
  const run = async (incident, status) => {
    const req = { params: { id: 'i1' }, body: { status }, incident };
    const r = res();
    await updateStatus(req, r, (e) => {
      throw e;
    });
    return r;
  };

  it('moves Open -> In Progress when an assignee is set', async () => {
    const r = await run({ _id: 'i1', status: 'Open', assignedTo: STAFF }, 'In Progress');
    expect(r.statusCode).toBe(200);
    expect(r.body.status).toBe('In Progress');
  });

  it('rejects Open -> In Progress with no assignee', async () => {
    const r = await run({ _id: 'i1', status: 'Open', assignedTo: null }, 'In Progress');
    expect(r.statusCode).toBe(400);
  });

  it('moves In Progress -> Resolved and stamps resolvedAt', async () => {
    const r = await run({ _id: 'i1', status: 'In Progress', assignedTo: STAFF }, 'Resolved');
    expect(r.statusCode).toBe(200);
    expect(r.body.status).toBe('Resolved');
    expect(r.body.resolvedAt).toBeInstanceOf(Date);
  });

  it('rejects skipping straight from Open to Resolved', async () => {
    const r = await run({ _id: 'i1', status: 'Open', assignedTo: STAFF }, 'Resolved');
    expect(r.statusCode).toBe(400);
  });

  it('rejects reopening a Resolved incident', async () => {
    const r = await run({ _id: 'i1', status: 'Resolved', assignedTo: STAFF }, 'Open');
    expect(r.statusCode).toBe(400);
  });

  it('requires a status in the body', async () => {
    const r = await run({ _id: 'i1', status: 'Open', assignedTo: STAFF }, undefined);
    expect(r.statusCode).toBe(400);
  });
});

describe('assign', () => {
  const run = async (body) => {
    const req = { params: { id: 'i1' }, body, event: { _id: 'e1', staff: [STAFF] } };
    const r = res();
    await assign(req, r, (e) => {
      throw e;
    });
    return r;
  };

  beforeEach(() => {
    Incident.findOne.mockResolvedValue({ _id: 'i1' });
  });

  it('assigns the incident to staff on the event', async () => {
    const r = await run({ staffId: STAFF });
    expect(r.statusCode).toBe(200);
    expect(r.body).toEqual({ _id: 'i1', assignedTo: STAFF });
  });

  it('rejects a non-staff assignee', async () => {
    expect((await run({ staffId: OUTSIDER })).statusCode).toBe(400);
  });

  it('requires staffId', async () => {
    expect((await run({})).statusCode).toBe(400);
  });

  it('404s when the incident is not on this event', async () => {
    Incident.findOne.mockResolvedValue(null);
    expect((await run({ staffId: STAFF })).statusCode).toBe(404);
  });
});
