jest.mock('../../incident/incident.model');

const Incident = require('../../incident/incident.model');
const { updateStatus, assign } = require('../../incident/incident.controller');

const STAFF = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const OTHER = 'cccccccccccccccccccccccc';

const call = async (fn, { userId, isOrganizer = false, body }) => {
  const req = { params: { id: 'i1' }, body, user: { userId }, isOrganizer, event: { _id: 'e1', staff: [STAFF] } };
  const res = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
  await fn(req, res, (e) => { throw e; });
  return res;
};

// Mongoose query stand-in: awaitable, and .populate() chains.
const query = (value) => {
  const q = Promise.resolve(value);
  q.populate = () => q;
  return q;
};

let item;
beforeEach(() => {
  item = { _id: 'i1', status: 'Open', assignedTo: STAFF, save: jest.fn() };
  Incident.findOne.mockResolvedValue(item);
  Incident.findById.mockImplementation(() => query(item));
  Incident.findOneAndUpdate.mockImplementation((f, d) => query({ ...item, ...d }));
});

it('assignee can resolve, which stamps resolvedAt', async () => {
  const res = await call(updateStatus, { userId: STAFF, body: { status: 'Resolved' } });
  expect(res.statusCode).toBe(200);
  expect(item.resolvedAt).toBeInstanceOf(Date);
});

it('reopening clears resolvedAt', async () => {
  await call(updateStatus, { userId: OTHER, isOrganizer: true, body: { status: 'Open' } });
  expect(item.resolvedAt).toBeNull();
});

it('non-assignee staff cannot change status', async () => {
  const res = await call(updateStatus, { userId: OTHER, body: { status: 'Resolved' } });
  expect(res.statusCode).toBe(403);
  expect(item.save).not.toHaveBeenCalled();
});

it('assign rejects users who are not event staff', async () => {
  const res = await call(assign, { userId: OTHER, isOrganizer: true, body: { staffId: OTHER } });
  expect(res.statusCode).toBe(400);
});

it('assign accepts event staff', async () => {
  const res = await call(assign, { userId: OTHER, isOrganizer: true, body: { staffId: STAFF } });
  expect(res.body.assignedTo).toBe(STAFF);
});
