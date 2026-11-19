var express = require('express');
var auth = require('../middleware/auth');
var requireRole = require('../middleware/requireRole');
var authController = require('../controllers/authController');
var profileController = require('../controllers/profileController');
var adminRoutes = require('./admin');
var residentRoutes = require('./resident');

var router = express.Router();

/** 
 * resident болон admin хуудастай холбоотой api ууд энд байна.
 */

router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', auth, authController.me); 

router.put('/profile', auth, profileController.update);

router.use('/admin', auth, requireRole('admin'), adminRoutes);

router.use('/resident', auth, requireRole('user'), residentRoutes);

module.exports = router;
