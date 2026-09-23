const router = require('express').Router({ mergeParams: true });
const c = require('./floorplan.controller');
const { authenticate } = require('../auth/auth.middleware');
// ponytail: these two guards live in schedule.middleware but are event-level
// (they key off req.params.eventId), not schedule-specific. Aliased rather than copied.
// Move them to event.middleware as canViewEvent/canManageEvent if a third module needs them.
const {
  canViewSchedule: canViewEvent,
  canManageSchedule: canManageEvent,
} = require('../schedule/schedule.middleware');

router
  .route('/')
  .get(authenticate, canViewEvent, c.get)
  .put(authenticate, canManageEvent, c.save);

module.exports = router;
