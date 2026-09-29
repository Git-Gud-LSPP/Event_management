const router = require('express').Router();

const c = require('./vendor.controller');

router.get('/nearby', c.nearby);
router.get('/route',  c.route);

module.exports = router;