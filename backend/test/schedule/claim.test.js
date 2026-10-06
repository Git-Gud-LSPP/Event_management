jest.mock('../../schedule/schedule.model');
jest.mock('../../schedule/schedule.repository');

const Schedule = require('../../schedule/schedule.model');
const repo = require('../../schedule/schedule.repository');
const { claim } = require('../../schedule/schedule.controller');

const run = async () => {
  const req = { params: { id: 's1' }, event: { _id: 'e1' }, user: { userId: 'u1' } };
  const res = {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
  await claim(req, res, (e) => { throw e; });
  return res;
};

it('takes an unassigned task, only if it is still unassigned', async () => {
  Schedule.findOneAndUpdate.mockResolvedValue({ _id: 's1' });
  repo.findById.mockResolvedValue({ _id: 's1', owner: 'u1' });
  const res = await run();
  expect(Schedule.findOneAndUpdate).toHaveBeenCalledWith({ _id: 's1', event: 'e1', owner: null }, { owner: 'u1' });
  expect(res.body).toEqual({ _id: 's1', owner: 'u1' });
});

it('409s when someone already has it', async () => {
  Schedule.findOneAndUpdate.mockResolvedValue(null);
  expect((await run()).statusCode).toBe(409);
});
