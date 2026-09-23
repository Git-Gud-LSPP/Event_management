jest.mock('../../floorplan/floorplan.repository');

const repo = require('../../floorplan/floorplan.repository');
const { save } = require('../../floorplan/floorplan.controller');

const STAFF = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const OUTSIDER = 'cccccccccccccccccccccccc';

const room = (over = {}) => ({
  id: 'r1', name: 'Main Hall', x: 0, y: 0, width: 200, height: 120, capacity: 10, ...over,
});

const floors = (over = {}) => [
  { name: 'Floor 1', rooms: [room()], placements: [], ...over },
];

const run = async (body) => {
  const req = { params: { eventId: 'e1' }, body, event: { _id: 'e1', staff: [STAFF] } };
  const res = {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
  await save(req, res, (e) => { throw e; });
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  repo.upsert.mockImplementation((_id, f) => Promise.resolve({ floors: f }));
});

it('saves a plan and returns it', async () => {
  const payload = floors({ placements: [{ user: STAFF, roomId: 'r1', x: 10, y: 20 }] });
  const res = await run({ floors: payload });
  expect(res.statusCode).toBe(200);
  expect(res.body.floors[0].rooms[0].name).toBe('Main Hall');
  expect(res.body.floors[0].placements[0].user).toBe(STAFF);
});

it('allows a placement loose on the floor', async () => {
  const res = await run({ floors: floors({ placements: [{ user: STAFF, roomId: null, x: 5, y: 5 }] }) });
  expect(res.statusCode).toBe(200);
});

it('rejects a placement for someone not staff on the event', async () => {
  const res = await run({ floors: floors({ placements: [{ user: OUTSIDER, roomId: 'r1', x: 1, y: 1 }] }) });
  expect(res.statusCode).toBe(400);
  expect(repo.upsert).not.toHaveBeenCalled();
});

it('rejects a placement pointing at a room that does not exist', async () => {
  const res = await run({ floors: floors({ placements: [{ user: STAFF, roomId: 'nope', x: 1, y: 1 }] }) });
  expect(res.statusCode).toBe(400);
});

it('rejects duplicate room ids', async () => {
  const res = await run({ floors: floors({ rooms: [room(), room({ name: 'Copy' })] }) });
  expect(res.statusCode).toBe(400);
});

it('rejects non-numeric geometry', async () => {
  const res = await run({ floors: floors({ rooms: [room({ width: 'wide' })] }) });
  expect(res.statusCode).toBe(400);
});

it('rejects an empty payload', async () => {
  expect((await run({})).statusCode).toBe(400);
});
