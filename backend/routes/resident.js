var express = require('express');
var homeController = require('../controllers/user/homeController');
var payController = require('../controllers/user/payController');
var requestsController = require('../controllers/user/requestsController');
var newsController = require('../controllers/user/newsController');
var profileController = require('../controllers/user/profileController');

// Оршин суугчийн API — /api/resident/...
// auth болон requireRole('user')-ийг api.js-д нэг удаа тавьсан.
// Controller-ууд controllers/user/ дотор, хуудас бүрт нэг. Хэрэглэгчийг ҮРГЭЛЖ req.user-аас авна —
// frontend-ээс ирсэн unit_id, user_id-д итгэхгүй (өөр айлын мэдээллийг авах гэж оролдож болно)
var router = express.Router();

// Нүүр — бүх өгөгдөл нэг дор
router.get('/home', homeController.show);

// Төлбөр
router.get('/pay', payController.show);

// Санал хүсэлт
router.get('/requests', requestsController.index);
router.post('/requests', requestsController.store);

// Зарлал ба санал хураалт
router.get('/news', newsController.index);
router.post('/polls/:id(\\d+)/vote', newsController.vote);

// Профайл (засах нь PUT /api/profile)
router.get('/profile', profileController.show);

module.exports = router;
