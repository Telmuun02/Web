
var express = require('express');
var auth = require('../middleware/auth');
var authController = require('../controllers/authController');
var dashboardController = require('../controllers/dashboardController');

var router = express.Router();

// Нэвтрэлт
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', auth, authController.me); // auth — эхлээд token шалгана

router.get('/dashboard', dashboardController.show);

module.exports = router;
