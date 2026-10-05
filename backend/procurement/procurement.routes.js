const router = require('express').Router({ mergeParams: true });
const c = require('./procurement.controller');
const { authenticate } = require('../auth/auth.middleware');
const {
  canViewSchedule: canViewEvent,
  canManageSchedule: canManageEvent,
} = require('../schedule/schedule.middleware');

// Event members can see who the event buys from; the organizer runs procurement.
router.route('/').get(authenticate, canViewEvent, c.list).post(authenticate, canManageEvent, c.create);
router
  .route('/:id')
  .patch(authenticate, canManageEvent, c.update)
  .delete(authenticate, canManageEvent, c.remove);

module.exports = router;
