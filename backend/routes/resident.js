var express = require('express');
var homeController = require('../controllers/user/homeController');
var payController = require('../controllers/user/payController');
var requestsController = require('../controllers/user/requestsController');
var newsController = require('../controllers/user/newsController');
var profileController = require('../controllers/user/profileController');
var chatController = require('../controllers/user/chatController');
var voiceController = require('../controllers/user/voiceController');
var meetingController = require('../controllers/user/meetingController');
var messagesController = require('../controllers/user/messagesController');

/**
 * resident хуудастай холбоотой api ууд ба доор байдлаар харагдана.
 */

var router = express.Router();

router.get('/home', homeController.show);

router.get('/pay', payController.show);
router.post('/pay', payController.pay);

router.get('/requests', requestsController.index);
router.post('/requests', requestsController.store);

router.get('/news', newsController.index);
router.post('/polls/:id(\\d+)/vote', newsController.vote);

router.get('/meeting', meetingController.show);

router.get('/profile', profileController.show);

router.post('/chat', chatController.send);

router.post('/transcribe', voiceController.transcribe);

router.get('/messages', messagesController.rooms);
router.get('/messages/:key(entrance|soh)', messagesController.show);
router.post('/messages/:key(entrance|soh)', messagesController.send);
router.post('/messages/:key(entrance|soh)/read', messagesController.read);

module.exports = router;
