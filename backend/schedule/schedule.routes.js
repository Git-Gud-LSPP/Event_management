const router = require('express').Router({ mergeParams: true });
const c = require('./schedule.controller');
const { authenticate } = require('../auth/auth.middleware');
const { authorizeScheduleAccess, canViewSchedule, canManageSchedule } = require('./schedule.middleware');

router
  .route('/')
  .get(authenticate, canViewSchedule, c.list)
  .post(authenticate, canManageSchedule, c.create);

router.get('/chains', authenticate, canViewSchedule, c.chains);

router
  .route('/:id')
  .get(authenticate, authorizeScheduleAccess('staff'), c.getOne)
  .patch(authenticate, authorizeScheduleAccess('staff'), c.update) // staff: own task status only, see c.update
  .delete(authenticate, authorizeScheduleAccess('organizer'), c.remove);

router.post('/:id/tasks-assign', authenticate, canManageSchedule, c.assign);

module.exports = router;