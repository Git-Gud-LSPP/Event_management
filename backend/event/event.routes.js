const router = require('express').Router();
const c = require('./event.controller');
const { authenticate } = require('../auth/auth.middleware');
const { authorizeEventAccess, canCreateEvent } = require('./event.middleware');

router.route('/').get(authenticate, c.list).post(authenticate, canCreateEvent, c.create);
router
  .route('/:id')
  .get(authenticate, authorizeEventAccess('staff'), c.getOne)
  .patch(authenticate, authorizeEventAccess('organizer'), c.update)
  .delete(authenticate, authorizeEventAccess('organizer'), c.remove);

router
  .route('/:id/staff')
  .post(authenticate, authorizeEventAccess('organizer'), c.addStaff)
  .delete(authenticate, authorizeEventAccess('organizer'), c.removeStaff);

module.exports = router;
