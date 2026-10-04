jest.mock('../../event/event.model');
jest.mock('../../schedule/schedule.model');

const Event = require('../../event/event.model');
const Schedule = require('../../schedule/schedule.model');
const {
  canViewSchedule,
  canManageSchedule,
} = require('../../schedule/schedule.middleware');

const ORGANIZER = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const STAFF = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const OUTSIDER = 'cccccccccccccccccccccccc';

const event = { organizer: ORGANIZER, staff: [STAFF] };

const run = async (mw, userId, role) => {
  const req = { params: { eventId: 'e1' }, user: { userId, role } };
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
  Schedule.findById.mockReturnValue({ populate: () => null });
});

describe('canViewSchedule', () => {
  // Regression: the collection route used to run the :id guard, so list always 404'd.
  it('lets the organizer list the schedule', async () => {
    expect(await run(canViewSchedule, ORGANIZER, 'organizer')).toEqual({
      nexted: true,
      status: null,
    });
  });

  it('lets assigned staff list the schedule', async () => {
    expect(await run(canViewSchedule, STAFF, 'staff')).toEqual({
      nexted: true,
      status: null,
    });
  });

  it('rejects a user not on the event', async () => {
    expect(await run(canViewSchedule, OUTSIDER, 'organizer')).toEqual({
      nexted: false,
      status: 403,
    });
  });

  it('404s an unknown event', async () => {
    Event.findById.mockResolvedValue(null);
    expect(await run(canViewSchedule, ORGANIZER, 'organizer')).toEqual({
      nexted: false,
      status: 404,
    });
  });
});

describe('canManageSchedule', () => {
  it('lets the event organizer write', async () => {
    expect(await run(canManageSchedule, ORGANIZER, 'organizer')).toEqual({
      nexted: true,
      status: null,
    });
  });

  it('rejects assigned staff', async () => {
    expect(await run(canManageSchedule, STAFF, 'staff')).toEqual({
      nexted: false,
      status: 403,
    });
  });

  it('rejects an organizer of some other event', async () => {
    expect(await run(canManageSchedule, OUTSIDER, 'organizer')).toEqual({
      nexted: false,
      status: 403,
    });
  });
});
