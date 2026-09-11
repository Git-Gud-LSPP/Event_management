const router = require('express').Router({ mergeParams: true });
const c = require('./timeline.controller');
const { authenticate } = require('../auth/auth.middleware');
const { authorizeTimelineAccess, canManageTimeline } = require('./timeline.middleware');

router
  .route('/')
  .get(authenticate, authorizeTimelineAccess('staff'), c.list)
  .post(authenticate, canManageTimeline, c.create);

router
  .route('/:id')
  .get(authenticate, authorizeTimelineAccess('staff'), c.getOne)
  .patch(authenticate, authorizeTimelineAccess('organizer'), c.update)
  .delete(authenticate, authorizeTimelineAccess('organizer'), c.remove);

module.exports = router;