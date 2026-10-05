const express = require('express');
const authController = require('../auth/auth.controller');
const { authenticate } = require('./auth.middleware');

const router = express.Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authenticate, authController.me);
router.get('/users', authenticate, authController.listUsers);

module.exports = router;
