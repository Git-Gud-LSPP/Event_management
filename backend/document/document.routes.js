const router = require('express').Router({ mergeParams: true });
const c = require('./document.controller');
const { authenticate } = require('../auth/auth.middleware');
const {
  canViewSchedule: canViewEvent,
  canManageSchedule: canManageEvent,
} = require('../schedule/schedule.middleware');

// Event members can read the hub; the organizer adds, edits and deletes.
router.route('/').get(authenticate, canViewEvent, c.list).post(authenticate, canManageEvent, c.create);
router.post('/generate', authenticate, canManageEvent, c.generate);
router
  .route('/:id')
  .get(authenticate, canViewEvent, c.getOne)
  .patch(authenticate, canManageEvent, c.update)
  .delete(authenticate, canManageEvent, c.remove);
router.get('/:id/file', authenticate, canViewEvent, c.download);

module.exports = router;
