
var express = require('express');
var auth = require('../middleware/auth');
var authController = require('../controllers/authController');
var dashboardController = require('../controllers/dashboardController');
var invoicesController = require('../controllers/invoicesController');

var router = express.Router();

// Нэвтрэлт
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', auth, authController.me); // auth — эхлээд token шалгана

// Самбар — нэвтэрсэн хэрэглэгч л харна
router.get('/dashboard', auth, dashboardController.show);
router.get('/dashboard/monthly', auth, dashboardController.monthlyChart);
router.get('/dashboard/debtors', auth, dashboardController.topDebtors);
router.get('/dashboard/categories', auth, dashboardController.requestCategories);

router.get('/invoices', auth, invoicesController.index);
router.get('/invoices/counts', auth, invoicesController.counts); // табуудын тоо

module.exports = router;
