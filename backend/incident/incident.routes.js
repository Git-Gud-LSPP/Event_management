const router = require('express').Router({ mergeParams: true });
const c = require('./incident.controller');
const { authenticate } = require('../auth/auth.middleware');
const {
  authorizeIncidentAccess,
  canViewIncidents,
  canManageIncidents,
  canUpdateIncidentStatus,
} = require('./incident.middleware');

router
  .route('/')
  .get(authenticate, canViewIncidents, c.list)
  .post(authenticate, canManageIncidents, c.create);

router
  .route('/:id')
  .get(authenticate, authorizeIncidentAccess('staff'), c.getOne)
  .patch(authenticate, canUpdateIncidentStatus, c.updateStatus)
  .delete(authenticate, authorizeIncidentAccess('organizer'), c.remove);

router.post('/:id/assign', authenticate, canManageIncidents, c.assign);

module.exports = router;
