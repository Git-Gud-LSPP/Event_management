const router = require('express').Router();
const c = require('./event.controller');

router.route('/').get(c.list).post(c.create);
router.route('/:id').get(c.getOne).patch(c.update).delete(c.remove);

module.exports = router;
