const router = require('express').Router({ mergeParams: true });
const Budget = require('./budget.model');
const c = require('../event/event.crud')(Budget, ['name', 'category', 'planned', 'actual', 'owner', 'notes'], 'Budget line');
const { authenticate } = require('../auth/auth.middleware');
const {
  canViewSchedule: canViewEvent,
  canManageSchedule: canManageEvent,
} = require('../schedule/schedule.middleware');

// Event members can see the budget; only the organizer changes it.
router.route('/').get(authenticate, canViewEvent, c.list).post(authenticate, canManageEvent, c.create);
router
  .route('/:id')
  .patch(authenticate, canManageEvent, c.update)
  .delete(authenticate, canManageEvent, c.remove);

module.exports = router;
