const router = require('express').Router({ mergeParams: true });
const c = require('./inventory.controller');
const { authenticate } = require('../auth/auth.middleware');
const {
  canViewSchedule: canViewEvent,
  canManageSchedule: canManageEvent,
} = require('../schedule/schedule.middleware');

// Event members can view; the organizer manages stock.
router.route('/').get(authenticate, canViewEvent, c.list).post(authenticate, canManageEvent, c.create);
router
  .route('/:id')
  .patch(authenticate, canManageEvent, c.update)
  .delete(authenticate, canManageEvent, c.remove);

module.exports = router;
