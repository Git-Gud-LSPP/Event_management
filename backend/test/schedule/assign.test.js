jest.mock('../../schedule/schedule.model');
jest.mock('../../schedule/schedule.repository');

const Schedule = require('../../schedule/schedule.model');
const repo = require('../../schedule/schedule.repository');
const { assign } = require('../../schedule/schedule.controller');

const STAFF = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const OUTSIDER = 'cccccccccccccccccccccccc';

const run = async (body) => {
  const req = { params: { id: 's1' }, body, event: { _id: 'e1', staff: [STAFF] } };
  const res = {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
  await assign(req, res, (e) => { throw e; });
  return res;
};

beforeEach(() => {
  Schedule.findOne.mockResolvedValue({ _id: 's1' });
  repo.update.mockImplementation((id, data) => Promise.resolve({ _id: id, ...data }));
});

it('assigns a task to staff on the event', async () => {
  const res = await run({ assigneeId: STAFF });
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ _id: 's1', owner: STAFF });
});

it('rejects a non-staff assignee', async () => {
  expect((await run({ assigneeId: OUTSIDER })).statusCode).toBe(400);
});

it('requires assigneeId', async () => {
  expect((await run({})).statusCode).toBe(400);
});

it('404s when the item is not on this event', async () => {
  Schedule.findOne.mockResolvedValue(null);
  expect((await run({ assigneeId: STAFF })).statusCode).toBe(404);
});
