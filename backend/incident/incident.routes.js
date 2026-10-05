const router = require('express').Router({ mergeParams: true });
const c = require('./incident.controller');
const { authenticate } = require('../auth/auth.middleware');
// Event-level guards, aliased the same way floorplan.routes does.
const {
  canViewSchedule: canViewEvent,
  canManageSchedule: canManageEvent,
} = require('../schedule/schedule.middleware');

// Any event member (organizer or staff) can view and report incidents.
router.route('/').get(authenticate, canViewEvent, c.list).post(authenticate, canViewEvent, c.create);

router
  .route('/:id')
  .get(authenticate, canViewEvent, c.getOne)
  .patch(authenticate, canViewEvent, c.updateStatus)
  .delete(authenticate, canManageEvent, c.remove);

router.post('/:id/assign', authenticate, canManageEvent, c.assign);

module.exports = router;
