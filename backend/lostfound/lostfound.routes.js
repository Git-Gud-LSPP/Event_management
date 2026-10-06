const router = require('express').Router({ mergeParams: true });
const LostItem = require('./lostfound.model');
const c = require('../event/event.crud')(
  LostItem,
  ['item', 'description', 'foundAt', 'storedAt', 'status', 'claimedBy'],
  'Lost item'
);
const { authenticate } = require('../auth/auth.middleware');
const {
  canViewSchedule: canViewEvent,
  canManageSchedule: canManageEvent,
} = require('../schedule/schedule.middleware');

// Crew on the floor log and hand back items; only the organizer deletes the record.
router.route('/').get(authenticate, canViewEvent, c.list).post(authenticate, canViewEvent, c.create);
router
  .route('/:id')
  .patch(authenticate, canViewEvent, c.update)
  .delete(authenticate, canManageEvent, c.remove);

module.exports = router;
