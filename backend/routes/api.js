var express = require('express');
var auth = require('../middleware/auth');
var requireRole = require('../middleware/requireRole');
var authController = require('../controllers/authController');
var profileController = require('../controllers/profileController');
var verifyController = require('../controllers/verifyController');
var messagesController = require('../controllers/messagesController');
var commentsController = require('../controllers/commentsController');
var adminRoutes = require('./admin');
var residentRoutes = require('./resident');

var router = express.Router();

/** 
 * resident болон admin хуудастай холбоотой api ууд энд байна.
 */

router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', auth, authController.me); 

// Утсаар бүртгүүлэх / нууц үг сэргээх (verify.mn) — нэвтрээгүй хэрэглэгч
router.post('/auth/verify', verifyController.start);
router.get('/auth/verify/:id', verifyController.status);
router.post('/auth/verify/:id/complete', verifyController.complete);

router.put('/profile', auth, profileController.update);

router.get('/messages', auth, messagesController.index);
router.patch('/messages/item/:id(\\d+)', auth, requireRole('admin'), messagesController.hide);
router.get('/messages/:room', auth, messagesController.show);
router.post('/messages/:room', auth, messagesController.send);
router.post('/messages/:room/read', auth, messagesController.read);

router.get('/announcements/:id(\\d+)/comments', auth, commentsController.index);
router.post('/announcements/:id(\\d+)/comments', auth, commentsController.store);

router.use('/admin', auth, requireRole('admin'), adminRoutes);

router.use('/resident', auth, requireRole('user'), residentRoutes);

module.exports = router;
