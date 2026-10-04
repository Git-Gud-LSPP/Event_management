const router = require('express').Router();
const c = require('./agent.controller');
const { authenticate } = require('../auth/auth.middleware');

// Every agent route acts as the signed-in user; tools reuse their token.
router.use(authenticate);

router.post('/chat', c.chat);
router.route('/conversation').get(c.getConversation).delete(c.resetConversation);
router.post('/actions/:id/confirm', c.confirmAction);
router.post('/actions/:id/cancel', c.cancelAction);

module.exports = router;
